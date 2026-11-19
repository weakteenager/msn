const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const users = new Map();
const messages = [];
let nextMessageId = 1;

const adjectives = [
  "Mavi", "Tatli", "Minik", "Uykulu", "Neşeli", "Gizemli",
  "Pembe", "Hızlı", "Sessiz", "Yaramaz", "Parlak", "Bulutlu"
];
const nouns = [
  "Kedi", "Gezgin", "Yıldız", "Balon", "Limon", "Martı",
  "Panda", "Robot", "Kiraz", "Rüya", "Kahve", "Gezegen"
];

function randomName() {
  return adjectives[Math.floor(Math.random() * adjectives.length)] +
    nouns[Math.floor(Math.random() * nouns.length)] +
    Math.floor(10 + Math.random() * 90);
}

function send(res, status, data, type) {
  res.writeHead(status, {
    "Content-Type": type || "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(type ? data : JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 10000) {
        reject(new Error("İstek çok büyük"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch (err) { reject(err); }
    });
    req.on("error", reject);
  });
}

function cleanupUsers() {
  const cutoff = Date.now() - 35000;
  for (const [id, user] of users.entries()) {
    if (user.lastSeen < cutoff) users.delete(id);
  }
}

function onlineCount() {
  cleanupUsers();
  return users.size;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "POST" && url.pathname === "/api/join") {
    const id = crypto.randomBytes(16).toString("hex");
    const user = { name: randomName(), lastSeen: Date.now(), lastMessageAt: 0 };
    users.set(id, user);
    return send(res, 200, { id, name: user.name, messages: messages.slice(-60), online: onlineCount() });
  }

  if (req.method === "POST" && url.pathname === "/api/ping") {
    try {
      const body = await readBody(req);
      const user = users.get(String(body.id || ""));
      if (!user) return send(res, 401, { error: "Oturum bulunamadı" });
      user.lastSeen = Date.now();
      return send(res, 200, { online: onlineCount() });
    } catch (_) {
      return send(res, 400, { error: "Geçersiz istek" });
    }
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    const id = url.searchParams.get("id") || "";
    const user = users.get(id);
    if (!user) return send(res, 401, { error: "Oturum bulunamadı" });
    user.lastSeen = Date.now();
    const after = Number(url.searchParams.get("after") || 0);
    return send(res, 200, {
      messages: messages.filter(message => message.id > after),
      online: onlineCount()
    });
  }

  if (req.method === "POST" && url.pathname === "/api/message") {
    try {
      const body = await readBody(req);
      const user = users.get(String(body.id || ""));
      if (!user) return send(res, 401, { error: "Oturum bulunamadı" });

      const text = String(body.text || "").trim();
      if (!text) return send(res, 400, { error: "Boş mesaj gönderilemez" });
      if (text.length > 300) return send(res, 400, { error: "Mesaj en fazla 300 karakter olabilir" });
      if (Date.now() - user.lastMessageAt < 900) {
        return send(res, 429, { error: "Biraz yavaşla :)" });
      }

      user.lastSeen = Date.now();
      user.lastMessageAt = Date.now();
      const message = {
        id: nextMessageId++,
        name: user.name,
        text,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      };
      messages.push(message);
      if (messages.length > 200) messages.shift();
      return send(res, 200, { ok: true, message });
    } catch (_) {
      return send(res, 400, { error: "Geçersiz istek" });
    }
  }

  if (req.method === "GET") {
    const requested = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
    if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, "Forbidden", "text/plain");
    fs.readFile(filePath, (err, content) => {
      if (err) return send(res, 404, "Not found", "text/plain; charset=utf-8");
      const ext = path.extname(filePath);
      const types = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".ico": "image/x-icon"
      };
      send(res, 200, content, types[ext] || "application/octet-stream");
    });
    return;
  }

  send(res, 405, { error: "Method not allowed" });
});

server.listen(PORT, () => {
  console.log("MSN Chat is running on port " + PORT);
});
