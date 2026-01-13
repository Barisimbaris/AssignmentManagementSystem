// Analiz ve Raporlar Modülü

const reportsState = {
  classes: [],
  analytics: null,
  charts: {},
  allStudents: [] // Öğretmenin sınıflarındaki tüm öğrenciler
};

const reportsSelectors = {
  page: () => document.getElementById("reportsPage"),
  teacherName: () => document.getElementById("teacherName"),
  logoutButton: () => document.getElementById("logoutButton"),
  analysisClassSelect: () => document.getElementById("analysisClassSelect"),
  loadClassAnalysisBtn: () => document.getElementById("loadClassAnalysis"),
  classAnalysisContainer: () => document.getElementById("classAnalysisContainer"),
  studentSearchInput: () => document.getElementById("studentSearchInput"),
  searchStudentBtn: () => document.getElementById("searchStudent"),
  studentAnalysisContainer: () => document.getElementById("studentAnalysisContainer"),
  allClassesSummary: () => document.getElementById("allClassesSummary")
};

const requireInstructorRoleReports = () => {
  const user = getAuthUser();
  if (!user) {
    throw new Error("Lütfen giriş yapın");
  }
  if ((user.role || "").toLowerCase() !== "instructor" && (user.role || "").toLowerCase() !== "admin") {
    throw new Error("Bu sayfa sadece öğretmenler içindir");
  }
  return user;
};

