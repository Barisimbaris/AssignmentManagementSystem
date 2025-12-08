const teacherState = {
  courses: [],
  classes: []
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
  createCourseForm: () => document.getElementById("createCourseForm"),
  createCourseResult: () => document.getElementById("createCourseResult")
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

const populateCourseSelect = (courses = []) => {
  const select = teacherSelectors.courseSelect();
  if (!select) {
    return;
  }
  select.innerHTML = '<option value="">Ders seçiniz</option>';
  courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.courseCode || "Kod"} - ${course.courseName}`;
    select.appendChild(option);
  });
};

const loadTeacherCourses = async () => {
  const select = teacherSelectors.courseSelect();
  const container = teacherSelectors.courseList();
  
  if (select) {
    select.innerHTML = '<option value="">Dersler yükleniyor...</option>';
  }
  if (container) {
    container.textContent = "Yükleniyor...";
  }
  
  try {
    // Öğretmenin sadece kendi derslerini getir
    const courses = await apiFetch("/Course/my-courses");
    teacherState.courses = Array.isArray(courses) ? courses : (courses?.data || courses?.Data || []);
    populateCourseSelect(teacherState.courses);
    renderTeacherCourses(teacherState.courses);
  } catch (error) {
    console.error("[loadTeacherCourses] Hata:", error);
    if (teacherHandleUnauthorized(error)) return;
    
    if (select) {
      select.innerHTML = `<option value="">Dersler alınamadı (${error.message || "Bilinmeyen hata"})</option>`;
    }
    if (container) {
      container.innerHTML = `<p style="color: red;">Dersler yüklenirken hata oluştu: ${error.message || "Bilinmeyen hata"}</p>`;
    }
  }
};

const handleEditCourse = (courseId) => {
  const course = teacherState.courses.find(c => c.id === courseId);
  if (!course) {
    showToast("Ders bulunamadı", true);
    return;
  }
  // Basit düzenleme - şimdilik prompt ile
  const newName = prompt("Yeni ders adı:", course.courseName);
  if (!newName || newName === course.courseName) return;
  
  // API çağrısı yap
  (async () => {
    try {
      await apiFetch(`/Course/${courseId}`, {
        method: "PUT",
        body: { courseName: newName }
      });
      showToast("Ders başarıyla güncellendi!");
      await loadTeacherCourses();
    } catch (error) {
      showToast(error.message || "Güncelleme başarısız", true);
    }
  })();
};

const handleDeleteCourse = async (courseId) => {
  if (!confirm("Bu dersi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
    return;
  }
  try {
    await apiFetch(`/Course/${courseId}`, {
      method: "DELETE"
    });
    showToast("Ders başarıyla silindi!");
    await loadTeacherCourses();
  } catch (error) {
    showToast(error.message || "Silme başarısız", true);
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
window.handleEditCourse = handleEditCourse;
window.handleDeleteCourse = handleDeleteCourse;
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
        <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
          <button onclick="handleEditCourse(${course.id})" style="padding: 0.5rem; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Düzenle</button>
          <button onclick="handleDeleteCourse(${course.id})" style="padding: 0.5rem; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Sil</button>
        </div>
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
  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    const response = await apiFetch("/Class/my-classes");
    // apiFetch zaten normalize ediyor, direkt array veya Result wrapper'dan data dönebilir
    teacherState.classes = Array.isArray(response) ? response : (response?.data || response?.Data || []);
    renderTeacherClasses(teacherState.classes);
  } catch (error) {
    if (teacherHandleUnauthorized(error)) return;
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message}</p>`;
    }
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

