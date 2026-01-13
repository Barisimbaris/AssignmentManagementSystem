// Sınıf Yönetimi Modülü

const classManagementState = {
  classes: [],
  selectedClassId: null,
  students: [],
  allStudents: []
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

const renderClassInfo = (classData) => {
  const container = classManagementSelectors.classInfo();
  const mobileContainer = document.getElementById("classInfoMobile");
  const isMobile = window.innerWidth <= 768;
  const targetContainer = isMobile ? mobileContainer : container;
  
  if (!targetContainer) return;

  const courseCode = classData.courseCode || classData.CourseCode || "";
  const className = classData.className || classData.ClassName || "";
  const classCode = classData.classCode || classData.ClassCode || "-";
  const semester = classData.semester || classData.Semester || "";
  const instructorName = classData.instructorName || classData.InstructorName || "";
  const currentEnrollment = classData.currentEnrollment || classData.CurrentEnrollment || 0;
  const maxCapacity = classData.maxCapacity || classData.MaxCapacity || 0;

  const classInfoHTML = `
    <div class="class-info-card" style="background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #2196F3;">
      <h3 style="margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 700; color: #1976D2;">${courseCode} - ${className}</h3>
      <div class="class-details" style="display: grid; grid-template-columns: ${isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))'}; gap: 1rem;">
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <span style="font-size: 0.85rem; color: #666; font-weight: 500;">Sınıf Kodu:</span>
          <span style="font-size: 1rem; color: #333; font-weight: 600;">${classCode}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <span style="font-size: 0.85rem; color: #666; font-weight: 500;">Dönem:</span>
          <span style="font-size: 1rem; color: #333; font-weight: 600;">${semester}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <span style="font-size: 0.85rem; color: #666; font-weight: 500;">Öğretmen:</span>
          <span style="font-size: 1rem; color: #333; font-weight: 600;">${instructorName}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <span style="font-size: 0.85rem; color: #666; font-weight: 500;">Kontenjan:</span>
          <span style="font-size: 1rem; color: #333; font-weight: 600;">${currentEnrollment}/${maxCapacity}</span>
        </div>
      </div>
    </div>
  `;

  if (isMobile && mobileContainer) {
    mobileContainer.innerHTML = classInfoHTML;
    mobileContainer.style.display = "block";
  } else if (container) {
    container.innerHTML = classInfoHTML;
  }
};

const renderStudentsList = (students = []) => {
  const container = classManagementSelectors.studentsList();
  const desktopContainer = document.getElementById("studentsListDesktop");
  const isMobile = window.innerWidth <= 768;
  const targetContainer = isMobile ? container : (desktopContainer || container);
  
  if (!targetContainer) return;

  if (!students.length) {
    const emptyMessage = "<p style='padding: 1rem 1.5rem; color: #666; text-align: center;'>Bu sınıfta henüz öğrenci bulunmuyor.</p>";
    if (container) container.innerHTML = emptyMessage;
    if (desktopContainer) desktopContainer.innerHTML = emptyMessage;
    return;
  }

  if (isMobile) {
    if (container) {
      container.innerHTML = students
        .map((student) => {
          const studentId = student.id || student.Id;
          const firstName = student.firstName || student.FirstName || "";
          const lastName = student.lastName || student.LastName || "";
          const email = student.email || student.Email || "";
          const studentNumber = student.studentNumber || student.StudentNumber;
          const department = student.department || student.Department;
          const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "👤";
          
          return `
            <div class="student-item-mobile">
              <div class="student-avatar-mobile">${initials}</div>
              <div class="student-info-mobile">
                <div class="student-name-mobile">${firstName} ${lastName}</div>
                <div class="student-email-mobile">${email}</div>
                ${department ? `<div class="student-dept-mobile">${department}</div>` : ""}
              </div>
            </div>
          `;
        })
        .join("");
    }
    return;
  }

  const desktopHTML = `
    <div class="students-grid">
      ${students
        .map((student) => {
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
        })
        .join("")}
    </div>
  `;
  
  if (container) container.innerHTML = desktopHTML;
  if (desktopContainer) desktopContainer.innerHTML = desktopHTML;
};

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
    // Backend endpoint: /Class/{classId}/unenroll/{studentId} - URL parametrelerinden alıyor
    const response = await apiFetch(`/Class/${classId}/unenroll/${studentId}`, {
      method: "POST"
    });
    
    console.log("[handleUnenrollStudentById] Başarılı response:", response);

    showToast("Öğrenci sınıftan çıkarıldı");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:orange'>Öğrenci sınıftan çıkarıldı.</p>";
    }
    
    await loadClassStudentsById(classId);
    
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

