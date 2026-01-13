const assignmentsState = {
  role: "",
  classes: [],
  assignments: [],
  selectedClassId: null,
  currentGroupId: null // Grup ödevi için otomatik alınan grup ID
};

const assignmentsSelectors = {
  page: () => document.getElementById("assignmentsPage"),
  studentSection: () => document.getElementById("studentAssignmentsSection"),
  studentList: () => document.getElementById("studentAssignmentsList"),
  submissionModal: () => document.getElementById("submissionModal"),
  submissionForm: () => document.getElementById("submissionForm"),
  submissionAssignmentId: () => document.getElementById("submissionAssignmentId"),
  submissionAssignmentTitle: () => document.getElementById("submissionAssignmentTitle"),
  submissionFileInput: () => document.getElementById("submissionFileInput"),
  submissionGroupId: () => document.getElementById("submissionGroupId"),
  submissionComments: () => document.getElementById("submissionComments"),
  submissionResult: () => document.getElementById("submissionResult"),
  closeSubmissionModal: () => document.getElementById("closeSubmissionModal"),
  teacherSection: () => document.getElementById("teacherAssignmentsSection"),
  classSelect: () => document.getElementById("assignmentClassSelect"),
  classFilter: () => document.getElementById("teacherClassFilter"),
  typeSelect: () => document.getElementById("assignmentTypeSelect"),
  titleInput: () => document.getElementById("assignmentTitle"),
  descriptionInput: () => document.getElementById("assignmentDescription"),
  dueDateInput: () => document.getElementById("assignmentDueDate"),
  maxScoreInput: () => document.getElementById("assignmentMaxScore"),
  allowLateCheckbox: () => document.getElementById("allowLate"),
  allowResubmissionCheckbox: () => document.getElementById("allowResubmission"),
  attachmentFileInput: () => document.getElementById("assignmentAttachmentFile"),
  attachmentFilePreview: () => document.getElementById("assignmentFilePreview"),
  form: () => document.getElementById("assignmentForm"),
  formResult: () => document.getElementById("assignmentFormResult"),
  teacherList: () => document.getElementById("teacherAssignmentsList"),
  refreshButton: () => document.getElementById("refreshAssignmentsButton")
};

const isInstructorRole = (role) => {
  const normalized = (role || "").toLowerCase();
  return normalized === "instructor" || normalized === "admin";
};

const redirectToLogin = (message) => {
  if (message) {
    showToast(message, true);
  }
  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
};

const handleAssignmentsUnauthorized = (error) => {
  if (error?.status === 401) {
    clearAuthSession();
    redirectToLogin("Oturum süresi doldu, lütfen yeniden giriş yapın.");
    return true;
  }
  return false;
};

const showSection = (section) => {
  if (!section) {
    console.warn("[showSection] Section bulunamadı!");
    return;
  }
  
  // Tüm gizleme class'larını kaldır
  section.classList.remove("hidden");
  section.classList.remove("force-hidden");
  
  // Inline style ekle - CSS'deki kuralları override etmek için
  section.style.display = "block";
  section.style.visibility = "visible";
  section.style.opacity = "1";
  section.style.height = "auto";
  section.style.overflow = "visible";
  
  console.log("[showSection] Section gösterildi:", section.id);
  console.log("[showSection] Section computed display:", window.getComputedStyle(section).display);
  console.log("[showSection] Section has hidden class:", section.classList.contains("hidden"));
};

const hideSection = (section) => {
  if (section) {
    section.classList.add("hidden");
    // CSS'deki !important kurallarını override etmek için inline style ekle
    section.style.display = "none";
    section.style.visibility = "hidden";
  }
};

// UTC'yi Türkiye saatine (UTC+3) çeviren helper fonksiyon
const convertUTCToTurkishTime = (utcDateString) => {
  if (!utcDateString) return null;
  try {
    // ISO string formatında gelen UTC tarihini parse et
    // Eğer string'de 'Z' varsa UTC, yoksa zaten local time olabilir
    let date;
    if (typeof utcDateString === 'string' && utcDateString.endsWith('Z')) {
      // UTC string'i - Türkiye saatine çevir (UTC+3)
      date = new Date(utcDateString);
      // Date objesi otomatik olarak local timezone'a çevrilir
      // Ama biz Türkiye saatini istiyoruz, bu yüzden UTC+3 offset'ini ekleyelim
      const utcTime = date.getTime();
      const turkishOffset = 3 * 60 * 60 * 1000; // UTC+3
      date = new Date(utcTime + turkishOffset);
    } else {
      // Zaten local time olabilir veya UTC olmayan format
      date = new Date(utcDateString);
    }
    
    if (Number.isNaN(date.getTime())) return null;
    return date;
  } catch (e) {
    console.error("[convertUTCToTurkishTime] Hata:", e);
    return null;
  }
};

const formatAssignmentDate = (value) => {
  // authUtils.js'deki formatDateTurkish fonksiyonunu kullan (diğer sayfalarla tutarlı)
  if (typeof window.formatDateTurkish === "function") {
    return window.formatDateTurkish(value);
  }
  if (!value) return "-";
  return value;
};

const populateClassSelect = (select, classes) => {
  if (!select) return;
  select.innerHTML = '<option value="">Sınıf seçiniz</option>';
  classes.forEach((cls) => {
    const option = document.createElement("option");
    option.value = cls.id;
    option.textContent = `${cls.className} (${cls.courseCode || ""} ${cls.courseName || ""})`;
    select.appendChild(option);
  });
};

