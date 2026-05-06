const { getConfig, requireAdmin, sendText, supabaseHeaders } = require("../_utils");

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendText(response, 405, "Method not allowed");
  }

  if (!requireAdmin(request, response)) return;

  const config = getConfig();
  if (!config) {
    return sendText(response, 500, "Supabase is not configured");
  }

  const { supabaseUrl, serviceRoleKey } = config;
  const endpoint = `${supabaseUrl}/rest/v1/leads?select=email,source,guidebook_slug,created_at,updated_at&order=created_at.desc&limit=10000`;
  const supabaseResponse = await fetch(endpoint, {
    headers: supabaseHeaders(serviceRoleKey),
  });

  if (!supabaseResponse.ok) {
    return sendText(response, 502, "Could not export leads");
  }

  const leads = await supabaseResponse.json();
  const header = ["email", "source", "guidebook_slug", "created_at", "updated_at"];
  const rows = leads.map((lead) => header.map((key) => csvCell(lead[key])).join(","));
  const csv = [header.join(","), ...rows].join("\n");

  response.setHeader("Content-Disposition", "attachment; filename=\"razer-leads.csv\"");
  return sendText(response, 200, csv, "text/csv; charset=utf-8");
};