const handleCreateCourse = async (event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  console.log("[handleCreateCourse] ========== BAŞLADI ==========");

  const form = teacherSelectors.createCourseForm();
  if (!form) {
    console.error("[handleCreateCourse] ❌ Form bulunamadı!");
    showToast("Form bulunamadı! Sayfayı yenileyin.", true);
    return;
  }
  console.log("[handleCreateCourse] ✅ Form bulundu");

  const courseCode = document.getElementById("courseCode")?.value.trim();
  const courseName = document.getElementById("courseName")?.value.trim();
  const description = document.getElementById("courseDescription")?.value.trim();
  const department = document.getElementById("courseDepartment")?.value.trim();
  const creditHoursInput = document.getElementById("creditHours")?.value;
  const creditHours = parseInt(creditHoursInput || "0", 10);
  const academicYear = document.getElementById("academicYear")?.value.trim();
  const resultContainer = teacherSelectors.createCourseResult();

  console.log("[handleCreateCourse] Form değerleri:", {
    courseCode,
    courseName,
    department,
    creditHours,
    academicYear
  });

  if (!courseCode || !courseName || !department || !creditHours || !academicYear) {
    const missing = [];
    if (!courseCode) missing.push("Ders Kodu");
    if (!courseName) missing.push("Ders Adı");
    if (!department) missing.push("Bölüm");
    if (!creditHours) missing.push("AKTS");
    if (!academicYear) missing.push("Akademik Yıl");
    const message = `Lütfen şu alanları doldurun: ${missing.join(", ")}`;
    console.error("[handleCreateCourse] ❌", message);
    showToast(message, true);
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red'>${message}</p>`;
    }
    return;
  }

  // AcademicYear formatını kontrol et (YYYY-YYYY)
  if (!/^\d{4}-\d{4}$/.test(academicYear)) {
    const message = "Akademik Yıl formatı hatalı! Örnek: 2024-2025";
    console.error("[handleCreateCourse] ❌", message);
    showToast(message, true);
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red'>${message}</p>`;
    }
    return;
  }

  // .NET API camelCase kabul ediyor (default JSON serializer)
  const body = {
    courseCode: courseCode,
    courseName: courseName,
    description: description || null,
    department: department,
    creditHours: creditHours,
    academicYear: academicYear
  };

  console.log("[handleCreateCourse] Gönderilecek body:", body);

  const submitButton = form.querySelector('button[type="submit"]') || document.getElementById("createCourseButton");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Oluşturuluyor...";
  }

  // Token kontrolü
  const token = getAuthToken();
  if (!token) {
    const message = "Oturum bulunamadı! Lütfen tekrar giriş yapın.";
    console.error("[handleCreateCourse] ❌", message);
    showToast(message, true);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Ders Oluştur";
    }
    return;
  }
  console.log("[handleCreateCourse] ✅ Token var:", token.substring(0, 20) + "...");

  try {
    console.log("[handleCreateCourse] API çağrısı yapılıyor...");
    
    const response = await apiFetch("/Course", {
      method: "POST",
      body
    });

    console.log("[handleCreateCourse] ✅ API yanıtı:", response);

    showToast("Ders başarıyla oluşturuldu! 🎉");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green; font-weight:bold;'>✅ Yeni ders eklendi!</p>";
    }
    form.reset();
    
    // Response'dan gelen Course'u state'e ekle
    const newCourse = response?.data || response?.Data || response;
    if (newCourse && newCourse.id) {
      // Eğer aynı Course zaten listede yoksa ekle
      const existingIndex = teacherState.courses.findIndex(c => c.id === newCourse.id);
      if (existingIndex >= 0) {
        // Zaten varsa güncelle
        teacherState.courses[existingIndex] = newCourse;
      } else {
        // Yoksa ekle
        teacherState.courses.push(newCourse);
      }
      // Select'e ekle
      populateCourseSelect(teacherState.courses);
      // Listeyi render et
      renderTeacherCourses(teacherState.courses);
    } else {
      // Response'dan Course alınamazsa listeyi yenile
      console.log("[handleCreateCourse] Response'dan Course alınamadı, liste yenileniyor...");
      await loadTeacherCourses();
    }
    
    // Modal'ı kapat
    const courseModal = document.getElementById("createCourseModal");
    if (courseModal) {
      setTimeout(() => {
        courseModal.style.display = "none";
        if (resultContainer) resultContainer.innerHTML = "";
      }, 1500);
    }
    
    console.log("[handleCreateCourse] ========== TAMAMLANDI ==========");
  } catch (error) {
    console.error("[handleCreateCourse] ❌ HATA:", error);
    console.error("[handleCreateCourse] Hata detayı:", {
      message: error.message,
      status: error.status,
      response: error.response
    });
    
    if (teacherHandleUnauthorized(error)) return;
    
    let errorMessage = error.message || "Bilinmeyen hata";
    if (error.response?.errors && Array.isArray(error.response.errors)) {
      errorMessage = error.response.errors.join(", ");
    }
    
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red; font-weight:bold;'>❌ ${errorMessage}</p>`;
    }
    showToast(`Ders oluşturulamadı: ${errorMessage}`, true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Ders Oluştur";
    }
  }
};

