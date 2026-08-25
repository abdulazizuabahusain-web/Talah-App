/**
 * Standalone production server for Expo static builds.
 *
 * Serves the output of build.js (static-build/) with two special routes:
 * - GET / or /manifest with expo-platform header → platform manifest JSON
 * - GET / without expo-platform → landing page HTML
 * Everything else falls through to static file serving from ./static-build/.
 *
 * Zero external dependencies — uses only Node.js built-ins (http, fs, path).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const TEMPLATE_PATH = path.resolve(__dirname, "templates", "landing-page.html");
const STATIC_PAGE_TEMPLATE_PATH = path.resolve(
  __dirname,
  "templates",
  "static-page.html",
);
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");
const IOS_APP_ID = "5YXF6Z9843.com.abdulaziz.talah";
const APP_STORE_LINK = "https://apps.apple.com/app/id6786908048";

const PRIVACY_POLICY_TEXT_EN = `Tal'ah is built on one principle: your privacy comes first. No user can browse your profile, and direct contact between users is not permitted until both sides mutually reveal after a meetup.

Information we collect:
• Phone number and email, to create and secure your account.
• Nickname, gender, city, and age range.
• Interests, personality traits, and meetup preferences (days, times, meetup type).
• Contact details (phone, Instagram, Snapchat, X/Twitter, TikTok) — stored privately and only shared after a mutual reveal you explicitly approve.
• A push notification token, used to alert you about meetups.

How we use your data:
• To arrange small, safe meetups between compatible people.
• To improve match quality over time.
• To contact you about your account or scheduled meetups.

What we never do:
• We never sell your data to third parties.
• We never show your photo or full profile to other users.
• We never allow browsing or searching for users.
• We never reveal your contact details without your explicit consent.

Your safety:
You can report or block any user at any time. Our team manually reviews every report.

Your rights:
You can update your information or permanently delete your account at any time from Settings. Deletion removes your personal data from our systems.

Contact us:
For any privacy questions, reach us at info@talahapp.com.

Last updated: July 2026`;

const SUPPORT_TEXT_EN = `For any question or issue related to the Tal'ah app, we're happy to help. Reach out by email and we'll get back to you as soon as possible.

info@talahapp.com`;

function serveStaticPage(res, { title, body, lang }) {
  const template = fs.readFileSync(STATIC_PAGE_TEMPLATE_PATH, "utf-8");
  const isAr = lang === "ar";
  const html = template
    .replace(/DIR_PLACEHOLDER/g, isAr ? "rtl" : "ltr")
    .replace(/LANG_PLACEHOLDER/g, lang)
    .replace(/TITLE_PLACEHOLDER/g, title)
    .replace(
      /BODY_PLACEHOLDER/g,
      body.replace(
        /info@talahapp\.com/g,
        '<a href="mailto:info@talahapp.com">info@talahapp.com</a>',
      ),
    )
    .replace(/APP_NAME_PLACEHOLDER/g, getAppName());

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

function getAppName() {
  try {
    const appJsonPath = path.resolve(__dirname, "..", "app.json");
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveManifest(platform, res) {
  // `platform` is validated by the caller to be exactly "ios" or "android"
  // before this function is invoked — no path traversal is possible here.
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(
      JSON.stringify({ error: `Manifest not found for platform: ${platform}` }),
    );
    return;
  }

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.writeHead(200, {
    "content-type": "application/json",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
  });
  res.end(manifest);
}

function serveLandingPage(req, res, landingPageTemplate, appName) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = forwardedProto || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

function serveAppleAppSiteAssociation(res) {
  const body = JSON.stringify({
    applinks: {
      details: [
        {
          appID: IOS_APP_ID,
          paths: ["/invite", "/invite/*"],
        },
      ],
    },
  });
  res.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=3600",
  });
  res.end(body);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function serveInviteFallback(req, res, url) {
  const forwardedProto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const inviteUrl = `${forwardedProto}://${host}${url.pathname}${url.search}`;
  const safeInviteUrl = escapeHtml(inviteUrl);
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="apple-itunes-app" content="app-id=6786908048, app-argument=${safeInviteUrl}">
  <title>دعوة إلى طلعة</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: #f5f0e8; color: #1a1a1a; font-family: Arial, sans-serif; }
    main { width: min(100%, 420px); padding: 32px; box-sizing: border-box; text-align: center; background: #fff; border-radius: 20px; }
    h1 { margin: 0 0 12px; color: #3d4a2e; }
    p { line-height: 1.7; color: #625b4f; }
    a { display: inline-block; margin-top: 12px; padding: 12px 20px; border-radius: 10px; background: #3d4a2e; color: #fff; text-decoration: none; }
  </style>
</head>
<body><main><h1>لديك دعوة إلى طلعة</h1><p>حمّلي التطبيق من App Store، ثم افتحي رابط الدعوة مرة أخرى للعودة إلى الدعوة المحددة.</p><a href="${APP_STORE_LINK}">تحميل التطبيق</a></main></body>
</html>`;
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

function serveStaticFile(urlPath, res) {
  // Normalise and strip leading ".." segments, then verify the resolved path
  // stays inside STATIC_ROOT — prevents path-traversal attacks.
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(STATIC_ROOT, safePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { "content-type": contentType });
  res.end(content);
}

const landingPageTemplate = fs.readFileSync(TEMPLATE_PATH, "utf-8");
const appName = getAppName();

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  if (
    pathname === "/.well-known/apple-app-site-association" ||
    pathname === "/apple-app-site-association"
  ) {
    return serveAppleAppSiteAssociation(res);
  }

  if (pathname === "/invite") {
    return serveInviteFallback(req, res, url);
  }

  if (pathname === "/" || pathname === "/manifest") {
    const platform = req.headers["expo-platform"];
    if (platform === "ios" || platform === "android") {
      return serveManifest(platform, res);
    }

    if (pathname === "/") {
      return serveLandingPage(req, res, landingPageTemplate, appName);
    }
  }

  if (pathname === "/privacy") {
    return serveStaticPage(res, {
      title: "Privacy Policy",
      body: PRIVACY_POLICY_TEXT_EN,
      lang: "en",
    });
  }

  if (pathname === "/support") {
    return serveStaticPage(res, {
      title: "Support",
      body: SUPPORT_TEXT_EN,
      lang: "en",
    });
  }

  serveStaticFile(pathname, res);
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Serving static Expo build on port ${port}`);
});
