const {
  SETTINGS_KEY,
  SUPABASE_BUCKET,
  getConfig,
  parseBody,
  requireAdmin,
  sanitizeGuidebookFileName,
  sendJson,
  supabaseHeaders,
} = require("../_utils");

function bufferFromDataUrl(value) {
  const base64 = String(value || "").split(",").pop();
  return base64 ? Buffer.from(base64, "base64") : null;
}

async function uploadObject({ supabaseUrl, serviceRoleKey, path, contentType, buffer }) {
  return fetch(`${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${path}`, {
    method: "POST",
    headers: supabaseHeaders(serviceRoleKey, {
      "Content-Type": contentType,
      "x-upsert": "true",
    }),
    body: buffer,
  });
}

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
  const pdfFileName = sanitizeGuidebookFileName(body.pdfFileName, "guidebook.pdf", ".pdf");
  const htmlFileName = sanitizeGuidebookFileName(body.htmlFileName, "guidebook.html", ".html");
  const pdfBuffer = bufferFromDataUrl(body.pdfContentBase64);
  const htmlBuffer = bufferFromDataUrl(body.htmlContentBase64);
  const version = String(body.version || "").trim() || new Date().toISOString().slice(0, 10);

  if (!pdfBuffer || !htmlBuffer) {
    return sendJson(response, 400, { error: "HTML and PDF files are required" });
  }

  if (!pdfBuffer.length || pdfBuffer.subarray(0, 4).toString() !== "%PDF") {
    return sendJson(response, 400, { error: "Only PDF files can be uploaded" });
  }

  const htmlStart = htmlBuffer.subarray(0, 512).toString().toLowerCase();
  if (!htmlStart.includes("<!doctype html") && !htmlStart.includes("<html")) {
    return sendJson(response, 400, { error: "Only HTML files can be uploaded" });
  }

  const { supabaseUrl, serviceRoleKey } = config;
  const stamp = Date.now();
  const pdfPath = `latest/${stamp}-${pdfFileName}`;
  const htmlPath = `latest/${stamp}-${htmlFileName}`;
  const htmlUploadResponse = await uploadObject({
    supabaseUrl,
    serviceRoleKey,
    path: htmlPath,
    contentType: "text/html; charset=utf-8",
    buffer: htmlBuffer,
  });
  const pdfUploadResponse = await uploadObject({
    supabaseUrl,
    serviceRoleKey,
    path: pdfPath,
    contentType: "application/pdf",
    buffer: pdfBuffer,
  });

  if (!htmlUploadResponse.ok || !pdfUploadResponse.ok) {
    return sendJson(response, 502, { error: "Could not upload guidebook files" });
  }

  const settingsPayload = {
    key: SETTINGS_KEY,
    value: {
      htmlPath,
      pdfPath,
      htmlFileName,
      pdfFileName,
      version,
      uploadedAt: new Date().toISOString(),
      htmlSize: htmlBuffer.length,
      pdfSize: pdfBuffer.length,
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
    return sendJson(response, 502, { error: "Uploaded files, but could not update latest guidebook" });
  }

  return sendJson(response, 200, {
    ok: true,
    htmlPath,
    pdfPath,
    htmlUrl: `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${htmlPath}`,
    pdfUrl: `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${pdfPath}`,
  });
};
