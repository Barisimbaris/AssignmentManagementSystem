// Analiz ve Raporlar Modülü

const reportsState = {
  classes: [],
  analytics: [],
  charts: {},
  allStudents: [], // Öğretmenin sınıflarındaki tüm öğrenciler
  classStudents: new Map(),
  classAssignments: new Map(),
  classGrades: new Map(),
  studentAnalyticsCache: new Map()
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

const getClassId = (cls) => cls?.id || cls?.Id || cls?.classId || cls?.ClassId;

const normalizeListResponse = (response, propertyName) => {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response[propertyName])) return response[propertyName];
  if (response && response.data && Array.isArray(response.data[propertyName])) {
    return response.data[propertyName];
  }
  if (response && Array.isArray(response.data)) {
    return response.data;
  }
  return Array.isArray(response?.Data) ? response.Data : [];
};

const getMetric = (obj, key, fallback = 0) => {
  if (!obj) return fallback;
  const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
  return obj[key] ?? obj[pascalKey] ?? fallback;
};

const getClassStudents = async (classId) => {
  if (reportsState.classStudents.has(classId)) {
    return reportsState.classStudents.get(classId);
  }

  const response = await apiFetch(`/Class/${classId}/students`);
  const students = normalizeListResponse(response, "students");
  reportsState.classStudents.set(classId, students);
  return students;
};

const getClassAssignments = async (classId) => {
  if (reportsState.classAssignments.has(classId)) {
    return reportsState.classAssignments.get(classId);
  }

  const response = await apiFetch(`/Assignment/class/${classId}`);
  const assignments = Array.isArray(response) ? response : normalizeListResponse(response, "assignments");
  reportsState.classAssignments.set(classId, assignments);
  return assignments;
};

