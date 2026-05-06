const {
  SETTINGS_KEY,
  SUPABASE_BUCKET,
  getConfig,
  supabaseHeaders,
} = require("./_utils");

module.exports = async function handler(request, response) {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.setHeader("Allow", "GET, HEAD");
    response.statusCode = 405;
    response.end("Method not allowed");
    return;
  }

  const config = getConfig();
  if (!config) {
    response.writeHead(302, { Location: "/assets/guidebook.pdf" });
    response.end();
    return;
  }

  const { supabaseUrl, serviceRoleKey } = config;
  const settingsUrl = `${supabaseUrl}/rest/v1/site_settings?key=eq.${SETTINGS_KEY}&select=value&limit=1`;
  const settingsResponse = await fetch(settingsUrl, {
    headers: supabaseHeaders(serviceRoleKey),
  });

  if (!settingsResponse.ok) {
    response.writeHead(302, { Location: "/assets/guidebook.pdf" });
    response.end();
    return;
  }

  const rows = await settingsResponse.json();
  const path = rows[0]?.value?.path;

  if (!path) {
    response.writeHead(302, { Location: "/assets/guidebook.pdf" });
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