const renderStudentAssignments = (assignments = []) => {
  const container = assignmentsSelectors.studentList();
  if (!container) return;

  if (!assignments.length) {
    container.innerHTML = "<p>Şu anda size atanmış aktif ödev bulunmuyor.</p>";
    return;
  }

  container.innerHTML = assignments
    .map(
      (assignment) => {
        const assignmentId = assignment.id || assignment.Id;
        const title = assignment.title || assignment.Title || "Bilinmeyen Ödev";
        const description = assignment.description || assignment.Description || "Açıklama bulunmuyor.";
        const className = assignment.className || assignment.ClassName || "-";
        const assignmentType = assignment.assignmentType || assignment.AssignmentType || "Bireysel";
        const dueDate = assignment.dueDate || assignment.DueDate;
        const maxScore = assignment.maxScore || assignment.MaxScore || "-";
        const assignmentTypeName = assignmentType === "Group" || assignmentType === "2" ? "Grup Ödevi" : "Bireysel Ödev";
        const attachmentPath = assignment.attachmentPath || assignment.AttachmentPath || null;
        
        // Teslim tarihi geçmiş mi kontrol et - öğretmenin girdiği saate göre (Türkiye saati)
        let isPastDue = false;
        if (dueDate) {
          try {
            // Backend'den gelen dueDate UTC olarak geliyor (ISO string formatında)
            // Önce string'i UTC olarak parse et
            let dueDateObj;
            if (typeof dueDate === 'string') {
              // Eğer string 'Z' ile bitmiyorsa (UTC değilse), UTC olarak ekle
              const dateStr = dueDate.endsWith('Z') ? dueDate : dueDate + 'Z';
              dueDateObj = new Date(dateStr);
            } else {
              dueDateObj = new Date(dueDate);
            }
            
            // Şu anki zamanı UTC olarak al
            const now = new Date();
            
            // UTC timestamp'leri direkt karşılaştır
            isPastDue = dueDateObj.getTime() < now.getTime();
          } catch (e) {
            console.error("[isPastDue check] Hata:", e);
            isPastDue = false;
          }
        }
        
        const allowLate = assignment.allowLateSubmission || assignment.AllowLateSubmission || false;
        const allowResubmission = assignment.allowResubmission || assignment.AllowResubmission || false;
        
        // Title'ı HTML attribute için escape et
        const escapedTitle = title.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        
        const hasSubmission = assignment.hasStudentSubmission || assignment.HasStudentSubmission || false;
        
        return `
        <div class="assignment-card">
          <div class="assignment-header">
            <strong>${title}</strong>
            ${hasSubmission ? '<span class="badge submitted" style="background: #4CAF50; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; margin-left: 0.5rem;">✅ Teslim Edildi</span>' : ''}
            ${!hasSubmission ? '<span class="badge not-submitted" style="background: #ff9800; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; margin-left: 0.5rem;">⏳ Teslim Edilmedi</span>' : ''}
            ${isPastDue && !hasSubmission ? '<span class="badge late">⏰ Süresi Doldu</span>' : ''}
            ${isPastDue && hasSubmission ? '' : ''}
          </div>
          <p>${description}</p>
          ${attachmentPath ? `
          <div class="assignment-attachment">
            <a href="#" 
               onclick="handleAssignmentFileDownload(event, ${assignmentId}); return false;" 
               class="download-attachment-btn">
              📎 Ek Dosyayı İndir
            </a>
          </div>
          ` : ''}
          <div class="assignment-info">
            <p><small>📚 Sınıf: ${className}</small></p>
            ${assignment.courseCode || assignment.CourseCode || assignment.courseName || assignment.CourseName ? 
              `<p><small>📖 Ders: ${(assignment.courseCode || assignment.CourseCode || "")} ${(assignment.courseCode || assignment.CourseCode) && (assignment.courseName || assignment.CourseName) ? "-" : ""} ${(assignment.courseName || assignment.CourseName || "")}</small></p>` : 
              ""}
            <p><small>📋 Tür: ${assignmentTypeName}</small></p>
            <p><small>⏰ Son teslim: ${formatAssignmentDate(dueDate)}</small></p>
            <p><small>💯 Maksimum puan: ${maxScore}</small></p>
            <p><small>🕐 Geç teslim izni: ${allowLate ? "✅ Evet" : "❌ Hayır"}</small></p>
            <p><small>🔄 Yeniden teslim izni: ${allowResubmission ? "✅ Evet" : "❌ Hayır"}</small></p>
          </div>
          ${assignmentType === "Group" || assignmentType === "2" ? 
            `<div style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;" id="groupManagementSection_${assignmentId}">
              <button class="submit-btn" onclick="openGroupManagementModal(${assignmentId}, '${escapedTitle}').catch(err => { console.error('Grup yönetimi hatası:', err); showToast('Grup yönetimi açılırken hata oluştu. Lütfen tekrar deneyin.', true); })" style="background: #667eea; margin-bottom: 0.5rem;">
                👥 Grup Yönetimi
              </button>
            </div>` : ''}
          ${isPastDue && !allowLate && !hasSubmission ? 
            '<button class="submit-btn" disabled style="opacity: 0.6; cursor: not-allowed;">❌ Süresi Doldu - Teslim Edilemez</button>' : 
            isPastDue && allowLate && !hasSubmission ?
            `<button class="submit-btn" id="submitBtn_${assignmentId}" onclick="openSubmissionModal(${assignmentId}, '${escapedTitle}', '${assignmentType}').catch(err => { console.error('Modal açma hatası:', err); showToast('Teslim modalı açılırken hata oluştu. Lütfen tekrar deneyin.', true); })" style="background: #ff9800;">
              ⏰ Geç Teslim Et
            </button>` :
            `<button class="submit-btn" id="submitBtn_${assignmentId}" onclick="openSubmissionModal(${assignmentId}, '${escapedTitle}', '${assignmentType}').catch(err => { console.error('Modal açma hatası:', err); showToast('Teslim modalı açılırken hata oluştu. Lütfen tekrar deneyin.', true); })">
              📤 Ödevi Teslim Et
            </button>`}
        </div>
      `;
      }
    )
    .join("");
};

const renderTeacherAssignments = (assignments = []) => {
  const container = assignmentsSelectors.teacherList();
  if (!container) return;

  if (!assignments.length) {
    container.innerHTML = "<p>Bu sınıf için henüz ödev oluşturmadınız.</p>";
    return;
  }

  container.innerHTML = assignments
    .map(
      (assignment) => {
        const assignmentId = assignment.id || assignment.Id;
        const attachmentPath = assignment.attachmentPath || assignment.AttachmentPath || null;
        
        return `
        <div class="assignment-card">
          <div class="assignment-header">
            <strong>${assignment.title || assignment.Title}</strong>
          </div>
          <p>${assignment.description || assignment.Description || "Açıklama bulunmuyor."}</p>
          ${attachmentPath ? `
          <div class="assignment-attachment">
            <a href="#" 
               onclick="handleAssignmentFileDownload(event, ${assignmentId}); return false;" 
               class="download-attachment-btn">
              📎 Ek Dosyayı İndir
            </a>
          </div>
          ` : ''}
          <div class="assignment-info">
            <p><small>📋 Tür: ${(assignment.assignmentType || assignment.AssignmentType) === "Individual" || (assignment.assignmentType || assignment.AssignmentType) === "1" ? "Bireysel Ödev" : (assignment.assignmentType || assignment.AssignmentType) === "Group" || (assignment.assignmentType || assignment.AssignmentType) === "2" ? "Grup Ödevi" : (assignment.assignmentType || assignment.AssignmentType)}</small></p>
            <p><small>⏰ Son teslim: ${formatAssignmentDate(assignment.dueDate || assignment.DueDate)}</small></p>
            <p><small>💯 Maksimum puan: ${(assignment.maxScore || assignment.MaxScore) || "-"}</small></p>
            <p><small>🕐 Geç teslim: ${(assignment.allowLateSubmission || assignment.AllowLateSubmission) ? "Evet" : "Hayır"}</small></p>
            <p><small>🔄 Yeniden teslim: ${(assignment.allowResubmission || assignment.AllowResubmission) ? "Evet" : "Hayır"}</small></p>
            <p><small>📊 Toplam teslim: ${(assignment.totalSubmissions || assignment.TotalSubmissions) || 0}</small></p>
          </div>
        </div>
      `;
      }
    )
    .join("");
};

const loadStudentAssignments = async () => {
  const list = assignmentsSelectors.studentList();
  if (list) {
    list.textContent = "Yükleniyor...";
  }

  try {
    console.log("[loadStudentAssignments] Öğrenci ödevleri yükleniyor...");
    const response = await apiFetch("/Assignment/my-assignments");
    console.log("[loadStudentAssignments] API Response:", response);
    
    // apiFetch zaten normalize ediyor - direkt array gelmeli
    const assignments = Array.isArray(response) ? response : [];
    
    console.log("[loadStudentAssignments] ✅ Yüklenen ödev sayısı:", assignments.length);
    if (assignments.length > 0) {
      console.log("[loadStudentAssignments] İlk ödev:", assignments[0]);
    }

    // Öğrencinin yaptığı teslimleri çek ve hangi ödevlere teslim yapıldığını işaretle
    let submittedAssignmentIds = new Set();
    try {
      const submissionsResponse = await apiFetch("/Submission/my-submissions");
      const submissions = Array.isArray(submissionsResponse) ? submissionsResponse : [];
      submittedAssignmentIds = new Set(
        submissions
          .map((s) => s.assignmentId ?? s.AssignmentId)
          .filter((id) => id != null)
      );
      console.log("[loadStudentAssignments] Öğrencinin teslim yaptığı ödevler:", Array.from(submittedAssignmentIds));
    } catch (subError) {
      console.warn("[loadStudentAssignments] Öğrencinin teslimleri alınamadı, hasSubmission bilgisi olmadan devam ediliyor:", subError);
    }

    const enrichedAssignments = assignments.map((a) => {
      const id = a.id ?? a.Id;
      const hasSubmission = id != null && submittedAssignmentIds.has(id);
      return {
        ...a,
        hasStudentSubmission: hasSubmission,
        HasStudentSubmission: hasSubmission
      };
    });
    
    assignmentsState.assignments = enrichedAssignments;
    renderStudentAssignments(assignmentsState.assignments);
  } catch (error) {
    console.error("[loadStudentAssignments] ❌ Hata:", error);
    if (handleAssignmentsUnauthorized(error)) return;
    if (list) {
      list.innerHTML = `<p style="color:red">${error.message || "Ödevler yüklenirken hata oluştu"}</p>`;
    }
  }
};

