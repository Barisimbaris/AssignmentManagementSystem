const teacherState = {
  courses: [],
  classes: [],
  weeklySchedule: [] // ✅ YENİ: Haftalık program için
};

const teacherSelectors = {
  dashboard: () => document.getElementById("teacherDashboard"),
  welcomeText: () => document.getElementById("teacherWelcomeText"),
  logoutButton: () => document.getElementById("teacherLogoutButton"),
  courseSelect: () => document.getElementById("courseSelect"),
  courseList: () => document.getElementById("teacherCourses"),
  classList: () => document.getElementById("teacherClasses"),
  createClassForm: () => document.getElementById("createClassForm"),
  createClassResult: () => document.getElementById("createClassResult"),
  classNameInput: () => document.getElementById("className"),
  classCodeInput: () => document.getElementById("classCode"),
  maxCapacityInput: () => document.getElementById("maxCapacity"),
  semesterInput: () => document.getElementById("semester"),
  teacherClassesList: () => document.getElementById("teacherClassesList"), // ✅ YENİ
  teacherWeeklySchedule: () => document.getElementById("teacherWeeklySchedule") // ✅ YENİ
};

const requireInstructorRole = () => {
  const user = getAuthUser();
  if (!user) {
    throw new Error("Lütfen giriş yapın");
  }
  if ((user.role || "").toLowerCase() !== "instructor" && (user.role || "").toLowerCase() !== "admin") {
    throw new Error("Bu sayfaya erişim yetkiniz yok");
  }
  return user;
};

