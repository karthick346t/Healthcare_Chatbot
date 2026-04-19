import axios from "axios";

const M2M_SERVER = process.env.M2M_SERVER || "http://localhost:8000/translate";

export async function translateViaM2M100(
  text: string,
  from: string,
  to: string
): Promise<string> {
  if (!text || from === to) return text;
  try {
    const resp = await axios.post<{ translation: string }>(
      M2M_SERVER,
      {
        text,
        source_lang: from,
        target_lang: to,
      },
      {
        headers: {
          'Translation-API-Key': process.env.TRANSLATION_API_KEY || 'default-dev-key',
        },
      }
    );
    return resp.data.translation;
  } catch (err: any) {
    console.error(
      `Translation error for '${text}' from ${from} to ${to}:`,
      err?.response?.data || err.message
    );
    // Fallback: return original
    return text;
  }
}