window.handleUnenrollStudentById = handleUnenrollStudentById;

const renderAllClasses = (classes = []) => {
  const container = classManagementSelectors.allClasses();
  if (!container) return;

  if (!classes.length) {
    container.innerHTML = "<p>Henüz sınıf oluşturmadınız.</p>";
    return;
  }

  container.innerHTML = classes
    .map((cls) => `
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
    `)
    .join("");
  
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
  const mobileClassSelect = document.getElementById("mobileClassSelect");

  try {
    console.log("[loadTeacherClasses] Sınıflar API'den çekiliyor...");
    const response = await apiFetch("/Class/my-classes");
    
    const classes = Array.isArray(response) ? response : [];
    
    classManagementState.classes = classes;
    
    console.log(`[loadTeacherClasses] ✅ ${classManagementState.classes.length} sınıf yüklendi`);
    
    if (classManagementState.classes.length > 0) {
      console.log("[loadTeacherClasses] İlk sınıf:", classManagementState.classes[0]);
    }
    
    renderAllClasses(classManagementState.classes);
    
    if (mobileClassSelect) {
      mobileClassSelect.innerHTML = '<option value="">Sınıf seçiniz</option>';
      
      if (classManagementState.classes.length === 0) {
        const noClassOption = document.createElement("option");
        noClassOption.value = "";
        noClassOption.textContent = "Henüz sınıf bulunmuyor";
        noClassOption.disabled = true;
        mobileClassSelect.appendChild(noClassOption);
      } else {
        classManagementState.classes.forEach((cls) => {
          const option = document.createElement("option");
          option.value = cls.id || cls.Id || "";
          const courseCode = cls.courseCode || cls.CourseCode || "";
          const className = cls.className || cls.ClassName || "";
          option.textContent = courseCode && className ? `${courseCode} - ${className}` : (className || courseCode || "Sınıf");
          mobileClassSelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error("[loadTeacherClasses] Hata:", error);
    
    if (classMgmtHandleUnauthorized(error)) return;
    
    if (mobileClassSelect) {
      mobileClassSelect.innerHTML = '<option value="">Sınıflar yüklenemedi</option>';
    }
    
    const errorMessage = `<p style="padding: 1rem; color: #d32f2f; text-align: center;">❌ ${error.message || "Sınıflar yüklenemedi"}</p>`;
    if (allClassesContainer) {
      allClassesContainer.innerHTML = errorMessage;
    }
    throw error;
  }
};

const loadAllStudents = async () => {
  try {
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
  // classId hem string hem number olabilir, karşılaştırma için normalize et
  const selectedClass = classManagementState.classes.find((c) => {
    const cId = Number(c.id ?? c.Id);
    return !Number.isNaN(cId) && cId === Number(classId);
  });

  const studentsSection = classManagementSelectors.studentsSection();
  const enrollSection = classManagementSelectors.enrollSection();
  const container = classManagementSelectors.studentsList();

  if (studentsSection) studentsSection.style.display = "block";
  if (enrollSection) enrollSection.style.display = "block";

  if (selectedClass) {
    renderClassInfo(selectedClass);
    const studentsListTitle = document.getElementById("studentsListTitle");
    if (studentsListTitle) {
      studentsListTitle.style.display = "block";
    }
  }

  const desktopContainer = document.getElementById("studentsListDesktop");
  const loadingMessage = "<p style='padding: 1rem 1.5rem; color: #666; text-align: center;'>Yükleniyor...</p>";
  
  if (container) {
    container.innerHTML = loadingMessage;
  }
  if (desktopContainer) {
    desktopContainer.innerHTML = loadingMessage;
  }

  try {
    // Backend endpoint: /Class/{classId}/students
    const response = await apiFetch(`/Class/${classId}/students`);
    console.log("[loadClassStudentsById] API Response:", response);
    
    // Response'dan students array'ini çıkar
    let students = [];
    if (Array.isArray(response)) {
      students = response;
    } else if (response && Array.isArray(response.students)) {
      students = response.students;
    } else if (response && Array.isArray(response.Students)) {
      students = response.Students;
    } else if (response && response.data && Array.isArray(response.data)) {
      students = response.data;
    }
    
    classManagementState.students = students;
    
    console.log("[loadClassStudentsById] ✅ Yüklenen öğrenci sayısı:", students.length);
    
    renderStudentsList(classManagementState.students);
    
    if (classManagementState.students.length > 0) {
      showToast("Öğrenci listesi yüklendi");
    }
    
    await loadAllStudents();
  } catch (error) {
    if (classMgmtHandleUnauthorized(error)) return;
    const errorMessage = `<p style="padding: 1rem 1.5rem; color: #d32f2f; text-align: center;">❌ ${error.message || "Öğrenciler yüklenemedi"}</p>`;
    if (container) {
      container.innerHTML = errorMessage;
    }
    if (desktopContainer) {
      desktopContainer.innerHTML = errorMessage;
    }
    showToast(error.message || "Öğrenciler yüklenemedi", true);
  }
};

const handleStudentSearch = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim() === "") {
    const resultsDiv = classManagementSelectors.studentSearchResults();
    if (resultsDiv) resultsDiv.style.display = "none";
    return;
  }

  if (classManagementState.allStudents.length === 0) {
    await loadAllStudents();
  }

  const searchLower = searchTerm.toLowerCase().trim();
  const resultsDiv = classManagementSelectors.studentSearchResults();
  const hiddenInput = classManagementSelectors.studentIdInput();
  
  const parsedId = parseInt(searchTerm, 10);
  let foundStudents = [];
  
  if (!isNaN(parsedId) && parsedId > 0) {
    foundStudents = classManagementState.allStudents.filter(s => s.id === parsedId);
  } else {
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
    // Backend endpoint: /Class/{classId}/enroll/{studentId} - URL parametrelerinden alıyor
    await apiFetch(`/Class/${classId}/enroll/${studentId}`, {
      method: "POST"
    });

    showToast("Öğrenci sınıfa eklendi");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green'>Öğrenci başarıyla eklendi.</p>";
    }
    
    if (classId) {
      await loadClassStudentsById(classId);
    }
    
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
    // Backend endpoint: /Class/{classId}/unenroll/{studentId} - URL parametrelerinden alıyor
    await apiFetch(`/Class/${classId}/unenroll/${studentId}`, {
      method: "POST"
    });

    showToast("Öğrenci sınıftan çıkarıldı");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:orange'>Öğrenci sınıftan çıkarıldı.</p>";
    }
    
    await loadClassStudentsById(classId);
    
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

  const enrollBtn = classManagementSelectors.enrollBtn();
  if (enrollBtn) {
    enrollBtn.addEventListener("click", handleEnrollStudent);
  }

  const unenrollBtn = classManagementSelectors.unenrollBtn();
  if (unenrollBtn) {
    unenrollBtn.addEventListener("click", handleUnenrollStudent);
  }

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
    console.error("[initClassManagement] Yetki hatası:", error);
    showToast(error.message, true);
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  try {
    if (typeof updateNavigationByRole === "function") {
      updateNavigationByRole();
    }

    bindClassManagementEvents();
    updateTeacherWelcomeClassMgmt();
    
    console.log("[initClassManagement] Sınıflar yükleniyor...");
    await loadTeacherClasses();
    console.log("[initClassManagement] ✅ Sayfa başarıyla yüklendi");
    
    const mobileClassSelect = document.getElementById("mobileClassSelect");
    const studentsListTitle = document.getElementById("studentsListTitle");
    
    if (mobileClassSelect) {
      mobileClassSelect.addEventListener("change", async (e) => {
        const classId = parseInt(e.target.value);
        if (!classId || isNaN(classId)) {
          if (studentsListTitle) studentsListTitle.style.display = "none";
          const container = classManagementSelectors.studentsList();
          const desktopContainer = document.getElementById("studentsListDesktop");
          const resetMessage = "<p style='padding: 1rem 1.5rem; color: #666; text-align: center;'>Sınıf seçiniz</p>";
          if (container) container.innerHTML = resetMessage;
          if (desktopContainer) desktopContainer.innerHTML = resetMessage;
          
          const classInfoMobile = document.getElementById("classInfoMobile");
          if (classInfoMobile) classInfoMobile.style.display = "none";
          return;
        }
        
        try {
          await loadClassStudentsById(classId);
        } catch (error) {
          console.error("[mobileClassSelect] Öğrenci yükleme hatası:", error);
          showToast(error.message || "Öğrenciler yüklenemedi", true);
        }
      });
    }
  } catch (error) {
    console.error("[initClassManagement] Sayfa başlatma hatası:", error);
    throw error;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const page = classManagementSelectors.page();
  if (!page) {
    console.error("[classManagement] Sayfa elementi bulunamadı!");
    return;
  }
  
  console.log("[classManagement] Sayfa yükleniyor...");
  initClassManagement().catch((error) => {
    console.error("[classManagement] Sayfa başlatma hatası:", error);
    showToast(error.message || "Sayfa yüklenirken bir hata oluştu", true);
    
    if (error.message && (error.message.includes("giriş yapın") || error.message.includes("öğretmen"))) {
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    }
  });
});