const loadTeacherClasses = async () => {
  try {
    console.log("[loadTeacherClasses] Sınıflar yükleniyor...");
    const response = await apiFetch("/Class/my-classes");
    // apiFetch zaten normalize ediyor
    assignmentsState.classes = Array.isArray(response) ? response : [];
    console.log("[loadTeacherClasses] Yüklenen sınıf sayısı:", assignmentsState.classes.length);
    
    const classSelect = assignmentsSelectors.classSelect();
    const classFilter = assignmentsSelectors.classFilter();
    
    if (classSelect) {
      populateClassSelect(classSelect, assignmentsState.classes);
      console.log("[loadTeacherClasses] Class select dolduruldu");
    } else {
      console.warn("[loadTeacherClasses] Class select bulunamadı!");
    }
    
    if (classFilter) {
      populateClassSelect(classFilter, assignmentsState.classes);
      console.log("[loadTeacherClasses] Class filter dolduruldu");
    } else {
      console.warn("[loadTeacherClasses] Class filter bulunamadı!");
    }
  } catch (error) {
    console.error("[loadTeacherClasses] ❌ Hata:", error);
    if (handleAssignmentsUnauthorized(error)) return;
    showToast(error.message || "Sınıflar alınamadı", true);
  }
};

// Süresi dolmuş ödevler için otomatik 0 notu ver
const autoGradeLateAssignments = async (assignments) => {
  if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
    return;
  }

  const now = new Date();
  
  // Süresi dolmuş ödevleri bul (geç teslim izni olsa bile)
  const lateAssignments = assignments.filter(assignment => {
    const dueDate = assignment.dueDate || assignment.DueDate;
    if (!dueDate) return false;
    
    // Backend'den gelen dueDate UTC olarak geliyor (ISO string formatında)
    // UTC olarak parse et ve karşılaştır
    let dueDateObj;
    if (typeof dueDate === 'string') {
      const dateStr = dueDate.endsWith('Z') ? dueDate : dueDate + 'Z';
      dueDateObj = new Date(dateStr);
    } else {
      dueDateObj = new Date(dueDate);
    }
    
    const now = new Date();
    // UTC timestamp'leri direkt karşılaştır
    const isPastDue = dueDateObj.getTime() < now.getTime();
    
    return isPastDue;
  });

  if (lateAssignments.length === 0) {
    return;
  }

  console.log(`[autoGradeLateAssignments] ${lateAssignments.length} adet süresi dolmuş ödev bulundu, otomatik 0 notu veriliyor...`);

  // Her bir süresi dolmuş ödev için otomatik not ver (sessizce, arka planda)
  for (const assignment of lateAssignments) {
    const assignmentId = assignment.id || assignment.Id;
    if (!assignmentId) continue;

    try {
      await apiFetch(`/Grade/auto-grade-late/${assignmentId}`, {
        method: "POST"
      });
      console.log(`[autoGradeLateAssignments] ✅ Ödev ${assignmentId} için otomatik 0 notu verildi`);
    } catch (error) {
      console.error(`[autoGradeLateAssignments] ❌ Ödev ${assignmentId} için otomatik not verilemedi:`, error);
      // Hata durumunda devam et, diğer ödevleri işlemeye devam et
    }
  }
};

// Öğretmenin tüm ödevlerini yükle ve auto-grade yap
const loadAllTeacherAssignmentsForAutoGrade = async () => {
  try {
    // Tüm sınıfları yükle
    const classesResponse = await apiFetch("/Class/my-classes");
    const classes = Array.isArray(classesResponse) ? classesResponse : [];
    const classIds = classes.map((c) => c.id || c.Id).filter(id => id);

    if (classIds.length === 0) {
      return;
    }

    // Tüm sınıfların ödevlerini yükle
    const allAssignments = [];
    for (const classId of classIds) {
      try {
        const assignmentsResponse = await apiFetch(`/Assignment/class/${classId}`);
        const assignments = Array.isArray(assignmentsResponse) ? assignmentsResponse : [];
        allAssignments.push(...assignments);
      } catch (error) {
        console.error(`[loadAllTeacherAssignmentsForAutoGrade] Sınıf ${classId} için ödev yüklenirken hata:`, error);
      }
    }

    if (allAssignments.length === 0) {
      return;
    }

    // Süresi dolmuş ödevler için otomatik 0 notu ver
    await autoGradeLateAssignments(allAssignments);
  } catch (error) {
    console.error("[loadAllTeacherAssignmentsForAutoGrade] Hata:", error);
    // Sessizce hata yok say
  }
};

const loadTeacherAssignments = async (classId) => {
  const container = assignmentsSelectors.teacherList();
  if (!classId) {
    assignmentsState.assignments = [];
    if (container) {
      container.innerHTML = "<p>Sınıf seçerek ödevleri görüntüleyin.</p>";
    }
    return;
  }

  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    console.log("[loadTeacherAssignments] Sınıf ID:", classId);
    const response = await apiFetch(`/Assignment/class/${classId}`);
    // apiFetch zaten normalize ediyor
    assignmentsState.assignments = Array.isArray(response) ? response : [];
    console.log("[loadTeacherAssignments] Yüklenen ödev sayısı:", assignmentsState.assignments.length);
    
    if (container) {
      renderTeacherAssignments(assignmentsState.assignments);
    } else {
      console.warn("[loadTeacherAssignments] Teacher list container bulunamadı!");
    }
  } catch (error) {
    console.error("[loadTeacherAssignments] ❌ Hata:", error);
    if (handleAssignmentsUnauthorized(error)) return;
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message || "Ödevler yüklenirken hata oluştu"}</p>`;
    }
  }
};

const handleAssignmentFormSubmit = async (event) => {
  event.preventDefault();

  const form = assignmentsSelectors.form();
  if (!form) return;

  const classId = parseInt(assignmentsSelectors.classSelect()?.value || "", 10);
  const typeValue = parseInt(assignmentsSelectors.typeSelect()?.value || "1", 10);
  const title = assignmentsSelectors.titleInput()?.value.trim();
  const description = assignmentsSelectors.descriptionInput()?.value.trim();
  const dueDateRaw = assignmentsSelectors.dueDateInput()?.value;
  const maxScoreValue = assignmentsSelectors.maxScoreInput()?.value;
  const allowLate = assignmentsSelectors.allowLateCheckbox()?.checked ?? false;
  const allowResubmission = assignmentsSelectors.allowResubmissionCheckbox()?.checked ?? false;
  const attachmentFile = assignmentsSelectors.attachmentFileInput()?.files[0];
  const resultContainer = assignmentsSelectors.formResult();

  if (!classId || !title || !description || !dueDateRaw) {
    showToast("Lütfen zorunlu alanları doldurun", true);
    return;
  }

  // Öğretmenin girdiği saati Türkiye saati (UTC+3) olarak yorumla ve UTC'ye çevir
  // datetime-local input "2025-12-02T10:27" formatında gelir (timezone bilgisi yok)
  // Bu değeri manuel olarak Türkiye saati olarak yorumlayıp UTC'ye çevirmeliyiz
  let dueDate;
  try {
    // String'i parse et: "2025-12-02T10:27"
    const parts = dueDateRaw.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!parts) {
      showToast("Geçerli bir son teslim tarihi seçin", true);
      return;
    }
    
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1; // 0-indexed
    const day = parseInt(parts[3], 10);
    const hour = parseInt(parts[4], 10);
    const minute = parseInt(parts[5], 10);
    
    // Öğretmenin girdiği saat Türkiye saati (UTC+3) olarak yorumlanmalı
    // Türkiye saati 10:27 ise, UTC 07:27 olmalı
    // Date.UTC() ile UTC timestamp oluştur, sonra Türkiye saatinden 3 saat çıkar
    const turkishTimeUTC = Date.UTC(year, month, day, hour, minute);
    const utcTime = turkishTimeUTC - (3 * 60 * 60 * 1000); // Türkiye saatinden 3 saat çıkar
    dueDate = new Date(utcTime);
    
    if (Number.isNaN(dueDate.getTime())) {
      showToast("Geçerli bir son teslim tarihi seçin", true);
      return;
    }
  } catch (e) {
    console.error("[dueDate parse] Hata:", e);
    showToast("Geçerli bir son teslim tarihi seçin", true);
    return;
  }

  const body = {
    title: title,
    description: description,
    classId: classId,
    type: typeValue, // 1 = Individual, 2 = Group
    dueDate: dueDate.toISOString(),
    maxScore: maxScoreValue ? parseInt(maxScoreValue, 10) : 100,
    allowLateSubmission: allowLate,
    allowResubmission: allowResubmission
  };
  
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = "<span>⏳ Kaydediliyor...</span>";
  }
  if (resultContainer) {
    resultContainer.textContent = "";
  }

  try {
    console.log("[handleAssignmentFormSubmit] Ödev oluşturuluyor...", {
      title,
      classId,
      hasFile: !!attachmentFile,
      fileName: attachmentFile?.name
    });

    const createdAssignment = await apiFetch("/Assignment", {
      method: "POST",
      body: body
    });

    const createdId = createdAssignment?.id || createdAssignment?.Id;

    // Ek dosya seçildiyse, ayrı bir istekte dosyayı yükle
    if (attachmentFile && createdId) {
      try {
        const formData = new FormData();
        formData.append("file", attachmentFile);

        await apiFetch(`/Assignment/${createdId}/attachment`, {
          method: "POST",
          body: formData
        });

        console.log("[handleAssignmentFormSubmit] ✅ Ek dosya yüklendi");
      } catch (uploadError) {
        console.error("[handleAssignmentFormSubmit] ❌ Ek dosya yüklenemedi:", uploadError);
        showToast("Ödev kaydedildi ancak ek dosya yüklenemedi.", true);
      }
    }

    showToast("✅ Ödev başarıyla oluşturuldu");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green; padding:1rem;'>✅ Yeni ödev eklendi.</p>";
    }
    
    // Formu temizle
    form.reset();
    assignmentsSelectors.maxScoreInput().value = "100";
    updateFilePreview(null); // Dosya önizlemesini temizle
    
    assignmentsState.selectedClassId = classId;
    await loadTeacherAssignments(classId);
    populateClassSelect(assignmentsSelectors.classSelect(), assignmentsState.classes);
    assignmentsSelectors.classSelect().value = String(classId);
    assignmentsSelectors.classFilter().value = String(classId);
  } catch (error) {
    console.error("[handleAssignmentFormSubmit] ❌ Hata:", error);
    if (handleAssignmentsUnauthorized(error)) return;
    
    let errorMessage = error.message || "Ödev oluşturulamadı";
    if (error.response?.message) {
      errorMessage = error.response.message;
    } else if (error.response?.errors && Array.isArray(error.response.errors)) {
      errorMessage = error.response.errors.join(", ");
    }
    
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red; padding:1rem;'>❌ ${errorMessage}</p>`;
    }
    showToast(errorMessage, true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = "<span>✨ Ödev Oluştur</span>";
    }
  }
};

