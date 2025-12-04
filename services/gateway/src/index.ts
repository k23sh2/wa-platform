import Fastify from "fastify";
import proxy from "@fastify/http-proxy";

import { createLogger } from "@wa/logger";
import { env } from "@wa/config";
import * as types from "@wa/types";
import * as http from "@wa/http";

// WhatsApp API 호출 헬퍼 (services/gateway/src/wa.ts 에 있다고 가정)
// 없으면 내가 예전에 준 wa.ts 코드 그대로 추가하면 됨
import { sendButtons, sendList, sendText } from "./wa"; // 필요시 "./wa.js" 로

const { MessageCreateSchema } = types;
const { httpPost } = http;

const logger = createLogger({ service: "gateway" });

const app = Fastify({
  loggerInstance: logger,
});

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
const TENANT_DEFAULT = process.env.TENANT_DEFAULT ?? "demo-tenant";

// phone_number_id → tenantId 매핑 (심플 버전)
function resolveTenant(phoneNumberId: string): string {
  // 나중에 필요하면 실제 매핑 테이블로 교체
  return TENANT_DEFAULT;
}

// orchestrator 응답 타입 (간단 정의)
type OrchestratorReply =
  | { kind: "text"; text: string }
  | {
      kind: "button";
      text: string;
      buttons: Array<{ id: string; title: string }>;
    }
  | {
      kind: "list";
      list: {
        header?: string;
        body: string;
        footer?: string;
        buttonTitle: string;
        sections: Array<{
          title?: string;
          rows: Array<{ id: string; title: string; description?: string }>;
        }>;
      };
    };

// =========================
// 헬스체크
// =========================
app.get("/health", async () => ({ ok: true }));

// =========================
// 기존 샘플 API (/api/v1/messages) 유지
// =========================
app.post("/api/v1/messages", async (req, reply) => {
  const body = req.body;
  const parsed = MessageCreateSchema.safeParse(body);

  if (!parsed.success) {
    req.log.warn(
      { error: parsed.error.flatten() },
      "invalid message create payload",
    );
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const data = parsed.data; // { userId, text }
  const url = `${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}/messages`;

  try {
    const created: any = await httpPost(url, data);
    req.log.info({ userId: data.userId }, "message created via orchestrator");
    return reply.code(201).send(created);
  } catch (err: any) {
    req.log.error({ err, url }, "failed to create message via orchestrator");
    return reply.code(502).send({ error: "orchestrator_error" });
  }
});

// =========================
// WhatsApp Webhook (GET: 검증)
// =========================
app.get("/whatsapp/webhook", async (req, reply) => {
  const query: any = req.query;
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  req.log.info({ mode, token }, "whatsapp webhook verify");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return reply.code(200).send(challenge);
  }
  return reply.code(403).send();
});

// =========================
// WhatsApp Webhook (POST: 메시지 처리)
// =========================
app.post("/whatsapp/webhook", async (req, reply) => {
  // Meta 요구사항: 즉시 200 응답
  reply.code(200).send();

  const body: any = req.body;

  // 비동기 처리 (응답과 분리)
  (async () => {
    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;

      // 상태 이벤트만 온 경우 (읽음/배달 등)
      if (Array.isArray(value?.statuses) && value.statuses.length > 0) {
        const st = value.statuses[0];
        logger.info(
          { status: st.status, messageId: st.id },
          "[WA STATUS] status event",
        );
        return;
      }

      const messages = value?.messages;
      if (!Array.isArray(messages) || messages.length === 0) {
        logger.info("[WA WEBHOOK] no messages in payload");
        return;
      }

      const msg = messages[0];
      const type = msg?.type ?? "";
      const from = msg?.from;
      const phoneNumberId = value?.metadata?.phone_number_id;

      if (!from || !phoneNumberId) {
        logger.warn(
          { from, phoneNumberId },
          "[WA WEBHOOK] missing from/phoneNumberId",
        );
        return;
      }

      // 텍스트/버튼/리스트 선택 정규화
      let text = "";
      if (type === "text") {
        text = msg.text?.body?.trim?.() || "";
      } else if (type === "interactive") {
        const it = msg.interactive;
        if (it?.type === "button_reply") text = it.button_reply?.id || "";
        else if (it?.type === "list_reply") text = it.list_reply?.id || "";
      }

      if (!text) {
        await sendText(from, "지금은 텍스트/버튼/리스트만 지원해.");
        return;
      }

      // orchestrator로 넘길 payload
      const tenantId = resolveTenant(phoneNumberId);
      const payload = {
        tenantId,
        from,
        to: phoneNumberId,
        text,
        waMessageId: msg.id,
      };

      let replyData: OrchestratorReply;

      try {
        replyData = await httpPost<OrchestratorReply>(
          `${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}/process`,
          payload,
        );
      } catch (e: any) {
        logger.error(
          {
            status: e?.response?.status,
            data: e?.response?.data,
            message: e?.message,
          },
          "[ORCH] error calling /process",
        );
        await sendText(from, "지금은 처리 불가해. 잠시 후 다시 시도해줘.");
        return;
      }

      // 응답 타입에 따라 실제 WhatsApp 전송
      if (replyData.kind === "button") {
        await sendButtons(from, replyData.text, replyData.buttons);
      } else if (replyData.kind === "list") {
        await sendList(from, replyData.list);
      } else if (replyData.kind === "text") {
        await sendText(from, replyData.text || "응답이 없었어.");
      } else {
        await sendText(from, "알 수 없는 응답 형식이야.");
      }
    } catch (err) {
      logger.error({ err }, "[WEBHOOK ERR]");
    }
  })();
});

// =========================
// 내부 API 프록시 (기존대로 유지)
// =========================
async function start() {
  await app.register(proxy, {
    upstream: `${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}`,
    prefix: "/api/v1",
    rewritePrefix: "",
  });

  await app.listen({ host: "0.0.0.0", port: env.GATEWAY_PORT });
  app.log.info(
    `gateway running at ${env.SERVICE_BASE_URL}:${env.GATEWAY_PORT}`,
  );
}

start().catch((err) => {
  logger.error({ err }, "failed to start gateway");
  process.exit(1);
});
