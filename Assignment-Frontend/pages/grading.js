// Not Verme Modülü

const gradingState = {
  assignments: [],
  submissions: [],
  selectedAssignment: null
};

const gradingSelectors = {
  page: () => document.getElementById("gradingPage"),
  teacherName: () => document.getElementById("teacherName"),
  logoutButton: () => document.getElementById("logoutButton"),
  assignmentSelect: () => document.getElementById("gradingAssignmentSelect"),
  loadSubmissionsBtn: () => document.getElementById("loadSubmissions"),
  submissionsSection: () => document.getElementById("submissionsSection"),
  gradingFormSection: () => document.getElementById("gradingFormSection"),
  assignmentInfo: () => document.getElementById("assignmentInfo"),
  submissionsList: () => document.getElementById("submissionsList"),
  gradingForm: () => document.getElementById("gradingForm"),
  gradingResult: () => document.getElementById("gradingResult"),
  submissionIdInput: () => document.getElementById("submissionId"),
  scoreInput: () => document.getElementById("scoreInput"),
  maxScoreDisplay: () => document.getElementById("maxScoreDisplay"),
  feedbackInput: () => document.getElementById("feedbackInput"),
  isPublishedCheckbox: () => document.getElementById("isPublished"),
  gradingStudentInfo: () => document.getElementById("gradingStudentInfo")
};

const requireInstructorRoleGrading = () => {
  const user = getAuthUser();
  if (!user) {
    throw new Error("Lütfen giriş yapın");
  }
  if ((user.role || "").toLowerCase() !== "instructor" && (user.role || "").toLowerCase() !== "admin") {
    throw new Error("Bu sayfa sadece öğretmenler içindir");
  }
  return user;
};