// Dosya önizlemesi güncelleme fonksiyonu
const updateFilePreview = (file) => {
  const preview = assignmentsSelectors.attachmentFilePreview();
  const fileInput = assignmentsSelectors.attachmentFileInput();
  
  if (!preview || !fileInput) return;
  
  if (!file) {
    preview.classList.add("hidden");
    preview.innerHTML = "";
    return;
  }
  
  preview.classList.remove("hidden");
  
  const fileName = file.name;
  const fileSize = (file.size / (1024 * 1024)).toFixed(2); // MB cinsinden
  const fileIcon = getFileIcon(fileName);
  
  preview.innerHTML = `
    <div class="file-preview-content">
      <span class="file-icon">${fileIcon}</span>
      <div class="file-info">
        <div class="file-name">${fileName}</div>
        <div class="file-size">${fileSize} MB</div>
      </div>
      <button type="button" class="file-remove-btn" onclick="clearAssignmentFile()">×</button>
    </div>
  `;
};

// Dosya ikonu belirleme
const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const icons = {
    pdf: '📄',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    doc: '📝',
    docx: '📝',
    zip: '📦',
    rar: '📦'
  };
  return icons[ext] || '📎';
};

// Dosya seçildiğinde önizleme göster
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  updateFilePreview(file);
};

// Dosyayı temizle
window.clearAssignmentFile = () => {
  const fileInput = assignmentsSelectors.attachmentFileInput();
  const preview = assignmentsSelectors.attachmentFilePreview();
  
  if (fileInput) {
    fileInput.value = "";
  }
  updateFilePreview(null);
};

// Ödev teslim modal'ını aç
window.openSubmissionModal = async (assignmentId, assignmentTitle, assignmentType) => {
  const modal = assignmentsSelectors.submissionModal();
  const assignmentIdInput = assignmentsSelectors.submissionAssignmentId();
  const assignmentTitleDisplay = assignmentsSelectors.submissionAssignmentTitle();
  const resultContainer = assignmentsSelectors.submissionResult();
  
  if (!modal || !assignmentIdInput || !assignmentTitleDisplay) {
    showToast("Modal öğeleri bulunamadı", true);
    return;
  }
  
  // Ödev bilgisini kontrol et - süresi dolmuş mu?
  const assignment = assignmentsState.assignments.find(a => (a.id || a.Id) == assignmentId);
  if (assignment) {
    const dueDate = assignment.dueDate || assignment.DueDate;
    const allowLate = assignment.allowLateSubmission || assignment.AllowLateSubmission || false;
    
    if (dueDate) {
      // Backend'den gelen dueDate UTC olarak geliyor (ISO string formatında)
      // UTC olarak parse et ve karşılaştır
      let dueDateObj;
      if (typeof dueDate === 'string') {
        const dateStr = dueDate.endsWith('Z') ? dueDate : dueDate + 'Z';
        dueDateObj = new Date(dateStr);
      } else {
        dueDateObj = new Date(dueDate);
      }
      
      const now = new Date();
      // UTC timestamp'leri direkt karşılaştır
      const isPastDue = dueDateObj.getTime() < now.getTime();
      
      // Geç teslim izni yoksa ve süre dolmuşsa teslim edilemez
      // Geç teslim izni varsa bir defalık teslim edilebilir
      if (isPastDue && !allowLate) {
        showToast("❌ Bu ödev için süre dolmuştur ve geç teslim izni yoktur. Teslim edilemez.", true);
        return;
      }
      // Geç teslim izni varsa, süre geçse bile teslim edilebilir (bir defalık)
    }
  }
  
  assignmentIdInput.value = assignmentId;
  assignmentTitleDisplay.textContent = assignmentTitle || "Ödev";
  
  // Ödev tipini kontrol et
  const isGroupAssignment = assignmentType === "Group" || assignmentType === "2" || assignmentType === 2;
  
  // Grup ödevi ise, öğrencinin grubunu otomatik al
  if (isGroupAssignment) {
    try {
      const myGroupResponse = await apiFetch(`/Group/my-group/${assignmentId}`);
      const myGroup = myGroupResponse?.data || myGroupResponse;
      if (myGroup && myGroup.id) {
        // Grup var, grup ID'yi sakla (form submit'te kullanılacak)
        assignmentsState.currentGroupId = myGroup.id;
      } else {
        showToast("Bu grup ödevi için henüz bir grubunuz yok. Lütfen önce grup oluşturun.", true);
        closeSubmissionModal();
        return;
      }
    } catch (error) {
      console.error("[openSubmissionModal] Grup bilgisi alınamadı:", error);
      showToast("Grup bilgisi alınamadı. Lütfen tekrar deneyin.", true);
      closeSubmissionModal();
      return;
    }
  } else {
    assignmentsState.currentGroupId = null;
  }
  
  if (resultContainer) {
    resultContainer.innerHTML = "";
  }
  
  // Formu temizle
  const form = assignmentsSelectors.submissionForm();
  if (form) {
    form.reset();
    // assignmentId'yi tekrar set et (reset silmiş olabilir)
    assignmentIdInput.value = assignmentId;
    assignmentTitleDisplay.textContent = assignmentTitle || "Ödev";
  }
  
  modal.classList.remove("hidden");
};

