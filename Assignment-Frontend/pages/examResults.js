// Sınav Karnesi / Notlar Modülü

const examState = {
  grades: [],
  assignments: [],
  studentInfo: null
};

const examSelectors = {
  page: () => document.getElementById("examResultsPage"),
  studentName: () => document.getElementById("studentName"),
  logoutButton: () => document.getElementById("logoutButton"),
  totalAssignments: () => document.getElementById("totalAssignments"),
  completedAssignments: () => document.getElementById("completedAssignments"),
  averageScore: () => document.getElementById("averageScore"),
  submissionRate: () => document.getElementById("submissionRate"),
  gradesList: () => document.getElementById("gradesList"),
  subjectAnalysis: () => document.getElementById("subjectAnalysis")
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

const examHandleUnauthorized = (error) => {
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
  // authUtils.js'deki formatDateTurkish fonksiyonunu kullan
  if (typeof window.formatDateTurkish === 'function') {
    return window.formatDateTurkish(value);
  }
  // Fallback
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    
    // UTC+3 offset ekle
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

const calculateStats = (grades = [], assignments = []) => {
  // Toplam ödev sayısı - tüm ödevlerden (grades değil)
  const totalAssignments = assignments.length;
  
  // Notlandırılmış ödev sayısı
  const completed = grades.filter((g) => {
    const score = g.score || g.Score;
    return score !== null && score !== undefined;
  }).length;
  
  // Ortalama puan - sadece notlandırılmış ödevlerden
  const totalScore = grades.reduce((sum, g) => {
    const score = g.score || g.Score || 0;
    return sum + score;
  }, 0);
  const avg = completed > 0 ? (totalScore / completed).toFixed(1) : 0;
  
  // Teslim oranı - toplam ödev sayısına göre
  const rate = totalAssignments > 0 ? ((completed / totalAssignments) * 100).toFixed(1) : 0;

  return {
    totalAssignments: totalAssignments,
    completedAssignments: completed,
    averageScore: avg,
    submissionRate: rate
  };
};

const renderStats = (stats) => {
  const totalEl = examSelectors.totalAssignments();
  const completedEl = examSelectors.completedAssignments();
  const avgEl = examSelectors.averageScore();
  const rateEl = examSelectors.submissionRate();

  if (totalEl) totalEl.textContent = stats.totalAssignments;
  if (completedEl) completedEl.textContent = stats.completedAssignments;
  if (avgEl) avgEl.textContent = stats.averageScore;
  if (rateEl) rateEl.textContent = `${stats.submissionRate}%`;
};

const renderGradesTable = (grades = []) => {
  const container = examSelectors.gradesList();
  if (!container) return;

  if (!grades.length) {
    container.innerHTML = "<p>Henüz notlandırılmış ödeviniz bulunmuyor.</p>";
    return;
  }

  // Ödevleri ders bazında sırala, aynı ders içinde gönderilme tarihine göre
  const sortedGrades = [...grades].sort((a, b) => {
    // Önce ders kodu/kodu ile sırala
    const courseCodeA = (a.courseCode || a.CourseCode || "").toLowerCase();
    const courseCodeB = (b.courseCode || b.CourseCode || "").toLowerCase();
    
    if (courseCodeA !== courseCodeB) {
      return courseCodeA.localeCompare(courseCodeB, "tr");
    }
    
    // Aynı derse ait ödevler için gönderilme tarihine göre sırala (SubmittedAt)
    const submittedAtA = a.submittedAt || a.SubmittedAt;
    const submittedAtB = b.submittedAt || b.SubmittedAt;
    
    if (submittedAtA && submittedAtB) {
      const dateA = new Date(submittedAtA);
      const dateB = new Date(submittedAtB);
      
      if (!Number.isNaN(dateA.getTime()) && !Number.isNaN(dateB.getTime())) {
        return dateA.getTime() - dateB.getTime(); // Eski tarihler önce
      }
    }
    
    // Tarih yoksa veya geçersizse ödev adına göre sırala
    const assignmentTitleA = (a.assignmentTitle || a.AssignmentTitle || "").toLowerCase();
    const assignmentTitleB = (b.assignmentTitle || b.AssignmentTitle || "").toLowerCase();
    return assignmentTitleA.localeCompare(assignmentTitleB, "tr");
  });

  const tableHTML = `
    <table class="grades-table">
      <thead>
        <tr>
          <th>Ders</th>
          <th>Ödev</th>
          <th>Puan</th>
          <th>Max Puan</th>
          <th>Geri Bildirim</th>
          <th>Tarih</th>
        </tr>
      </thead>
      <tbody>
        ${sortedGrades
          .map((grade) => {
            // Property isimlerini hem camelCase hem PascalCase için kontrol et
            const score = grade.score || grade.Score || 0;
            const maxScore = grade.maxScore || grade.MaxScore || 100;
            const assignmentTitle = grade.assignmentTitle || grade.AssignmentTitle || "Bilinmeyen Ödev";
            const feedback = grade.feedback || grade.Feedback || "";
            const gradedAt = grade.gradedAt || grade.GradedAt;
            const courseCode = grade.courseCode || grade.CourseCode || "";
            const courseName = grade.courseName || grade.CourseName || "";
            
            // Ders adını oluştur
            let courseDisplay = "";
            if (courseCode && courseName) {
              courseDisplay = `${courseCode} - ${courseName}`;
            } else if (courseCode) {
              courseDisplay = courseCode;
            } else if (courseName) {
              courseDisplay = courseName;
            } else {
              courseDisplay = "-";
            }
            
            const percentage = maxScore > 0 ? ((score / maxScore) * 100) : 0;
            const gradeClass = percentage >= 80 ? "high" : percentage >= 60 ? "medium" : "low";
            return `
              <tr>
                <td><strong>${courseDisplay}</strong></td>
                <td>${assignmentTitle}</td>
                <td class="score ${gradeClass}">${score}</td>
                <td>${maxScore}</td>
                <td class="feedback">${feedback || "-"}</td>
                <td>${formatDate(gradedAt)}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;
};

const analyzeSubjects = (grades = []) => {
  // Ders bazlı analiz - courseCode ve courseName'e göre grupla
  const courseMap = {};

  grades.forEach((grade) => {
    const courseCode = grade.courseCode || grade.CourseCode || "";
    const courseName = grade.courseName || grade.CourseName || "";
    const score = parseFloat(grade.score || grade.Score || 0);
    const maxScore = parseFloat(grade.maxScore || grade.MaxScore || 0);
    const creditHours = parseInt(grade.creditHours || grade.CreditHours || 0, 10);
    
    // Ders kodu ve adını birleştir (eğer varsa)
    const courseKey = courseCode || courseName || "Genel";
    const courseDisplay = courseCode && courseName 
      ? `${courseCode} - ${courseName}` 
      : (courseCode || courseName || "Genel");

    if (!courseMap[courseKey]) {
      courseMap[courseKey] = {
        courseCode: courseCode,
        courseName: courseName,
        courseDisplay: courseDisplay,
        creditHours: creditHours || 0,
        assignments: [],
        totalScore: 0,
        totalMaxScore: 0,
        assignmentCount: 0
      };
    }

    courseMap[courseKey].assignments.push({
      score: score,
      maxScore: maxScore
    });
    courseMap[courseKey].totalScore += score;
    courseMap[courseKey].totalMaxScore += maxScore;
    courseMap[courseKey].assignmentCount += 1;
  });

  // Her ders için ortalama hesapla
  const courseAnalysis = Object.values(courseMap).map((course) => {
    const average = course.assignmentCount > 0 
      ? (course.totalScore / course.assignmentCount).toFixed(2)
      : "0.00";
    
    const percentage = course.totalMaxScore > 0
      ? ((course.totalScore / course.totalMaxScore) * 100).toFixed(2)
      : "0.00";

    return {
      courseCode: course.courseCode,
      courseName: course.courseName,
      courseDisplay: course.courseDisplay,
      creditHours: course.creditHours,
      average: parseFloat(average),
      percentage: parseFloat(percentage),
      count: course.assignmentCount
    };
  });

  return courseAnalysis;
};

const renderSubjectAnalysis = (analysis = [], grades = []) => {
  const container = examSelectors.subjectAnalysis();
  if (!container) return;

  if (!analysis.length) {
    container.innerHTML = "<p>Ders bazlı analiz için yeterli veri yok.</p>";
    return;
  }

  // AKTS oranlarıyla genel ortalama hesapla (üniversite sistemi)
  let totalWeightedScore = 0;
  let totalCredits = 0;
  
  analysis.forEach(course => {
    if (course.creditHours > 0) {
      totalWeightedScore += course.average * course.creditHours;
      totalCredits += course.creditHours;
    }
  });

  const weightedGPA = totalCredits > 0 
    ? (totalWeightedScore / totalCredits).toFixed(2)
    : "0.00";

  // Genel ortalama (AKTS'siz)
  const simpleAverage = analysis.length > 0
    ? (analysis.reduce((sum, course) => sum + course.average, 0) / analysis.length).toFixed(2)
    : "0.00";

  let html = `
    <div class="gpa-summary" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <h3 style="margin: 0 0 1rem 0; color: #333;">📊 Genel Performans</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div style="text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: #667eea;">${weightedGPA}</div>
          <div style="color: #666; font-size: 0.9rem;">AKTS Ağırlıklı GNO</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: #764ba2;">${simpleAverage}</div>
          <div style="color: #666; font-size: 0.9rem;">Genel Ortalama</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: #43e97b;">${totalCredits}</div>
          <div style="color: #666; font-size: 0.9rem;">Toplam AKTS</div>
        </div>
      </div>
    </div>
    
    <div class="university-grade-table" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <th style="padding: 1rem; text-align: left; font-weight: 600;">Ders Kodu</th>
            <th style="padding: 1rem; text-align: left; font-weight: 600;">Ders Adı</th>
            <th style="padding: 1rem; text-align: center; font-weight: 600;">AKTS</th>
            <th style="padding: 1rem; text-align: center; font-weight: 600;">Ödev Ortalaması</th>
            <th style="padding: 1rem; text-align: center; font-weight: 600;">Başarı Yüzdesi</th>
            <th style="padding: 1rem; text-align: center; font-weight: 600;">Ödev Sayısı</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Dersleri alfabetik sırala
  const sortedAnalysis = [...analysis].sort((a, b) => {
    const codeA = (a.courseCode || "").toLowerCase();
    const codeB = (b.courseCode || "").toLowerCase();
    if (codeA !== codeB) return codeA.localeCompare(codeB, "tr");
    const nameA = (a.courseName || "").toLowerCase();
    const nameB = (b.courseName || "").toLowerCase();
    return nameA.localeCompare(nameB, "tr");
  });

  sortedAnalysis.forEach((course, index) => {
    const rowStyle = index % 2 === 0 
      ? "background: #f8f9fa;" 
      : "background: white;";
    
    const gradeClass = course.average >= 80 ? "high" : course.average >= 60 ? "medium" : "low";
    
    html += `
      <tr style="${rowStyle} border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 1rem; font-weight: 600; color: #333;">${course.courseCode || "-"}</td>
        <td style="padding: 1rem; color: #555;">${course.courseName || "-"}</td>
        <td style="padding: 1rem; text-align: center; color: #667eea; font-weight: 600;">${course.creditHours || 0}</td>
        <td style="padding: 1rem; text-align: center;">
          <span class="score ${gradeClass}" style="font-weight: 600; font-size: 1.1rem;">${course.average.toFixed(2)}</span>
        </td>
        <td style="padding: 1rem; text-align: center;">
          <div style="display: inline-block; background: #e0e0e0; border-radius: 10px; width: 100px; height: 20px; position: relative; overflow: hidden;">
            <div style="background: ${course.percentage >= 80 ? "#4CAF50" : course.percentage >= 60 ? "#FF9800" : "#f44336"}; width: ${Math.min(course.percentage, 100)}%; height: 100%; border-radius: 10px;"></div>
            <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.85rem; font-weight: 600; color: #333;">${course.percentage.toFixed(1)}%</span>
          </div>
        </td>
        <td style="padding: 1rem; text-align: center; color: #666;">${course.count}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
};

const loadStudentGrades = async () => {
  const container = examSelectors.gradesList();
  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    console.log("[loadStudentGrades] Notlar ve ödevler yükleniyor...");
    
    // Hem notları hem de tüm ödevleri yükle
    const [gradesResponse, assignmentsResponse] = await Promise.all([
      apiFetch("/Grade/my-grades"),
      apiFetch("/Assignment/my-assignments")
    ]);
    
    // Result wrapper'ı normalize et - Grades
    let grades = [];
    if (Array.isArray(gradesResponse)) {
      grades = gradesResponse;
    } else if (gradesResponse?.data && Array.isArray(gradesResponse.data)) {
      grades = gradesResponse.data;
    } else if (gradesResponse?.isSuccess && Array.isArray(gradesResponse.data)) {
      grades = gradesResponse.data;
    }
    
    // Result wrapper'ı normalize et - Assignments
    let assignments = [];
    if (Array.isArray(assignmentsResponse)) {
      assignments = assignmentsResponse;
    } else if (assignmentsResponse?.data && Array.isArray(assignmentsResponse.data)) {
      assignments = assignmentsResponse.data;
    } else if (assignmentsResponse?.isSuccess && Array.isArray(assignmentsResponse.data)) {
      assignments = assignmentsResponse.data;
    }
    
    console.log("[loadStudentGrades] Yüklenen notlar:", grades);
    console.log("[loadStudentGrades] Yüklenen ödevler:", assignments);
    examState.grades = grades;
    examState.assignments = assignments;

    const stats = calculateStats(examState.grades, examState.assignments);
    renderStats(stats);
    renderGradesTable(examState.grades);

    const subjectAnalysis = analyzeSubjects(examState.grades);
    renderSubjectAnalysis(subjectAnalysis, examState.grades);
    
    if (grades.length === 0 && assignments.length === 0) {
      if (container) {
        container.innerHTML = "<p style='color:orange; padding:1rem;'>Henüz ödeviniz bulunmuyor.</p>";
      }
    } else if (grades.length === 0) {
      if (container) {
        container.innerHTML = "<p style='color:orange; padding:1rem;'>Henüz notlandırılmış ve yayınlanmış ödeviniz bulunmuyor.</p>";
      }
    }
  } catch (error) {
    console.error("[loadStudentGrades] ❌ Hata:", error);
    if (examHandleUnauthorized(error)) return;
    
    // Backend'den gelen hata mesajını parse et
    let errorMessage = "Notlar yüklenemedi";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response?.message) {
      errorMessage = error.response.message;
    } else if (error.response?.errors && Array.isArray(error.response.errors)) {
      errorMessage = error.response.errors.join(", ");
    }
    
    if (container) {
      container.innerHTML = `<p style="color:red; padding:1rem;">❌ ${errorMessage}</p>`;
    }
    showToast(errorMessage, true);
  }
};