const bindTeacherEvents = () => {
  // Modal açma/kapatma
  const openCourseModal = document.getElementById("openCreateCourseModal");
  const closeCourseModal = document.getElementById("closeCourseModal");
  const courseModal = document.getElementById("createCourseModal");
  const openClassModal = document.getElementById("openCreateClassModal");
  const closeClassModal = document.getElementById("closeClassModal");
  const classModal = document.getElementById("createClassModal");
  
  if (openCourseModal && courseModal) {
    openCourseModal.addEventListener("click", () => {
      courseModal.style.display = "flex";
    });
  }
  
  if (closeCourseModal && courseModal) {
    closeCourseModal.addEventListener("click", () => {
      courseModal.style.display = "none";
    });
  }
  
  if (openClassModal && classModal) {
    openClassModal.addEventListener("click", () => {
      classModal.style.display = "flex";
      // Modal açıldığında ders listesini yükle (eğer yüklenmemişse)
      if (!teacherState.courses || teacherState.courses.length === 0) {
        loadTeacherCourses().catch(err => console.error("Ders listesi yüklenirken hata:", err));
      } else {
        // Zaten yüklüyse sadece select'i doldur
        populateCourseSelect(teacherState.courses);
      }
    });
  }
  
  if (closeClassModal && classModal) {
    closeClassModal.addEventListener("click", () => {
      classModal.style.display = "none";
    });
  }
  
  // Modal dışına tıklanınca kapat
  if (courseModal) {
    courseModal.addEventListener("click", (e) => {
      if (e.target === courseModal) {
        courseModal.style.display = "none";
      }
    });
  }
  
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

  const courseForm = teacherSelectors.createCourseForm();
  if (courseForm) {
    console.log("[bindTeacherEvents] Form bulundu, event listener ekleniyor...");
    
    // Form submit eventi
    courseForm.addEventListener("submit", (e) => {
      console.log("[bindTeacherEvents] Form submit eventi yakalandı");
      e.preventDefault();
      e.stopPropagation();
      handleCreateCourse(e).catch((err) => {
        console.error("[bindTeacherEvents] handleCreateCourse hatası:", err);
        showToast("Ders oluşturulurken hata oluştu: " + err.message, true);
      });
      return false;
    });

    // Butona direkt click eventi ekle (fallback)
    const submitButton = courseForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.addEventListener("click", (e) => {
        console.log("[bindTeacherEvents] Buton click eventi yakalandı");
        e.preventDefault();
        e.stopPropagation();
        const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {} };
        handleCreateCourse(fakeEvent).catch((err) => {
          console.error("[bindTeacherEvents] handleCreateCourse hatası:", err);
          showToast("Ders oluşturulurken hata oluştu: " + err.message, true);
        });
        return false;
      });
      console.log("[bindTeacherEvents] Buton click event listener eklendi");
    } else {
      console.error("[bindTeacherEvents] Submit butonu bulunamadı!");
    }
  } else {
    console.error("[bindTeacherEvents] createCourseForm bulunamadı!");
  }

  const classForm = teacherSelectors.createClassForm();
  if (classForm) {
    classForm.addEventListener("submit", handleCreateClass);
  }
};

const updateTeacherWelcome = async () => {
  const user = getAuthUser();
  const welcomeNameEl = document.getElementById("teacherWelcomeName");
  const infoDetailsEl = document.getElementById("teacherInfoDetails");
  
  if (user && welcomeNameEl) {
    const roleText = (user.role || "").toLowerCase() === "admin" ? "Admin" : "Öğretmen";
    welcomeNameEl.textContent = `👋 Hoş geldiniz, ${user.fullName || user.email}!`;
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

