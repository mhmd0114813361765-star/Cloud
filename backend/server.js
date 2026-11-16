const http = require("node:http");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");

const port = Number(process.env.PORT) || 3000;
const maxBodyBytes = 10 * 1024;
const databasePath = process.env.DB_FILE || path.join(__dirname, "data", "app.db");
const db = new DatabaseSync(databasePath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

const server = http.createServer((request, response) => {
  if (request.url === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.url !== "/api/login" && request.url !== "/api/register") {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  if (!request.headers["content-type"]?.includes("application/json")) {
    sendJson(response, 415, { error: "Content-Type must be application/json." });
    return;
  }

  let body = "";
  let bodyTooLarge = false;

  request.on("data", (chunk) => {
    if (bodyTooLarge) return;
    body += chunk;
    if (Buffer.byteLength(body) > maxBodyBytes) {
      bodyTooLarge = true;
      sendJson(response, 413, { error: "Request body is too large." });
      request.resume();
    }
  });

  request.on("end", () => {
    if (bodyTooLarge) return;
    let credentials;
    try {
      credentials = JSON.parse(body);
    } catch {
      sendJson(response, 400, { error: "Request body must be valid JSON." });
      return;
    }

    if (credentials === null || typeof credentials !== "object" || Array.isArray(credentials)) {
      sendJson(response, 400, { error: "Request body must be a JSON object." });
      return;
    }

    const username = typeof credentials.username === "string" ? credentials.username.trim().toLowerCase() : "";
    const password = typeof credentials.password === "string" ? credentials.password : "";
    if (!username || username.length > 50 || !password) {
      sendJson(response, 400, { error: "Enter a username (up to 50 characters) and password." });
      return;
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
      sendJson(response, 400, { error: "Password must not exceed 72 UTF-8 bytes." });
      return;
    }
    void handleCredentials(request.url, username, password, response);
  });
});

async function handleCredentials(url, username, password, response) {
  try {
    if (url === "/api/register") {
      if (password.length < 8) {
        sendJson(response, 400, { error: "Password must be at least 8 characters." });
        return;
      }
      const passwordHash = await bcrypt.hash(password, 10);
      db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, passwordHash);
      sendJson(response, 201, { message: `Account created for ${username}. You can now log in.` });
      return;
    }

    const user = db.prepare("SELECT password_hash FROM users WHERE username = ?").get(username);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      sendJson(response, 401, { error: "Invalid username or password." });
      return;
    }
    sendJson(response, 200, { message: `You have logged in successfully, ${username}.` });
  } catch (error) {
    if (url === "/api/register" && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      sendJson(response, 409, { error: "That username is already registered." });
      return;
    }
    console.error("Database request failed:", error);
    sendJson(response, 500, { error: "The request could not be completed." });
  }
}

server.listen(port, "0.0.0.0", () => {
  console.log(`Backend listening on port ${port}; SQLite file: ${databasePath}`);
});

server.on("close", () => db.close());
