// Sınıf Yönetimi Modülü

const classManagementState = {
  classes: [],
  selectedClassId: null,
  students: [],
  allStudents: [] // Tüm öğrenciler (arama için)
};

const classManagementSelectors = {
  page: () => document.getElementById("classManagementPage"),
  teacherName: () => document.getElementById("teacherName"),
  logoutButton: () => document.getElementById("logoutButton"),
  classSelect: () => document.getElementById("classSelectForManagement"),
  loadStudentsBtn: () => document.getElementById("loadClassStudents"),
  studentsSection: () => document.getElementById("studentsSection"),
  enrollSection: () => document.getElementById("enrollSection"),
  classInfo: () => document.getElementById("classInfo"),
  studentsList: () => document.getElementById("studentsList"),
  studentIdInput: () => document.getElementById("studentIdInput"),
  studentSearchInput: () => document.getElementById("studentSearchInput"),
  studentSearchResults: () => document.getElementById("studentSearchResults"),
  enrollBtn: () => document.getElementById("enrollStudentBtn"),
  unenrollBtn: () => document.getElementById("unenrollStudentBtn"),
  enrollResult: () => document.getElementById("enrollResult"),
  allClasses: () => document.getElementById("allClasses")
};

const requireInstructorRoleClassMgmt = () => {
  const user = getAuthUser();
  if (!user) {
    throw new Error("Lütfen giriş yapın");
  }
  if ((user.role || "").toLowerCase() !== "instructor" && (user.role || "").toLowerCase() !== "admin") {
    throw new Error("Bu sayfa sadece öğretmenler içindir");
  }
  return user;
};

const classMgmtHandleUnauthorized = (error) => {
  if (error?.status === 401) {
    showToast("Oturumunuzun süresi doldu, lütfen tekrar giriş yapın.", true);
    clearAuthSession();
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
    return true;
  }
  return false;
};

// populateClassSelect artık kullanılmıyor - sınıflar kart olarak gösterilecek

const renderClassInfo = (classData) => {
  const container = classManagementSelectors.classInfo();
  if (!container) return;

  container.innerHTML = `
    <div class="class-info-card">
      <h3>${classData.courseCode} - ${classData.className}</h3>
      <div class="class-details">
        <p><strong>Sınıf Kodu:</strong> ${classData.classCode || "-"}</p>
        <p><strong>Dönem:</strong> ${classData.semester}</p>
        <p><strong>Öğretmen:</strong> ${classData.instructorName}</p>
        <p><strong>Kontenjan:</strong> ${classData.currentEnrollment}/${classData.maxCapacity}</p>
      </div>
    </div>
  `;
};

const renderStudentsList = (students = []) => {
  const container = classManagementSelectors.studentsList();
  if (!container) return;

  if (!students.length) {
    container.innerHTML = "<p>Bu sınıfta henüz öğrenci bulunmuyor.</p>";
    return;
  }

  container.innerHTML = `
    <div class="students-grid">
      ${students
        .map(
          (student) => {
            const studentId = student.id || student.Id;
            const firstName = student.firstName || student.FirstName || "";
            const lastName = student.lastName || student.LastName || "";
            const email = student.email || student.Email || "";
            const studentNumber = student.studentNumber || student.StudentNumber;
            const department = student.department || student.Department;
            
            return `
            <div class="student-card">
              <div class="student-avatar">👤</div>
              <div class="student-info">
                <h4>${firstName} ${lastName}</h4>
                <p class="student-email">${email}</p>
                ${studentNumber ? `<p class="student-number">No: ${studentNumber}</p>` : ""}
                ${department ? `<p class="student-dept">${department}</p>` : ""}
              </div>
              <button class="btn-small danger-btn" 
                      onclick="handleUnenrollStudentById(${studentId}, '${firstName} ${lastName}')"
                      style="margin-top: 0.5rem; padding: 0.5rem 1rem; font-size: 0.85rem;">
                Sınıftan Çıkar
              </button>
            </div>
          `;
          }
        )
        .join("")}
    </div>
  `;
};

