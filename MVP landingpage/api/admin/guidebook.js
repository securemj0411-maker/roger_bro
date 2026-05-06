const {
  SETTINGS_KEY,
  SUPABASE_BUCKET,
  getConfig,
  parseBody,
  requireAdmin,
  sanitizeFileName,
  sendJson,
  supabaseHeaders,
} = require("../_utils");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  if (!requireAdmin(request, response)) return;

  const config = getConfig();
  if (!config) {
    return sendJson(response, 500, { error: "Supabase is not configured" });
  }

  const body = parseBody(request.body);
  const fileName = sanitizeFileName(body.fileName);
  const base64 = String(body.contentBase64 || "").split(",").pop();

  if (!base64) {
    return sendJson(response, 400, { error: "PDF file is required" });
  }

  const fileBuffer = Buffer.from(base64, "base64");
  if (!fileBuffer.length || fileBuffer.subarray(0, 4).toString() !== "%PDF") {
    return sendJson(response, 400, { error: "Only PDF files can be uploaded" });
  }

  const { supabaseUrl, serviceRoleKey } = config;
  const path = `latest/${Date.now()}-${fileName}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${path}`;
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: supabaseHeaders(serviceRoleKey, {
      "Content-Type": "application/pdf",
      "x-upsert": "true",
    }),
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    return sendJson(response, 502, { error: "Could not upload guidebook" });
  }

  const settingsPayload = {
    key: SETTINGS_KEY,
    value: {
      path,
      fileName,
      uploadedAt: new Date().toISOString(),
      size: fileBuffer.length,
    },
    updated_at: new Date().toISOString(),
  };

  const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/site_settings?on_conflict=key`, {
    method: "POST",
    headers: supabaseHeaders(serviceRoleKey, {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify(settingsPayload),
  });

  if (!settingsResponse.ok) {
    return sendJson(response, 502, { error: "Uploaded PDF, but could not update latest guidebook" });
  }

  return sendJson(response, 200, {
    ok: true,
    path,
    publicUrl: `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`,
  });
};
