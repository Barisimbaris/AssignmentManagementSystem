// ClassSchedule Yönetimi Modülü (Instructor)

const scheduleState = {
  schedules: [],
  classId: null,
  className: null
};

const scheduleSelectors = {
  page: () => document.getElementById("classSchedulesPage"),
  loadingIndicator: () => document.getElementById("loadingIndicator"),
  schedulesList: () => document.getElementById("schedulesList"),
  emptyState: () => document.getElementById("emptyState"),
  errorState: () => document.getElementById("errorState"),
  errorMessage: () => document.getElementById("errorMessage"),
  scheduleCount: () => document.getElementById("scheduleCount"),
  scheduleClassName: () => document.getElementById("scheduleClassName"),
  createScheduleBtn: () => document.getElementById("createScheduleBtn"),
  createScheduleEmptyBtn: () => document.getElementById("createScheduleEmptyBtn"),
  schedulesToolbar: () => document.getElementById("schedulesToolbar"),
  createScheduleToolbarBtn: () => document.getElementById("createScheduleToolbarBtn"),
  schedulesCountToolbar: () => document.getElementById("schedulesCountToolbar")
};

const requireInstructorRoleSchedule = () => {
  const user = getAuthUser();
  if (!user) {
    throw new Error("Lütfen giriş yapın");
  }
  if ((user.role || "").toLowerCase() !== "instructor" && (user.role || "").toLowerCase() !== "admin") {
    throw new Error("Bu sayfa sadece öğretmenler içindir");
  }
  return user;
};

const scheduleHandleUnauthorized = (error) => {
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

// URL parametrelerinden classId ve className'i al
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const classId = parseInt(params.get("classId"), 10);
  const className = params.get("className") || "Sınıf";
  return { classId, className };
};

// Gün adını döndür
const getDayName = (dayOfWeek) => {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[dayOfWeek] || 'Bilinmiyor';
};

// TimeSpan formatını parse et (HH:mm:ss -> HH:mm)
const formatTime = (timeSpan) => {
  if (!timeSpan) return '';
  const parts = timeSpan.split(':');
  return `${parts[0]}:${parts[1]}`;
};

// Schedule'ları yükle
const loadSchedules = async () => {
  const loadingIndicator = scheduleSelectors.loadingIndicator();
  const schedulesList = scheduleSelectors.schedulesList();
  const emptyState = scheduleSelectors.emptyState();
  const errorState = scheduleSelectors.errorState();
  const scheduleCount = scheduleSelectors.scheduleCount();

  // Loading göster
  if (loadingIndicator) loadingIndicator.style.display = "block";
  if (schedulesList) schedulesList.style.display = "none";
  if (emptyState) emptyState.style.display = "none";
  if (errorState) errorState.style.display = "none";

  try {
    requireInstructorRoleSchedule();

    const { classId } = getUrlParams();
    if (!classId) {
      throw new Error("Sınıf ID bulunamadı");
    }

    scheduleState.classId = classId;

    console.log("[loadSchedules] 📅 Schedule'lar yükleniyor, ClassId:", classId);

    const response = await apiFetch(`/ClassSchedule/class/${classId}`);
    
    let schedules = [];
    if (Array.isArray(response)) {
      schedules = response;
    } else if (response?.data && Array.isArray(response.data)) {
      schedules = response.data;
    } else if (response?.isSuccess && Array.isArray(response.data)) {
      schedules = response.data;
    }

    scheduleState.schedules = schedules;
    console.log("[loadSchedules] ✅ Yüklenen schedule sayısı:", schedules.length);

    // İstatistik güncelle
    if (scheduleCount) {
      scheduleCount.textContent = `📅 ${schedules.length} schedule`;
    }

    // ✅ YENİ: Toolbar'ı göster ve sayıyı güncelle
    const schedulesToolbar = scheduleSelectors.schedulesToolbar();
    const schedulesCountToolbar = scheduleSelectors.schedulesCountToolbar();
    
    if (schedulesToolbar && scheduleState.classId) {
      schedulesToolbar.style.display = "flex";
    }
    
    if (schedulesCountToolbar) {
      schedulesCountToolbar.textContent = `${schedules.length} schedule`;
    }

    // Render
    renderSchedules(schedules);

    if (loadingIndicator) loadingIndicator.style.display = "none";
    
    if (schedules.length === 0) {
      if (emptyState) emptyState.style.display = "block";
      if (schedulesList) schedulesList.style.display = "none";
    } else {
      if (schedulesList) schedulesList.style.display = "block";
      if (emptyState) emptyState.style.display = "none";
    }

  } catch (error) {
    console.error("[loadSchedules] ❌ Hata:", error);
    
    if (scheduleHandleUnauthorized(error)) return;

    if (loadingIndicator) loadingIndicator.style.display = "none";
    if (errorState) errorState.style.display = "block";
    const errorMessage = scheduleSelectors.errorMessage();
    if (errorMessage) {
      errorMessage.textContent = error.message || "Schedule'lar yüklenirken bir hata oluştu.";
    }
  }
};