const gradingHandleUnauthorized = (error) => {
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

const populateAssignmentSelect = (assignments = []) => {
  const select = gradingSelectors.assignmentSelect();
  if (!select) {
    console.error("[populateAssignmentSelect] Select elementi bulunamadı!");
    return;
  }

  select.innerHTML = '<option value="">Ödev seçiniz</option>';
  
  if (!assignments || assignments.length === 0) {
    console.warn("[populateAssignmentSelect] Hiç ödev bulunamadı!");
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Henüz ödev bulunmuyor";
    select.appendChild(option);
    return;
  }
  
  console.log("[populateAssignmentSelect] Ödevler yükleniyor:", assignments.length);
  
  assignments.forEach((assignment) => {
    const assignmentId = assignment.id || assignment.Id;
    const title = assignment.title || assignment.Title || "İsimsiz Ödev";
    const className = assignment.className || assignment.ClassName || assignment.class?.className || "Sınıf";
    const totalSubmissions = assignment.totalSubmissions || assignment.TotalSubmissions || 0;
    
    const option = document.createElement("option");
    option.value = assignmentId;
    option.textContent = `${title} - ${className} (${totalSubmissions} teslim)`;
    select.appendChild(option);
  });
  
  console.log("[populateAssignmentSelect] ✅ Ödevler select'e eklendi");
};

const renderAssignmentInfo = (assignment) => {
  const container = gradingSelectors.assignmentInfo();
  if (!container) return;

  container.innerHTML = `
    <div class="assignment-info-card">
      <h3>${assignment.title}</h3>
      <div class="assignment-details">
        <p><strong>Sınıf:</strong> ${assignment.className}</p>
        <p><strong>Tür:</strong> ${assignment.assignmentType === "Individual" ? "Bireysel" : "Grup"}</p>
        <p><strong>Max Puan:</strong> ${assignment.maxScore}</p>
        <p><strong>Son Teslim:</strong> ${formatDate(assignment.dueDate)}</p>
        <p><strong>Toplam Teslim:</strong> ${assignment.totalSubmissions}</p>
      </div>
    </div>
  `;
};

const renderSubmissionsList = (submissions = [], assignment) => {
  const container = gradingSelectors.submissionsList();
  if (!container) return;

  if (!submissions.length) {
    container.innerHTML = "<p>Bu ödeve henüz teslim yapılmamış.</p>";
    return;
  }

  // Grup ödevi mi kontrol et
  const isGroupAssignment = assignment.type === "Group" || assignment.Type === "Group" || 
                           assignment.assignmentType === "Group" || assignment.AssignmentType === "Group" ||
                           assignment.type === 2 || assignment.Type === 2;

  // Submission'ları grup ID'ye göre grupla (varsa)
  let groupedSubmissions = [];
  let ungroupedSubmissions = [];

  if (isGroupAssignment) {
    // Grup ödevleri: GroupId'ye göre grupla
    const groupMap = new Map();
    
    submissions.forEach(submission => {
      const groupId = submission.groupId || submission.GroupId;
      if (groupId) {
        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, []);
        }
        groupMap.get(groupId).push(submission);
      } else {
        ungroupedSubmissions.push(submission);
      }
    });
    
    // Grupları sırala (GroupId'ye göre) ve flatten et
    const sortedGroups = Array.from(groupMap.entries()).sort((a, b) => {
      // GroupId'yi parse et (GroupName formatından: "Grup_1" -> 1)
      const groupA = a[1][0]?.groupName || a[1][0]?.GroupName || "";
      const groupB = b[1][0]?.groupName || b[1][0]?.GroupName || "";
      const numA = parseInt(groupA.replace("Grup_", "")) || 0;
      const numB = parseInt(groupB.replace("Grup_", "")) || 0;
      return numA - numB;
    });
    
    sortedGroups.forEach(([groupId, groupSubmissions]) => {
      groupedSubmissions.push(...groupSubmissions);
    });
  } else {
    // Bireysel ödevler: sıralama yok
    groupedSubmissions = submissions;
  }

  // Tüm submission'ları birleştir (önce gruplu, sonra grupsuz)
  const allSubmissions = [...groupedSubmissions, ...ungroupedSubmissions];

  container.innerHTML = `
    <div class="submissions-grid">
      ${allSubmissions
        .map(
          (submission, index) => {
            // Submission ID'sini al (hem camelCase hem PascalCase)
            const submissionId = submission.id || submission.Id || 0;
            
            // Dosya path'ini kontrol et (camelCase veya PascalCase olabilir)
            const filePath = submission.filePath || submission.FilePath || "";
            const hasFile = filePath && filePath.trim() !== "";
            
            // Her zaman download URL'i oluştur (backend kontrolü yapacak)
            const downloadUrl = `http://localhost:8080/api/Submission/${submissionId}/download`;
            
            // Öğrenci adını güvenli şekilde al
            const studentName = submission.studentName || submission.StudentName || `Öğrenci #${submission.studentId || submission.StudentId || "?"}`;
            const safeStudentName = studentName.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            
            // Grup bilgisi
            const groupId = submission.groupId || submission.GroupId;
            const groupName = submission.groupName || submission.GroupName || "";
            
            // Durum bilgisi
            const status = submission.status || submission.Status || "Pending";
            const submittedAt = submission.submittedAt || submission.SubmittedAt;
            const comments = submission.comments || submission.Comments;
            const grade = submission.grade || submission.Grade;
            
            // Aynı gruptan önceki submission'ın group ID'si
            const prevSubmission = index > 0 ? allSubmissions[index - 1] : null;
            const prevGroupId = prevSubmission ? (prevSubmission.groupId || prevSubmission.GroupId) : null;
            
            // Grup başlığı göster (aynı grubun ilk submission'ı ise)
            const showGroupHeader = isGroupAssignment && groupId && groupId !== prevGroupId;
            
            return `
              ${showGroupHeader ? `
                <div class="group-header" style="grid-column: 1 / -1; padding: 1rem; background: #e3f2fd; border-radius: 8px; margin: 1rem 0; font-weight: bold; border-left: 4px solid #2196f3;">
                  📦 ${groupName || `Grup ID: ${groupId}`}
                </div>
              ` : ''}
              <div class="submission-card ${groupId ? 'group-submission' : ''}">
                <div class="submission-header">
                  <h4>${safeStudentName}${groupId ? ` <span style="color: #2196f3; font-size: 0.85em;">(${groupName || `Grup ${groupId}`})</span>` : ''}</h4>
                  <span class="status-badge ${status.toLowerCase()}">${status}</span>
                </div>
                <div class="submission-details">
                  <p><strong>Teslim Tarihi:</strong> ${formatDate(submittedAt)}</p>
                  ${comments ? `<p><strong>Yorum:</strong> ${comments.replace(/'/g, "&#39;")}</p>` : ""}
                  ${hasFile ? `
                    <p><strong>Dosya:</strong> 
                      ${(filePath.split('/').pop() || filePath).substring(0, 50)}${filePath.length > 50 ? '...' : ''}
                      ${submission.fileSizeInBytes || submission.FileSizeInBytes ? ` (${Math.round((submission.fileSizeInBytes || submission.FileSizeInBytes) / 1024)} KB)` : ''}
                      - ${submission.fileType || submission.FileType || "PDF"}
                    </p>
                  ` : "<p style='color:orange;'><strong>⚠️ Dosya yolu görüntülenemiyor (dosyayı indirmeyi deneyin)</strong></p>"}
                  ${grade ? `<p class="graded"><strong>Not:</strong> ${grade.score || grade.Score || 0}/${assignment.maxScore || assignment.MaxScore || 100}</p>` : `<p class="not-graded">Henüz notlandırılmadı</p>`}
                </div>
                <div class="submission-actions">
                  <a href="${downloadUrl}" 
                     target="_blank" 
                     class="download-btn"
                     onclick="handleDownloadClick(event, ${submissionId}); return false;"
                     title="${hasFile ? 'Dosyayı indir' : 'Dosya indirmeyi deneyin (backend kontrolü yapacak)'}">
                     📥 Dosyayı İndir ${submission.fileType || submission.FileType ? `(${submission.fileType || submission.FileType})` : ''}
                  </a>
                  <button class="grade-btn" onclick="openGradingForm(${submissionId}, '${safeStudentName}', ${assignment.maxScore || assignment.MaxScore || 100}, ${grade ? (grade.score || grade.Score || 0) : 0}, '${(grade?.feedback || grade?.Feedback || "").replace(/'/g, "&#39;").replace(/"/g, "&quot;")}', ${grade ? (grade.id || grade.Id || null) : null}, ${groupId || null})">
                    ${grade ? "Notu Düzenle" : "Not Ver"}
                  </button>
                </div>
              </div>
            `;
          }
        )
        .join("")}
    </div>
  `;
};

// Süresi dolmuş ödevler için otomatik 0 notu ver (grading sayfası için)
const autoGradeLateAssignmentsInGrading = async (assignments) => {
  if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
    return;
  }

  const now = new Date();
  
  // Süresi dolmuş ödevleri bul (geç teslim izni olsa bile)
  const lateAssignments = assignments.filter(assignment => {
    const dueDate = assignment.dueDate || assignment.DueDate;
    if (!dueDate) return false;
    
    const dueDateObj = new Date(dueDate);
    const isPastDue = dueDateObj.getTime() < now.getTime();
    
    return isPastDue;
  });

  if (lateAssignments.length === 0) {
    return;
  }

  console.log(`[autoGradeLateAssignmentsInGrading] ${lateAssignments.length} adet süresi dolmuş ödev bulundu, otomatik 0 notu veriliyor...`);

  // Her bir süresi dolmuş ödev için otomatik not ver (sessizce, arka planda)
  for (const assignment of lateAssignments) {
    const assignmentId = assignment.id || assignment.Id;
    if (!assignmentId) continue;

    try {
      await apiFetch(`/Grade/auto-grade-late/${assignmentId}`, {
        method: "POST"
      });
      console.log(`[autoGradeLateAssignmentsInGrading] ✅ Ödev ${assignmentId} için otomatik 0 notu verildi`);
    } catch (error) {
      console.error(`[autoGradeLateAssignmentsInGrading] ❌ Ödev ${assignmentId} için otomatik not verilemedi:`, error);
      // Hata durumunda devam et, diğer ödevleri işlemeye devam et
    }
  }
};

