const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getEmailFromForm(form) {
  const local = form.querySelector(".email-local")?.value.trim();
  const domainSelect = form.querySelector(".email-domain");
  const customDomain = form.querySelector(".email-custom-domain")?.value.trim();
  const domain = domainSelect?.value === "custom" ? customDomain : domainSelect?.value;

  if (!local || !domain) return "";

  return `${local}@${domain}`.toLowerCase();
}

function setupEmailBuilders() {
  document.querySelectorAll("[data-email-builder]").forEach((builder) => {
    const domainSelect = builder.querySelector(".email-domain");
    const customDomain = builder.querySelector(".email-custom-domain");

    domainSelect?.addEventListener("change", () => {
      const isCustom = domainSelect.value === "custom";
      customDomain.hidden = !isCustom;
      customDomain.required = isCustom;

      if (isCustom) {
        customDomain.focus();
      } else {
        customDomain.value = "";
      }
    });
  });
}

async function handleLeadSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button");
  const email = getEmailFromForm(form);

  if (!EMAIL_PATTERN.test(email)) {
    alert("이메일을 제대로 입력해주세요.");
    return;
  }

  if (button) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = "처리 중";
  }

  try {
    if (window.location.protocol === "file:") {
      const leads = JSON.parse(localStorage.getItem("razerLeads") || "[]");
      if (!leads.includes(email)) leads.push(email);
      localStorage.setItem("razerLeads", JSON.stringify(leads));
      localStorage.setItem("razerLeadEmail", email);
      window.location.href = "./download.html";
      return;
    }

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        source: "guidebook_landing",
        guidebook_slug: "transfer-english-input-roadmap-v1",
      }),
    });

    if (!response.ok) {
      throw new Error("Lead submission failed");
    }

    localStorage.setItem("razerLeadEmail", email);
    window.location.href = "./download.html";
  } catch (error) {
    alert("저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    if (button) {
      button.disabled = false;
      button.textContent = button.dataset.originalText || "무료 가이드북 받기";
    }
  }
}

setupEmailBuilders();

document.getElementById("leadForm")?.addEventListener("submit", handleLeadSubmit);
document.getElementById("leadFormBottom")?.addEventListener("submit", handleLeadSubmit);
