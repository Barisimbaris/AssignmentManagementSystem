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
  // Mobil uygulamaya göre stats: Ortalama, En Yüksek, En Düşük, Toplam
  // 0 notları dahil edilmemeli - sadece gerçekten teslim edilmiş ödevlerin notları dahil edilmeli
  const gradedGrades = grades.filter((g) => {
    const score = g.score ?? g.Score;
    // Score null/undefined değilse ve geçerli bir sayıysa
    if (score === null || score === undefined || isNaN(parseFloat(score))) {
      return false;
    }
    
    const parsedScore = parseFloat(score);
    
    // Eğer score 0 ise, submission bilgisi kontrol et
    // Otomatik 0 verilen notları (teslim edilmemiş) hariç tut
    if (parsedScore === 0) {
      // Submission bilgisi var mı kontrol et
      const submissionId = g.submissionId ?? g.SubmissionId;
      const filePath = g.filePath ?? g.FilePath;
      const fileSizeInBytes = g.fileSizeInBytes ?? g.FileSizeInBytes ?? 0;
      const status = g.status ?? g.Status ?? g.submissionStatus ?? g.SubmissionStatus;
      
      // Eğer submission yoksa veya filePath boşsa, bu otomatik 0 notu olabilir
      // Bu durumda dahil etme
      if (!submissionId && (!filePath || filePath.trim().length === 0 || fileSizeInBytes === 0)) {
        return false; // Otomatik 0 notu, dahil etme
      }
      
      // Submission varsa ama status kontrolü yap
      if (status && status !== "Submitted" && status !== "Late" && status !== "Resubmitted") {
        return false; // Geçerli bir submission değil
      }
    }
    
    return true;
  });
  
  // Score'ları çıkar - 0 notları hariç (sadece gerçek teslimler)
  const scores = gradedGrades.map(g => {
    const score = g.score ?? g.Score ?? 0;
    return parseFloat(score);
  });
  
  // Ortalama - 0 notları hariç (sadece gerçek teslimler)
  const avg = scores.length > 0 
    ? (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1)
    : 0;
  
  // En yüksek
  const highest = scores.length > 0 
    ? Math.max(...scores).toFixed(1)
    : 0;
  
  // En düşük - 0 notları hariç
  const lowest = scores.length > 0 
    ? Math.min(...scores).toFixed(1)
    : 0;
  
  // Toplam (notlandırılmış ödev sayısı - 0 notları hariç)
  const total = gradedGrades.length;

  return {
    averageGrade: avg,
    highestGrade: highest,
    lowestGrade: lowest,
    totalGraded: total
  };
};

// Bir notun gerçekten teslim edilmiş olup olmadığını kontrol et
const isRealSubmissionGrade = (g) => {
  const score = g.score ?? g.Score;
  if (score === null || score === undefined || isNaN(parseFloat(score))) {
    return false;
  }

  const parsedScore = parseFloat(score);
  const submissionId = g.submissionId ?? g.SubmissionId;
  const filePath = g.filePath ?? g.FilePath;
  const fileSizeInBytes = g.fileSizeInBytes ?? g.FileSizeInBytes ?? 0;
  const status = g.status ?? g.Status ?? g.submissionStatus ?? g.SubmissionStatus;

  // 0 notları için gerçek teslim doğrulaması yap
  if (parsedScore === 0) {
    if (!submissionId && (!filePath || filePath.trim().length === 0 || fileSizeInBytes === 0)) {
      return false; // otomatik 0, teslim sayılmasın
    }
    if (status && status !== "Submitted" && status !== "Late" && status !== "Resubmitted") {
      return false; // geçerli teslim değil
    }
  }

  // 0 dışındaki notlar doğrudan teslim sayılır
  return true;
};

// Tamamlanan ödev sayısını ve oranı hesapla
const calculateCompletionStats = (grades = [], assignments = []) => {
  const total = Array.isArray(assignments) && assignments.length > 0
    ? assignments.length
    : grades.length;

  const completed = grades.filter(isRealSubmissionGrade).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, rate };
};

