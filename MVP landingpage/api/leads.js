const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function normalizeText(value, fallback = null) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
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

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return sendJson(response, 500, { error: "Lead storage is not configured" });
  }

  const body = parseBody(request.body);
  const email = normalizeText(body.email, "").toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return sendJson(response, 400, { error: "Invalid email" });
  }

  const payload = {
    email,
    source: normalizeText(body.source, "guidebook_landing"),
    guidebook_slug: normalizeText(body.guidebook_slug, "transfer-english-input-roadmap-v1"),
    referrer: normalizeText(request.headers.referer),
    user_agent: normalizeText(request.headers["user-agent"]),
    updated_at: new Date().toISOString(),
  };

  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?on_conflict=email`;
  const supabaseResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!supabaseResponse.ok) {
    return sendJson(response, 502, { error: "Could not save lead" });
  }

  return sendJson(response, 200, { ok: true });
};