const teacherHandleUnauthorized = (error) => {
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

const teacherFormatDate = (value) => {
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

/**
 * Öğretmenin sadece kendi sınıflarına ait ödevleri filtreler.
 * /Assignment endpoint'i tüm ödevleri döndürebildiği için,
 * burada teacherState.classes içindeki ClassId'lere göre süzüyoruz.
 */
const filterAssignmentsForCurrentTeacher = (allAssignments = []) => {
  try {
    const classIds = new Set(
      (teacherState.classes || []).map((c) => c.id || c.Id).filter((id) => !!id)
    );

    // Eğer öğretmenin sınıfı yoksa, backend zaten sadece yetkili olduğu ödevleri döndürüyor olabilir.
    // Bu durumda filtreleme yapmadan olduğu gibi dönüyoruz.
    if (!classIds.size) {
      return allAssignments;
    }

    return allAssignments.filter((a) => {
      const classId = a.classId || a.ClassId;
      return classId && classIds.has(classId);
    });
  } catch (e) {
    console.error("[filterAssignmentsForCurrentTeacher] Hata:", e);
    return allAssignments;
  }
};

const populateCourseSelect = (courses = []) => {
  // Tüm courseSelect elementlerini bul (mobil ve desktop için)
  const selects = document.querySelectorAll('#courseSelect');
  if (!selects || selects.length === 0) {
    console.warn("[populateCourseSelect] courseSelect elementi bulunamadı!");
    // Bir süre sonra tekrar dene (modal henüz render olmamış olabilir)
    setTimeout(() => {
      const retrySelects = document.querySelectorAll('#courseSelect');
      if (retrySelects.length > 0 && courses.length > 0) {
        console.log("[populateCourseSelect] Retry: Select'ler bulundu, dolduruluyor...");
        populateCourseSelect(courses);
      }
    }, 200);
    return;
  }
  
  console.log(`[populateCourseSelect] ${selects.length} adet courseSelect bulundu, ${courses.length} ders dolduruluyor`);
  
  if (courses.length === 0) {
    console.warn("[populateCourseSelect] Ders listesi boş!");
    selects.forEach((select) => {
      select.innerHTML = '<option value="">Ders bulunamadı</option>';
    });
    return;
  }
  
  selects.forEach((select, index) => {
    // Mevcut seçimi temizle
    select.innerHTML = '<option value="">Ders seçiniz</option>';
    
    courses.forEach((course) => {
      const option = document.createElement("option");
      const courseId = course.id || course.Id || course.courseId || course.CourseId;
      const courseCode = course.courseCode || course.CourseCode || "Kod";
      const courseName = course.courseName || course.CourseName || "İsimsiz";
      
      option.value = courseId;
      option.textContent = `${courseCode} - ${courseName}`;
      select.appendChild(option);
    });
    
    console.log(`[populateCourseSelect] Select ${index} dolduruldu: ${select.options.length} seçenek`);
  });
  
  // Kontrol: Tüm select'lerin dolu olduğunu doğrula
  const allPopulated = Array.from(selects).every(select => select.options.length > 1);
  if (!allPopulated) {
    console.warn("[populateCourseSelect] Bazı select'ler doldurulamadı! Tekrar deneniyor...");
    setTimeout(() => {
      if (courses.length > 0) {
        populateCourseSelect(courses);
      }
    }, 100);
  }
};

const loadTeacherCourses = async () => {
  const selects = document.querySelectorAll('#courseSelect');
  const container = teacherSelectors.courseList();
  
  selects.forEach(select => {
    if (select) {
      select.innerHTML = '<option value="">Dersler yükleniyor...</option>';
    }
  });
  
  if (container) {
    container.textContent = "Yükleniyor...";
  }
  
  try {
    // Öğretmenin sadece kendi derslerini getir
    console.log("[loadTeacherCourses] Dersler yükleniyor...");
    const response = await apiFetch("/Course/my-courses");
    console.log("[loadTeacherCourses] API Response:", response);
    
    // Result<T> wrapper'ından data'yı çıkar
    let courses = [];
    if (Array.isArray(response)) {
      courses = response;
    } else if (response?.data && Array.isArray(response.data)) {
      courses = response.data;
    } else if (response?.Data && Array.isArray(response.Data)) {
      courses = response.Data;
    } else if (response?.result && Array.isArray(response.result)) {
      courses = response.result;
    } else if (response?.Result && Array.isArray(response.Result)) {
      courses = response.Result;
    }
    
    teacherState.courses = courses;
    console.log(`[loadTeacherCourses] ${teacherState.courses.length} ders yüklendi:`, teacherState.courses);
    
    if (teacherState.courses.length === 0) {
      console.warn("[loadTeacherCourses] Hiç ders bulunamadı!");
    }
    
    populateCourseSelect(teacherState.courses);
    renderTeacherCourses(teacherState.courses);
  } catch (error) {
    console.error("[loadTeacherCourses] Hata:", error);
    if (teacherHandleUnauthorized(error)) return;
    
    selects.forEach(select => {
      if (select) {
        select.innerHTML = `<option value="">Dersler alınamadı (${error.message || "Bilinmeyen hata"})</option>`;
      }
    });
    
    if (container) {
      container.innerHTML = `<p style="color: red;">Dersler yüklenirken hata oluştu: ${error.message || "Bilinmeyen hata"}</p>`;
    }
  }
};


const handleEditClass = (classId) => {
  const cls = teacherState.classes.find(c => c.id === classId);
  if (!cls) {
    showToast("Sınıf bulunamadı", true);
    return;
  }
  const newName = prompt("Yeni sınıf adı:", cls.className);
  if (!newName || newName === cls.className) return;
  
  (async () => {
    try {
      await apiFetch(`/Class/${classId}`, {
        method: "PUT",
        body: { className: newName }
      });
      showToast("Sınıf başarıyla güncellendi!");
      await loadTeacherClasses();
    } catch (error) {
      showToast(error.message || "Güncelleme başarısız", true);
    }
  })();
};

const handleDeleteClass = async (classId) => {
  if (!confirm("Bu sınıfı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
    return;
  }
  try {
    await apiFetch(`/Class/${classId}`, {
      method: "DELETE"
    });
    showToast("Sınıf başarıyla silindi!");
    await loadTeacherClasses();
  } catch (error) {
    showToast(error.message || "Silme başarısız", true);
  }
};

// Global scope'a ekle
window.handleEditClass = handleEditClass;
window.handleDeleteClass = handleDeleteClass;

const renderTeacherCourses = (courses = []) => {
  const container = teacherSelectors.courseList();
  if (!container) return;

  if (!courses.length) {
    container.innerHTML = "<p>Henüz ders oluşturmadınız.</p>";
    return;
  }

  container.innerHTML = courses
    .map(
      (course) => `
      <div class="assignment-card">
        <strong>${course.courseCode || ""} - ${course.courseName || ""}</strong>
        <p>${course.department || ""} - AKTS: ${course.creditHours ?? "-"}</p>
        <p><small>${course.description || ""}</small></p>
        <p><small>Akademik Yıl: ${course.academicYear || "-"}</small></p>
      </div>
    `
    )
    .join("");
};

const renderTeacherClasses = (classes = []) => {
  const container = teacherSelectors.classList();
  if (!container) return;

  if (!classes.length) {
    container.innerHTML = "<p>Henüz sınıf oluşturmadınız.</p>";
    return;
  }

  container.innerHTML = classes
    .map(
      (cls) => `
      <div class="assignment-card">
        <strong>${cls.className}</strong>
        <p>${cls.courseCode || ""} ${cls.courseName || ""}</p>
        <p><small>Kod: ${cls.classCode || "-"}</small></p>
        <p><small>Dönem: ${cls.semester || "-"}</small></p>
        <p><small>Kontenjan: ${cls.currentEnrollment ?? 0}/${cls.maxCapacity ?? "-"}</small></p>
        <p><small>Oluşturulma: ${teacherFormatDate(cls.createdAt)}</small></p>
        <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
          <button onclick="handleEditClass(${cls.id})" style="padding: 0.5rem; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Düzenle</button>
          <button onclick="handleDeleteClass(${cls.id})" style="padding: 0.5rem; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Sil</button>
        </div>
      </div>
    `
    )
    .join("");
};

const loadTeacherClasses = async () => {
  const container = teacherSelectors.classList();
  const mobileContainer = teacherSelectors.teacherClassesList();
  
  if (container) {
    container.textContent = "Yükleniyor...";
  }
  if (mobileContainer) {
    mobileContainer.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary);">Yükleniyor...</div>';
  }

  try {
    const response = await apiFetch("/Class/my-classes");
    // apiFetch zaten normalize ediyor, direkt array veya Result wrapper'dan data dönebilir
    teacherState.classes = Array.isArray(response) ? response : (response?.data || response?.Data || []);
    renderTeacherClasses(teacherState.classes);
    renderTeacherClassesMobile(teacherState.classes); // ✅ YENİ: Mobil görünümü render et
  } catch (error) {
    if (teacherHandleUnauthorized(error)) return;
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message}</p>`;
    }
    if (mobileContainer) {
      mobileContainer.innerHTML = `<p style="color:red; text-align: center; padding: 1rem;">${error.message}</p>`;
    }
  }
};

// ✅ YENİ: Mobil görünüm için class'ları render et
const renderTeacherClassesMobile = (classes = []) => {
  const container = teacherSelectors.teacherClassesList();
  if (!container) return;

  if (!classes.length) {
    container.innerHTML = `
      <div style="background: var(--background); border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center;">
        <p style="color: var(--text-secondary); margin: 0;">Henüz sınıf oluşturmadınız.</p>
      </div>
    `;
    return;
  }

  // İlk 3 class'ı göster (mobildeki gibi)
  const displayClasses = classes.slice(0, 3);
  
  container.innerHTML = displayClasses
    .map((cls) => {
      const className = cls.className || cls.ClassName || "Sınıf";
      const courseCode = cls.courseCode || cls.CourseCode || "";
      const courseName = cls.courseName || cls.CourseName || "";
      const currentEnrollment = cls.currentEnrollment || cls.CurrentEnrollment || 0;
      const classId = cls.id || cls.Id;
      
      return `
        <div style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 4px 0; font-size: 1.1rem; color: var(--text-primary); font-weight: bold;">${className}</h4>
              <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">${courseName} (${courseCode})</p>
              <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: var(--primary); font-weight: 600;">👥 ${currentEnrollment} öğrenci</p>
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
            <a href="class_management.html" style="flex: 1; background: var(--background-secondary); padding: 8px; border-radius: 8px; text-align: center; text-decoration: none; color: var(--primary); font-weight: 600; font-size: 0.85rem;">👥 Öğrenciler</a>
            <a href="class_schedules.html?classId=${classId}&className=${encodeURIComponent(className)}" style="flex: 1; background: var(--background-secondary); padding: 8px; border-radius: 8px; text-align: center; text-decoration: none; color: var(--primary); font-weight: 600; font-size: 0.85rem;">📅 Schedule</a>
            <a href="assignments.html?classId=${classId}" style="flex: 1; background: var(--background-secondary); padding: 8px; border-radius: 8px; text-align: center; text-decoration: none; color: var(--primary); font-weight: 600; font-size: 0.85rem;">📚 Ödevler</a>
          </div>
        </div>
      `;
    })
    .join("");
  
  // Eğer 3'ten fazla class varsa "Tümünü Gör" linki ekle
  if (classes.length > 3) {
    container.innerHTML += `
      <a href="class_management.html" style="display: block; background: var(--background); border: 1px solid var(--border); border-radius: 12px; padding: 12px; text-align: center; text-decoration: none; color: var(--primary); font-weight: 600; margin-top: 8px;">
        + ${classes.length - 3} daha fazla sınıf gör
      </a>
    `;
  }
};

const resetCreateClassResult = () => {
  const result = teacherSelectors.createClassResult();
  if (result) {
    result.textContent = "";
  }
};

const handleCreateClass = async (event) => {
  event.preventDefault();

  const form = teacherSelectors.createClassForm();
  if (!form) return;

  const courseId = parseInt(teacherSelectors.courseSelect()?.value || "", 10);
  const className = teacherSelectors.classNameInput()?.value.trim();
  const classCode = teacherSelectors.classCodeInput()?.value.trim();
  const maxCapacityValue = teacherSelectors.maxCapacityInput()?.value;
  const semester = teacherSelectors.semesterInput()?.value.trim();
  const resultContainer = teacherSelectors.createClassResult();
  const user = getAuthUser();

  resetCreateClassResult();

  if (!courseId || !className || !semester) {
    showToast("Lütfen zorunlu alanları doldurun", true);
    return;
  }

  const instructorId = getUserId();
  if (!instructorId) {
    showToast("Kullanıcı ID bilgisi alınamadı, lütfen tekrar giriş yapın", true);
    return;
  }

  const body = {
    courseId,
    className,
    classCode: classCode || null,
    instructorId,
    maxCapacity: maxCapacityValue ? parseInt(maxCapacityValue, 10) : 50,
    semester
  };

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Oluşturuluyor...";
  }

  try {
    await apiFetch("/Class", {
      method: "POST",
      body
    });

    showToast("Sınıf başarıyla oluşturuldu");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green'>Yeni sınıf eklendi.</p>";
    }
    form.reset();
    populateCourseSelect(teacherState.courses);
    await loadTeacherClasses();
    
    // Modal'ı kapat
    const classModal = document.getElementById("createClassModal");
    if (classModal) {
      setTimeout(() => {
        classModal.style.display = "none";
        if (resultContainer) resultContainer.innerHTML = "";
      }, 1500);
    }
  } catch (error) {
    if (teacherHandleUnauthorized(error)) return;
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red'>${error.message}</p>`;
    }
    showToast(error.message || "Sınıf oluşturulamadı", true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Sınıf Oluştur";
    }
  }
};


