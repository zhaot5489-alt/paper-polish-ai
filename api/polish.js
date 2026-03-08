export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, mode = "light", scene = "paper" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (text.length > 3000) {
      return res.status(400).json({ error: "Text too long (max 3000 characters)" });
    }

    let systemPrompt = "";

    if (scene === "abstract") {
      if (mode === "deep") {
        systemPrompt =
          "You are an expert academic editor for SCI manuscripts. Revise the user's abstract in polished academic English. Make it concise, coherent, information-dense, and publication-ready. Improve logic, flow, clarity, and formal tone while preserving the original meaning. Return only the revised abstract text, with no explanations, notes, or headings.";
      } else {
        systemPrompt =
          "You are an expert academic editor for SCI manuscripts. Lightly polish the user's abstract by correcting grammar, wording, punctuation, and minor stylistic issues while preserving the original meaning and structure as much as possible. Keep the abstract concise and natural in academic English. Return only the revised abstract text, with no explanations, notes, or headings.";
      }
    } else if (scene === "reviewer") {
      if (mode === "deep") {
        systemPrompt =
          "You are an expert academic editor assisting with reviewer responses for SCI manuscripts. Rewrite the user's response in highly professional, polite, formal, and well-structured academic English. Make the tone respectful, clear, and persuasive while preserving the original meaning. Return only the revised response text, with no explanations, notes, or headings.";
      } else {
        systemPrompt =
          "You are an expert academic editor assisting with reviewer responses for SCI manuscripts. Lightly polish the user's response by improving grammar, wording, punctuation, politeness, and clarity while preserving the original meaning and structure as much as possible. Return only the revised response text, with no explanations, notes, or headings.";
      }
    } else {
      if (mode === "deep") {
        systemPrompt =
          "You are an expert academic editor for SCI manuscripts. Rewrite the user's text in polished academic English with improved clarity, conciseness, coherence, and formality. Make the revision noticeably more refined and publication-ready, even if the original text is already understandable. Preserve the original meaning, but do not stay too close to the original wording. Return only the revised text, with no explanations, headings, or notes.";
      } else {
        systemPrompt =
          "You are an expert academic editor for SCI manuscripts. Lightly polish the user's text by correcting grammar, word choice, punctuation, and minor stylistic issues while preserving the original meaning and sentence structure as much as possible. Do not substantially rewrite the text unless necessary for correctness or natural academic English. Return only the revised text, with no explanations, headings, or notes.";
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
