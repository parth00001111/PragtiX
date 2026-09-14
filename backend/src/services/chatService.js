const GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

const SYSTEM_INSTRUCTIONS = `You are Samadhan Sahayak, the official help assistant inside SamadhanSetu, Jharkhand's societal innovation collaboration portal.

Your job is to help citizens, students, faculty, universities, organisations, industries and startups use the portal. You can explain:
- citizen registration, login and guest submissions (Aadhaar is never mandatory);
- submitting a challenge with category, district, block, village/ward, severity, people affected, evidence and GPS location;
- tracking problems, saving public challenges and submitting solution ideas;
- university profiles, faculty profiles, multidisciplinary teams and research workflows;
- organisation workspaces, team assignment, solution proposals, milestones, CSR funding and industry collaboration.

Language rules:
- Understand English, Hindi in Devanagari, and informal Hinglish written in Latin script.
- Reply in the language used by the user. If they mix Hindi and English, reply in natural Hinglish unless they request otherwise.
- Use simple, respectful language and short numbered steps for procedures.

Safety and accuracy:
- Never claim that you submitted, changed, approved or tracked a specific record. Explain where the user can do it.
- Never invent a challenge status or account detail. Tell users to sign in and check their dashboard for personal data.
- Do not ask for Aadhaar numbers, passwords, OTPs, bank details, medical records or other sensitive personal information.
- For emergencies or immediate danger, direct the user to the relevant emergency authority; SamadhanSetu is not an emergency service.
- Stay focused on SamadhanSetu and societal-innovation guidance. If a request is unrelated, politely explain your scope.
- Keep most answers below 180 words.`;

const FALLBACKS = {
  hi: "मैं अभी AI सेवा से जुड़ नहीं पा रहा हूँ, लेकिन आपकी सहायता कर सकता हूँ। समस्या दर्ज करने के लिए ‘समस्या दर्ज करें’ खोलें, स्पष्ट विवरण, श्रेणी, जिला/स्थान, प्रभावित लोगों की संख्या और फोटो या GPS साक्ष्य जोड़ें, फिर जानकारी जाँचकर सबमिट करें। अपनी समस्या की स्थिति नागरिक डैशबोर्ड के ‘मेरी समस्याएँ’ भाग में देखें। कृपया पासवर्ड, OTP, आधार या बैंक जानकारी साझा न करें।",
  hinglish: "Main abhi AI service se connect nahi ho pa raha hoon, lekin basic guidance de sakta hoon. ‘Submit Problem’ kholiye, clear description, category, district/location, affected people aur photo ya GPS evidence add karke submit kijiye. Status Citizen Dashboard ke ‘My Problems’ section mein milega. Password, OTP, Aadhaar ya bank details share na karein.",
  en: "I cannot connect to the AI service right now, but I can still give basic guidance. Open ‘Submit Problem’, add a clear description, category, district/location, people affected, and useful photo or GPS evidence, then review and submit. Track it under Citizen Dashboard → My Problems. Do not share passwords, OTPs, Aadhaar numbers, or bank details.",
};

const hindiScript = /[\u0900-\u097F]/;
const hinglishWords = /\b(kaise|kya|mera|meri|mujhe|karna|karo|hai|hain|nahi|problem|shikayat|samadhan|dikha|batao|bataiye|madad|chahiye)\b/i;

export const detectChatLanguage = (text = "") => {
  if (hindiScript.test(text)) return "hi";
  if (hinglishWords.test(text)) return "hinglish";
  return "en";
};

const extractText = (response) => response?.candidates
  ?.flatMap((candidate) => candidate?.content?.parts || [])
  .map((part) => part?.text || "")
  .join("\n")
  .trim();

export const fallbackChatReply = (message) => FALLBACKS[detectChatLanguage(message)];

export async function createChatReply({ message, history = [] }) {
  if (!process.env.GEMINI_API_KEY) {
    return { reply: fallbackChatReply(message), mode: "fallback" };
  }

  const contents = [
    ...history.map(({ role, content }) => ({
      role: role === "assistant" ? "model" : "user",
      parts: [{ text: content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];
  const model = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
  const response = await fetch(`${GEMINI_API_ROOT}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": process.env.GEMINI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
      contents,
      generationConfig: { maxOutputTokens: 500, temperature: 0.35 },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || "Gemini API request failed");
    error.status = response.status;
    throw error;
  }

  const reply = extractText(data);
  if (!reply) throw new Error("Gemini returned an empty or blocked response");
  return { reply, mode: "ai" };
}
