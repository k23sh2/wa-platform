import Fastify from "fastify";
import { createLogger } from "@wa/logger";
import { env } from "@wa/config";
import type { InboundText, OrchestratorReply } from "@wa/types";
import { translateText } from "./translate.js";
import { routeIntent, respond } from "./policy.js";

type Session = { step: string };
const sess = new Map<string, Session>();

const logger = createLogger({ service: "orchestrator" });

const app = Fastify({
  loggerInstance: logger,
});

const isEnglish = (s: string) => /^[\x00-\x7F]+$/.test(s);

// 헬스체크
app.get("/health", async () => ({ ok: true }));

// WhatsApp 메시지 처리
app.post<{
  Body: InboundText;
}>("/process", async (req, reply) => {
  const { tenantId, from, to, text, waMessageId } = req.body;

  req.log.info(
    { tenantId, from, to, text, waMessageId },
    "[ORCH] /process called"
  );

  const s = sess.get(from) ?? { step: "start" };

  // 1) 세션이 start 상태일 때: 메뉴 버튼 제공
  if (s.step === "start") {
    sess.set(from, { step: "waiting_choice" });
    const resp: OrchestratorReply = {
      kind: "button",
      text: "문의 유형을 선택해줘 👇",
      buttons: [
        { id: "inq_moq", title: "MOQ 문의" },
        { id: "inq_price", title: "가격 문의" },
        { id: "inq_sample", title: "샘플 요청" },
      ],
    };
    return reply.send(resp);
  }

  // 2) 버튼 선택 이후
  if (s.step === "waiting_choice") {
    if (text === "inq_moq") {
      sess.set(from, { step: "moq_detail" });
      const resp: OrchestratorReply = {
        kind: "list",
        list: {
          header: "MOQ 선택",
          body: "대상 제품군을 골라줘",
          buttonTitle: "메뉴 보기",
          sections: [
            {
              title: "제품군",
              rows: [
                { id: "moq_cat_a", title: "A카테고리" },
                { id: "moq_cat_b", title: "B카테고리" },
                { id: "moq_cat_c", title: "C카테고리" },
              ],
            },
          ],
        },
      };
      return reply.send(resp);
    }

    if (text === "inq_price") {
      sess.set(from, { step: "price_detail" });
      const msg = respond("QUOTE");
      const resp: OrchestratorReply = { kind: "text", text: msg };
      return reply.send(resp);
    }

    if (text === "inq_sample") {
      sess.set(from, { step: "sample_detail" });
      const msg = respond("SAMPLE");
      const resp: OrchestratorReply = { kind: "text", text: msg };
      return reply.send(resp);
    }

    // 알 수 없는 선택 → 초기화
    sess.set(from, { step: "start" });
    const resp: OrchestratorReply = {
      kind: "text",
      text: "알 수 없는 선택이야. 처음부터 다시 시도해줘.",
    };
    return reply.send(resp);
  }

  // 3) MOQ 세부 선택 이후 (리스트 선택)
  if (s.step === "moq_detail") {
    sess.set(from, { step: "start" });
    const resp: OrchestratorReply = {
      kind: "text",
      text: `MOQ 관련 문의 유형: ${text} 접수 완료.`,
    };
    return reply.send(resp);
  }

  // 4) 가격 문의 세부
  if (s.step === "price_detail") {
    sess.set(from, { step: "start" });
    const resp: OrchestratorReply = {
      kind: "text",
      text: `가격 문의 유형: ${text} 접수 완료.`,
    };
    return reply.send(resp);
  }

  // 5) 샘플 상세 문의: 번역 + 한국어 안내
  if (s.step === "sample_detail") {
    const replyKo = "샘플 요청 정보를 접수했어. 담당자가 곧 연락할게.";

    if (isEnglish(text)) {
      const toKo = await translateText(text, "ko");
      req.log.info(
        { from, text, toKo },
        '[translate in en→ko] sample detail translated'
      );
      const replyEn = await translateText(replyKo, "en");
      sess.set(from, { step: "start" });
      const resp: OrchestratorReply = { kind: "text", text: replyEn };
      return reply.send(resp);
    }

    sess.set(from, { step: "start" });
    const resp: OrchestratorReply = { kind: "text", text: replyKo };
    return reply.send(resp);
  }

  // 6) 그 외: intent route + fallback
  const { intent } = routeIntent(text);
  const msg = respond(intent);
  sess.set(from, { step: "start" });
  const resp: OrchestratorReply = { kind: "text", text: msg };
  return reply.send(resp);
});

// 공통 에러 핸들러 (선택)
app.setErrorHandler((error, req, reply) => {
  req.log.error({ err: error }, "unhandled error");
  reply.code(500).send({ error: "internal_server_error" });
});

async function start() {
  await app.listen({
    host: "0.0.0.0",
    port: env.ORCHESTRATOR_PORT,
  });

  app.log.info(
    `orchestrator running at ${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}`
  );
}

start().catch((err) => {
  logger.error({ err }, "failed to start orchestrator");
  process.exit(1);
});
