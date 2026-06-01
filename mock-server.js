const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8080;

// Sett til true hvis du vil teste automatisk rollefunn.
// Sett til false hvis du vil teste fallback til manual login.
const AUTO_LOGIN_OK = false;

const users = {
  admin1: {
    password: "test",
    role: "admin",
    matchedGroup: "GG_HelpDesk_Admin",
  },
  support1: {
    password: "test",
    role: "support",
    matchedGroup: "GG_HelpDesk_Support",
  },
  user1: {
    password: "test",
    role: "user",
    matchedGroup: "GG_HelpDesk_User",
  },
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data, null, 2));
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const contentTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
    });
    res.end(content);
  });
}

function readBody(req, callback) {
  let body = "";

  req.on("data", chunk => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      callback(JSON.parse(body || "{}"));
    } catch {
      callback({});
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  // Mock av C++ endpoint: /cgi-bin/ad-bootstrap
  if (req.url === "/cgi-bin/ad-bootstrap" && req.method === "GET") {
    if (AUTO_LOGIN_OK) {
      return sendJson(res, 200, {
        status: "auto_login_ok",
        username: "support1",
        role: "support",
        matchedGroup: "GG_HelpDesk_Support",
        source: "Mock Active Directory",
        checkedBy: "Mock C++ LDAP Role Resolver",
      });
    }

    return sendJson(res, 200, {
      status: "manual_login_required",
      message: "Could not find AD role automatically",
    });
  }

  // Mock av C++ endpoint: /cgi-bin/ad-login
  if (req.url === "/cgi-bin/ad-login" && req.method === "POST") {
    return readBody(req, body => {
      const { username, password } = body;
      const user = users[username];

      if (!user || user.password !== password) {
        return sendJson(res, 401, {
          status: "login_failed",
          message: "Invalid AD username or password",
        });
      }

      return sendJson(res, 200, {
        status: "manual_login_ok",
        username,
        role: user.role,
        matchedGroup: user.matchedGroup,
        source: "Mock Active Directory",
        checkedBy: "Mock C++ LDAP Role Resolver",
      });
    });
  }

  // Server frontend-filer
  let filePath = req.url === "/" ? "index.html" : req.url.slice(1);
  filePath = path.join(__dirname, filePath);

  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Mock HelpDesk server running on http://localhost:${PORT}`);
  console.log("Test accounts:");
  console.log("admin1 / test");
  console.log("support1 / test");
  console.log("user1 / test");
});