// Ödev teslim modal'ını kapat
const closeSubmissionModal = () => {
  const modal = assignmentsSelectors.submissionModal();
  if (modal) {
    modal.classList.add("hidden");
  }
  
  const form = assignmentsSelectors.submissionForm();
  if (form) {
    form.reset();
  }
  
  const resultContainer = assignmentsSelectors.submissionResult();
  if (resultContainer) {
    resultContainer.innerHTML = "";
  }
};

// Ödev teslim formunu işle
const handleSubmissionFormSubmit = async (event) => {
  event.preventDefault();
  
  const assignmentId = assignmentsSelectors.submissionAssignmentId()?.value;
  const fileInput = assignmentsSelectors.submissionFileInput();
  const comments = assignmentsSelectors.submissionComments()?.value.trim();
  const resultContainer = assignmentsSelectors.submissionResult();
  
  if (!assignmentId) {
    showToast("Ödev seçilemedi", true);
    return;
  }
  
  if (!fileInput?.files?.length) {
    showToast("Lütfen yüklemek için bir dosya seçin", true);
    return;
  }
  
  // Dosya boyutu kontrolü (10MB)
  const file = fileInput.files[0];
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    showToast("Dosya boyutu 10MB'dan küçük olmalıdır", true);
    return;
  }
  
  // Ödev bilgisini alarak tipini kontrol et
  const assignment = assignmentsState.assignments.find(a => (a.id || a.Id) == assignmentId);
  if (!assignment) {
    showToast("Ödev bilgisi bulunamadı", true);
    return;
  }
  
  const assignmentType = assignment ? (assignment.assignmentType || assignment.AssignmentType) : null;
  const isGroupAssignment = assignmentType === "Group" || assignmentType === "2" || assignmentType === 2;
  
  // Süresi dolmuş mu kontrol et
  const dueDate = assignment.dueDate || assignment.DueDate;
  const allowLate = assignment.allowLateSubmission || assignment.AllowLateSubmission || false;
  
  if (dueDate) {
    // Backend'den gelen dueDate UTC olarak geliyor (ISO string formatında)
    // UTC olarak parse et ve karşılaştır
    let dueDateObj;
    if (typeof dueDate === 'string') {
      const dateStr = dueDate.endsWith('Z') ? dueDate : dueDate + 'Z';
      dueDateObj = new Date(dateStr);
    } else {
      dueDateObj = new Date(dueDate);
    }
    
    const now = new Date();
    // UTC timestamp'leri direkt karşılaştır
    const isPastDue = dueDateObj.getTime() < now.getTime();
    
    if (isPastDue && !allowLate) {
      showToast("❌ Bu ödev için süre dolmuştur ve geç teslim izni yoktur. Teslim edilemez.", true);
      return;
    }
    // Geç teslim izni varsa, süre geçse bile bir defalık teslim edilebilir
  }
  
  // Grup ID kontrolü - otomatik alınan grup ID'yi kullan
  let groupIdValue = null;
  if (isGroupAssignment) {
    // Grup ödevi - otomatik alınan grup ID'yi kullan
    if (!assignmentsState.currentGroupId) {
      showToast("Bu ödev grup ödevidir. Lütfen önce grup oluşturun.", true);
      return;
    }
    groupIdValue = assignmentsState.currentGroupId.toString();
  }
  
  const formData = new FormData();
  formData.append("assignmentId", assignmentId);
  
  if (groupIdValue !== null) {
    formData.append("groupId", groupIdValue);
  }
  
  if (comments && comments.trim() !== "") {
    formData.append("comments", comments.trim());
  }
  
  formData.append("file", file);
  
  const submitButton = assignmentsSelectors.submissionForm()?.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Gönderiliyor...";
  }
  
  if (resultContainer) {
    resultContainer.innerHTML = "<p style='color:blue; padding:1rem;'>Yükleniyor...</p>";
  }
  
  try {
    console.log("[handleSubmissionFormSubmit] Ödev teslim ediliyor:", { assignmentId, groupId: groupIdValue });
    
    await apiFetch("/Submission", {
      method: "POST",
      body: formData
    });
    
    showToast("✅ Ödev başarıyla teslim edildi!");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green; padding:1rem;'>✅ Tesliminiz başarıyla alındı.</p>";
    }
    
    // Formu temizle ve modal'ı kapat
    setTimeout(() => {
      closeSubmissionModal();
      // Ödev listesini yenile
      loadStudentAssignments();
    }, 1500);
    
  } catch (error) {
    console.error("[handleSubmissionFormSubmit] ❌ Hata:", error);
    if (handleAssignmentsUnauthorized(error)) return;
    
    let errorMessage = "Teslim sırasında hata oluştu";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response?.message) {
      errorMessage = error.response.message;
    } else if (error.response?.errors) {
      const errors = error.response.errors;
      if (typeof errors === 'object') {
        const errorList = [];
        for (const key in errors) {
          if (Array.isArray(errors[key])) {
            errorList.push(...errors[key]);
          }
        }
        errorMessage = errorList.length > 0 ? errorList.join(", ") : errorMessage;
      }
    }
    
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red; padding:1rem;'>❌ ${errorMessage}</p>`;
    }
    showToast(errorMessage, true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Teslim Et";
    }
  }
};

const bindAssignmentEvents = () => {
  const form = assignmentsSelectors.form();
  if (form) {
    form.addEventListener("submit", handleAssignmentFormSubmit);
  }

  // Dosya seçimi event'i
  const fileInput = assignmentsSelectors.attachmentFileInput();
  if (fileInput) {
    fileInput.addEventListener("change", handleFileSelect);
  }

  const classFilter = assignmentsSelectors.classFilter();
  if (classFilter) {
    classFilter.addEventListener("change", (event) => {
      const selected = parseInt(event.target.value || "", 10);
      assignmentsState.selectedClassId = Number.isNaN(selected) ? null : selected;
      loadTeacherAssignments(assignmentsState.selectedClassId);
    });
  }

  const refreshButton = assignmentsSelectors.refreshButton();
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      loadTeacherAssignments(assignmentsState.selectedClassId);
    });
  }
  
  // Ödev teslim modal event'leri
  const submissionForm = assignmentsSelectors.submissionForm();
  if (submissionForm) {
    submissionForm.addEventListener("submit", handleSubmissionFormSubmit);
  }
  
  const closeModalBtn = assignmentsSelectors.closeSubmissionModal();
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeSubmissionModal);
  }
  
  const cancelSubmissionBtn = document.getElementById("cancelSubmission");
  if (cancelSubmissionBtn) {
    cancelSubmissionBtn.addEventListener("click", closeSubmissionModal);
  }
  
  // Modal dışına tıklayınca kapat
  const modal = assignmentsSelectors.submissionModal();
  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeSubmissionModal();
      }
    });
  }
};