// Schedule'ları render et
const renderSchedules = (schedules = []) => {
  const container = scheduleSelectors.schedulesList();
  if (!container) return;

  // ✅ YENİ: Toolbar'ı göster ve sayıyı güncelle
  const schedulesToolbar = scheduleSelectors.schedulesToolbar();
  const schedulesCountToolbar = scheduleSelectors.schedulesCountToolbar();
  
  if (schedulesToolbar && scheduleState.classId) {
    schedulesToolbar.style.display = "flex";
  }
  
  if (schedulesCountToolbar) {
    schedulesCountToolbar.textContent = `${schedules.length} schedule`;
  }

  if (schedules.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = schedules
    .map((schedule) => {
      const dayName = getDayName(schedule.dayOfWeek);
      const startTime = formatTime(schedule.startTime);
      const endTime = formatTime(schedule.endTime);
      const isActive = schedule.isActive !== false;
      const roomNumber = schedule.roomNumber || "";
      const building = schedule.building || "";
      const notes = schedule.notes || "";

      return `
        <div class="assignment-card" style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong style="font-size: 1.1rem; color: var(--text-primary);">${dayName}</strong>
            ${!isActive ? '<span style="background: var(--text-secondary); color: white; padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.75rem; font-weight: 600;">Pasif</span>' : ''}
          </div>
          <div style="margin-bottom: 0.5rem;">
            <span style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">🕐 ${startTime} - ${endTime}</span>
          </div>
          ${roomNumber ? `<p style="margin: 0.25rem 0; color: var(--text-secondary); font-size: 0.9rem;">🏢 ${roomNumber}${building ? ` (${building})` : ''}</p>` : ''}
          ${notes ? `<p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.85rem; font-style: italic;">${notes}</p>` : ''}
        </div>
      `;
    })
    .join("");
};

// Schedule oluşturma sayfasına yönlendir
const navigateToCreateSchedule = () => {
  const { classId, className } = getUrlParams();
  if (classId) {
    window.location.href = `create_schedule.html?classId=${classId}&className=${encodeURIComponent(className || "Sınıf")}`;
  }
};

// Class'ları yükle ve selector'a ekle
const loadClassesForSelector = async () => {
  try {
    const response = await apiFetch("/Class/my-classes");
    const classes = Array.isArray(response) ? response : (response?.data || response?.Data || []);
    
    const classSelector = document.getElementById("classSelector");
    if (!classSelector) return;
    
    classSelector.innerHTML = '<option value="">Sınıf seçiniz</option>';
    
    classes.forEach((cls) => {
      const option = document.createElement("option");
      option.value = cls.id || cls.Id || "";
      const courseCode = cls.courseCode || cls.CourseCode || "";
      const className = cls.className || cls.ClassName || "";
      option.textContent = courseCode && className ? `${courseCode} - ${className}` : (className || courseCode || "Sınıf");
      classSelector.appendChild(option);
    });
    
    // Eğer tek bir class varsa otomatik seç
    if (classes.length === 1) {
      const firstClass = classes[0];
      const classId = firstClass.id || firstClass.Id;
      const className = firstClass.className || firstClass.ClassName || "Sınıf";
      if (classId) {
        window.location.href = `class_schedules.html?classId=${classId}&className=${encodeURIComponent(className)}`;
      }
    }
  } catch (error) {
    console.error("[loadClassesForSelector] Hata:", error);
    if (scheduleHandleUnauthorized(error)) return;
  }
};

// Class seçildiğinde sayfayı yeniden yükle
const handleClassSelect = (event) => {
  const classId = event.target.value;
  if (classId) {
    const selectedOption = event.target.options[event.target.selectedIndex];
    const className = selectedOption.textContent;
    window.location.href = `class_schedules.html?classId=${classId}&className=${encodeURIComponent(className)}`;
  }
};

// Event'leri bağla
const bindScheduleEvents = () => {
  const createScheduleBtn = scheduleSelectors.createScheduleBtn();
  const createScheduleEmptyBtn = scheduleSelectors.createScheduleEmptyBtn();

  if (createScheduleBtn) {
    createScheduleBtn.addEventListener("click", navigateToCreateSchedule);
  }

  if (createScheduleEmptyBtn) {
    createScheduleEmptyBtn.addEventListener("click", navigateToCreateSchedule);
  }
};

// Sayfa başlatma
const initClassSchedulesPage = async () => {
  try {
    requireInstructorRoleSchedule();

    // Navigation menüsünü güncelle
    if (typeof updateNavigationByRole === "function") {
      updateNavigationByRole();
    }

    // ✅ YENİ: Class seçimini her zaman göster ve yükle
    const classSelectorSection = document.getElementById("classSelectorSection");
    if (classSelectorSection) {
      classSelectorSection.style.display = "block";
    }
    
    await loadClassesForSelector();
    
    // Class seçimi event'ini bağla
    const classSelector = document.getElementById("classSelector");
    if (classSelector) {
      classSelector.addEventListener("change", handleClassSelect);
      
      // ✅ YENİ: URL'den classId varsa seçili yap
      const { classId } = getUrlParams();
      if (classId) {
        classSelector.value = classId;
      }
    }

    // URL parametrelerini kontrol et
    const { classId, className } = getUrlParams();
    
    if (!classId) {
      // ClassId yoksa sadece seçim göster, schedule'ları gösterme
      const schedulesPage = scheduleSelectors.page();
      const scheduleStatsBar = document.getElementById("scheduleStatsBar");
      const loadingIndicator = scheduleSelectors.loadingIndicator();
      const schedulesList = scheduleSelectors.schedulesList();
      const emptyState = scheduleSelectors.emptyState();
      const errorState = scheduleSelectors.errorState();
      const schedulesToolbar = scheduleSelectors.schedulesToolbar();
      
      if (schedulesPage) {
        schedulesPage.style.display = "none";
      }
      if (scheduleStatsBar) {
        scheduleStatsBar.style.display = "none";
      }
      if (loadingIndicator) {
        loadingIndicator.style.display = "none";
      }
      if (schedulesList) {
        schedulesList.style.display = "none";
      }
      if (emptyState) {
        emptyState.style.display = "none";
      }
      if (errorState) {
        errorState.style.display = "none";
      }
      // ✅ YENİ: Toolbar'ı gizle
      if (schedulesToolbar) {
        schedulesToolbar.style.display = "none";
      }
      
      return; // ClassId olmadan devam etme
    }

    // ClassId varsa normal akışa devam et
    scheduleState.classId = classId;
    scheduleState.className = className;
    
    const scheduleClassName = scheduleSelectors.scheduleClassName();
    if (scheduleClassName) {
      scheduleClassName.textContent = `📅 ${className || "Ders Programı"}`;
    }

    // Event'leri bağla
    bindScheduleEvents();

    // ✅ YENİ: Toolbar butonuna event ekle
    const toolbarCreateBtn = scheduleSelectors.createScheduleToolbarBtn();
    if (toolbarCreateBtn) {
      toolbarCreateBtn.style.display = "block";
      toolbarCreateBtn.addEventListener("click", navigateToCreateSchedule);
    }

    // Schedule'ları yükle
    await loadSchedules();

  } catch (error) {
    console.error("[initClassSchedulesPage] Hata:", error);
    showToast(error.message || "Sayfa yüklenirken bir hata oluştu", true);
    
    if (error.message.includes("giriş yapın") || error.message.includes("yetki")) {
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    }
  }
};

// DOM yüklendiğinde başlat
document.addEventListener("DOMContentLoaded", () => {
  const page = scheduleSelectors.page();
  if (page) {
    initClassSchedulesPage();
  }
});
