const passwordInput = document.getElementById("adminPassword");
const authForm = document.getElementById("adminAuthForm");
const workspace = document.getElementById("adminWorkspace");
const leadRows = document.getElementById("leadRows");
const leadCount = document.getElementById("leadCount");
const refreshLeads = document.getElementById("refreshLeads");
const exportLeads = document.getElementById("exportLeads");
const guidebookForm = document.getElementById("guidebookForm");
const guidebookFile = document.getElementById("guidebookFile");
const uploadStatus = document.getElementById("uploadStatus");

function getPassword() {
  return sessionStorage.getItem("razerAdminPassword") || "";
}

function setStatus(message, isError = false) {
  uploadStatus.textContent = message;
  uploadStatus.dataset.error = isError ? "true" : "false";
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function loadLeads() {
  leadRows.innerHTML = "<tr><td colspan=\"3\">불러오는 중...</td></tr>";

  const response = await fetch("/api/admin/leads", {
    headers: { "x-admin-password": getPassword() },
  });

  if (!response.ok) {
    leadRows.innerHTML = "<tr><td colspan=\"3\">조회 실패. 비밀번호와 환경변수를 확인하세요.</td></tr>";
    leadCount.textContent = "0";
    return;
  }

  const data = await response.json();
  leadCount.textContent = data.leads.length;
  leadRows.innerHTML = data.leads.length
    ? data.leads.map((lead) => `
      <tr>
        <td>${lead.email}</td>
        <td>${lead.source || "-"}</td>
        <td>${formatDate(lead.created_at)}</td>
      </tr>
    `).join("")
    : "<tr><td colspan=\"3\">아직 수집된 이메일이 없습니다.</td></tr>";
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  sessionStorage.setItem("razerAdminPassword", passwordInput.value);
  workspace.hidden = false;
  await loadLeads();
});

refreshLeads.addEventListener("click", loadLeads);

exportLeads.addEventListener("click", async () => {
  const response = await fetch("/api/admin/export", {
    headers: { "x-admin-password": getPassword() },
  });

  if (!response.ok) {
    alert("CSV 다운로드에 실패했습니다.");
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "razer-leads.csv";
  link.click();
  URL.revokeObjectURL(url);
});

guidebookForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = guidebookFile.files[0];

  if (!file || file.type !== "application/pdf") {
    setStatus("PDF 파일만 업로드할 수 있습니다.", true);
    return;
  }

  setStatus("업로드 중...");
  const contentBase64 = await readFileAsBase64(file);
  const response = await fetch("/api/admin/guidebook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": getPassword(),
    },
    body: JSON.stringify({ fileName: file.name, contentBase64 }),
  });

  if (!response.ok) {
    setStatus("업로드 실패. 비밀번호, 파일 크기, Supabase 설정을 확인하세요.", true);
    return;
  }

  setStatus("최신 PDF로 업데이트됐습니다.");
  guidebookForm.reset();
});

if (getPassword()) {
  passwordInput.value = getPassword();
  workspace.hidden = false;
  loadLeads();
}