const renderStats = (stats) => {
  // Mobil uygulamaya göre stats render
  const avgEl = document.getElementById("averageGrade");
  const highestEl = document.getElementById("highestGrade");
  const lowestEl = document.getElementById("lowestGrade");
  const totalEl = document.getElementById("totalGraded");
  const statsContainer = document.getElementById("statsContainer");
  if (avgEl) avgEl.textContent = stats.averageGrade;
  if (highestEl) highestEl.textContent = stats.highestGrade;
  if (lowestEl) lowestEl.textContent = stats.lowestGrade;
  if (totalEl) totalEl.textContent = stats.totalGraded;
  
  // Stats container'ı göster
  if (statsContainer && stats.totalGraded > 0) {
    statsContainer.style.display = "flex";
  }
};

const renderCompletionStats = (completion) => {
  const totalEl = examSelectors.totalAssignments();
  const completedEl = examSelectors.completedAssignments();
  const rateEl = examSelectors.submissionRate();

  if (totalEl) totalEl.textContent = completion.total;
  if (completedEl) completedEl.textContent = completion.completed;
  if (rateEl) rateEl.textContent = `%${completion.rate}`;
};

const renderGradesTable = (grades = []) => {
  const container = examSelectors.gradesList();
  if (!container) return;

  // Empty state - mobil uygulamaya göre
  if (!grades.length) {
    container.innerHTML = `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 32px;">
        <div style="font-size: 64px; margin-bottom: 16px;">📭</div>
        <div style="font-size: 20px; font-weight: bold; color: var(--text-primary); margin-bottom: 8px;">Henüz notlandırılmış ödev yok</div>
        <div style="font-size: 14px; color: var(--text-secondary); text-align: center;">Öğretmeniniz ödevlerinizi değerlendirdiğinde burada görünecek</div>
      </div>
    `;
    return;
  }

  // Ödevleri ders bazında grupla, her ders içinde en yeni → en eski sırala
  // Önce ders bazında grupla
  const gradesByCourse = {};
  grades.forEach(grade => {
    const courseCode = grade.courseCode || grade.CourseCode || "";
    const courseName = grade.courseName || grade.CourseName || "";
    
    // Ders bilgisi yoksa, Assignment üzerinden Class -> Course bilgisini almaya çalış
    // (Backend'den gelmeli ama eğer gelmediyse frontend'de de kontrol et)
    let finalCourseCode = courseCode;
    let finalCourseName = courseName;
    
    // Eğer ders bilgisi yoksa, assignment bilgisinden almayı dene (eğer varsa)
    if (!finalCourseCode && !finalCourseName) {
      // Assignment objesi varsa ve class bilgisi varsa
      const assignment = examState.assignments?.find(a => 
        (a.id || a.Id) === (grade.assignmentId || grade.AssignmentId)
      );
      if (assignment) {
        finalCourseCode = assignment.courseCode || assignment.CourseCode || "";
        finalCourseName = assignment.courseName || assignment.CourseName || "";
      }
    }
    
    // Ders key ve display oluştur
    const courseKey = finalCourseCode || finalCourseName || "";
    const courseDisplay = finalCourseCode && finalCourseName 
      ? `${finalCourseCode} - ${finalCourseName}` 
      : (finalCourseCode || finalCourseName || "");
    
    // Eğer hala ders bilgisi yoksa, sabit bir key kullan (tüm ders bilgisi olmayanları grupla)
    const finalCourseKey = courseKey || "_no_course";
    
    if (!gradesByCourse[finalCourseKey]) {
      gradesByCourse[finalCourseKey] = {
        courseKey: finalCourseKey,
        courseDisplay: courseDisplay || "Ders Bilgisi Yok",
        courseCode: finalCourseCode,
        courseName: finalCourseName,
        grades: []
      };
    }
    gradesByCourse[finalCourseKey].grades.push(grade);
  });
  
  // Her ders içindeki notları en yeni → en eski sırala (gradedAt'a göre)
  Object.keys(gradesByCourse).forEach(courseKey => {
    gradesByCourse[courseKey].grades.sort((a, b) => {
      const gradedAtA = a.gradedAt || a.GradedAt || a.submittedAt || a.SubmittedAt || new Date(0);
      const gradedAtB = b.gradedAt || b.GradedAt || b.submittedAt || b.SubmittedAt || new Date(0);
      
      const dateA = new Date(gradedAtA);
      const dateB = new Date(gradedAtB);
      
      if (!Number.isNaN(dateA.getTime()) && !Number.isNaN(dateB.getTime())) {
        return dateB.getTime() - dateA.getTime(); // En yeni önce (azalan sıra)
      }
      return 0;
    });
  });
  
  // Dersleri alfabetik sırala - "Ders Bilgisi Yok" olanları en sona
  const sortedCourseKeys = Object.keys(gradesByCourse).sort((a, b) => {
    const displayA = gradesByCourse[a].courseDisplay;
    const displayB = gradesByCourse[b].courseDisplay;
    
    // "Ders Bilgisi Yok" olanları en sona
    if (displayA === "Ders Bilgisi Yok" && displayB !== "Ders Bilgisi Yok") return 1;
    if (displayA !== "Ders Bilgisi Yok" && displayB === "Ders Bilgisi Yok") return -1;
    
    return displayA.toLowerCase().localeCompare(displayB.toLowerCase(), "tr");
  });
  
  // Tüm notları ders bazında birleştir
  const sortedGrades = [];
  sortedCourseKeys.forEach(courseKey => {
    sortedGrades.push(...gradesByCourse[courseKey].grades);
  });

  // Mobil uygulamaya göre grade card tasarımı - ders bazında gruplandırılmış
  let mobileHTML = "";
  
  sortedCourseKeys.forEach((courseKey) => {
    const courseData = gradesByCourse[courseKey];
    const courseGrades = courseData.grades;
    
    // Ders başlığı - her zaman göster (ders adı yoksa "Ders Bilgisi Yok" göster)
    mobileHTML += `
      <div style="margin: 2rem 0 1rem 0; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h3 style="margin: 0; color: white; font-size: 1.25rem; font-weight: 700;">📚 ${courseData.courseDisplay}</h3>
      </div>
    `;
    
    // Bu derse ait notlar (en yeni → en eski)
    courseGrades.forEach(grade => {
      const score = grade.score || grade.Score || 0;
      const maxScore = grade.maxScore || grade.MaxScore || 100;
      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      const feedback = grade.feedback || grade.Feedback || "";
      const assignmentTitle = grade.assignmentTitle || grade.AssignmentTitle || "Ödev";
      
      // Renk belirleme (yüzdeye göre)
      let progressColor = "#667eea"; // Varsayılan mor
      let cardBgColor = "#f8f9ff"; // Açık mor arka plan
      
      if (percentage >= 90) {
        progressColor = "#4CAF50"; // Yeşil
        cardBgColor = "#f1f8f4";
      } else if (percentage >= 80) {
        progressColor = "#8BC34A"; // Açık yeşil
        cardBgColor = "#f5f9f1";
      } else if (percentage >= 70) {
        progressColor = "#FFC107"; // Sarı
        cardBgColor = "#fffbf0";
      } else if (percentage >= 60) {
        progressColor = "#FF9800"; // Turuncu
        cardBgColor = "#fff8f0";
      } else {
        progressColor = "#f44336"; // Kırmızı
        cardBgColor = "#fff5f5";
      }
      
      mobileHTML += `
        <div class="grade-card-mobile" style="background: ${cardBgColor}; border-left: 4px solid ${progressColor}; margin-bottom: 1.5rem; padding: 1.75rem; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <div class="grade-card-header" style="margin-bottom: 1rem;">
            <div style="flex: 1;">
              <div class="grade-card-title" style="font-size: 1.25rem; font-weight: 700; color: #333; margin-bottom: 0.5rem;">${assignmentTitle}</div>
            </div>
            <div class="grade-card-score" style="font-size: 2rem; font-weight: 700; color: ${progressColor}; text-align: right;">${score}<span style="font-size: 1.2rem; color: #999;">/${maxScore}</span></div>
          </div>
          <div class="grade-progress-bar" style="height: 16px; background: #e0e0e0; border-radius: 10px; overflow: hidden; margin: 1rem 0;">
            <div class="grade-progress-fill" style="height: 100%; background: linear-gradient(90deg, ${progressColor} 0%, ${progressColor}dd 100%); border-radius: 10px; width: ${percentage}%; transition: width 0.5s ease;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
            <div class="grade-percentage" style="font-size: 1.1rem; font-weight: 700; color: ${progressColor};">%${percentage}</div>
            <div style="font-size: 0.85rem; color: #999;">${formatDate(grade.gradedAt || grade.GradedAt || grade.submittedAt || grade.SubmittedAt)}</div>
          </div>
          ${feedback ? `<div class="grade-feedback" style="margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #e0e0e0; font-size: 0.95rem; color: #555; line-height: 1.6;">💬 ${feedback}</div>` : ""}
        </div>
      `;
    });
  });
  
  // Mobil tasarımı container'a ekle (eğer mobil görünümdeyse)
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    container.innerHTML = mobileHTML;
    return;
  }
  
  // Desktop tablosu - ders bazında gruplandırılmış
  let tableHTML = `
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
  `;
  
  // Ders bazında gruplandırılmış tablo oluştur
  sortedCourseKeys.forEach((courseKey, courseIndex) => {
    const courseData = gradesByCourse[courseKey];
    const courseGrades = courseData.grades;
    
    // Ders başlığı - her zaman göster
    if (courseGrades.length > 0) {
      tableHTML += `
        <tr style="background-color: #f5f5f5; font-weight: bold;">
          <td colspan="6" style="padding: 1rem; border-bottom: 2px solid #ddd;">
            📚 ${courseData.courseDisplay}
          </td>
        </tr>
      `;
    }
    
    // Bu derse ait notlar
    courseGrades.forEach((grade) => {
      const score = grade.score || grade.Score || 0;
      const maxScore = grade.maxScore || grade.MaxScore || 100;
      const assignmentTitle = grade.assignmentTitle || grade.AssignmentTitle || "Bilinmeyen Ödev";
      const feedback = grade.feedback || grade.Feedback || "";
      const gradedAt = grade.gradedAt || grade.GradedAt;
      
      // Ders adını göster (backend'den geliyor)
      const courseDisplay = courseData.courseDisplay;
      
      const percentage = maxScore > 0 ? ((score / maxScore) * 100) : 0;
      const gradeClass = percentage >= 80 ? "high" : percentage >= 60 ? "medium" : "low";
      
      tableHTML += `
        <tr>
          <td style="padding-left: ${courseData.courseCode || courseData.courseName ? '2rem' : '1rem'};">${courseDisplay}</td>
          <td>${assignmentTitle}</td>
          <td class="score ${gradeClass}">${score}</td>
          <td>${maxScore}</td>
          <td class="feedback">${feedback || "-"}</td>
          <td>${formatDate(gradedAt)}</td>
        </tr>
      `;
    });
  });
  
  tableHTML += `
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
    const rawScore = grade.score ?? grade.Score;
    
    // Score null/undefined değilse ve geçerli bir sayıysa
    if (rawScore === null || rawScore === undefined || isNaN(parseFloat(rawScore))) {
      return; // Geçersiz not, atla
    }
    
    const score = parseFloat(rawScore);
    
    // Eğer score 0 ise, submission bilgisi kontrol et
    // Otomatik 0 verilen notları (teslim edilmemiş) hariç tut
    if (score === 0) {
      // Submission bilgisi var mı kontrol et
      const submissionId = grade.submissionId ?? grade.SubmissionId;
      const filePath = grade.filePath ?? grade.FilePath;
      const fileSizeInBytes = grade.fileSizeInBytes ?? grade.FileSizeInBytes ?? 0;
      const status = grade.status ?? grade.Status ?? grade.submissionStatus ?? grade.SubmissionStatus;
      
      // Eğer submission yoksa veya filePath boşsa, bu otomatik 0 notu olabilir
      // Bu durumda dahil etme
      if (!submissionId && (!filePath || filePath.trim().length === 0 || fileSizeInBytes === 0)) {
        return; // Otomatik 0 notu, dahil etme
      }
      
      // Submission varsa ama status kontrolü yap
      if (status && status !== "Submitted" && status !== "Late" && status !== "Resubmitted") {
        return; // Geçerli bir submission değil
      }
    }
    
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

    // Sadece gerçek teslimlerin notlarını ekle (0 notları hariç)
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
    
    // İlk notun ders bilgilerini kontrol et
    if (grades.length > 0) {
      const firstGrade = grades[0];
      console.log("[loadStudentGrades] İlk notun ders bilgileri:", {
        courseCode: firstGrade.courseCode || firstGrade.CourseCode,
        courseName: firstGrade.courseName || firstGrade.CourseName,
        fullGrade: firstGrade
      });
    }
    examState.grades = grades;
    examState.assignments = assignments;

    const stats = calculateStats(examState.grades, examState.assignments);
    const completionStats = calculateCompletionStats(examState.grades, examState.assignments);
    renderStats(stats);
    renderCompletionStats(completionStats);
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