const getClassGrades = async (classId) => {
  if (reportsState.classGrades.has(classId)) {
    return reportsState.classGrades.get(classId);
  }

  const response = await apiFetch(`/Grade/class/${classId}`);
  const grades = Array.isArray(response) ? response : normalizeListResponse(response, "grades");
  reportsState.classGrades.set(classId, grades);
  return grades;
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
    const classId = getClassId(cls);
    option.value = classId;
    const courseCode = cls.courseCode || cls.CourseCode || "";
    const className = cls.className || cls.ClassName || "Sınıf";
    option.textContent = `${courseCode} - ${className}`.trim().replace(/^ - /, "");
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

  const courseCode = classData.courseCode || classData.CourseCode || "";
  const className = classData.className || classData.ClassName || "";
  const totalStudents = getMetric(classData, "totalStudents", 0);

  // Ortalama puan hem AverageScore hem AverageGrade alanlarından gelebilir
  let averageScore = getMetric(classData, "averageScore", null);
  if (averageScore == null || averageScore === "-") {
    averageScore = classData.averageGrade ?? classData.AverageGrade ?? 0;
  }
  
  // Ortalama puanı yuvarla ve formatla (2 ondalık basamak)
  if (typeof averageScore === "number") {
    averageScore = Math.round(averageScore * 100) / 100; // 2 ondalık basamak
  }

  // Teslim oranı backend'den yoksa, ClassStatisticsDto üzerinden hesapla:
  // TotalSubmissions / (TotalAssignments * TotalStudents) * 100
  // ÖNEMLİ: Sadece submission sayısını kullan, grade sayısını kullanma!
  let submissionRate = getMetric(classData, "submissionRate", null);
  if (submissionRate == null || submissionRate === "-") {
    const totalAssignments = getMetric(classData, "totalAssignments", 0);
    const totalSubmissions = getMetric(classData, "totalSubmissions", 0); // Backend'den gelen submission sayısı (NOT grades!)
    const pendingSubmissions = getMetric(classData, "pendingSubmissions", null);

    // Öncelik: Eğer PendingSubmissions varsa, doğrudan oradan hesapla
    if (pendingSubmissions != null && totalAssignments > 0 && totalStudents > 0) {
      const totalRequired = totalAssignments * totalStudents;
      const completed = totalRequired - pendingSubmissions;
      submissionRate = totalRequired > 0
        ? Math.round((completed / totalRequired) * 100)
        : 0;
    } else if (totalAssignments > 0 && totalStudents > 0) {
      // Aksi halde Submissions sayısından hesapla (NOT grades!)
      // Maksimum submission sayısı = ödev sayısı * öğrenci sayısı
      const maxPossibleSubmissions = totalAssignments * totalStudents;
      submissionRate = maxPossibleSubmissions > 0
        ? Math.round((totalSubmissions / maxPossibleSubmissions) * 100)
        : 0;
      
      // %100'ü geçmemeli
      if (submissionRate > 100) {
        submissionRate = 100;
      }
    } else {
      submissionRate = 0;
    }
  }
  
  // Teslim oranı %100'ü geçmemeli ve negatif olamaz
  if (submissionRate > 100) {
    submissionRate = 100;
  }
  if (submissionRate < 0) {
    submissionRate = 0;
  }

  const topPerformers = classData.topPerformers || classData.TopPerformers || [];

  const html = `
    <div class="analysis-card">
      <h3>${courseCode} - ${className}</h3>
      <div class="analysis-stats">
        <div class="stat-item">
          <span class="stat-label">Toplam Öğrenci:</span>
          <span class="stat-value">${totalStudents}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Ortalama Puan:</span>
          <span class="stat-value">${averageScore}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Teslim Oranı:</span>
          <span class="stat-value">${submissionRate}%</span>
        </div>
      </div>
      ${topPerformers && topPerformers.length > 0 ? `
      <div class="top-performers">
        <h4>En Başarılı Öğrenciler (Ortalamaya Göre):</h4>
        <ul>
          ${topPerformers.map((name, index) => `<li>${index + 1}. ${name}</li>`).join("")}
        </ul>
      </div>
      ` : ""}
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

  const strongSubjects = studentData.strongSubjects || [];
  const weakSubjects = studentData.weakSubjects || [];

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
            ${strongSubjects.length ? strongSubjects.map((s) => `<li>✅ ${s}</li>`).join("") : "<li>Veri yok</li>"}
          </ul>
        </div>
        <div class="performance-section">
          <h4>Geliştirilmesi Gereken Dersler:</h4>
          <ul class="weak-subjects">
            ${weakSubjects.length ? weakSubjects.map((s) => `<li>⚠️ ${s}</li>`).join("") : "<li>Veri yok</li>"}
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
      (cls) => {
        const courseCode = cls.courseCode || cls.CourseCode || "";
        const className = cls.className || cls.ClassName || "";
        const totalStudents = getMetric(cls, "totalStudents", 0);
        const averageScore = cls.averageScore !== undefined ? cls.averageScore : getMetric(cls, "averageGrade", 0);
        const submissionRate = cls.submissionRate !== undefined ? cls.submissionRate : 0;
        
        return `
          <div class="summary-card" style="background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h4 style="margin: 0 0 1rem 0; font-size: 1.1rem; color: #333;">${courseCode} - ${className}</h4>
            <p style="margin: 0.5rem 0;"><strong>Öğrenci:</strong> ${totalStudents}</p>
            <p style="margin: 0.5rem 0;"><strong>Ortalama:</strong> ${typeof averageScore === "number" ? averageScore.toFixed(2) : averageScore}</p>
            <p style="margin: 0.5rem 0;"><strong>Teslim Oranı:</strong> ${submissionRate}%</p>
          </div>
        `;
      }
    )
    .join("");
};

const createClassPerformanceChart = (classAnalytics = []) => {
  const canvas = document.getElementById("classPerformanceChart");
  if (!canvas) {
    console.warn("[createClassPerformanceChart] Canvas bulunamadı!");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("[createClassPerformanceChart] Canvas context alınamadı!");
    return;
  }

  // Eski chart'ı yoket
  if (reportsState.charts.performanceChart) {
    reportsState.charts.performanceChart.destroy();
  }

  if (!classAnalytics || classAnalytics.length === 0) {
    console.warn("[createClassPerformanceChart] Veri yok!");
    return;
  }

  const labels = classAnalytics.map((c) => {
    const courseCode = c.courseCode || c.CourseCode || "";
    const className = c.className || c.ClassName || "Sınıf";
    return `${courseCode} - ${className}`.trim().replace(/^ - /, "") || "Sınıf";
  });
  
  const data = classAnalytics.map((c) => {
    const avgScore = c.averageScore !== undefined ? c.averageScore : getMetric(c, "averageGrade", 0);
    return typeof avgScore === "number" ? avgScore : 0;
  });

  console.log("[createClassPerformanceChart] Labels:", labels);
  console.log("[createClassPerformanceChart] Data:", data);

  try {
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
        aspectRatio: 2,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 10
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: "top"
          },
          tooltip: {
            enabled: true
          }
        }
      }
    });
    console.log("[createClassPerformanceChart] Chart başarıyla oluşturuldu");
  } catch (error) {
    console.error("[createClassPerformanceChart] Chart oluşturulurken hata:", error);
  }
};

const createSubmissionRateChart = (classAnalytics = []) => {
  const canvas = document.getElementById("submissionRateChart");
  if (!canvas) {
    console.warn("[createSubmissionRateChart] Canvas bulunamadı!");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("[createSubmissionRateChart] Canvas context alınamadı!");
    return;
  }

  // Eski chart'ı yoket
  if (reportsState.charts.submissionChart) {
    reportsState.charts.submissionChart.destroy();
  }

  if (!classAnalytics || classAnalytics.length === 0) {
    console.warn("[createSubmissionRateChart] Veri yok!");
    return;
  }

  const labels = classAnalytics.map((c) => {
    const courseCode = c.courseCode || c.CourseCode || "";
    const className = c.className || c.ClassName || "Sınıf";
    return `${courseCode} - ${className}`.trim().replace(/^ - /, "") || "Sınıf";
  });
  
  const data = classAnalytics.map((c) => {
    const rate = c.submissionRate !== undefined ? c.submissionRate : 0;
    return typeof rate === "number" ? rate : 0;
  });

  console.log("[createSubmissionRateChart] Labels:", labels);
  console.log("[createSubmissionRateChart] Data:", data);

  try {
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
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 10,
              callback: function(value) {
                return value + "%";
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: "top"
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context) {
                return "Teslim Oranı: " + context.parsed.y + "%";
              }
            }
          }
        }
      }
    });
    console.log("[createSubmissionRateChart] Chart başarıyla oluşturuldu");
  } catch (error) {
    console.error("[createSubmissionRateChart] Chart oluşturulurken hata:", error);
  }
};

const loadTeacherClassesForReports = async () => {
  const select = reportsSelectors.analysisClassSelect();
  if (select) {
    select.innerHTML = '<option value="">Sınıflar yükleniyor...</option>';
  }

  try {
    // Mevcut cache'leri temizle
    reportsState.classStudents = new Map();
    reportsState.classAssignments = new Map();
    reportsState.classGrades = new Map();
    reportsState.studentAnalyticsCache = new Map();

    const classes = await apiFetch("/Class/my-classes");
    reportsState.classes = Array.isArray(classes) ? classes : normalizeListResponse(classes, "classes");
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
    const analyticsResponse = await apiFetch("/Dashboard/statistics/my-classes");
    let classAnalytics = Array.isArray(analyticsResponse)
      ? analyticsResponse
      : normalizeListResponse(analyticsResponse, "classAnalytics");
    
    // Her sınıf için teslim oranını hesapla ve ekle
    classAnalytics = classAnalytics.map(cls => {
      const totalAssignments = getMetric(cls, "totalAssignments", 0);
      const totalSubmissions = getMetric(cls, "totalSubmissions", 0);
      const totalStudents = getMetric(cls, "totalStudents", 0);
      
      // Teslim oranını hesapla: TotalSubmissions / (TotalAssignments * TotalStudents) * 100
      let submissionRate = 0;
      if (totalAssignments > 0 && totalStudents > 0) {
        const maxPossibleSubmissions = totalAssignments * totalStudents;
        submissionRate = maxPossibleSubmissions > 0
          ? Math.min(100, Math.round((totalSubmissions / maxPossibleSubmissions) * 100))
          : 0;
      }
      
      // Ortalama puanı formatla
      let averageScore = getMetric(cls, "averageGrade", 0);
      if (typeof averageScore === "number") {
        averageScore = Math.round(averageScore * 100) / 100; // 2 ondalık basamak
      }
      
      return {
        ...cls,
        submissionRate: submissionRate,
        averageScore: averageScore
      };
    });
    
    reportsState.analytics = classAnalytics;
    
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
    console.error("[loadAnalytics] Hata:", error);
    showToast(error.message || "Analiz verileri yüklenemedi", true);
  }
};

const handleLoadClassAnalysis = async () => {
  const classId = parseInt(reportsSelectors.analysisClassSelect()?.value || "", 10);
  if (!classId) {
    showToast("Lütfen bir sınıf seçin", true);
    return;
  }

  const container = reportsSelectors.classAnalysisContainer();
  if (container) {
    container.innerHTML = "<p>Yükleniyor...</p>";
  }

  // Önce cache'den kontrol et, yoksa analytics'ten ara
  let classData = reportsState.analytics.find((item) => getClassId(item) === classId);
  
  // Eğer analytics'te bulunamadıysa, sınıf bilgilerini manuel olarak oluştur
  if (!classData) {
    console.log("[handleLoadClassAnalysis] Analytics'te bulunamadı, sınıf bilgileri manuel oluşturuluyor...");
    
    // Sınıf bilgilerini çek
    try {
      const classInfo = await apiFetch(`/Class/${classId}`);
      const students = await getClassStudents(classId);
      const assignments = await getClassAssignments(classId);
      const grades = await getClassGrades(classId);
      
      // Ortalama puan hesapla (yüzde olarak, 2 ondalık basamak)
      let averageScore = 0;
      if (grades.length > 0) {
        // Her grade'in yüzde değerini hesapla (score / maxScore * 100)
        const totalPercentage = grades.reduce((sum, g) => {
          const score = g.score || g.Score || 0;
          const maxScore = g.maxScore || g.MaxScore || g.assignment?.maxScore || g.Assignment?.MaxScore || 100;
          return sum + (maxScore > 0 ? (score / maxScore) * 100 : 0);
        }, 0);
        averageScore = Math.round((totalPercentage / grades.length) * 100) / 100; // 2 ondalık basamak
      }
      
      // Teslim oranı hesapla: UNIQUE student-assignment çiftleri / (Ödev sayısı * Öğrenci sayısı) * 100
      // ÖNEMLİ: Bir öğrenci aynı ödeve birden fazla kez submission yapabilir, ama sadece bir kez sayılmalı
      let totalSubmissions = 0;
      try {
        // Her ödev için UNIQUE öğrenci submission sayısını al ve topla
        for (const assignment of assignments) {
          const assignmentId = assignment.id || assignment.Id;
          if (!assignmentId) continue;
          
          try {
            const submissionsResponse = await apiFetch(`/Submission/assignment/${assignmentId}`);
            const submissions = Array.isArray(submissionsResponse) 
              ? submissionsResponse 
              : normalizeListResponse(submissionsResponse, "submissions");
            
            // ÖNEMLİ: Sadece gerçek submission'ları say (FilePath'i olan VE FileSizeInBytes > 0 olan, yani öğrenci tarafından dosya yüklenmiş olan)
            // Otomatik 0 notları için oluşturulan submission'ları sayma (bunların FilePath'i boş veya FileSizeInBytes = 0)
            const realSubmissions = submissions.filter(sub => {
              const filePath = sub.filePath || sub.FilePath || "";
              const fileSize = sub.fileSizeInBytes || sub.FileSizeInBytes || 0;
              const status = sub.status || sub.Status || "";
              
              // Sadece gerçekten dosya yüklenmiş submission'ları say
              const isReal = filePath && 
                             filePath.trim().length > 0 && 
                             fileSize > 0 && 
                             (status === "Submitted" || status === "Late" || status === "Resubmitted"); // Status kontrolü
              
              if (!isReal) {
                console.log(`[handleLoadClassAnalysis] Assignment ${assignmentId}: Submission filtrelendi (FilePath: "${filePath}", FileSize: ${fileSize}, Status: "${status}")`);
              }
              
              return isReal;
            });
            
            console.log(`[handleLoadClassAnalysis] Assignment ${assignmentId}: Toplam ${submissions.length} submission, ${realSubmissions.length} gerçek submission`);
            
            // Unique öğrenci sayısını bul (bir öğrenci birden fazla submission yapmış olabilir)
            const uniqueStudentIds = new Set();
            realSubmissions.forEach(sub => {
              const studentId = sub.studentId || sub.StudentId;
              if (studentId) {
                uniqueStudentIds.add(studentId);
              }
            });
            
            totalSubmissions += uniqueStudentIds.size;
            console.log(`[handleLoadClassAnalysis] Assignment ${assignmentId}: ${uniqueStudentIds.size} unique öğrenci submission'ı`);
          } catch (assignmentErr) {
            console.warn(`[handleLoadClassAnalysis] Assignment ${assignmentId} submissions alınamadı:`, assignmentErr);
            // Bu ödev için submission sayısını 0 olarak kabul et
          }
        }
      } catch (err) {
        console.error("[handleLoadClassAnalysis] Submissions alınırken hata:", err);
        // Hata durumunda 0 kullan (grades kullanma!)
        totalSubmissions = 0;
      }
      
      const maxPossibleSubmissions = assignments.length * students.length;
      const submissionRate = maxPossibleSubmissions > 0
        ? Math.min(100, Math.round((totalSubmissions / maxPossibleSubmissions) * 100))
        : 0;
      
      console.log(`[handleLoadClassAnalysis] Teslim oranı hesaplandı:`);
      console.log(`  - Toplam ödev: ${assignments.length}`);
      console.log(`  - Toplam öğrenci: ${students.length}`);
      console.log(`  - Maksimum submission: ${maxPossibleSubmissions}`);
      console.log(`  - Gerçek submission (unique): ${totalSubmissions}`);
      console.log(`  - Teslim oranı: ${submissionRate}%`);
      
      // En başarılı öğrenciler (top 5)
      const studentScores = new Map();
      grades.forEach(grade => {
        const studentId = grade.studentId || grade.StudentId;
        const score = grade.score || grade.Score || 0;
        if (!studentScores.has(studentId)) {
          studentScores.set(studentId, { total: 0, count: 0 });
        }
        const studentData = studentScores.get(studentId);
        studentData.total += score;
        studentData.count += 1;
      });
      
      const topPerformers = Array.from(studentScores.entries())
        .map(([studentId, data]) => ({
          studentId,
          average: data.count > 0 ? data.total / data.count : 0
        }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 5)
        .map(item => {
          const student = students.find(s => (s.id || s.Id) === item.studentId);
          return student ? `${student.firstName || student.FirstName || ""} ${student.lastName || student.LastName || ""}`.trim() : "Öğrenci";
        });
      
      classData = {
        classId: classId,
        className: classInfo.className || classInfo.ClassName || "",
        courseCode: classInfo.courseCode || classInfo.CourseCode || "",
        totalStudents: students.length,
        averageScore: averageScore,
        submissionRate: submissionRate,
        topPerformers: topPerformers
      };
      
      renderClassAnalysis(classData);
      showToast("Sınıf analizi yüklendi");
    } catch (error) {
      console.error("[handleLoadClassAnalysis] Hata:", error);
      const errorMessage = error.message || "Sınıf analizi yüklenemedi";
      if (container) {
        container.innerHTML = `<p style="color:red">${errorMessage}</p>`;
      }
      showToast(errorMessage, true);
    }
  } else {
    renderClassAnalysis(classData);
    showToast("Sınıf analizi yüklendi");
  }
};

