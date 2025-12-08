const dashboardState = {
  assignments: []
};

const selectors = {
  enrolledClassesList: () => document.getElementById("enrolledClassesList"),
  allClassesList: () => document.getElementById("allClassesList"),
  assignmentsList: () => document.getElementById("assignmentsList"),
  assignmentSelect: () => document.getElementById("selectAssignment"),
  submissionResult: () => document.getElementById("submissionResult"),
  submissionForm: () => document.getElementById("submissionForm"),
  welcomeText: () => document.getElementById("welcomeText"),
  logoutButton: () => document.getElementById("logoutButton")
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

const handleUnauthorized = (error) => {
  if (error?.status === 401) {
    showToast("Oturumunuzun süresi doldu, lütfen yeniden giriş yapın.", true);
    clearAuthSession();
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
    return true;
  }
  return false;
};

const renderEnrolledClasses = (classes = []) => {
  const container = selectors.enrolledClassesList();
  if (!container) return;

  if (!classes.length) {
    container.innerHTML = `
      <div style="padding: 1rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; color: #856404;">
        <p><strong>ℹ️ Henüz hiçbir sınıfa kayıtlı değilsiniz.</strong></p>
        <p style="margin-top: 0.5rem; font-size: 0.9em;">Sınıflara kayıt olmak için "Tüm Sınıflar" bölümünden bir sınıf seçip "Kayıt Ol" butonuna tıklayın.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = classes
    .map(
      (cls) => {
        const courseCode = cls.courseCode || cls.CourseCode || "";
        const className = cls.className || cls.ClassName || "";
        const instructorName = cls.instructorName || cls.InstructorName || "";
        const semester = cls.semester || cls.Semester || "";
        const currentEnrollment = cls.currentEnrollment || cls.CurrentEnrollment || 0;
        const maxCapacity = cls.maxCapacity || cls.MaxCapacity || 0;
        
        return `
        <div class="assignment-card">
          <strong>${courseCode} - ${className}</strong>
          <p><small>Öğretmen: ${instructorName}</small></p>
          <p><small>Dönem: ${semester}</small></p>
          <p><small>Kontenjan: ${currentEnrollment}/${maxCapacity}</small></p>
        </div>
      `;
      }
    )
    .join("");
};

const renderAllClasses = (classes = [], enrolledClassIds = []) => {
  const container = selectors.allClassesList();
  if (!container) return;

  if (!classes.length) {
    container.innerHTML = `
      <div style="padding: 1rem; background: #e7f3ff; border: 1px solid #2196F3; border-radius: 8px; color: #0d47a1;">
        <p><strong>ℹ️ Henüz hiçbir sınıf bulunmuyor.</strong></p>
        <p style="margin-top: 0.5rem; font-size: 0.9em;">Öğretmenler sınıf oluşturduğunda burada görünecektir.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = classes
    .map(
      (cls) => {
        const classId = cls.id || cls.Id;
        const courseCode = cls.courseCode || cls.CourseCode || "";
        const className = cls.className || cls.ClassName || "";
        const instructorName = cls.instructorName || cls.InstructorName || "";
        const semester = cls.semester || cls.Semester || "";
        const currentEnrollment = cls.currentEnrollment || cls.CurrentEnrollment || 0;
        const maxCapacity = cls.maxCapacity || cls.MaxCapacity || 0;
        
        const isEnrolled = enrolledClassIds.includes(classId);
        const isFull = currentEnrollment >= maxCapacity;
        
        return `
        <div class="assignment-card" style="${isEnrolled ? 'background: #e8f5e9;' : ''}">
          <strong>${courseCode} - ${className}</strong>
          <p><small>Öğretmen: ${instructorName}</small></p>
          <p><small>Dönem: ${semester}</small></p>
          <p><small>Kontenjan: ${currentEnrollment}/${maxCapacity}</small></p>
          ${isEnrolled ? 
            `<button onclick="handleUnenroll(${classId})" style="margin-top: 0.5rem; padding: 0.5rem; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Kayıttan Çık</button>` :
            (isFull ? 
              `<p style="color: red; margin-top: 0.5rem;">Sınıf Dolu</p>` :
              `<button onclick="handleEnroll(${classId})" style="margin-top: 0.5rem; padding: 0.5rem; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Kayıt Ol</button>`
            )
          }
        </div>
      `;
      }
    )
    .join("");
};

const renderAssignments = (assignments = []) => {
  const container = selectors.assignmentsList();
  if (!container) return;

  if (!assignments.length) {
    container.innerHTML = "<p>Aktif ödev bulunamadı.</p>";
    return;
  }

  container.innerHTML = assignments
    .map(
      (assignment) => `
        <div class="assignment-card">
          <strong>${assignment.title}</strong>
          <p>${assignment.description || "Açıklama bulunmuyor."}</p>
          <p><small>Son teslim: ${formatDate(assignment.dueDate)}</small></p>
          <p><small>Puan: ${assignment.maxScore ?? "-"}</small></p>
        </div>
      `
    )
    .join("");
};

const populateAssignmentSelect = (assignments = []) => {
  const select = selectors.assignmentSelect();
  if (!select) return;

  select.innerHTML = '<option value="">Ödev seçiniz</option>';
  assignments.forEach((assignment) => {
    const option = document.createElement("option");
    option.value = assignment.id;
    option.textContent = `${assignment.title} - ${formatDate(
      assignment.dueDate
    )}`;
    select.appendChild(option);
  });
};

const loadStudentEnrollments = async () => {
  const container = selectors.enrolledClassesList();
  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    console.log("[loadStudentEnrollments] Öğrenci kayıtlı sınıfları yükleniyor...");
    const response = await apiFetch("/Class/my-enrollments");
    console.log("[loadStudentEnrollments] API Response:", response);
    
    // apiFetch zaten normalize ediyor - direkt array gelmeli
    const classes = Array.isArray(response) ? response : [];
    
    console.log("[loadStudentEnrollments] ✅ Yüklenen sınıf sayısı:", classes.length);
    if (classes.length > 0) {
      console.log("[loadStudentEnrollments] İlk sınıf:", classes[0]);
    }
    
    renderEnrolledClasses(classes);
    return classes.map(c => c.id || c.Id);
  } catch (error) {
    console.error("[loadStudentEnrollments] ❌ Hata:", error);
    if (handleUnauthorized(error)) return [];
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message || "Sınıflar yüklenirken hata oluştu"}</p>`;
    }
    return [];
  }
};

const loadAllClasses = async (enrolledClassIds = []) => {
  const container = selectors.allClassesList();
  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    console.log("[loadAllClasses] Tüm sınıflar yükleniyor...");
    const response = await apiFetch("/Class");
    console.log("[loadAllClasses] API Response:", response);
    
    // apiFetch zaten normalize ediyor - direkt array gelmeli
    const allClasses = Array.isArray(response) ? response : [];
    
    console.log("[loadAllClasses] ✅ Yüklenen sınıf sayısı:", allClasses.length);
    
    renderAllClasses(allClasses, enrolledClassIds);
  } catch (error) {
    console.error("[loadAllClasses] ❌ Hata:", error);
    if (handleUnauthorized(error)) return;
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message || "Sınıflar yüklenirken hata oluştu"}</p>`;
    }
  }
};

const handleEnroll = async (classId) => {
  try {
    // Backend artık body gerektirmiyor, sadece POST isteği yeterli
    await apiFetch(`/Class/${classId}/enroll`, {
      method: "POST"
    });
    showToast("Sınıfa başarıyla kayıt oldunuz!");
    // Listeleri yenile
    const enrolledIds = await loadStudentEnrollments();
    await loadAllClasses(enrolledIds);
  } catch (error) {
    console.error("[handleEnroll] Hata:", error);
    const errorMessage = error.message || error.response?.message || "Kayıt olurken hata oluştu";
    showToast(errorMessage, true);
  }
};

const handleUnenroll = async (classId) => {
  if (!confirm("Bu sınıftan kayıttan çıkmak istediğinize emin misiniz?")) {
    return;
  }

  try {
    // Backend artık body gerektirmiyor, sadece POST isteği yeterli
    await apiFetch(`/Class/${classId}/unenroll`, {
      method: "POST"
    });
    showToast("Sınıftan başarıyla kayıttan çıktınız!");
    // Listeleri yenile
    const enrolledIds = await loadStudentEnrollments();
    await loadAllClasses(enrolledIds);
  } catch (error) {
    console.error("[handleUnenroll] Hata:", error);
    const errorMessage = error.message || error.response?.message || "Kayıttan çıkarken hata oluştu";
    showToast(errorMessage, true);
  }
};

// Global scope'a ekle
window.handleEnroll = handleEnroll;
window.handleUnenroll = handleUnenroll;

const loadStudentAssignments = async () => {
  const container = selectors.assignmentsList();
  if (!container) return;

  container.textContent = "Yükleniyor...";

  try {
    console.log("[loadStudentAssignments] Öğrenci ödevleri yükleniyor...");
    const response = await apiFetch("/Assignment/my-assignments");
    console.log("[loadStudentAssignments] API Response:", response);
    
    // apiFetch zaten normalize ediyor - direkt array gelmeli
    const assignments = Array.isArray(response) ? response : [];
    
    console.log("[loadStudentAssignments] ✅ Yüklenen ödev sayısı:", assignments.length);
    
    dashboardState.assignments = assignments;
    renderAssignments(assignments);
    populateAssignmentSelect(assignments);
  } catch (error) {
    console.error("[loadStudentAssignments] ❌ Hata:", error);
    if (handleUnauthorized(error)) return;
    container.innerHTML = `<p style="color:red">${error.message || "Ödevler yüklenirken hata oluştu"}</p>`;
  }
};

const submitAssignment = async (event) => {
  event.preventDefault();

  const form = selectors.submissionForm();
  if (!form) return;

  const assignmentId = selectors.assignmentSelect()?.value;
  const groupIdInput = document.getElementById("groupId")?.value.trim();
  const fileInput = document.getElementById("fileInput");
  const comments = document.getElementById("commentsInput")?.value.trim();
  const resultContainer = selectors.submissionResult();

  if (!assignmentId) {
    showToast("Lütfen bir ödev seçin", true);
    return;
  }

  if (!fileInput?.files?.length) {
    showToast("Lütfen yüklemek için bir dosya seçin", true);
    return;
  }

  // Grup ID'yi kontrol et - sadece geçerli bir sayı ise ekle
  let groupIdValue = null;
  if (groupIdInput && groupIdInput.trim() !== "") {
    const parsedGroupId = parseInt(groupIdInput.trim(), 10);
    if (!isNaN(parsedGroupId) && parsedGroupId > 0) {
      groupIdValue = parsedGroupId.toString();
    } else {
      showToast("Grup ID geçerli bir pozitif sayı olmalıdır. Boş bırakabilirsiniz.", true);
      return;
    }
  }

  const formData = new FormData();
  formData.append("assignmentId", assignmentId.toString());
  
  // Grup ID'yi sadece geçerli bir değer varsa ekle
  if (groupIdValue !== null) {
    formData.append("groupId", groupIdValue);
  }
  
  if (comments && comments.trim() !== "") {
    formData.append("comments", comments.trim());
  }
  
  formData.append("file", fileInput.files[0]);

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Gönderiliyor...";
  }

  try {
    console.log("[submitAssignment] Teslim gönderiliyor:", { assignmentId, groupId, hasFile: !!fileInput.files[0] });
    
    const response = await apiFetch("/Submission", {
      method: "POST",
      body: formData
    });

    showToast("✅ Ödev başarıyla teslim edildi!");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green; padding:1rem;'>✅ Tesliminiz başarıyla alındı.</p>";
    }
    form.reset();
    await loadStudentAssignments(); // Ödev listesini yenile
    return response;
  } catch (error) {
    console.error("[submitAssignment] ❌ Hata:", error);
    if (handleUnauthorized(error)) return;
    
    // Backend'den gelen hata mesajını parse et
    let errorMessage = "Teslim sırasında hata oluştu";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response?.errors) {
      // FluentValidation hataları
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
    } else if (error.response?.message) {
      errorMessage = error.response.message;
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

const bindDashboardEvents = () => {
  const form = selectors.submissionForm();
  if (form) {
    form.addEventListener("submit", submitAssignment);
  }

  const logoutButton = selectors.logoutButton();
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearAuthSession();
      window.location.href = "index.html";
    });
  }
};

const updateWelcomeMessage = async () => {
  const user = getAuthUser();
  const welcomeNameEl = document.getElementById("studentWelcomeName");
  const infoDetailsEl = document.getElementById("studentInfoDetails");
  
  if (user && welcomeNameEl) {
    welcomeNameEl.textContent = `👋 Hoş geldiniz, ${user.fullName || user.email}!`;
  }
  
  // Öğrenci bilgilerini yükle
  try {
    const enrollments = await apiFetch("/Class/my-enrollments");
    const classes = Array.isArray(enrollments) ? enrollments : [];
    
    if (infoDetailsEl) {
      const courseCount = classes.length;
      const courseNames = classes.map(c => c.courseName || c.CourseName || "Bilinmeyen Ders").slice(0, 5);
      
      infoDetailsEl.innerHTML = `
        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 10px;">
          <strong style="display: block; margin-bottom: 0.5rem;">📚 Toplam Sınıf</strong>
          <span style="font-size: 1.5rem; font-weight: bold;">${courseCount}</span>
        </div>
        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 10px;">
          <strong style="display: block; margin-bottom: 0.5rem;">🎓 Dersler</strong>
          <div style="font-size: 0.9rem;">
            ${courseNames.length > 0 ? courseNames.map(name => `<div>• ${name}</div>`).join("") : "Henüz ders yok"}
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Öğrenci bilgileri yüklenemedi:", error);
    if (infoDetailsEl) {
      infoDetailsEl.innerHTML = `<p>Bilgiler yüklenemedi.</p>`;
    }
  }
};

