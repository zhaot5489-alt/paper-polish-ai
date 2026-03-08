export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, mode = "light" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (text.length > 3000) {
      return res.status(400).json({ error: "Text too long (max 3000 characters)" });
    }

    let systemPrompt = "";

    if (mode === "deep") {
      systemPrompt =
        "You are an expert academic editor for SCI manuscripts. Rewrite the user's text in polished academic English with improved clarity, conciseness, coherence, and formality. Make the revision noticeably more refined and publication-ready, even if the original text is already understandable. Preserve the original meaning, but do not stay too close to the original wording. Return only the revised text, with no explanations, no headings, and no notes.";
    } else {
      systemPrompt =
        "You are an expert academic editor for SCI manuscripts. Lightly polish the user's text by correcting grammar, word choice, punctuation, and minor stylistic issues while preserving the original meaning and sentence structure as much as possible. Do not substantially rewrite the text unless necessary for correctness or natural academic English. Return only the revised text, with no explanations, no headings, and no notes.";
    }

    const response = await fetch("http://1.95.142.151:3000/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        temperature: mode === "deep" ? 0.4 : 0.2,
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content: systemPrompt
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

    let result = data?.choices?.[0]?.message?.content || "";

    result = result
      .replace(/Here's the polished version:/gi, "")
      .replace(/Changes made:[\s\S]*/gi, "")
      .replace(/\*\*/g, "")
      .trim();

    return res.status(200).json({
      polished: result
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