// Öğrenci ID ile direkt çıkarma fonksiyonu
const handleUnenrollStudentById = async (studentId, studentName) => {
  const classId = classManagementState.selectedClassId;
  
  if (!classId) {
    showToast("Önce bir sınıf seçin", true);
    return;
  }

  if (!studentId || isNaN(studentId)) {
    console.error("[handleUnenrollStudentById] Geçersiz öğrenci ID:", studentId);
    showToast("Geçerli bir öğrenci ID bulunamadı", true);
    return;
  }

  console.log("[handleUnenrollStudentById] Öğrenci çıkarılıyor:", { studentId, studentName, classId });

  const confirmed = confirm(`"${studentName}" adlı öğrenciyi sınıftan çıkarmak istediğinizden emin misiniz?`);
  if (!confirmed) return;

  const resultContainer = classManagementSelectors.enrollResult();

  try {
    const response = await apiFetch(`/Class/${classId}/unenroll`, {
      method: "POST",
      body: { StudentId: studentId } // Backend DTO'da PascalCase bekliyor
    });
    
    console.log("[handleUnenrollStudentById] Başarılı response:", response);

    showToast("Öğrenci sınıftan çıkarıldı");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:orange'>Öğrenci sınıftan çıkarıldı.</p>";
    }
    
    // Listeyi yenile
    await loadClassStudentsById(classId);
    
    // Input'u temizle
    const input = classManagementSelectors.studentIdInput();
    const searchInput = classManagementSelectors.studentSearchInput();
    if (input) input.value = "";
    if (searchInput) searchInput.value = "";
  } catch (error) {
    if (classMgmtHandleUnauthorized(error)) return;
    
    let errorMessage = error.message || "Öğrenci çıkarılamadı";
    console.error("[handleUnenrollStudentById] Hata detayları:", {
      error,
      message: error.message,
      response: error.response,
      studentId,
      classId
    });
    
    // Backend'den gelen hata mesajını parse et
    if (error.response?.message) {
      errorMessage = error.response.message;
    } else if (error.response?.errors && Array.isArray(error.response.errors)) {
      errorMessage = error.response.errors.join(", ");
    }
    
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red'>${errorMessage}</p>`;
    }
    showToast(errorMessage, true);
  }
};

// Global scope'a ekle
window.handleUnenrollStudentById = handleUnenrollStudentById;

const renderAllClasses = (classes = []) => {
  const container = classManagementSelectors.allClasses();
  if (!container) return;

  if (!classes.length) {
    container.innerHTML = "<p>Henüz sınıf oluşturmadınız.</p>";
    return;
  }

  container.innerHTML = classes
    .map(
      (cls) => `
      <div class="assignment-card class-card-clickable" 
           data-class-id="${cls.id}"
           style="cursor: pointer; transition: all 0.3s ease;"
           onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.2)';"
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';">
        <strong>${cls.courseCode} - ${cls.className}</strong>
        <p>${cls.courseName}</p>
        <p><small>Kod: ${cls.classCode || "-"}</small></p>
        <p><small>Dönem: ${cls.semester}</small></p>
        <p><small>Öğrenci: ${cls.currentEnrollment}/${cls.maxCapacity}</small></p>
      </div>
    `
    )
    .join("");
  
  // Sınıf kartlarına tıklama event'i ekle
  container.querySelectorAll(".class-card-clickable").forEach(card => {
    card.addEventListener("click", () => {
      const classId = parseInt(card.getAttribute("data-class-id"), 10);
      if (classId) {
        loadClassStudentsById(classId);
      }
    });
  });
};

const loadTeacherClasses = async () => {
  const allClassesContainer = classManagementSelectors.allClasses();

  try {
    const response = await apiFetch("/Class/my-classes");
    // apiFetch zaten normalize ediyor
    classManagementState.classes = Array.isArray(response) ? response : [];
    renderAllClasses(classManagementState.classes);
  } catch (error) {
    if (classMgmtHandleUnauthorized(error)) return;
    if (allClassesContainer) {
      allClassesContainer.innerHTML = `<p style="color:red">${error.message}</p>`;
    }
  }
};

const loadAllStudents = async () => {
  try {
    // Tüm öğrencileri yükle (arama için)
    const students = await apiFetch("/User/students");
    classManagementState.allStudents = Array.isArray(students) ? students : [];
  } catch (error) {
    console.error("Öğrenciler yüklenemedi:", error);
    classManagementState.allStudents = [];
  }
};