const reportsHandleUnauthorized = (error) => {
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

const populateAnalysisClassSelect = (classes = []) => {
  const select = reportsSelectors.analysisClassSelect();
  if (!select) return;

  select.innerHTML = '<option value="">Sınıf seçiniz</option>';
  classes.forEach((cls) => {
    const option = document.createElement("option");
    option.value = cls.id;
    option.textContent = `${cls.courseCode} - ${cls.className}`;
    select.appendChild(option);
  });
};

const renderClassAnalysis = (classData) => {
  const container = reportsSelectors.classAnalysisContainer();
  if (!container) return;

  if (!classData) {
    container.innerHTML = "<p>Sınıf verisi bulunamadı.</p>";
    return;
  }

  const html = `
    <div class="analysis-card">
      <h3>${classData.courseCode} - ${classData.className}</h3>
      <div class="analysis-stats">
        <div class="stat-item">
          <span class="stat-label">Toplam Öğrenci:</span>
          <span class="stat-value">${classData.totalStudents}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Ortalama Puan:</span>
          <span class="stat-value">${classData.averageScore}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Teslim Oranı:</span>
          <span class="stat-value">${classData.submissionRate}%</span>
        </div>
      </div>
      <div class="top-performers">
        <h4>En Başarılı Öğrenciler (Ortalamaya Göre):</h4>
        <ul>
          ${(classData.topPerformers || []).map((name, index) => `<li>${index + 1}. ${name}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;

  container.innerHTML = html;
};

const renderStudentAnalysis = (studentData) => {
  const container = reportsSelectors.studentAnalysisContainer();
  if (!container) return;

  if (!studentData) {
    container.innerHTML = "<p>Öğrenci verisi bulunamadı.</p>";
    return;
  }

  const html = `
    <div class="analysis-card">
      <h3>👤 ${studentData.studentName}</h3>
      <div class="analysis-stats">
        <div class="stat-item">
          <span class="stat-label">Toplam Ödev:</span>
          <span class="stat-value">${studentData.totalAssignments}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Tamamlanan:</span>
          <span class="stat-value">${studentData.completedAssignments}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Ortalama Puan:</span>
          <span class="stat-value">${studentData.averageScore}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Teslim Oranı:</span>
          <span class="stat-value">${studentData.submissionRate}%</span>
        </div>
      </div>
      <div class="subject-performance">
        <div class="performance-section">
          <h4>Güçlü Olduğu Dersler:</h4>
          <ul class="strong-subjects">
            ${studentData.strongSubjects.map((s) => `<li>✅ ${s}</li>`).join("")}
          </ul>
        </div>
        <div class="performance-section">
          <h4>Geliştirilmesi Gereken Dersler:</h4>
          <ul class="weak-subjects">
            ${studentData.weakSubjects.map((s) => `<li>⚠️ ${s}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
};

const renderAllClassesSummary = (classAnalytics = []) => {
  const container = reportsSelectors.allClassesSummary();
  if (!container) return;

  if (!classAnalytics.length) {
    container.innerHTML = "<p>Sınıf analizi bulunmuyor.</p>";
    return;
  }

  container.innerHTML = classAnalytics
    .map(
      (cls) => `
      <div class="summary-card">
        <h4>${cls.courseCode} - ${cls.className}</h4>
        <p><strong>Öğrenci:</strong> ${cls.totalStudents}</p>
        <p><strong>Ortalama:</strong> ${cls.averageScore}</p>
        <p><strong>Teslim Oranı:</strong> ${cls.submissionRate}%</p>
      </div>
    `
    )
    .join("");
};

const createClassPerformanceChart = (classAnalytics = []) => {
  const canvas = document.getElementById("classPerformanceChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Eski chart'ı yoket
  if (reportsState.charts.performanceChart) {
    reportsState.charts.performanceChart.destroy();
  }

  const labels = classAnalytics.map((c) => c.className);
  const data = classAnalytics.map((c) => c.averageScore);

  reportsState.charts.performanceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Ortalama Puan",
          data,
          backgroundColor: "rgba(33, 150, 243, 0.6)",
          borderColor: "rgba(33, 150, 243, 1)",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      },
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
};

const createSubmissionRateChart = (classAnalytics = []) => {
  const canvas = document.getElementById("submissionRateChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Eski chart'ı yoket
  if (reportsState.charts.submissionChart) {
    reportsState.charts.submissionChart.destroy();
  }

  const labels = classAnalytics.map((c) => c.className);
  const data = classAnalytics.map((c) => c.submissionRate);

  reportsState.charts.submissionChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Teslim Oranı (%)",
          data,
          backgroundColor: "rgba(76, 175, 80, 0.2)",
          borderColor: "rgba(76, 175, 80, 1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      },
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
};

const loadTeacherClassesForReports = async () => {
  const select = reportsSelectors.analysisClassSelect();
  if (select) {
    select.innerHTML = '<option value="">Sınıflar yükleniyor...</option>';
  }

  try {
    const classes = await apiFetch("/Class/my-classes");
    reportsState.classes = Array.isArray(classes) ? classes : [];
    populateAnalysisClassSelect(reportsState.classes);
    
    // Sınıflar yüklendikten sonra öğrencileri de yükle
    await loadAllStudentsFromClasses();
  } catch (error) {
    if (reportsHandleUnauthorized(error)) return;
    if (select) {
      select.innerHTML = `<option value="">Sınıflar alınamadı (${error.message})</option>`;
    }
  }
};

const loadAnalytics = async () => {
  try {
    // Yeni endpoint: Instructor'ın sınıf istatistikleri
    const classStatistics = await apiFetch("/Dashboard/statistics/my-classes");
    
    // Response direkt array olarak geliyor
    const classAnalytics = Array.isArray(classStatistics) ? classStatistics : [];
    
    reportsState.analytics = { classAnalytics };
    
    if (classAnalytics.length > 0) {
      renderAllClassesSummary(classAnalytics);
      createClassPerformanceChart(classAnalytics);
      createSubmissionRateChart(classAnalytics);
    } else {
      // Veri yoksa boş mesaj göster
      const container = reportsSelectors.allClassesSummary();
      if (container) {
        container.innerHTML = "<p>Henüz analiz verisi bulunmuyor. Ödevler oluşturup notlar verildikçe analizler otomatik olarak oluşacaktır.</p>";
      }
    }
  } catch (error) {
    if (reportsHandleUnauthorized(error)) return;
    showToast(error.message || "Analiz verileri yüklenemedi", true);
  }
};

const handleLoadClassAnalysis = () => {
  const classId = parseInt(reportsSelectors.analysisClassSelect()?.value || "", 10);
  if (!classId) {
    showToast("Lütfen bir sınıf seçin", true);
    return;
  }

  const classData = reportsState.analytics?.classAnalytics?.find((c) => c.classId === classId);
  if (classData) {
    renderClassAnalysis(classData);
    showToast("Sınıf analizi yüklendi");
  } else {
    showToast("Sınıf analizi bulunamadı", true);
  }
};

// Öğretmenin tüm sınıflarındaki öğrencileri yükle
const loadAllStudentsFromClasses = async () => {
  if (reportsState.allStudents.length > 0) {
    return; // Zaten yüklü
  }

  try {
    const allStudentsMap = new Map(); // Duplicate'leri önlemek için

    // Her sınıf için öğrencileri yükle
    for (const classItem of reportsState.classes) {
      try {
        // Yeni endpoint: Sınıf öğrencileri
        const students = await apiFetch(`/Class/${classItem.id}/students`);
        if (Array.isArray(students)) {
          students.forEach(student => {
            // Öğrenciyi map'e ekle (ID ile unique)
            if (student.id && !allStudentsMap.has(student.id)) {
              allStudentsMap.set(student.id, {
                id: student.id || student.Id,
                firstName: student.firstName || student.FirstName || "",
                lastName: student.lastName || student.LastName || "",
                email: student.email || student.Email || "",
                studentNumber: student.studentNumber || student.StudentNumber || "",
                fullName: `${student.firstName || student.FirstName || ""} ${student.lastName || student.LastName || ""}`.trim()
              });
            }
          });
        }
      } catch (classError) {
        console.warn(`[loadAllStudentsFromClasses] Sınıf ${classItem.id} öğrencileri yüklenemedi:`, classError);
        // Devam et, diğer sınıfları yükle
      }
    }

    reportsState.allStudents = Array.from(allStudentsMap.values());
    console.log(`[loadAllStudentsFromClasses] ${reportsState.allStudents.length} öğrenci yüklendi`);
  } catch (error) {
    console.error("[loadAllStudentsFromClasses] Hata:", error);
    // Hata olsa bile devam et
  }
};

const handleSearchStudent = async () => {
  const searchTerm = reportsSelectors.studentSearchInput()?.value.trim();
  const container = reportsSelectors.studentAnalysisContainer();
  
  if (!searchTerm) {
    showToast("Lütfen öğrenci adı veya ID girin", true);
    return;
  }

  // Öğrencileri yükle (henüz yüklenmemişse)
  await loadAllStudentsFromClasses();

  let studentId = null;
  
  // Önce ID olarak mı kontrol et
  const parsedId = parseInt(searchTerm, 10);
  if (!isNaN(parsedId) && parsedId > 0) {
    // Sayı ise ID olarak kabul et
    studentId = parsedId;
    
    // Öğretmenin sınıflarında bu ID var mı kontrol et
    const foundInClasses = reportsState.allStudents.find(s => s.id === studentId);
    if (!foundInClasses) {
      // Öğretmenin sınıflarında yok ama yine de deneyelim (belki farklı sınıfta)
      console.log(`[handleSearchStudent] Öğrenci ${studentId} öğretmenin sınıflarında bulunamadı, yine de analiz isteniyor`);
    }
  } else {
    // İsim olarak arama yap
    const searchLower = searchTerm.toLowerCase();
    const foundStudents = reportsState.allStudents.filter(student => {
      const fullName = student.fullName.toLowerCase();
      const firstName = (student.firstName || "").toLowerCase();
      const lastName = (student.lastName || "").toLowerCase();
      const email = (student.email || "").toLowerCase();
      const studentNumber = (student.studentNumber || "").toLowerCase();
      
      return fullName.includes(searchLower) ||
             firstName.includes(searchLower) ||
             lastName.includes(searchLower) ||
             email.includes(searchLower) ||
             studentNumber.includes(searchLower);
    });

    if (foundStudents.length === 0) {
      showToast("Öğrenci bulunamadı. Lütfen öğrenci adı, soyadı veya ID girin.", true);
      if (container) {
        container.innerHTML = "<p style='color:red; padding:1rem;'>Arama sonucu bulunamadı. Lütfen öğrenci adı, soyadı veya ID girin.</p>";
      }
      return;
    }

    if (foundStudents.length > 1) {
      // Birden fazla öğrenci bulundu, ilkini kullan ama kullanıcıyı bilgilendir
      showToast(`${foundStudents.length} öğrenci bulundu. İlk sonuç gösteriliyor: ${foundStudents[0].fullName}`, false);
      studentId = foundStudents[0].id;
    } else {
      // Tek öğrenci bulundu
      studentId = foundStudents[0].id;
      showToast(`Öğrenci bulundu: ${foundStudents[0].fullName}`, false);
    }
  }

  if (!studentId) {
    showToast("Geçerli bir öğrenci bulunamadı", true);
    return;
  }

  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    console.log(`[handleSearchStudent] Öğrenci analizi isteniyor: ID=${studentId}`);
    const studentData = await apiFetch(`/Analytics/student/${studentId}`);
    
    if (studentData) {
      renderStudentAnalysis(studentData);
      showToast("✅ Öğrenci analizi yüklendi");
    } else {
      showToast("Öğrenci analizi bulunamadı", true);
      if (container) {
        container.innerHTML = "<p style='color:orange; padding:1rem;'>Öğrenci bulundu ancak analiz verisi bulunamadı. Öğrencinin henüz ödevi veya notu olmayabilir.</p>";
      }
    }
  } catch (error) {
    console.error("[handleSearchStudent] Hata:", error);
    if (reportsHandleUnauthorized(error)) return;
    
    const errorMessage = error.message || error.response?.message || "Öğrenci analizi yüklenemedi";
    showToast(errorMessage, true);
    
    if (container) {
      container.innerHTML = `<p style='color:red; padding:1rem;'>❌ ${errorMessage}</p>`;
    }
  }
};

const updateTeacherWelcomeReports = () => {
  const user = getAuthUser();
  const nameEl = reportsSelectors.teacherName();
  if (user && nameEl) {
    nameEl.textContent = `${user.fullName || user.email} - Analiz ve Raporlar`;
  }
};

const bindReportsEvents = () => {
  const logoutButton = reportsSelectors.logoutButton();
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearAuthSession();
      window.location.href = "index.html";
    });
  }

  const loadClassBtn = reportsSelectors.loadClassAnalysisBtn();
  if (loadClassBtn) {
    loadClassBtn.addEventListener("click", handleLoadClassAnalysis);
  }

  const searchBtn = reportsSelectors.searchStudentBtn();
  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearchStudent);
  }

  // Enter tuşuna basıldığında da arama yap
  const studentSearchInput = reportsSelectors.studentSearchInput();
  if (studentSearchInput) {
    studentSearchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSearchStudent();
      }
    });
  }
};

const initReports = async () => {
  try {
    requireInstructorRoleReports();
  } catch (error) {
    showToast(error.message, true);
    window.location.href = "login.html";
    return;
  }

  // Navigation menüsünü rol bazlı güncelle
  if (typeof updateNavigationByRole === "function") {
    updateNavigationByRole();
  }

  bindReportsEvents();
  updateTeacherWelcomeReports();
  await Promise.all([loadTeacherClassesForReports(), loadAnalytics()]);
};

document.addEventListener("DOMContentLoaded", () => {
  const page = reportsSelectors.page();
  if (!page) return;
  initReports();
});