const loadTeacherAssignments = async () => {
  const select = gradingSelectors.assignmentSelect();
  if (select) {
    select.innerHTML = '<option value="">Yükleniyor...</option>';
  }

  try {
    const classesResponse = await apiFetch("/Class/my-classes");
    const classes = Array.isArray(classesResponse) ? classesResponse : [];
    const classIds = classes.map((c) => c.id || c.Id).filter(id => id);

    const allAssignments = [];
    for (const classId of classIds) {
      try {
        const assignmentsResponse = await apiFetch(`/Assignment/class/${classId}`);
        const assignments = Array.isArray(assignmentsResponse) ? assignmentsResponse : [];
        console.log(`[loadTeacherAssignments] Sınıf ${classId} için ${assignments.length} ödev bulundu`);
        allAssignments.push(...assignments);
      } catch (error) {
        console.error(`[loadTeacherAssignments] Sınıf ${classId} için ödev yüklenirken hata:`, error);
      }
    }

    console.log(`[loadTeacherAssignments] Toplam ${allAssignments.length} ödev bulundu`);
    gradingState.assignments = allAssignments;
    populateAssignmentSelect(allAssignments);
  } catch (error) {
    if (gradingHandleUnauthorized(error)) return;
    if (select) {
      select.innerHTML = `<option value="">Ödevler yüklenemedi (${error.message})</option>`;
    }
  }
};

