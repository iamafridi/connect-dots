import cpeak, {
  serveStatic,
  parseJSON,
  cookieParser,
  auth,
} from "cpeak";
import type {
  CpeakRequest as Request,
  CpeakResponse as Response,
} from "cpeak";

import path from "path";
import compression from "compression";
import helmet from "helmet";
import { fileURLToPath } from "url";

import log from "./lib/log.js";
import keys from "./config/keys.js";
import util from "./lib/util.js";
import apiRouter from "./router.js";
import { DB } from "./database/index.js";

const app = cpeak();

// For parsing JSON body
app.beforeEach(parseJSON());

// Security headers. CSP stays off so the (custom) frontend can use inline
// styles and scripts freely; everything else helmet guards remains on.
app.beforeEach(
  helmet({
    contentSecurityPolicy: false,
  }) as any,
);

app.beforeEach(
  compression({
    filter: (req: any, res: any) => {
      // Never compress HTTP redirects (301, 302, 307, 308) — saves CPU cycles and buffer allocations
      if (res.statusCode >= 300 && res.statusCode < 400) return false;
      return compression.filter(req, res);
    },
  }) as any,
);

const publicPath = fileURLToPath(new URL("../public", import.meta.url));
const staticMiddleware = serveStatic(publicPath);

// Fast-path guard: only check filesystem for root and static asset paths.
// Eliminates fs.stat disk I/O on every short code redirect (/:id, /q/:id).
app.beforeEach((req, res, next) => {
  const url = req.url || "";
  if (
    url === "/" ||
    url.startsWith("/assets/") ||
    url.startsWith("/screenshots/") ||
    url === "/favicon.svg" ||
    url === "/footer_globe.mp4" ||
    url === "/robots.txt" ||
    url === "/redirect-warning" ||
    url === "/redirect-warning.html" ||
    url === "/404.html"
  ) {
    return staticMiddleware(req, res, next);
  }
  next();
});

// For server side rendering
// app.beforeEach(render());

if (!keys.cookieKey || keys.cookieKey.length < 32) {
  console.error(
    "You must set a cookie key in config/keys.ts file and it must be at least 32 characters long.",
  );
  process.exit(1);
}

if (!keys.tokenSecret || keys.tokenSecret.length < 32) {
  console.error(
    "You must set a token secret in config/keys.ts file and it must be at least 32 characters long.",
  );
  process.exit(1);
}

// Cookie parsing with signed cookie support
app.beforeEach(cookieParser({ secret: keys.cookieKey }));

// For authentication
app.beforeEach(
  auth({
    secret: keys.tokenSecret,
    tokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
    saveToken: async (tokenId, userId, expiresAt) => {
      await DB.insert("tokens", {
        id: tokenId,
        user_id: Number(userId),
        expires_at: expiresAt,
      });
    },
    findToken: async (tokenId) => {
      const row = await DB.find<{ user_id: number; expires_at: Date }>(
        "SELECT user_id, expires_at FROM tokens WHERE id = $1",
        [tokenId],
      );
      return row
        ? { userId: String(row.user_id), expiresAt: row.expires_at }
        : null;
    },
    revokeToken: async (tokenId) => {
      await DB.delete("tokens", "id = $1", [tokenId]);
    },
  }),
);

// Restore req.user from the signed uid cookie (Google OAuth), Falls back to
// the email/password auth when uid isn't present.
// Redirect fast path skips database token verification to maximize redirect throughput.
app.beforeEach(async (req, res, next) => {
  const uid = req.signedCookies?.uid;
  if (uid) {
    req.user = { id: Number(uid) };
    return next();
  }

  const token = req.signedCookies?.token;
  if (token) {
    const url = req.url || "";
    // Only verify session token if the request targets user/auth/account routes
    const isPublicRedirectOrFastRoute =
      !url.startsWith("/user") &&
      !url.startsWith("/url") &&
      !url.startsWith("/auth") &&
      !url.startsWith("/qr/");

    if (!isPublicRedirectOrFastRoute) {
      const result = await req.verifyToken(token as string);
      if (result)
        req.user = {
          id: Number(result.userId),
          tokenId: (token as string).split(".")[0],
        };
    }
  }

  next();
});

// Logging middleware
app.beforeEach((req, res, next) => {
  const requestStart = Date.now();
  // Grab requester ip address (honors TRUST_PROXY)
  const ip = util.getClientIp(req) || "unknown";

  // Once the request is finished
  res.on("finish", () => {
    // Get req status code and message
    const { statusCode, statusMessage } = res;
    // Calculate how much it took the request to finish
    const processingTime = Date.now() - requestStart;

    // Format the log message and send it to log function
    log(
      ip +
        " -- " +
        req.method +
        " " +
        req.url +
        " " +
        statusCode +
        " " +
        statusMessage +
        " -- response-time: " +
        processingTime +
        " ms",
    );
  });
  next();
});

// Show the home page
app.route("get", "/", (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, "./index.html"), "text/html");
});

app.route("get", "/terms", (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, "./terms.html"), "text/html");
});

app.route("get", "/privacy", (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, "./privacy.html"), "text/html");
});

app.route("get", "/reset-password", (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, "./index.html"), "text/html");
});

// ------ API Routes ------ //
apiRouter(app);

// Send 404 page for any route nothing else matched
app.fallback((req: Request, res: Response) => {
  res.status(404).sendFile(path.join(publicPath, "./404.html"), "text/html");
});

// Branded HTML error page rendered for browser (non-API) requests. Kept as a
// small in-code template so the message passed by the route stays visible.
function renderErrorPage(status: number, message: string): string {
  const safeMessage = String(message || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const title =
    status === 401
      ? "Sign in required"
      : status === 402
        ? "Out of credits"
        : status === 403
          ? "Not yours to touch"
          : status === 404
            ? "Not found"
            : status === 429
              ? "Slow down"
              : "Something broke";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${status} — ConnectDots</title>
    <meta name="color-scheme" content="dark" />
  </head>
  <body style="margin:0;background:#101315;color:#f3f0e8;font-family:'Inter Tight',system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
    <main style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:24px;">
      <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;letter-spacing:.2em;color:#ff7659;text-transform:uppercase;">
        ${status} / ${title}
      </div>
      <h1 style="margin:0;font-size:clamp(2rem,6vw,4rem);letter-spacing:-.05em;line-height:1.1;">
        ${title}<br /><span style="color:#98a09e;">doesn&rsquo;t fly.</span>
      </h1>
      <p style="max-width:52ch;color:#98a09e;">${safeMessage}</p>
      <a href="/" style="text-decoration:none;">
        <span style="display:inline-block;margin-top:18px;padding:14px 22px;background:#ff7659;color:#101315;border-radius:10px;font-weight:700;">Back to base ↗</span>
      </a>
    </main>
  </body>
</html>`;
}

// Handle all the errors that could happen in the routes
app.handleErr((error: any, req: Request, res: Response) => {
  const wantsHtml = (req.headers?.accept || "").includes("text/html");
  const status = error && error.status ? error.status : 500;
  const message =
    error && error.status
      ? error.message
      : "Sorry, something unexpected happened from our side.";

  if (wantsHtml) {
    if (status === 404) {
      return res
        .status(404)
        .sendFile(path.join(publicPath, "./404.html"), "text/html");
    }
    return res
      .status(status)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .end(renderErrorPage(status, message));
  }

  if (error && error.status) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error(error);
  log(error);
  res.status(500).json({
    error: "Sorry, something unexpected happened from our side.",
  });
});

export default app;