// Öğretmenin tüm sınıflarındaki öğrencileri yükle
const loadAllStudentsFromClasses = async () => {
  if (!reportsState.classes.length) {
    reportsState.allStudents = [];
    return;
  }

  try {
    const allStudentsMap = new Map(); // Duplicate'leri önlemek için

    for (const classItem of reportsState.classes) {
      const classId = getClassId(classItem);
      if (!classId) continue;

      try {
        const students = await getClassStudents(classId);
        students.forEach((student) => {
          const studentId = student.id || student.Id;
          if (!studentId || allStudentsMap.has(studentId)) {
            return;
          }

          allStudentsMap.set(studentId, {
            id: studentId,
            firstName: student.firstName || student.FirstName || "",
            lastName: student.lastName || student.LastName || "",
            email: student.email || student.Email || "",
            studentNumber: student.studentNumber || student.StudentNumber || "",
            fullName: `${student.firstName || student.FirstName || ""} ${student.lastName || student.LastName || ""}`.trim()
          });
        });
      } catch (classError) {
        console.warn(`[loadAllStudentsFromClasses] Sınıf ${classId} öğrencileri yüklenemedi:`, classError);
      }
    }

    reportsState.allStudents = Array.from(allStudentsMap.values());
    console.log(`[loadAllStudentsFromClasses] ${reportsState.allStudents.length} öğrenci yüklendi`);
  } catch (error) {
    console.error("[loadAllStudentsFromClasses] Hata:", error);
  }
};