const loadSubmissions = async () => {
  const assignmentId = parseInt(gradingSelectors.assignmentSelect()?.value || "", 10);

  if (!assignmentId) {
    showToast("Lütfen bir ödev seçin", true);
    return;
  }

  gradingState.selectedAssignment = gradingState.assignments.find((a) => a.id === assignmentId);

  const submissionsSection = gradingSelectors.submissionsSection();
  const container = gradingSelectors.submissionsList();

  if (submissionsSection) submissionsSection.style.display = "block";

  if (gradingState.selectedAssignment) {
    renderAssignmentInfo(gradingState.selectedAssignment);
  }

  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    const submissions = await apiFetch(`/Submission/assignment/${assignmentId}`);
    console.log("[loadSubmissions] Teslimler yüklendi:", submissions);
    console.log("[loadSubmissions] Submission sayısı:", Array.isArray(submissions) ? submissions.length : 0);
    
    // Her submission'ın filePath'ini kontrol et
    if (Array.isArray(submissions)) {
      submissions.forEach((sub, idx) => {
        const filePath = sub.filePath || sub.FilePath || "";
        console.log(`[loadSubmissions] Submission ${idx + 1} (ID: ${sub.id || sub.Id}):`, {
          hasFilePath: !!filePath,
          filePath: filePath,
          studentName: sub.studentName || sub.StudentName
        });
      });
    }
    
    gradingState.submissions = Array.isArray(submissions) ? submissions : [];

    if (gradingState.submissions.length === 0) {
      container.innerHTML = "<p>Bu ödeve henüz teslim yapılmamış.</p>";
      showToast("Bu ödeve henüz teslim yapılmamış.", false);
      return;
    }

    // Her teslim için not bilgisini çek
    for (const submission of gradingState.submissions) {
      try {
        const submissionId = submission.id || submission.Id;
        if (submissionId) {
          const grade = await apiFetch(`/Grade/submission/${submissionId}`);
          submission.grade = grade;
        } else {
          submission.grade = null;
        }
      } catch (gradeError) {
        const submissionId = submission.id || submission.Id;
        console.warn(`[loadSubmissions] Teslim ${submissionId} için not bulunamadı:`, gradeError);
        submission.grade = null;
      }
    }

    renderSubmissionsList(gradingState.submissions, gradingState.selectedAssignment);
    showToast(`✅ ${gradingState.submissions.length} teslim yüklendi`);
  } catch (error) {
    console.error("[loadSubmissions] ❌ Hata:", error);
    if (gradingHandleUnauthorized(error)) return;
    
    const errorMessage = error.message || error.response?.message || "Teslimler yüklenirken bir hata oluştu";
    if (container) {
      container.innerHTML = `<p style="color:red; padding:1rem;">❌ ${errorMessage}</p>`;
    }
    showToast(errorMessage, true);
  }
};

