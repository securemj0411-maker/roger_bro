const { getConfig, requireAdmin, sendJson, supabaseHeaders } = require("../_utils");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  if (!requireAdmin(request, response)) return;

  const config = getConfig();
  if (!config) {
    return sendJson(response, 500, { error: "Supabase is not configured" });
  }

  const { supabaseUrl, serviceRoleKey } = config;
  const endpoint = `${supabaseUrl}/rest/v1/leads?select=id,email,source,guidebook_slug,created_at,updated_at&order=created_at.desc&limit=1000`;
  const supabaseResponse = await fetch(endpoint, {
    headers: supabaseHeaders(serviceRoleKey),
  });

  if (!supabaseResponse.ok) {
    return sendJson(response, 502, { error: "Could not load leads" });
  }

  const leads = await supabaseResponse.json();
  return sendJson(response, 200, { leads });
};