const loadClassStudentsById = async (classId) => {
  if (!classId) {
    showToast("Geçersiz sınıf ID", true);
    return;
  }

  classManagementState.selectedClassId = classId;
  const selectedClass = classManagementState.classes.find((c) => c.id === classId);

  const studentsSection = classManagementSelectors.studentsSection();
  const enrollSection = classManagementSelectors.enrollSection();
  const container = classManagementSelectors.studentsList();

  if (studentsSection) studentsSection.style.display = "block";
  if (enrollSection) enrollSection.style.display = "block";

  if (selectedClass) {
    renderClassInfo(selectedClass);
  }

  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    // Enrollment'ları al
    const enrollments = await apiFetch(`/Class/${classId}/enrollments`);
    classManagementState.students = Array.isArray(enrollments) ? enrollments : [];
    renderStudentsList(classManagementState.students);
    showToast("Öğrenci listesi yüklendi");
    
    // Tüm öğrencileri de yükle (arama için)
    await loadAllStudents();
  } catch (error) {
    if (classMgmtHandleUnauthorized(error)) return;
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message || "Öğrenciler yüklenemedi"}</p>`;
    }
    showToast(error.message || "Öğrenciler yüklenemedi", true);
  }
};

// Eski fonksiyon - geriye uyumluluk için
const loadClassStudents = async () => {
  // Bu fonksiyon artık kullanılmıyor, sınıflar kart olarak tıklanıyor
  showToast("Lütfen bir sınıf kartına tıklayın", true);
};

const handleStudentSearch = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim() === "") {
    const resultsDiv = classManagementSelectors.studentSearchResults();
    if (resultsDiv) resultsDiv.style.display = "none";
    return;
  }

  // Öğrenciler yüklenmemişse yükle
  if (classManagementState.allStudents.length === 0) {
    await loadAllStudents();
  }

  const searchLower = searchTerm.toLowerCase().trim();
  const resultsDiv = classManagementSelectors.studentSearchResults();
  const hiddenInput = classManagementSelectors.studentIdInput();
  
  // ID olarak mı kontrol et
  const parsedId = parseInt(searchTerm, 10);
  let foundStudents = [];
  
  if (!isNaN(parsedId) && parsedId > 0) {
    // ID ile arama
    foundStudents = classManagementState.allStudents.filter(s => s.id === parsedId);
  } else {
    // İsim ile arama
    foundStudents = classManagementState.allStudents.filter(student => {
      const fullName = ((student.firstName || "") + " " + (student.lastName || "")).toLowerCase();
      const email = (student.email || "").toLowerCase();
      const studentNumber = (student.studentNumber || "").toLowerCase();
      
      return fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             studentNumber.includes(searchLower);
    });
  }

  if (resultsDiv) {
    if (foundStudents.length === 0) {
      resultsDiv.style.display = "none";
      if (hiddenInput) hiddenInput.value = "";
    } else {
      resultsDiv.innerHTML = foundStudents.slice(0, 5).map(student => `
        <div class="student-search-item" 
             style="padding: 0.75rem; cursor: pointer; border-bottom: 1px solid #eee;"
             onclick="selectStudent(${student.id}, '${(student.firstName || "")} ${(student.lastName || "")}')"
             onmouseover="this.style.background='#f5f5f5'" 
             onmouseout="this.style.background='white'">
          <strong>${student.firstName || ""} ${student.lastName || ""}</strong>
          <div style="font-size: 0.85rem; color: #666;">${student.email || ""} ${student.studentNumber ? `(${student.studentNumber})` : ""}</div>
        </div>
      `).join("");
      resultsDiv.style.display = "block";
    }
  }
};

const selectStudent = (studentId, studentName) => {
  const searchInput = classManagementSelectors.studentSearchInput();
  const hiddenInput = classManagementSelectors.studentIdInput();
  const resultsDiv = classManagementSelectors.studentSearchResults();
  
  if (hiddenInput) hiddenInput.value = studentId;
  if (searchInput) searchInput.value = studentName;
  if (resultsDiv) resultsDiv.style.display = "none";
};

window.selectStudent = selectStudent;

const handleEnrollStudent = async () => {
  const studentId = parseInt(classManagementSelectors.studentIdInput()?.value || "", 10);
  const classId = classManagementState.selectedClassId;
  const resultContainer = classManagementSelectors.enrollResult();

  if (!classId) {
    showToast("Önce bir sınıf seçin", true);
    return;
  }

  if (!studentId || isNaN(studentId)) {
    showToast("Lütfen öğrenci seçin (arama yapıp listeden seçin)", true);
    return;
  }

  const btn = classManagementSelectors.enrollBtn();
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Ekleniyor...";
  }

  try {
    await apiFetch(`/Class/${classId}/enroll`, {
      method: "POST",
      body: { StudentId: studentId }
    });

    showToast("Öğrenci sınıfa eklendi");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green'>Öğrenci başarıyla eklendi.</p>";
    }
    
    // Listeyi yenile - seçili sınıfın öğrencilerini tekrar yükle
    if (classId) {
      await loadClassStudentsById(classId);
    }
    
    // Input'u temizle
    const input = classManagementSelectors.studentIdInput();
    const searchInput = classManagementSelectors.studentSearchInput();
    if (input) input.value = "";
    if (searchInput) searchInput.value = "";
  } catch (error) {
    if (classMgmtHandleUnauthorized(error)) return;
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red'>${error.message}</p>`;
    }
    showToast(error.message || "Öğrenci eklenemedi", true);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Sınıfa Ekle";
    }
  }
};

