export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, mode = "light", lang = "en" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (text.length > 3000) {
      return res.status(400).json({ error: "Text too long (max 3000 characters)" });
    }

    let systemPrompt = "";

    if (lang === "zh") {
      if (mode === "academic") {
        systemPrompt =
          "你是一位资深学术编辑。请对用户提供的中文文本进行学术增强润色，在不改变原意的前提下，进一步提升其学术性、逻辑性、凝练度、正式程度和书面表达质量，使其更符合高水平学术论文写作风格。只返回润色后的文本，不要添加说明、标题、注释或任何额外内容。";
      } else if (mode === "deep") {
        systemPrompt =
          "你是一位资深学术编辑。请对用户提供的中文文本进行深度润色，在不改变原意的前提下，显著提升其学术性、凝练度、逻辑性和正式程度，使其更符合高水平学术写作风格。只返回润色后的文本，不要添加说明、标题、注释或任何额外内容。";
      } else {
        systemPrompt =
          "你是一位资深学术编辑。请对用户提供的中文文本进行轻度润色，重点修改语病、措辞、标点和局部表达问题，同时尽量保留原意和原句式。只返回润色后的文本，不要添加说明、标题、注释或任何额外内容。";
      }
    } else {
      if (mode === "academic") {
        systemPrompt =
          "You are an expert academic editor for SCI manuscripts. Strengthen the user's English text to sound more academic, logical, formal, and publication-ready while preserving the original meaning. Improve clarity, cohesion, scholarly tone, and sentence quality more strongly than a standard revision. Return only the revised text, with no explanations, headings, or notes.";
      } else if (mode === "deep") {
        systemPrompt =
          "You are an expert academic editor for SCI manuscripts. Rewrite the user's English text in polished academic English with improved clarity, conciseness, coherence, and formality. Make the revision noticeably more refined and publication-ready while preserving the original meaning. Return only the revised text, with no explanations, headings, or notes.";
      } else {
        systemPrompt =
          "You are an expert academic editor for SCI manuscripts. Lightly polish the user's English text by correcting grammar, word choice, punctuation, and minor stylistic issues while preserving the original meaning and sentence structure as much as possible. Return only the revised text, with no explanations, headings, or notes.";
      }
    }

    const response = await fetch("http://1.95.142.151:3000/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        temperature: mode === "light" ? 0.2 : 0.4,
        max_tokens: 1400,
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