const updateWelcome = () => {
  const user = getAuthUser();
  const nameEl = examSelectors.studentName();
  if (user && nameEl) {
    nameEl.textContent = `${user.fullName || user.email} - Sınav Karnesi`;
  }
};

const bindExamEvents = () => {
  const logoutButton = examSelectors.logoutButton();
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearAuthSession();
      window.location.href = "index.html";
    });
  }
};

const initExamResults = async () => {
  console.log("[initExamResults] Sayfa başlatılıyor...");
  
  try {
    // Önce authentication kontrolü
    ensureAuthenticated();
    
    // Rol kontrolü
    const user = requireStudentRole();
    
    if (!user) {
      throw new Error("Lütfen giriş yapın");
    }
    
    console.log("[initExamResults] Kullanıcı doğrulandı:", user.fullName || user.email);
    
    // Navigation menüsünü rol bazlı güncelle (hemen, hata olmadan önce)
    if (typeof updateNavigationByRole === "function") {
      console.log("[initExamResults] Navigation güncelleniyor...");
      updateNavigationByRole();
    } else {
      console.warn("[initExamResults] updateNavigationByRole fonksiyonu bulunamadı! navigation.js yüklü mü?");
    }
    
    bindExamEvents();
    updateWelcome();
    await loadStudentGrades();
    
    console.log("[initExamResults] ✅ Sayfa başarıyla yüklendi");
  } catch (error) {
    console.error("[initExamResults] ❌ Hata:", error);
    
    // Navigation'ı yine de güncellemeyi dene (hata olsa bile görünsün)
    if (typeof updateNavigationByRole === "function") {
      try {
        console.log("[initExamResults] Hata durumunda navigation güncelleniyor...");
        updateNavigationByRole();
      } catch (navError) {
        console.error("[initExamResults] Navigation güncellenirken hata:", navError);
      }
    } else {
      console.warn("[initExamResults] updateNavigationByRole fonksiyonu bulunamadı! navigation.js yüklü mü?");
    }
    
    showToast(error.message || "Sayfa yüklenirken bir hata oluştu", true);
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
    return;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const page = examSelectors.page();
  if (!page) return;
  initExamResults();
});