const bindTeacherEvents = () => {
  // Modal açma/kapatma
  const openClassModal = document.getElementById("openCreateClassModal");
  const closeClassModal = document.getElementById("closeClassModal");
  const classModal = document.getElementById("createClassModal");
  
  if (openClassModal && classModal) {
    openClassModal.addEventListener("click", async () => {
      classModal.style.display = "flex";
      console.log("[bindTeacherEvents] Sınıf oluştur modal'ı açıldı");
      
      // Modal açıldıktan sonra kısa bir süre bekle (DOM'un render olması için)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Modal açıldığında her zaman ders listesini yeniden yükle
      // (Yeni ders oluşturulmuş olabilir)
      console.log("[bindTeacherEvents] Dersler yükleniyor...");
      try {
        await loadTeacherCourses();
        console.log("[bindTeacherEvents] Dersler başarıyla yüklendi:", teacherState.courses);
        
        // Yükleme sonrası tekrar populate et (modal içindeki select'ler için)
        if (teacherState.courses && teacherState.courses.length > 0) {
          console.log("[bindTeacherEvents] Select'ler dolduruluyor...");
          populateCourseSelect(teacherState.courses);
          
          // Kontrol: Select'lerin dolu olup olmadığını kontrol et
          const selects = document.querySelectorAll('#courseSelect');
          selects.forEach((select, index) => {
            console.log(`[bindTeacherEvents] Select ${index} options:`, select.options.length);
            if (select.options.length <= 1) {
              console.warn(`[bindTeacherEvents] Select ${index} boş! Tekrar dolduruluyor...`);
              populateCourseSelect(teacherState.courses);
            }
          });
        } else {
          console.warn("[bindTeacherEvents] Dersler yüklendi ama boş!");
        }
      } catch (err) {
        console.error("Ders listesi yüklenirken hata:", err);
        showToast("Ders listesi yüklenirken hata oluştu: " + err.message, true);
        
        // Hata olsa bile mevcut dersleri göster
        if (teacherState.courses && teacherState.courses.length > 0) {
          populateCourseSelect(teacherState.courses);
        }
      }
    });
  }
  
  if (closeClassModal && classModal) {
    closeClassModal.addEventListener("click", () => {
      classModal.style.display = "none";
    });
  }
  
  // Modal dışına tıklanınca kapat
  if (classModal) {
    classModal.addEventListener("click", (e) => {
      if (e.target === classModal) {
        classModal.style.display = "none";
      }
    });
  }

  const logoutButton = teacherSelectors.logoutButton();
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearAuthSession();
      window.location.href = "index.html";
    });
  }

  const classForm = teacherSelectors.createClassForm();
  if (classForm) {
    classForm.addEventListener("submit", handleCreateClass);
  }
};

