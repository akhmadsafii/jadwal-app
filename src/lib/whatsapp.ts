type WhatsAppPayload = {
  number: string | null | undefined;
  message: string;
};

const DEFAULT_WHATSAPP_URL = "https://whatsapp.notifapp.online/send-message";

export function normalizeWhatsAppNumber(number: string | null | undefined) {
  const digits = (number || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function getWhatsAppAdminNumbers() {
  return (process.env.WHATSAPP_ADMIN_NUMBERS || "")
    .split(",")
    .map((number) => number.trim())
    .filter(Boolean);
}

export async function sendWhatsAppMessage({ number, message }: WhatsAppPayload) {
  const apiKey = process.env.WHATSAPP_API_KEY;
  const sender = process.env.WHATSAPP_SENDER;
  const endpoint = process.env.WHATSAPP_API_URL || DEFAULT_WHATSAPP_URL;
  const normalizedNumber = normalizeWhatsAppNumber(number);

  if (!apiKey || !sender || !normalizedNumber || !message.trim()) {
    console.warn("WhatsApp notification skipped:", {
      hasApiKey: Boolean(apiKey),
      hasSender: Boolean(sender),
      hasNumber: Boolean(normalizedNumber),
      hasMessage: Boolean(message.trim()),
    });
    return { skipped: true };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      sender,
      number: normalizedNumber,
      message,
    }),
  });

  const responseText = await response.text().catch(() => "");
  let responseBody: unknown = responseText;

  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = responseText;
  }

  if (!response.ok) {
    throw new Error(`WhatsApp API failed: ${response.status} ${responseText}`);
  }

  if (
    responseBody &&
    typeof responseBody === "object" &&
    "status" in responseBody &&
    responseBody.status === false
  ) {
    throw new Error(`WhatsApp API rejected message: ${responseText}`);
  }

  return { skipped: false, response: responseBody };
}

export async function sendWhatsAppMessages(messages: WhatsAppPayload[]) {
  const results = await Promise.allSettled(
    messages.map((payload) => sendWhatsAppMessage(payload))
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("WhatsApp notification error:", result.reason);
    }
  });
}
