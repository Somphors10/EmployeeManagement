export const config = {
  api: {
    bodyParser: false,
  },
};

function backendBase() {
  return String(process.env.BACKEND_URL || process.env.VITE_API_BASE || '').replace(/\/$/, '');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const base = backendBase();
  if (!base) {
    res.status(502).json({
      status: 502,
      message:
        'Backend is not configured. In Vercel → Settings → Environment Variables, set BACKEND_URL to your public Spring Boot URL (no trailing slash), then Redeploy.',
    });
    return;
  }

  const incoming = req.url || '/';
  const target = `${base}${incoming.startsWith('/') ? incoming : `/${incoming}`}`;
  const headers = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (!value) continue;
    const lower = key.toLowerCase();
    if (['host', 'connection', 'content-length'].includes(lower)) continue;
    headers[key] = Array.isArray(value) ? value.join(',') : value;
  }

  const method = req.method || 'GET';
  const hasBody = !['GET', 'HEAD'].includes(method);

  let upstream;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: hasBody ? await readBody(req) : undefined,
    });
  } catch {
    res.status(502).json({
      status: 502,
      message: `Cannot reach the Spring Boot API at ${base}. Host the backend publicly, then set BACKEND_URL.`,
    });
    return;
  }

  res.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (['transfer-encoding', 'connection'].includes(lower)) return;
    res.setHeader(key, value);
  });
  res.send(Buffer.from(await upstream.arrayBuffer()));
}