const loadTeacherAssignments = async () => {
  try {
    const assignments = await apiFetch("/Assignment");
    const allAssignments = Array.isArray(assignments) ? assignments : [];

    // Sadece bu öğretmenin sınıflarına ait ödevleri say
    const assignmentsList = filterAssignmentsForCurrentTeacher(allAssignments);
    
    const container = document.getElementById("teacherAssignmentsList");
    if (!container) return;
    
    if (assignmentsList.length === 0) {
      container.innerHTML = "<p style='padding: 1rem 1.5rem; color: #666;'>Henüz ödev bulunmuyor.</p>";
      return;
    }
    
    // Mobil uygulamaya göre assignment card'ları
    if (assignmentsList.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <div style="font-size: 64px; margin-bottom: 16px;">📚</div>
          <div style="font-size: 16px; color: var(--text-secondary); margin-bottom: 16px;">Henüz ödev yok</div>
          <a href="assignments.html" style="display: inline-block; background-color: var(--primary); color: var(--text-white); padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">+ Ödev Oluştur</a>
        </div>
      `;
      return;
    }
    
    container.innerHTML = assignmentsList.slice(0, 5).map(assignment => {
      const dueDate = new Date(assignment.dueDate).toLocaleDateString('tr-TR');
      const submissionCount = assignment.totalSubmissions || 0;
      const className = assignment.className || assignment.ClassName || "";
      
      return `
        <div style="background-color: var(--background); border-radius: 12px; padding: 16px; margin-bottom: 12px; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 16px; font-weight: bold; color: var(--text-primary); flex: 1;">${assignment.title || "Ödev"}</div>
            <div style="font-size: 14px; color: var(--primary); font-weight: 600;">${submissionCount} teslim</div>
          </div>
          <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">${className}</div>
          <div style="font-size: 13px; color: var(--text-secondary);">Son Tarih: ${dueDate}</div>
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error("Ödevler yüklenemedi:", error);
    const container = document.getElementById("teacherAssignmentsList");
    if (container) {
      container.innerHTML = "<p style='padding: 1rem 1.5rem; color: #666;'>Ödevler yüklenirken hata oluştu.</p>";
    }
  }
};

const updateTeacherStats = async () => {
  try {
    const dashboardData = await apiFetch("/Dashboard/instructor");

    const totalAssignments = dashboardData?.totalAssignments ?? dashboardData?.TotalAssignments ?? 0;
    const pendingGrades = dashboardData?.pendingGrades ?? dashboardData?.PendingGrades ?? 0;
    const totalStudents = dashboardData?.totalStudents ?? dashboardData?.TotalStudents ?? 0;

    // Dashboard API sınıf istatistikleri döndürüyor; gerekirse future use için sakla
    if (Array.isArray(dashboardData?.classStatistics) || Array.isArray(dashboardData?.ClassStatistics)) {
      teacherState.dashboardClassStats = dashboardData.classStatistics || dashboardData.ClassStatistics;
    }

    const statAssignments = document.getElementById("statAssignments");
    const statPending = document.getElementById("statPending");
    const statGraded = document.getElementById("statGraded");
    const statStudents = document.getElementById("statStudents");

    if (statAssignments) statAssignments.textContent = totalAssignments;
    if (statPending) statPending.textContent = pendingGrades;
    if (statGraded) statGraded.textContent = Math.max(totalAssignments - pendingGrades, 0);
    if (statStudents) statStudents.textContent = totalStudents;
  } catch (error) {
    console.error("İstatistikler yüklenemedi:", error);
  }
};

const updateTeacherWelcome = async () => {
  const user = getAuthUser();
  const welcomeNameEl = document.getElementById("teacherWelcomeName");
  const infoDetailsEl = document.getElementById("teacherInfoDetails");
  const mobileGreeting = document.getElementById("teacherMobileGreeting");
  const mobileUserName = document.getElementById("teacherMobileUserName");
  
  const userName = user?.fullName?.split(" ")[0] || user?.firstName || user?.email?.split("@")[0] || "Hoca";
  
  // Mobil uygulamaya göre header
  if (mobileGreeting) {
    mobileGreeting.textContent = "👋 Hoş geldin,";
  }
  if (mobileUserName) {
    mobileUserName.textContent = `${userName}!`;
  }
  
  if (user && welcomeNameEl) {
    const roleText = (user.role || "").toLowerCase() === "admin" ? "Admin" : "Öğretmen";
    welcomeNameEl.textContent = `👋 Hoş geldiniz, ${userName}!`;
  }
  
  // Öğretmen bilgilerini yükle
  try {
    const [coursesResult, classesResult] = await Promise.allSettled([
      apiFetch("/Course/my-courses"),
      apiFetch("/Class/my-classes")
    ]);
    
    const coursesList = coursesResult.status === "fulfilled" 
      ? (Array.isArray(coursesResult.value) ? coursesResult.value : (coursesResult.value?.data || coursesResult.value?.Data || []))
      : [];
    const classesList = classesResult.status === "fulfilled"
      ? (Array.isArray(classesResult.value) ? classesResult.value : (classesResult.value?.data || classesResult.value?.Data || []))
      : [];
    
    if (infoDetailsEl) {
      infoDetailsEl.innerHTML = `
        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 10px;">
          <strong style="display: block; margin-bottom: 0.5rem;">📚 Toplam Ders</strong>
          <span style="font-size: 1.5rem; font-weight: bold;">${coursesList.length}</span>
        </div>
        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 10px;">
          <strong style="display: block; margin-bottom: 0.5rem;">🏫 Toplam Sınıf</strong>
          <span style="font-size: 1.5rem; font-weight: bold;">${classesList.length}</span>
        </div>
      `;
    }
  } catch (error) {
    console.error("Öğretmen bilgileri yüklenemedi:", error);
    if (infoDetailsEl) {
      infoDetailsEl.innerHTML = `
        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 10px;">
          <strong style="display: block; margin-bottom: 0.5rem;">📚 Toplam Ders</strong>
          <span style="font-size: 1.5rem; font-weight: bold;">-</span>
        </div>
        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 10px;">
          <strong style="display: block; margin-bottom: 0.5rem;">🏫 Toplam Sınıf</strong>
          <span style="font-size: 1.5rem; font-weight: bold;">-</span>
        </div>
      `;
    }
  }
};

const initTeacherDashboard = async () => {
  try {
    const user = requireInstructorRole();
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
    
    // Navigation menüsünü rol bazlı güncelle
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

  bindTeacherEvents();

  await Promise.all([loadTeacherCourses(), loadTeacherClasses()]);
  
  // Mobil tasarım için ödevleri ve istatistikleri yükle
  await Promise.all([loadTeacherAssignments(), updateTeacherStats()]);
  
  // ✅ YENİ: Haftalık programı yükle (ClassSchedule'lar)
  await loadTeacherWeeklySchedule();
  
  // Son olarak hoş geldin mesajını güncelle
  await updateTeacherWelcome();
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("[teacher.js] DOMContentLoaded başladı");
  const dashboard = teacherSelectors.dashboard();
  if (!dashboard) {
    console.error("[teacher.js] Dashboard elementi bulunamadı!");
    return;
  }
  console.log("[teacher.js] initTeacherDashboard çağrılıyor");
  initTeacherDashboard().catch((err) => {
    console.error("[teacher.js] initTeacherDashboard hatası:", err);
  });
});