window.openGradingForm = (submissionId, studentName, maxScore, currentScore, currentFeedback, gradeId = null) => {
  const formSection = gradingSelectors.gradingFormSection();
  if (formSection) formSection.style.display = "block";

  const infoContainer = gradingSelectors.gradingStudentInfo();
  if (infoContainer) {
    infoContainer.innerHTML = `<p><strong>Öğrenci:</strong> ${studentName}</p>`;
  }

  const submissionIdInput = gradingSelectors.submissionIdInput();
  const gradeIdInput = document.getElementById("gradeId");
  const scoreInput = gradingSelectors.scoreInput();
  const maxScoreDisplay = gradingSelectors.maxScoreDisplay();
  const feedbackInput = gradingSelectors.feedbackInput();

  if (submissionIdInput) submissionIdInput.value = submissionId;
  if (gradeIdInput) gradeIdInput.value = gradeId || "";
  if (scoreInput) scoreInput.value = currentScore || "";
  if (maxScoreDisplay) maxScoreDisplay.value = maxScore;
  if (feedbackInput) feedbackInput.value = currentFeedback || "";

  // Form başlığını güncelle
  const formTitle = formSection.querySelector("h2");
  if (formTitle) {
    formTitle.textContent = gradeId ? "Notu Düzenle" : "Not Ver";
  }

  // Submit butonunu güncelle
  const submitButton = formSection.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = gradeId ? "Notu Güncelle" : "Notu Kaydet";
  }

  // Forma scroll
  if (formSection) {
    formSection.scrollIntoView({ behavior: "smooth" });
  }
};

