import { z } from 'zod';

export const MessageCreateSchema = z.object({
  userId: z.string().cuid(),
  text: z.string().min(1).max(1000),
});
export type MessageCreate = z.infer<typeof MessageCreateSchema>;

export const MessageSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  text: z.string(),
  createdAt: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

// WhatsApp 인바운드 → orchestrator 요청
export type InboundText = {
  tenantId: string;
  from: string;      // 발신 WhatsApp 번호
  to: string;        // 비즈니스 번호(phone_number_id)
  text: string;
  waMessageId: string;
};

// orchestrator 응답
export type OrchestratorReplyText = {
  kind: "text";
  text: string;
};

export type OrchestratorReplyButton = {
  kind: "button";
  text: string;
  buttons: Array<{ id: string; title: string }>;
};

export type OrchestratorReplyList = {
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

export type OrchestratorReply =
  | OrchestratorReplyText
  | OrchestratorReplyButton
  | OrchestratorReplyList;
