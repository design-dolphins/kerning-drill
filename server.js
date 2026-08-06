const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "out");
const types = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((req, res) => {
  const requested = decodeURIComponent((req.url || "/").split("?")[0]);
  const relative = requested === "/" ? "index.html" : requested.replace(/^\/+/, "");
  let file = path.resolve(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, "index.html");
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}).listen(3000, "127.0.0.1", () => console.log("Kerning Drill is ready at http://localhost:3000"));