window.handleDownloadClick = async (event, submissionId) => {
  event.preventDefault();
  event.stopPropagation();
  
  const token = getAuthToken();
  if (!token) {
    showToast("❌ Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.", true);
    window.location.href = "login.html";
    return;
  }

  try {
    const url = `http://localhost:8080/api/Submission/${submissionId}/download`;
    console.log("[handleDownloadClick] Dosya indiriliyor:", url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = "Dosya indirilemedi";
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.errors?.[0] || errorMessage;
        console.error("[handleDownloadClick] Backend hatası:", errorData);
      } catch (parseError) {
        errorMessage = response.status === 404 ? "Dosya bulunamadı" : `HTTP ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    // Content-Type ve dosya adını al
    const contentType = response.headers.get("content-type") || "";
    const contentDisposition = response.headers.get("content-disposition") || "";
    
    // Dosya uzantısını belirle
    let fileExtension = ".pdf";
    if (contentType.includes("image/jpeg")) fileExtension = ".jpg";
    else if (contentType.includes("image/png")) fileExtension = ".png";
    else if (contentType.includes("application/pdf")) fileExtension = ".pdf";
    
    // Dosya adını belirle
    let fileName = `submission_${submissionId}_${Date.now()}`;
    
    // Content-Disposition'dan dosya adını al
    if (contentDisposition) {
      // Önce filename* formatını dene (UTF-8 encoded)
      let fileNameMatch = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = decodeURIComponent(fileNameMatch[1]);
      } else {
        // Sonra normal filename formatını dene
        fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '').trim();
        }
      }
    }
    
    // Eğer dosya adı hala varsayılan ise, uzantıyı ekle
    if (!fileName.includes('.')) {
      fileName = `${fileName}${fileExtension}`;
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error("Dosya boş veya indirilemedi");
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName.endsWith(fileExtension) ? fileName : `${fileName}${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    
    showToast("✅ Dosya başarıyla indirildi!");
  } catch (error) {
    console.error("[handleDownloadClick] ❌ Hata:", error);
    const errorMessage = error.message || "Dosya indirilemedi. Lütfen tekrar deneyin.";
    showToast(`❌ ${errorMessage}`, true);
  }
};

const handleGrading = async (event) => {
  event.preventDefault();

  const form = gradingSelectors.gradingForm();
  if (!form) return;

  const submissionId = parseInt(gradingSelectors.submissionIdInput()?.value || "", 10);
  const gradeIdInput = document.getElementById("gradeId");
  const gradeId = gradeIdInput?.value && gradeIdInput.value !== "" && gradeIdInput.value !== "null" ? parseInt(gradeIdInput.value, 10) : null;
  const score = parseFloat(gradingSelectors.scoreInput()?.value || "0");
  const feedback = gradingSelectors.feedbackInput()?.value.trim();
  const isPublished = true; // Notu direkt yayınla
  const resultContainer = gradingSelectors.gradingResult();
  
  console.log("[handleGrading] Form verileri:", {
    submissionId,
    gradeId,
    score,
    feedback,
    isPublished,
    gradeIdInputValue: gradeIdInput?.value
  });

  if (!submissionId || isNaN(submissionId)) {
    showToast("Geçerli bir teslim seçin", true);
    return;
  }

  if (isNaN(score) || score === null || score === undefined) {
    showToast("Lütfen geçerli bir puan girin", true);
    return;
  }

  if (score < 0) {
    showToast("Puan negatif olamaz", true);
    return;
  }

  const maxScore = parseFloat(gradingSelectors.maxScoreDisplay()?.value || "100");
  if (isNaN(maxScore)) {
    showToast("Maksimum puan bilgisi bulunamadı", true);
    return;
  }

  if (score > maxScore) {
    showToast(`Puan maksimum ${maxScore} olabilir`, true);
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Kaydediliyor...";
  }

  try {
    // Önce mevcut notu kontrol et
    let existingGradeId = gradeId;
    
    if (!existingGradeId) {
      try {
        console.log("[handleGrading] Mevcut not kontrol ediliyor:", submissionId);
        const existingGrade = await apiFetch(`/Grade/submission/${submissionId}`);
        if (existingGrade && (existingGrade.id || existingGrade.Id)) {
          existingGradeId = existingGrade.id || existingGrade.Id;
          console.log("[handleGrading] Mevcut not bulundu:", existingGradeId);
        }
      } catch (gradeCheckError) {
        console.log("[handleGrading] Mevcut not bulunamadı, yeni not oluşturulacak");
        existingGradeId = null;
      }
    }

    // Eğer mevcut bir not varsa güncelle, yoksa yeni not oluştur
    if (existingGradeId) {
      // Mevcut notu güncelle
      const updateBody = {
        score: score, // Score her zaman gönderilmeli (0 bile olabilir)
        feedback: feedback && feedback.trim() !== "" ? feedback.trim() : null,
        isPublished: isPublished === true // Boolean olarak gönder
      };

      console.log("[handleGrading] Mevcut not güncelleniyor:", { gradeId: existingGradeId, submissionId, updateBody });
      
      const updateResponse = await apiFetch(`/Grade/${existingGradeId}`, {
        method: "PUT",
        body: updateBody
      });
      
      console.log("[handleGrading] ✅ Güncelleme yanıtı:", updateResponse);

      showToast("✅ Not başarıyla güncellendi!");
      if (resultContainer) {
        resultContainer.innerHTML = "<p style='color:green; padding:1rem;'>✅ Not güncellendi ve öğrenciye gönderildi.</p>";
      }
    } else {
      // Yeni not oluştur
      const createBody = {
        submissionId,
        score,
        feedback: feedback || null,
        isPublished
      };

      console.log("[handleGrading] Yeni not oluşturuluyor:", createBody);
      
      try {
        await apiFetch("/Grade", {
          method: "POST",
          body: createBody
        });

        showToast("✅ Not başarıyla kaydedildi!");
        if (resultContainer) {
          resultContainer.innerHTML = "<p style='color:green; padding:1rem;'>✅ Not kaydedildi ve öğrenciye gönderildi.</p>";
        }
      } catch (createError) {
        // Eğer "already graded" hatası alırsak, mevcut notu bul ve güncelle
        const errorMsg = createError.message || createError.response?.message || "";
        if (errorMsg.includes("already graded") || errorMsg.includes("zaten notlandırılmış")) {
          console.log("[handleGrading] Not zaten var, güncelleme yapılıyor...");
          
          // Mevcut notu bul
          const existingGrade = await apiFetch(`/Grade/submission/${submissionId}`);
          if (existingGrade && (existingGrade.id || existingGrade.Id)) {
            const updateGradeId = existingGrade.id || existingGrade.Id;
            const updateBody = {
              score: score,
              feedback: feedback && feedback.trim() !== "" ? feedback.trim() : null,
              isPublished: isPublished
            };
            
            await apiFetch(`/Grade/${updateGradeId}`, {
              method: "PUT",
              body: updateBody
            });
            
            showToast("✅ Not başarıyla güncellendi!");
            if (resultContainer) {
              resultContainer.innerHTML = "<p style='color:green; padding:1rem;'>✅ Not güncellendi ve öğrenciye gönderildi.</p>";
            }
          } else {
            throw createError; // Mevcut not bulunamadı, orijinal hatayı fırlat
          }
        } else {
          throw createError; // Farklı bir hata, fırlat
        }
      }
    }

    form.reset();
    
    // Formu gizle
    const formSection = gradingSelectors.gradingFormSection();
    if (formSection) formSection.style.display = "none";
    
    // Teslimleri yenile
    await loadSubmissions();

  } catch (error) {
    console.error("[handleGrading] ❌ Hata detayları:", {
      error,
      message: error.message,
      response: error.response,
      stack: error.stack
    });
    
    if (gradingHandleUnauthorized(error)) return;
    
    // Backend'den gelen hata mesajını parse et
    let errorMessage = "Not kaydedilemedi";
    
    // Önce response'dan hata mesajını al
    if (error.response) {
      if (error.response.message) {
        errorMessage = error.response.message;
      } else if (error.response.errors) {
        // FluentValidation hataları
        const errors = error.response.errors;
        if (typeof errors === 'object') {
          const errorList = [];
          for (const key in errors) {
            if (Array.isArray(errors[key])) {
              errorList.push(...errors[key]);
            } else if (typeof errors[key] === 'string') {
              errorList.push(errors[key]);
            }
          }
          errorMessage = errorList.length > 0 ? errorList.join(", ") : errorMessage;
        } else if (Array.isArray(errors)) {
          errorMessage = errors.join(", ");
        }
      } else if (typeof error.response === 'string') {
        errorMessage = error.response;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Türkçe hata mesajları
    if (errorMessage.includes("already graded") || errorMessage.includes("zaten notlandırılmış")) {
      errorMessage = "Bu teslim zaten notlandırılmış. Sistem otomatik olarak notu güncellemeye çalışıyor...";
      
      // Tekrar deneme: Mevcut notu bul ve güncelle
      try {
        const existingGrade = await apiFetch(`/Grade/submission/${submissionId}`);
        if (existingGrade && (existingGrade.id || existingGrade.Id)) {
          const updateGradeId = existingGrade.id || existingGrade.Id;
          const updateBody = {
            score: score,
            feedback: feedback && feedback.trim() !== "" ? feedback.trim() : null,
            isPublished: isPublished
          };
          
          await apiFetch(`/Grade/${updateGradeId}`, {
            method: "PUT",
            body: updateBody
          });
          
          showToast("✅ Not başarıyla güncellendi!");
          if (resultContainer) {
            resultContainer.innerHTML = "<p style='color:green; padding:1rem;'>✅ Not güncellendi ve öğrenciye gönderildi.</p>";
          }
          
          form.reset();
          const formSection = gradingSelectors.gradingFormSection();
          if (formSection) formSection.style.display = "none";
          await loadSubmissions();
          return; // Başarılı, hata gösterme
        }
      } catch (retryError) {
        console.error("[handleGrading] Otomatik güncelleme hatası:", retryError);
        errorMessage = "Bu teslim zaten notlandırılmış. Lütfen 'Notu Düzenle' butonunu kullanın.";
      }
    } else if (errorMessage.includes("Score cannot exceed") || errorMessage.includes("Puan maksimum")) {
      errorMessage = errorMessage.replace("Score cannot exceed", "Puan maksimum değeri aşamaz");
    } else if (errorMessage.includes("Puan gereklidir")) {
      errorMessage = "Lütfen geçerli bir puan girin";
    }
    
    console.error("[handleGrading] Final hata mesajı:", errorMessage);
    
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red; padding:1rem;'>❌ ${errorMessage}</p>`;
    }
    showToast(errorMessage, true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Notu Kaydet";
    }
  }
};

const updateTeacherWelcomeGrading = () => {
  const user = getAuthUser();
  const nameEl = gradingSelectors.teacherName();
  if (user && nameEl) {
    nameEl.textContent = `${user.fullName || user.email} - Not Verme`;
  }
};

const bindGradingEvents = () => {
  const logoutButton = gradingSelectors.logoutButton();
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearAuthSession();
      window.location.href = "index.html";
    });
  }

  const loadBtn = gradingSelectors.loadSubmissionsBtn();
  if (loadBtn) {
    loadBtn.addEventListener("click", loadSubmissions);
  }

  const gradingForm = gradingSelectors.gradingForm();
  if (gradingForm) {
    gradingForm.addEventListener("submit", handleGrading);
  }
};