const buildStudentAnalysis = async (studentId) => {
  if (reportsState.studentAnalyticsCache.has(studentId)) {
    return reportsState.studentAnalyticsCache.get(studentId);
  }

  const studentInfo = reportsState.allStudents.find((s) => s.id === studentId) || {};
  const studentClasses = [];
  const gradeValues = [];

  for (const classItem of reportsState.classes) {
    const classId = getClassId(classItem);
    if (!classId) continue;

    const students = await getClassStudents(classId);
    const isEnrolled = students.some((student) => (student.id || student.Id) === studentId);
    if (!isEnrolled) continue;

    const [assignments, grades] = await Promise.all([
      getClassAssignments(classId),
      getClassGrades(classId)
    ]);

    const studentGrades = grades.filter((grade) => (grade.studentId || grade.StudentId) === studentId);
    const totalAssignments = assignments.length;
    const completedAssignments = studentGrades.length;
    const averageScore =
      completedAssignments > 0
        ? Math.round(
            studentGrades.reduce((sum, grade) => sum + (grade.score || grade.Score || 0), 0) / completedAssignments
          )
        : 0;

    gradeValues.push(...studentGrades.map((grade) => grade.score || grade.Score || 0));

    studentClasses.push({
      classId,
      className: classItem.className || classItem.ClassName || "",
      courseCode: classItem.courseCode || classItem.CourseCode || "",
      totalAssignments,
      completedAssignments,
      averageScore
    });
  }

  const totalAssignments = studentClasses.reduce((sum, cls) => sum + cls.totalAssignments, 0);
  const completedAssignments = studentClasses.reduce((sum, cls) => sum + cls.completedAssignments, 0);
  const averageScore =
    gradeValues.length > 0 ? Math.round(gradeValues.reduce((sum, score) => sum + score, 0) / gradeValues.length) : 0;
  const submissionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  const strongSubjects = studentClasses
    .filter((cls) => cls.averageScore >= 85)
    .map((cls) => `${cls.courseCode} ${cls.className}`.trim())
    .slice(0, 5);

  const weakSubjects = studentClasses
    .filter((cls) => cls.averageScore > 0 && cls.averageScore < 70)
    .map((cls) => `${cls.courseCode} ${cls.className}`.trim())
    .slice(0, 5);

  const analysis = {
    studentId,
    studentName: studentInfo.fullName || `${studentInfo.firstName || ""} ${studentInfo.lastName || ""}`.trim() || "Öğrenci",
    totalAssignments,
    completedAssignments,
    averageScore,
    submissionRate,
    strongSubjects,
    weakSubjects
  };

  reportsState.studentAnalyticsCache.set(studentId, analysis);
  return analysis;
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
    const studentData = await buildStudentAnalysis(studentId);
    
    if (studentData && (studentData.totalAssignments > 0 || studentData.completedAssignments > 0)) {
      renderStudentAnalysis(studentData);
      showToast("✅ Öğrenci analizi yüklendi");
    } else {
      showToast("Öğrenci analizi verisi bulunamadı", true);
      if (container) {
        container.innerHTML = "<p style='color:orange; padding:1rem;'>Öğrencinin henüz değerlendirilmiş ödevi bulunmuyor.</p>";
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
  
  // Sınıfları ve analizleri yükle
  await Promise.all([loadTeacherClassesForReports(), loadAnalytics()]);
  
  // Grafikleri tekrar oluştur (veriler yüklendikten sonra)
  setTimeout(() => {
    if (reportsState.analytics && reportsState.analytics.length > 0) {
      console.log("[initReports] Grafikler tekrar oluşturuluyor...");
      createClassPerformanceChart(reportsState.analytics);
      createSubmissionRateChart(reportsState.analytics);
    }
  }, 500);
};

document.addEventListener("DOMContentLoaded", () => {
  const page = reportsSelectors.page();
  if (!page) return;
  
  // Chart.js'in yüklendiğini kontrol et
  if (typeof Chart === "undefined") {
    console.error("[initReports] Chart.js yüklenemedi! Grafikler çalışmayacak.");
    // Chart.js'i tekrar yükle
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
    script.onload = () => {
      console.log("[initReports] Chart.js yüklendi, initReports çağrılıyor...");
      initReports();
    };
    script.onerror = () => {
      console.error("[initReports] Chart.js yüklenemedi!");
      initReports(); // Yine de devam et, grafikler olmadan
    };
    document.head.appendChild(script);
  } else {
    console.log("[initReports] Chart.js yüklü, initReports çağrılıyor...");
    initReports();
  }
});