const initStudentDashboard = async () => {
  try {
    ensureAuthenticated();
    
    // Rol kontrolü - sadece öğrenci veya admin erişebilir
    const user = getAuthUser();
    const userRole = (user?.role || "").toLowerCase();
    
    if (userRole === "instructor") {
      showToast("Bu sayfa sadece öğrenciler içindir. Öğretmen paneline yönlendiriliyorsunuz...", false);
      setTimeout(() => {
        window.location.href = "teacher_dashboard.html";
      }, 1500);
      return;
    }
    
    if (userRole !== "student" && userRole !== "admin") {
      showToast("Bu sayfaya erişim yetkiniz yok", true);
      window.location.href = "login.html";
      return;
    }
    
    // Navigation menüsünü rol bazlı güncelle
    if (typeof updateNavigationByRole === "function") {
      updateNavigationByRole();
    }
  } catch (error) {
    showToast(error.message, true);
    window.location.href = "login.html";
    return;
  }

  bindDashboardEvents();
  
  // Önce kayıtlı sınıfları yükle, sonra tüm sınıfları yükle
  const enrolledIds = await loadStudentEnrollments();
  await Promise.all([loadAllClasses(enrolledIds), loadStudentAssignments()]);
  
  // Son olarak hoş geldin mesajını güncelle
  await updateWelcomeMessage();
};

document.addEventListener("DOMContentLoaded", () => {
  const dashboard = document.getElementById("studentDashboard");
  if (!dashboard) return;
  initStudentDashboard();
});
