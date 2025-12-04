import axios from "axios";

const API_KEY = process.env.GOOGLE_API_KEY!;

function decodeHtmlEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'"); // HTML 엔티티 복원
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text) return "";
  const r = await axios.post(
    `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
    { q: text, target: targetLang, format: "text" }
  );
  const out = r.data?.data?.translations?.[0]?.translatedText ?? text;
  return decodeHtmlEntities(out);
}
