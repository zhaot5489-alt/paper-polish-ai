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
        temperature: 0.2,
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content:
              "You are an expert academic editor for SCI manuscripts. Polish the user's academic text to improve clarity, grammar, conciseness, and scientific tone. Preserve the original meaning. Return ONLY the polished text with no explanations, no headings, and no notes."
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

    // 自动清理模型多余内容
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
