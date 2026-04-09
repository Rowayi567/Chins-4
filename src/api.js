const API = '/api/reed';

export async function callAI(prompt, system = null, maxTokens = 200) {
  const body = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  };
  if (system) body.system = system;
  const r = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.content?.find(b => b.type === "text")?.text || "";
}

export { API };