const initAssignmentsPage = async () => {
  console.log("[initAssignmentsPage] Sayfa başlatılıyor...");
  
  try {
    ensureAuthenticated();
  } catch (error) {
    console.error("[initAssignmentsPage] Authentication hatası:", error);
    redirectToLogin(error.message);
    return;
  }

  const user = getAuthUser();
  if (!user) {
    console.error("[initAssignmentsPage] Kullanıcı bilgisi bulunamadı!");
    redirectToLogin("Oturum bilgisi bulunamadı");
    return;
  }
  
  assignmentsState.role = (user?.role || "").toLowerCase();
  
  console.log("[initAssignmentsPage] Kullanıcı rolü:", assignmentsState.role, "User:", user);

  // Navigation menüsünü önce güncelle (her zaman)
  if (typeof updateNavigationByRole === "function") {
    updateNavigationByRole();
    // Navigation'ın görünür olduğundan emin ol
    setTimeout(() => {
      const nav = document.querySelector("nav");
      const header = document.querySelector("header");
      if (nav) {
        nav.style.setProperty("display", "block", "important");
        nav.style.setProperty("visibility", "visible", "important");
        nav.classList.remove("hidden");
        console.log("[initAssignmentsPage] Navigation görünür yapıldı");
      }
      if (header) {
        header.style.setProperty("display", "flex", "important");
        header.style.setProperty("visibility", "visible", "important");
        header.classList.remove("hidden");
        console.log("[initAssignmentsPage] Header görünür yapıldı");
      }
    }, 50);
  }
  
  // Önce section'ları kontrol et ve varsayılan olarak gizle
  const studentSection = assignmentsSelectors.studentSection();
  const teacherSection = assignmentsSelectors.teacherSection();
  
  if (studentSection) {
    studentSection.classList.add("hidden");
    studentSection.style.display = "none";
  }
  if (teacherSection) {
    teacherSection.classList.add("hidden");
    teacherSection.style.display = "none";
  }

  // Tüm kullanıcılar için event'leri bağla (modal için)
  bindAssignmentEvents();

  if (assignmentsState.role === "student") {
    console.log("[initAssignmentsPage] Öğrenci sayfası gösteriliyor");
    
    // Öğrenci bölümünü göster, öğretmen bölümünü gizle
    if (studentSection) {
      studentSection.classList.remove("hidden", "force-hidden");
      studentSection.style.setProperty("display", "block", "important");
      studentSection.style.setProperty("visibility", "visible", "important");
      studentSection.style.setProperty("opacity", "1", "important");
      console.log("[initAssignmentsPage] Student section gösterildi");
    }
    if (teacherSection) {
      teacherSection.classList.add("hidden", "force-hidden");
      teacherSection.style.setProperty("display", "none", "important");
      teacherSection.style.setProperty("visibility", "hidden", "important");
      teacherSection.style.setProperty("opacity", "0", "important");
      console.log("[initAssignmentsPage] Teacher section gizlendi");
    }
    
    // Ekstra güvenlik: Eğer hala görünmüyorsa, zorla göster
    setTimeout(() => {
      if (studentSection) {
        const computedStyle = window.getComputedStyle(studentSection);
        const isHidden = computedStyle.display === "none" || 
                        computedStyle.visibility === "hidden" || 
                        studentSection.classList.contains("hidden") ||
                        studentSection.classList.contains("force-hidden");
        
        if (isHidden) {
          console.warn("[initAssignmentsPage] Student section hala gizli, zorla gösteriliyor...");
          studentSection.classList.remove("hidden", "force-hidden");
          studentSection.style.setProperty("display", "block", "important");
          studentSection.style.setProperty("visibility", "visible", "important");
          studentSection.style.setProperty("opacity", "1", "important");
          studentSection.style.setProperty("height", "auto", "important");
          studentSection.style.setProperty("overflow", "visible", "important");
        }
        
        // Öğretmen section'ının gizli olduğundan emin ol
        if (teacherSection) {
          teacherSection.classList.add("hidden", "force-hidden");
          teacherSection.style.setProperty("display", "none", "important");
          teacherSection.style.setProperty("visibility", "hidden", "important");
          teacherSection.style.setProperty("opacity", "0", "important");
        }
        
        const finalStyle = window.getComputedStyle(studentSection);
        console.log("[initAssignmentsPage] Student section final state:", {
          display: finalStyle.display,
          visibility: finalStyle.visibility,
          hasHidden: studentSection.classList.contains("hidden"),
          hasForceHidden: studentSection.classList.contains("force-hidden")
        });
      }
    }, 300);
    
    await loadStudentAssignments();
    return;
  }

  if (isInstructorRole(assignmentsState.role)) {
    console.log("[initAssignmentsPage] Öğretmen sayfası gösteriliyor");
    
    console.log("[initAssignmentsPage] Teacher section bulundu:", teacherSection);
    console.log("[initAssignmentsPage] Student section bulundu:", studentSection);
    
    if (!teacherSection) {
      console.error("[initAssignmentsPage] ❌ Teacher section bulunamadı!");
      showToast("Sayfa yüklenirken hata oluştu. Lütfen sayfayı yenileyin.", true);
      return;
    }
    
    // Öğrenci bölümünü gizle
    if (studentSection) {
      studentSection.classList.add("hidden", "force-hidden");
      studentSection.style.setProperty("display", "none", "important");
      studentSection.style.setProperty("visibility", "hidden", "important");
      studentSection.style.setProperty("opacity", "0", "important");
      console.log("[initAssignmentsPage] Student section gizlendi");
    }
    
    // Öğretmen bölümünü göster
    teacherSection.classList.remove("hidden", "force-hidden");
    teacherSection.style.setProperty("display", "block", "important");
    teacherSection.style.setProperty("visibility", "visible", "important");
    teacherSection.style.setProperty("opacity", "1", "important");
    console.log("[initAssignmentsPage] Teacher section gösterildi");
    
    // Ekstra güvenlik: Eğer hala görünmüyorsa, zorla göster
    setTimeout(() => {
      if (teacherSection) {
        const computedStyle = window.getComputedStyle(teacherSection);
        const isHidden = computedStyle.display === "none" || 
                        computedStyle.visibility === "hidden" || 
                        teacherSection.classList.contains("hidden") ||
                        teacherSection.classList.contains("force-hidden");
        
        if (isHidden) {
          console.warn("[initAssignmentsPage] Teacher section hala gizli, zorla gösteriliyor...");
          teacherSection.classList.remove("hidden", "force-hidden");
          teacherSection.style.setProperty("display", "block", "important");
          teacherSection.style.setProperty("visibility", "visible", "important");
          teacherSection.style.setProperty("opacity", "1", "important");
          teacherSection.style.setProperty("height", "auto", "important");
          teacherSection.style.setProperty("overflow", "visible", "important");
        }
        
        // Öğrenci section'ının gizli olduğundan emin ol
        if (studentSection) {
          studentSection.classList.add("hidden", "force-hidden");
          studentSection.style.setProperty("display", "none", "important");
          studentSection.style.setProperty("visibility", "hidden", "important");
          studentSection.style.setProperty("opacity", "0", "important");
        }
        
        const finalStyle = window.getComputedStyle(teacherSection);
        console.log("[initAssignmentsPage] Teacher section final state:", {
          display: finalStyle.display,
          visibility: finalStyle.visibility,
          hasHidden: teacherSection.classList.contains("hidden"),
          hasForceHidden: teacherSection.classList.contains("force-hidden")
        });
      }
    }, 300);
    
    console.log("[initAssignmentsPage] Teacher section hidden class kaldırıldı");
    console.log("[initAssignmentsPage] Teacher section görünür mü?", !teacherSection.classList.contains("hidden"));
    
    // Section'ın görünür olup olmadığını kontrol et
    const computedStyle = window.getComputedStyle(teacherSection);
    console.log("[initAssignmentsPage] Teacher section computed display:", computedStyle.display);
    console.log("[initAssignmentsPage] Teacher section computed visibility:", computedStyle.visibility);
    
    await loadTeacherClasses();
    
    // Süresi dolmuş ödevler için otomatik 0 notu ver (arka planda, sessizce)
    loadAllTeacherAssignmentsForAutoGrade().catch(err => {
      console.error("[initAssignmentsPage] Auto-grade hatası:", err);
    });
    
    console.log("[initAssignmentsPage] ✅ Öğretmen sayfası yüklendi");
    return;
  }

  // Other roles (e.g., admin without instructor privileges)
  console.warn("[initAssignmentsPage] Bilinmeyen rol:", assignmentsState.role);
  hideSection(assignmentsSelectors.studentSection());
  hideSection(assignmentsSelectors.teacherSection());
  showToast("Bu sayfayı görüntüleme yetkiniz yok", true);
};

