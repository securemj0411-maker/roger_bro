const SUPABASE_BUCKET = "guidebooks";
const SETTINGS_KEY = "latest_guidebook_path";

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", contentType);
  response.end(body);
}

function parseBody(body) {
  if (body && typeof body === "object") return body;
  if (typeof body !== "string") return {};

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function getConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return { supabaseUrl, serviceRoleKey };
}

function getAdminPassword(request) {
  return request.headers["x-admin-password"] || parseBody(request.body).password || "";
}

function requireAdmin(request, response) {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    sendJson(response, 500, { error: "Admin password is not configured" });
    return false;
  }

  if (getAdminPassword(request) !== configuredPassword) {
    sendJson(response, 401, { error: "Unauthorized" });
    return false;
  }

  return true;
}

function supabaseHeaders(serviceRoleKey, extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...extra,
  };
}

function sanitizeFileName(fileName) {
  const safe = String(fileName || "guidebook.pdf")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safe.endsWith(".pdf") ? safe : `${safe || "guidebook"}.pdf`;
}

module.exports = {
  SETTINGS_KEY,
  SUPABASE_BUCKET,
  getConfig,
  parseBody,
  requireAdmin,
  sanitizeFileName,
  sendJson,
  sendText,
  supabaseHeaders,
};
