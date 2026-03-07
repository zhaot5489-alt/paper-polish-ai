require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const OpenAI = require('openai').default;

const app = express();
const PORT = process.env.PORT || 3000;

// 中转API客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://pro.gemai.cc/v1"
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 首页返回 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// AI论文润色接口
app.post('/api/polish', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "请输入需要润色的内容"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "claude-opus-4-6",
      messages: [
        {
          role: "system",
          content: "You are an academic writing assistant. Improve grammar, clarity and academic tone. Output only the polished text."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3
    });

    const result = completion.choices[0]?.message?.content || "";

    res.json({
      polished: result
    });

  } catch (error) {
    console.error("AI error:", error);

    res.status(500).json({
      error: "AI调用失败"
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
