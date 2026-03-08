export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const response = await fetch("http://1.95.142.151:3000/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are an expert academic editor for SCI manuscripts. Polish the user's text to improve clarity, grammar, conciseness, coherence, and formal scientific tone. Preserve the original meaning. Return only the revised text, with no commentary, no headings, no quotation marks, and no explanation of edits."
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Upstream API error",
        details: data
      });
    }

    return res.status(200).json({
      polished: data?.choices?.[0]?.message?.content?.trim() || ""
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
