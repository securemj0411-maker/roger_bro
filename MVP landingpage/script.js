async function handleLeadSubmit(event, inputId) {
  event.preventDefault();
  const input = document.getElementById(inputId);
  const form = event.currentTarget;
  const button = form.querySelector("button");
  const email = input.value.trim();

  if (!email || !email.includes("@")) {
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

document.getElementById("leadForm")?.addEventListener("submit", (e) => handleLeadSubmit(e, "email"));
document.getElementById("leadFormBottom")?.addEventListener("submit", (e) => handleLeadSubmit(e, "emailBottom"));
