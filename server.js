require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const OpenAI = require('openai').default;

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json());

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.post('/api/polish', async (req, res) => {
  try {
    const { text } = req.body;

    if (text === undefined || text === null) {
      return res.status(400).json({ error: 'Missing field: text' });
    }

    const input = typeof text === 'string' ? text : String(text);

    if (!input.trim()) {
      return res.status(400).json({ error: 'text cannot be empty' });
    }

    if (!openai) {
      return res.status(500).json({
        error: 'OPENAI_API_KEY is not set. Add it to .env and restart.',
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an academic writing assistant. Polish the given English text to improve clarity, grammar, and academic tone. Preserve the original meaning. Output only the polished text, no explanations.',
        },
        { role: 'user', content: input },
      ],
      temperature: 0.3,
    });

    const polished = completion.choices[0]?.message?.content?.trim() || '';

    res.json({ polished });
  } catch (err) {
    console.error('[/api/polish]', err.message || err);
    res.status(500).json({
      error: err.message || 'Polish request failed',
    });
  }
});

// 根路径返回 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// 静态托管 public 目录
app.use(express.static(publicDir));

app.listen(PORT, () => {
  console.log(`Polish server running at http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY not set. Set it in .env to use /api/polish.');
  }
});