// Ödev ek dosyasını indir
window.handleAssignmentFileDownload = async (event, assignmentId) => {
  event.preventDefault();
  event.stopPropagation();
  
  const token = getAuthToken();
  if (!token) {
    showToast("❌ Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.", true);
    window.location.href = "login.html";
    return;
  }

  try {
    // API URL'ini oluştur - apiFetch'in buildUrl fonksiyonunu kullan
    const API_BASE_URL = window.__API_BASE_URL__ || "https://jangly-unsimplified-bria.ngrok-free.dev/api";
    const url = `${API_BASE_URL}/Assignment/${assignmentId}/download`;
    console.log("[handleAssignmentFileDownload] Dosya indiriliyor:", url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      let errorMessage = "Dosya indirilemedi";
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.errors?.[0] || errorMessage;
        console.error("[handleAssignmentFileDownload] Backend hatası:", errorData);
      } catch (parseError) {
        if (response.status === 404) {
          errorMessage = "Dosya bulunamadı";
        } else if (response.status === 403) {
          errorMessage = "Bu dosyaya erişim yetkiniz yok";
        } else if (response.status === 500) {
          errorMessage = "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin";
        } else {
          errorMessage = `Sunucu hatası (${response.status}): ${response.statusText || "Bilinmeyen hata"}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    // Content-Type ve dosya adını al
    const contentType = response.headers.get("content-type") || "";
    const contentDisposition = response.headers.get("content-disposition") || "";
    
    // Dosya uzantısını belirle
    let fileExtension = ".pdf";
    let fileName = `assignment_${assignmentId}_${Date.now()}`;
    
    if (contentType.includes("image/jpeg")) fileExtension = ".jpg";
    else if (contentType.includes("image/png")) fileExtension = ".png";
    else if (contentType.includes("application/pdf")) fileExtension = ".pdf";
    else if (contentType.includes("application/msword")) fileExtension = ".doc";
    else if (contentType.includes("wordprocessingml")) fileExtension = ".docx";
    else if (contentType.includes("application/zip")) fileExtension = ".zip";
    else if (contentType.includes("x-rar-compressed")) fileExtension = ".rar";
    
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
      throw new Error("Dosya boş veya indirilemedi. Lütfen tekrar deneyin.");
    }

    // Dosyayı indir
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
    console.error("[handleAssignmentFileDownload] ❌ Hata:", error);
    const errorMessage = error.message || "Dosya indirilemedi. Lütfen tekrar deneyin.";
    showToast(`❌ ${errorMessage}`, true);
  }
};

// Grup Yönetimi Fonksiyonları
const openGroupManagementModal = async (assignmentId, assignmentTitle) => {
  const modal = document.getElementById("groupManagementModal");
  const modalTitle = document.getElementById("groupModalTitle");
  const modalContent = document.getElementById("groupManagementContent");
  
  if (!modal || !modalTitle || !modalContent) {
    showToast("Grup yönetimi modal'ı bulunamadı", true);
    return;
  }
  
  modalTitle.textContent = `Grup Yönetimi - ${assignmentTitle}`;
  modalContent.innerHTML = "<p>Yükleniyor...</p>";
  modal.classList.remove("hidden");
  
  try {
    // Öğrencinin grubunu kontrol et
    const myGroupResponse = await apiFetch(`/Group/my-group/${assignmentId}`);
    const myGroup = myGroupResponse?.data || myGroupResponse;
    
    // Müsait öğrencileri getir
    const availableStudentsResponse = await apiFetch(`/Group/available-students/${assignmentId}`);
    const availableStudents = availableStudentsResponse?.data || availableStudentsResponse || [];
    
    if (myGroup && myGroup.id) {
      // Grup var - grup yönetimi göster
      await renderGroupManagement(assignmentId, myGroup, availableStudents);
    } else {
      // Grup yok - grup oluşturma göster
      await renderGroupCreation(assignmentId, availableStudents);
    }
  } catch (error) {
    console.error("[openGroupManagementModal] Hata:", error);
    const errorMessage = error.message || "Grup bilgileri yüklenemedi";
    modalContent.innerHTML = `<p style="color: red; padding: 1rem;">❌ Hata: ${errorMessage}</p>`;
    showToast(`Grup yönetimi açılırken hata oluştu: ${errorMessage}`, true);
  }
};

const renderGroupCreation = async (assignmentId, availableStudents) => {
  const modalContent = document.getElementById("groupManagementContent");
  const user = getAuthUser();
  const currentStudentId = user?.id || user?.Id;
  
  const unassignedStudents = availableStudents.filter(s => !s.isInGroup || !s.IsInGroup);
  
  modalContent.innerHTML = `
    <div style="padding: 1rem;">
      <h4>Yeni Grup Oluştur</h4>
      <p style="color: #666; margin-bottom: 1rem;">Grup oluşturduğunuzda otomatik olarak grup lideri olursunuz.</p>
      
      <form id="createGroupForm">
        <div class="form-group">
          <label for="groupNameInput">Grup Adı *</label>
          <input type="text" id="groupNameInput" placeholder="Örn: Grup 1" required>
        </div>
        
        <div class="form-group">
          <label>Grup Üyeleri Seçin</label>
          <div id="availableStudentsList" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem;">
            ${unassignedStudents.length === 0 ? 
              '<p style="color: #666; padding: 1rem; text-align: center;">Tüm öğrenciler zaten bir grupta</p>' :
              unassignedStudents.map(student => `
                <label style="display: flex; align-items: center; padding: 0.5rem; cursor: pointer; border-bottom: 1px solid #eee;">
                  <input type="checkbox" name="memberIds" value="${student.studentId || student.StudentId}" style="margin-right: 0.5rem;">
                  <div>
                    <strong>${student.studentName || student.StudentName}</strong>
                    ${student.studentNumber || student.StudentNumber ? `<small style="color: #666;"> (${student.studentNumber || student.StudentNumber})</small>` : ''}
                  </div>
                </label>
              `).join('')
            }
          </div>
        </div>
        
        <div id="createGroupResult"></div>
        <div class="modal-actions">
          <button type="button" onclick="closeGroupModal()" class="btn-secondary">İptal</button>
          <button type="submit" class="btn-primary">Grup Oluştur</button>
        </div>
      </form>
    </div>
  `;
  
  const form = document.getElementById("createGroupForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleCreateGroup(assignmentId);
    });
  }
};

const renderGroupManagement = async (assignmentId, myGroup, availableStudents) => {
  const modalContent = document.getElementById("groupManagementContent");
  const user = getAuthUser();
  const currentStudentId = user?.id || user?.Id;
  const isLeader = myGroup.leaderStudentId === currentStudentId || myGroup.LeaderStudentId === currentStudentId;
  
  const members = myGroup.members || myGroup.Members || [];
  const unassignedStudents = availableStudents.filter(s => !s.isInGroup || !s.IsInGroup);
  
  modalContent.innerHTML = `
    <div style="padding: 1rem;">
      <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <h4 style="margin: 0 0 0.5rem 0;">Grup: ${myGroup.groupName || myGroup.GroupName}</h4>
        <p style="margin: 0; color: #666;">
          Lider: <strong>${myGroup.leaderName || myGroup.LeaderName}</strong>
          ${isLeader ? '<span style="background: #4CAF50; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem; margin-left: 0.5rem;">Siz</span>' : ''}
        </p>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h5>Grup Üyeleri</h5>
        <div id="groupMembersList" style="border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem;">
          ${members.map(member => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid #eee;">
              <div>
                <strong>${member.studentName || member.StudentName}</strong>
                ${member.isLeader || member.IsLeader ? '<span style="background: #ff9800; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem; margin-left: 0.5rem;">Lider</span>' : ''}
                ${member.studentNumber || member.StudentNumber ? `<small style="color: #666; display: block; margin-top: 0.25rem;">${member.studentNumber || member.StudentNumber}</small>` : ''}
              </div>
              ${isLeader && !(member.isLeader || member.IsLeader) && !(myGroup.hasSubmission || myGroup.HasSubmission) ? 
                `<button onclick="handleRemoveGroupMember(${myGroup.id || myGroup.Id}, ${member.studentId || member.StudentId})" 
                         style="background: #f44336; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                  Çıkar
                </button>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      
      ${isLeader && !(myGroup.hasSubmission || myGroup.HasSubmission) ? `
        <div>
          <h5>Üye Ekle</h5>
          <div id="availableStudentsList" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem; margin-bottom: 1rem;">
            ${unassignedStudents.length === 0 ? 
              '<p style="color: #666; padding: 1rem; text-align: center;">Eklenebilecek öğrenci yok</p>' :
              unassignedStudents.map(student => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #eee;">
                  <div>
                    <strong>${student.studentName || student.StudentName}</strong>
                    ${student.studentNumber || student.StudentNumber ? `<small style="color: #666;"> (${student.studentNumber || student.StudentNumber})</small>` : ''}
                  </div>
                  <button onclick="handleAddGroupMember(${myGroup.id || myGroup.Id}, ${student.studentId || student.StudentId})" 
                          style="background: #4CAF50; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                    Ekle
                  </button>
                </div>
              `).join('')
            }
          </div>
        </div>
      ` : isLeader && (myGroup.hasSubmission || myGroup.HasSubmission) ? `
        <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
          <p style="color: #856404; margin: 0; font-weight: bold;">⚠️ Ödev teslim edildikten sonra grup üyesi eklenemez veya çıkarılamaz.</p>
        </div>
      ` : ''}
      
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 0.9rem;">
          ${isLeader ? 
            '💡 Grup lideri olarak üye ekleyip çıkarabilirsiniz. Ödev teslimini sadece siz yapabilirsiniz.' :
            '💡 Grup üyesisiniz. Ödev teslimini grup lideri yapacaktır.'}
        </p>
      </div>
      
      <div class="modal-actions" style="margin-top: 1rem;">
        <button type="button" onclick="closeGroupModal()" class="btn-secondary">Kapat</button>
      </div>
    </div>
  `;
};

const handleCreateGroup = async (assignmentId) => {
  const groupNameInput = document.getElementById("groupNameInput");
  const resultDiv = document.getElementById("createGroupResult");
  const form = document.getElementById("createGroupForm");
  
  if (!groupNameInput || !form) return;
  
  const groupName = groupNameInput.value.trim();
  if (!groupName) {
    showToast("Grup adı gerekli", true);
    return;
  }
  
  const checkboxes = form.querySelectorAll('input[name="memberIds"]:checked');
  const memberIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
  
  try {
    const response = await apiFetch("/Group/create", {
      method: "POST",
      body: {
        assignmentId: parseInt(assignmentId),
        groupName: groupName,
        memberIds: memberIds
      }
    });
    
    showToast("✅ Grup başarıyla oluşturuldu! Artık grup liderisiniz.");
    closeGroupModal();
    
    // Ödev listesini yenile
    await loadStudentAssignments();
  } catch (error) {
    console.error("[handleCreateGroup] Hata:", error);
    const errorMessage = error.message || "Grup oluşturulamadı";
    if (resultDiv) {
      resultDiv.innerHTML = `<p style="color: red; padding: 1rem;">❌ ${errorMessage}</p>`;
    }
    showToast(`Grup oluşturulurken hata oluştu: ${errorMessage}`, true);
  }
};

const handleAddGroupMember = async (groupId, studentId) => {
  try {
    await apiFetch(`/Group/${groupId}/add-member`, {
      method: "POST",
      body: {
        studentId: studentId
      }
    });
    
    showToast("✅ Üye başarıyla eklendi");
    
    // Modal'ı yenile
    const assignmentId = assignmentsState.assignments.find(a => {
      // Grup bilgisini almak için assignment'ı bul
      return true; // Geçici çözüm
    });
    
    // Modal'ı kapat ve yeniden aç
    closeGroupModal();
    // Assignment ID'yi bulmak için state'i kontrol et
    const currentAssignment = assignmentsState.assignments.find(a => {
      // Bu geçici bir çözüm, daha iyi bir yol bulunabilir
      return true;
    });
    
    if (currentAssignment) {
      await openGroupManagementModal(currentAssignment.id || currentAssignment.Id, currentAssignment.title || currentAssignment.Title);
    }
  } catch (error) {
    console.error("[handleAddGroupMember] Hata:", error);
    const errorMessage = error.message || "Üye eklenemedi";
    showToast(`Üye eklenirken hata oluştu: ${errorMessage}`, true);
  }
};

const handleRemoveGroupMember = async (groupId, studentId) => {
  if (!confirm("Bu üyeyi gruptan çıkarmak istediğinizden emin misiniz?")) {
    return;
  }
  
  try {
    await apiFetch(`/Group/${groupId}/remove-member`, {
      method: "POST",
      body: {
        studentId: studentId
      }
    });
    
    showToast("✅ Üye başarıyla çıkarıldı");
    
    // Modal'ı yenile
    const currentAssignment = assignmentsState.assignments.find(a => {
      return true; // Geçici çözüm
    });
    
    if (currentAssignment) {
      closeGroupModal();
      await openGroupManagementModal(currentAssignment.id || currentAssignment.Id, currentAssignment.title || currentAssignment.Title);
    }
  } catch (error) {
    console.error("[handleRemoveGroupMember] Hata:", error);
    const errorMessage = error.message || "Üye çıkarılamadı";
    showToast(`Üye çıkarılırken hata oluştu: ${errorMessage}`, true);
  }
};

const closeGroupModal = () => {
  const modal = document.getElementById("groupManagementModal");
  if (modal) {
    modal.classList.add("hidden");
  }
};

window.openGroupManagementModal = openGroupManagementModal;
window.closeGroupModal = closeGroupModal;
window.handleAddGroupMember = handleAddGroupMember;
window.handleRemoveGroupMember = handleRemoveGroupMember;

// Modal kapatma event'leri
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("closeGroupModal");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeGroupModal);
  }
  
  const modal = document.getElementById("groupManagementModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeGroupModal();
      }
    });
  }
});

// Grup ödevi için lider kontrolü ve UI güncelleme
const checkAndUpdateGroupAssignmentUI = async (assignmentId) => {
  try {
    const myGroupResponse = await apiFetch(`/Group/my-group/${assignmentId}`);
    const myGroup = myGroupResponse?.data || myGroupResponse;
    const user = getAuthUser();
    const currentStudentId = user?.id || user?.Id;
    
    const groupManagementSection = document.getElementById(`groupManagementSection_${assignmentId}`);
    const submitBtn = document.getElementById(`submitBtn_${assignmentId}`);
    
    if (myGroup && myGroup.id) {
      // Grup var - lider kontrolü yap
      const isLeader = myGroup.leaderStudentId === currentStudentId || myGroup.LeaderStudentId === currentStudentId;
      
      if (!isLeader) {
        // Lider değil - grup yönetimi ve teslim butonlarını gizle
        if (groupManagementSection) {
          groupManagementSection.style.display = "none";
        }
        if (submitBtn) {
          submitBtn.style.display = "none";
        }
      } else {
        // Lider - butonları göster
        if (groupManagementSection) {
          groupManagementSection.style.display = "block";
        }
        if (submitBtn) {
          submitBtn.style.display = "block";
        }
      }
    } else {
      // Grup yok - grup yönetimi butonunu göster, teslim butonunu gizle
      if (groupManagementSection) {
        groupManagementSection.style.display = "block";
      }
      if (submitBtn) {
        submitBtn.style.display = "none"; // Grup yoksa teslim edemez
      }
    }
  } catch (error) {
    console.error("[checkAndUpdateGroupAssignmentUI] Hata:", error);
    // Hata durumunda butonları göster (varsayılan)
    // Kullanıcıya hata mesajı gösterme - sessizce devam et
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const page = assignmentsSelectors.page();
  if (!page) {
    console.warn("[assignments.js] Assignments page bulunamadı!");
    return;
  }
  
  console.log("[assignments.js] DOMContentLoaded - Sayfa başlatılıyor...");
  
  // initAssignmentsPage'i çalıştır
  initAssignmentsPage().catch(error => {
    console.error("[assignments.js] initAssignmentsPage hatası:", error);
    showToast("Sayfa yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.", true);
    
    // Hata durumunda bile section'ları göstermeyi dene
    const user = getAuthUser();
    if (user) {
      const role = (user.role || "").toLowerCase();
      const studentSection = assignmentsSelectors.studentSection();
      const teacherSection = assignmentsSelectors.teacherSection();
      
      if (role === "student" && studentSection) {
        showSection(studentSection);
      } else if ((role === "instructor" || role === "admin") && teacherSection) {
        showSection(teacherSection);
      }
    }
  });
});