const handleUnenrollStudent = async () => {
  const studentId = parseInt(classManagementSelectors.studentIdInput()?.value || "", 10);
  const classId = classManagementState.selectedClassId;
  const resultContainer = classManagementSelectors.enrollResult();

  if (!classId) {
    showToast("Önce bir sınıf seçin", true);
    return;
  }

  if (!studentId) {
    showToast("Geçerli bir öğrenci ID girin", true);
    return;
  }

  const confirmed = confirm("Bu öğrenciyi sınıftan çıkarmak istediğinizden emin misiniz?");
  if (!confirmed) return;

  const btn = classManagementSelectors.unenrollBtn();
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Çıkarılıyor...";
  }

  try {
    await apiFetch(`/Class/${classId}/unenroll`, {
      method: "POST",
      body: { StudentId: studentId } // Backend DTO'da PascalCase bekliyor
    });

    showToast("Öğrenci sınıftan çıkarıldı");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:orange'>Öğrenci sınıftan çıkarıldı.</p>";
    }
    
    // Listeyi yenile
    await loadClassStudentsById(classId);
    
    // Input'u temizle
    const input = classManagementSelectors.studentIdInput();
    const searchInput = classManagementSelectors.studentSearchInput();
    if (input) input.value = "";
    if (searchInput) searchInput.value = "";
  } catch (error) {
    if (classMgmtHandleUnauthorized(error)) return;
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red'>${error.message}</p>`;
    }
    showToast(error.message || "Öğrenci çıkarılamadı", true);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Sınıftan Çıkar";
    }
  }
};

const updateTeacherWelcomeClassMgmt = () => {
  const user = getAuthUser();
  const nameEl = classManagementSelectors.teacherName();
  if (user && nameEl) {
    nameEl.textContent = `${user.fullName || user.email} - Sınıf Yönetimi`;
  }
};

const bindClassManagementEvents = () => {
  const logoutButton = classManagementSelectors.logoutButton();
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearAuthSession();
      window.location.href = "index.html";
    });
  }

  // "Öğrencileri Yükle" butonu artık kullanılmıyor - sınıf kartlarına tıklanıyor

  const enrollBtn = classManagementSelectors.enrollBtn();
  if (enrollBtn) {
    enrollBtn.addEventListener("click", handleEnrollStudent);
  }

  const unenrollBtn = classManagementSelectors.unenrollBtn();
  if (unenrollBtn) {
    unenrollBtn.addEventListener("click", handleUnenrollStudent);
  }

  // Öğrenci arama input'u
  const searchInput = classManagementSelectors.studentSearchInput();
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      const term = e.target.value;
      searchTimeout = setTimeout(() => {
        handleStudentSearch(term);
      }, 300);
    });

    // Input dışına tıklanınca sonuçları gizle
    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !classManagementSelectors.studentSearchResults()?.contains(e.target)) {
        const resultsDiv = classManagementSelectors.studentSearchResults();
        if (resultsDiv) resultsDiv.style.display = "none";
      }
    });
  }
};

const initClassManagement = async () => {
  try {
    requireInstructorRoleClassMgmt();
  } catch (error) {
    showToast(error.message, true);
    window.location.href = "index.html";
    return;
  }

  // Navigation menüsünü rol bazlı güncelle
  if (typeof updateNavigationByRole === "function") {
    updateNavigationByRole();
  }

  bindClassManagementEvents();
  updateTeacherWelcomeClassMgmt();
  await loadTeacherClasses();
};

document.addEventListener("DOMContentLoaded", () => {
  const page = classManagementSelectors.page();
  if (!page) return;
  initClassManagement();
  });
  