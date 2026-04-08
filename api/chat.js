export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Missing API key' });

  const { model = 'gemini-2.0-flash', messages, stream = false } = req.body;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${GEMINI_API_KEY}`;

  const body = {
    contents: messages,
    generationConfig: { maxOutputTokens: 8192 }
  };

  try {
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!apiRes.ok) {
      const err = await apiRes.text();
      return res.status(apiRes.status).json({ error: err });
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      apiRes.body.pipeTo(new WritableStream({
        write(chunk) { res.write(chunk); },
        close() { res.end(); }
      }));
    } else {
      const data = await apiRes.json();
      res.json(data);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
