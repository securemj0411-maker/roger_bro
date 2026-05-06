const {
  SETTINGS_KEY,
  SUPABASE_BUCKET,
  getConfig,
  supabaseHeaders,
} = require("./_utils");

function getGuidebookType(request) {
  const host = request.headers.host || "localhost";
  const url = new URL(request.url || "/api/guidebook", `https://${host}`);
  return url.searchParams.get("type") === "html" ? "html" : "pdf";
}

module.exports = async function handler(request, response) {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.setHeader("Allow", "GET, HEAD");
    response.statusCode = 405;
    response.end("Method not allowed");
    return;
  }

  const type = getGuidebookType(request);
  const fallback = type === "html" ? "/assets/guidebook.html" : "/assets/guidebook.pdf";
  const config = getConfig();
  if (!config) {
    response.writeHead(302, { Location: fallback });
    response.end();
    return;
  }

  const { supabaseUrl, serviceRoleKey } = config;
  const settingsUrl = `${supabaseUrl}/rest/v1/site_settings?key=eq.${SETTINGS_KEY}&select=value&limit=1`;
  const settingsResponse = await fetch(settingsUrl, {
    headers: supabaseHeaders(serviceRoleKey),
  });

  if (!settingsResponse.ok) {
    response.writeHead(302, { Location: fallback });
    response.end();
    return;
  }

  const rows = await settingsResponse.json();
  const value = rows[0]?.value || {};
  const path = type === "html" ? value.htmlPath : value.pdfPath || value.path;

  if (!path) {
    response.writeHead(302, { Location: fallback });
    response.end();
    return;
  }

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  response.writeHead(302, {
    "Cache-Control": "no-store",
    Location: `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${encodedPath}`,
  });
  response.end();
};
