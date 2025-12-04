import axios from "axios";

const BASE = "https://graph.facebook.com/v20.0";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

/** 단순 텍스트 전송 */
export async function sendText(to: string, body: string) {
  return axios.post(
    `${BASE}/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
}

/** 버튼(quick reply) 전송 */
export async function sendButtons(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>
) {
  return axios.post(
    `${BASE}/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: body },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
}

/** 리스트 메뉴 전송 */
export async function sendList(
  to: string,
  list: {
    header?: string;
    body: string;
    footer?: string;
    buttonTitle: string;
    sections: Array<{
      title?: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  }
) {
  return axios.post(
    `${BASE}/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: list.header ? { type: "text", text: list.header } : undefined,
        body: { text: list.body },
        footer: list.footer ? { text: list.footer } : undefined,
        action: {
          button: list.buttonTitle,
          sections: list.sections,
        },
      },
    },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
}