const initGrading = async () => {
  console.log("[initGrading] Sayfa başlatılıyor...");
  
  try {
    // Önce authentication kontrolü
    ensureAuthenticated();
    
    // Rol kontrolü
    const user = requireInstructorRoleGrading();
    
    if (!user) {
      throw new Error("Lütfen giriş yapın");
    }
    
    // Ekstra rol kontrolü - öğrenci giriş yaparsa öğrenci paneline yönlendir
    const userRole = (user?.role || "").toLowerCase();
    if (userRole === "student") {
      showToast("Bu sayfa sadece öğretmenler içindir. Öğrenci paneline yönlendiriliyorsunuz...", false);
      setTimeout(() => {
        window.location.href = "student_dashboard.html";
      }, 1500);
      return;
    }
    
    console.log("[initGrading] Kullanıcı doğrulandı:", user.fullName || user.email);
    
    // Navigation menüsünü rol bazlı güncelle (hemen, hata olmadan önce)
    if (typeof updateNavigationByRole === "function") {
      console.log("[initGrading] Navigation güncelleniyor...");
      updateNavigationByRole();
    } else {
      console.warn("[initGrading] updateNavigationByRole fonksiyonu bulunamadı!");
    }
    
    // Event'leri bağla
    bindGradingEvents();
    updateTeacherWelcomeGrading();
    
    // Ödevleri yükle
    console.log("[initGrading] Ödevler yükleniyor...");
    await loadTeacherAssignments();
    
    // Süresi dolmuş ödevler için otomatik 0 notu ver (arka planda, sessizce)
    if (gradingState.assignments && gradingState.assignments.length > 0) {
      autoGradeLateAssignmentsInGrading(gradingState.assignments).catch(err => {
        console.error("[initGrading] Auto-grade hatası:", err);
      });
    }
    
    console.log("[initGrading] ✅ Sayfa başarıyla yüklendi");
  } catch (error) {
    console.error("[initGrading] ❌ Hata:", error);
    
    // Navigation'ı yine de güncellemeyi dene (hata olsa bile görünsün)
    if (typeof updateNavigationByRole === "function") {
      try {
        console.log("[initGrading] Hata durumunda navigation güncelleniyor...");
        updateNavigationByRole();
      } catch (navError) {
        console.error("[initGrading] Navigation güncellenirken hata:", navError);
      }
    } else {
      console.warn("[initGrading] updateNavigationByRole fonksiyonu bulunamadı! navigation.js yüklü mü?");
    }
    
    showToast(error.message || "Sayfa yüklenirken bir hata oluştu", true);
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
    return;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const page = gradingSelectors.page();
  if (!page) return;
  initGrading();
});


