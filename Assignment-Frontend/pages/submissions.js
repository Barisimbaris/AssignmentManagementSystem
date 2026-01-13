// Teslimlerim Modülü

const submissionsState = {
  submissions: []
};

const submissionsSelectors = {
  page: () => document.getElementById("submissionsPage"),
  submissionsList: () => document.getElementById("submissionsList")
};

const requireStudentRole = () => {
  const user = getAuthUser();
  if (!user) {
    throw new Error("Lütfen giriş yapın");
  }
  if ((user.role || "").toLowerCase() !== "student") {
    throw new Error("Bu sayfa sadece öğrenciler içindir");
  }
  return user;
};

const submissionsHandleUnauthorized = (error) => {
  if (error?.status === 401) {
    showToast("Oturumunuzun süresi doldu, lütfen tekrar giriş yapın.", true);
    clearAuthSession();
    setTimeout(() => {
      window.location.href = "login.html";
    }, 800);
    return true;
  }
  return false;
};

const formatDate = (value) => {
  if (typeof window.formatDateTurkish === 'function') {
    return window.formatDateTurkish(value);
  }
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    
    const utcTime = date.getTime();
    const turkishOffset = 3 * 60 * 60 * 1000;
    const turkishTime = new Date(utcTime + turkishOffset);
    
    return turkishTime.toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Istanbul"
    });
  } catch (e) {
    return value;
  }
};

const renderSubmissions = (submissions = [], filter = "all") => {
  const container = submissionsSelectors.submissionsList();
  if (!container) return;

  // Filtreleme
  let filteredSubmissions = submissions;
  if (filter === "pending") {
    filteredSubmissions = submissions.filter(s => !(s.gradeId || s.GradeId));
  } else if (filter === "graded") {
    filteredSubmissions = submissions.filter(s => (s.gradeId || s.GradeId));
  }

  if (!filteredSubmissions.length) {
    container.innerHTML = "<p style='padding: 1rem 1.5rem; color: #666;'>Teslim bulunmuyor.</p>";
    return;
  }

  const isMobile = window.innerWidth <= 768;

  container.innerHTML = filteredSubmissions.map(submission => {
    const assignmentTitle = submission.assignmentTitle || submission.AssignmentTitle || "Ödev";
    const courseCode = submission.courseCode || submission.CourseCode || "";
    const submittedAt = formatDate(submission.submittedAt || submission.SubmittedAt);
    const fileName = submission.fileName || submission.FileName || "Dosya";
    const status = (submission.gradeId || submission.GradeId) ? "Notlandı" : "Bekleyen";
    const statusColor = (submission.gradeId || submission.GradeId) ? "#4CAF50" : "#FF9800";
    const score = submission.score || submission.Score;
    const maxScore = submission.maxScore || submission.MaxScore;
    const scoreText = score !== null && score !== undefined ? `${score}/${maxScore || 100}` : "-";

    if (isMobile) {
      return `
        <div class="assignment-card-mobile">
          <div class="assignment-card-header">
            <div>
              <div class="assignment-card-title">${assignmentTitle}</div>
              <div class="assignment-card-type" style="background: ${statusColor === "#4CAF50" ? "#E8F5E9" : "#FFF3E0"}; color: ${statusColor};">${status}</div>
            </div>
          </div>
          <div class="assignment-card-info">
            <div>📚 ${courseCode}</div>
            <div>📅 ${submittedAt}</div>
            <div>📄 ${fileName}</div>
            ${score !== null && score !== undefined ? `<div>⭐ ${scoreText}</div>` : ""}
          </div>
          <div class="assignment-card-actions">
            <button class="btn-secondary-mobile" onclick="downloadSubmission(${submission.id || submission.Id})">📥 İndir</button>
            ${score !== null && score !== undefined ? `<button class="btn-primary-mobile" style="background: #4CAF50;" disabled>✅ ${scoreText}</button>` : ""}
          </div>
        </div>
      `;
    }

    // Desktop tasarım
    return `
      <div class="assignment-card">
        <div class="assignment-header">
          <strong>${assignmentTitle}</strong>
          <span class="badge" style="background: ${statusColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; margin-left: 0.5rem;">${status}</span>
        </div>
        <p><strong>Ders:</strong> ${courseCode}</p>
        <p><strong>Teslim Tarihi:</strong> ${submittedAt}</p>
        <p><strong>Dosya:</strong> ${fileName}</p>
        ${score !== null && score !== undefined ? `<p><strong>Puan:</strong> ${scoreText}</p>` : ""}
        <div style="margin-top: 1rem;">
          <button class="download-btn" onclick="downloadSubmission(${submission.id || submission.Id})">📥 Dosyayı İndir</button>
        </div>
      </div>
    `;
  }).join("");
};

const downloadSubmission = async (submissionId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      showToast("Oturumunuzun süresi doldu", true);
      window.location.href = "login.html";
      return;
    }

    // API_BASE_URL'yi authUtils.js'den al (ngrok URL'i içerir)
    const API_BASE_URL = window.__API_BASE_URL__ || "https://jangly-unsimplified-bria.ngrok-free.dev/api";
    const response = await fetch(`${API_BASE_URL}/Submission/${submissionId}/download`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthSession();
        window.location.href = "login.html";
        return;
      }
      throw new Error("Dosya indirilemedi");
    }

    // Content-Disposition header'ından dosya adını al
    const contentDisposition = response.headers.get("Content-Disposition");
    let fileName = `submission_${submissionId}.pdf`;
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1].replace(/['"]/g, '');
        // UTF-8 encoded filename* desteği
        if (fileName.startsWith("UTF-8''")) {
          fileName = decodeURIComponent(fileName.substring(7));
        }
      }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showToast("Dosya başarıyla indirildi!");
  } catch (error) {
    console.error("Dosya indirme hatası:", error);
    showToast(error.message || "Dosya indirilemedi", true);
  }
};

window.downloadSubmission = downloadSubmission;

const loadSubmissions = async () => {
  const container = submissionsSelectors.submissionsList();
  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    const response = await apiFetch("/Submission/my-submissions");
    const submissions = Array.isArray(response) ? response : [];
    
    submissionsState.submissions = submissions;
    renderSubmissions(submissions, "all");
  } catch (error) {
    console.error("Teslimler yüklenemedi:", error);
    if (submissionsHandleUnauthorized(error)) return;
    if (container) {
      container.innerHTML = `<p style="color:red; padding: 1rem 1.5rem;">${error.message || "Teslimler yüklenirken hata oluştu"}</p>`;
    }
  }
};

const setupFilterButtons = () => {
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");
      renderSubmissions(submissionsState.submissions, filter);
    });
  });
};

const initSubmissionsPage = async () => {
  try {
    ensureAuthenticated();
    requireStudentRole();
    
    if (typeof updateNavigationByRole === "function") {
      updateNavigationByRole();
    }
  } catch (error) {
    showToast(error.message, true);
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
    return;
  }

  await loadSubmissions();
  setupFilterButtons();
};

document.addEventListener("DOMContentLoaded", () => {
  const page = submissionsSelectors.page();
  if (!page) return;
  initSubmissionsPage();
});








