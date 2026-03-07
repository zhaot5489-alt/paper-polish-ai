export default async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" });
}

try {

const { text } = req.body;

const response = await fetch("http://1.95.142.151:3000/v1/chat/completions", {

method: "POST",

headers: {
"Content-Type": "application/json"
},

body: JSON.stringify({

model: "claude-3-opus-20240229",

messages: [
{
role: "system",
content: "You are an expert academic editor. Improve grammar, clarity and academic tone."
},
{
role: "user",
content: text
}
],

temperature: 0.3

})

});

const data = await response.json();

res.status(200).json({

result: data.choices?.[0]?.message?.content || "No response"

});

} catch (error) {

res.status(500).json({ error: "Server error" });

}

}
