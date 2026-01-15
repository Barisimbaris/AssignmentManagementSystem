// Öğrenci Ders Programı Modülü (ClassSchedule + Assignments) - Alt alta liste

const scheduleState = {
  schedules: [], // ClassSchedule'lar
  assignments: [], // Assignment'lar
  classes: []
};

const scheduleSelectors = {
  loadingIndicator: () => document.getElementById("loadingIndicator"),
  scheduleContent: () => document.getElementById("scheduleContent"),
  emptyState: () => document.getElementById("emptyState"),
  errorState: () => document.getElementById("errorState"),
  errorMessage: () => document.getElementById("errorMessage"),
  schedulesList: () => document.getElementById("schedulesList"),
  assignmentsList: () => document.getElementById("assignmentsList"),
  classesList: () => document.getElementById("classesList")
};

// Rol kontrolü
const requireStudentRole = () => {
  const user = getAuthUser();
  if (!user) {
    throw new Error("Lütfen giriş yapın");
  }
  const role = (user.role || "").toLowerCase();
  if (role !== "student" && role !== "admin") {
    throw new Error("Bu sayfa sadece öğrenciler içindir");
  }
  return user;
};

// Unauthorized handling
const handleUnauthorized = (error) => {
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

// TimeSpan formatını parse et
const parseTimeSpan = (timeSpan) => {
  if (!timeSpan) return null;
  const parts = timeSpan.split(':');
  return {
    hours: parseInt(parts[0]) || 0,
    minutes: parseInt(parts[1]) || 0,
    seconds: parseInt(parts[2]) || 0
  };
};

// Saat formatla (HH:mm)
const formatTime = (timeSpan) => {
  if (!timeSpan) return "-";
  const time = parseTimeSpan(timeSpan);
  if (!time) return "-";
  return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
};

// Gün adını döndür
const getDayName = (dayOfWeek) => {
  const days = {
    0: "Pazar",
    1: "Pazartesi",
    2: "Salı",
    3: "Çarşamba",
    4: "Perşembe",
    5: "Cuma",
    6: "Cumartesi"
  };
  return days[dayOfWeek] || "Bilinmeyen";
};

// Ders programını yükle (ClassSchedule + Assignments)
const loadSchedule = async () => {
  const loadingIndicator = scheduleSelectors.loadingIndicator();
  const scheduleContent = scheduleSelectors.scheduleContent();
  const emptyState = scheduleSelectors.emptyState();
  const errorState = scheduleSelectors.errorState();
  
  if (loadingIndicator) loadingIndicator.style.display = "block";
  if (scheduleContent) scheduleContent.style.display = "none";
  if (emptyState) emptyState.style.display = "none";
  if (errorState) errorState.style.display = "none";

  try {
    requireStudentRole();
    
    console.log("[loadSchedule] 📅 Ders programı ve ödevler yükleniyor...");
    
    // 1. Class'ları al
    const classesResponse = await apiFetch("/Class/my-classes");
    let classes = [];
    if (Array.isArray(classesResponse)) {
      classes = classesResponse;
    } else if (classesResponse?.data && Array.isArray(classesResponse.data)) {
      classes = classesResponse.data;
    } else if (classesResponse?.isSuccess && Array.isArray(classesResponse.data)) {
      classes = classesResponse.data;
    }
    
    scheduleState.classes = classes;
    console.log("[loadSchedule] 📅 Bulunan class sayısı:", classes.length);
    
    // 2. Her class için ClassSchedule'ları çek
    const schedulePromises = classes.map(async (cls) => {
      const classId = cls.id || cls.Id;
      if (!classId) return [];
      
      try {
        const response = await apiFetch(`/ClassSchedule/class/${classId}/weekly`);
        let schedules = [];
        if (Array.isArray(response)) {
          schedules = response;
        } else if (response?.data && Array.isArray(response.data)) {
          schedules = response.data;
        } else if (response?.isSuccess && Array.isArray(response.data)) {
          schedules = response.data;
        } else if (response?.Data && Array.isArray(response.Data)) {
          schedules = response.Data;
        }
        return schedules;
      } catch (err) {
        console.warn(`[loadSchedule] Class ${classId} schedule yüklenemedi:`, err);
        return [];
      }
    });
    
    const scheduleResults = await Promise.all(schedulePromises);
    const allSchedules = scheduleResults
      .filter(r => Array.isArray(r))
      .flatMap(r => r)
      .filter(s => {
        const isActive = s.isActive !== undefined ? s.isActive : s.IsActive;
        return s && isActive !== false;
      });
    
    scheduleState.schedules = allSchedules;
    console.log("[loadSchedule] 📅 Toplam schedule sayısı:", allSchedules.length);
    
    // 3. Ödevleri al
    try {
      const assignmentsResponse = await apiFetch("/Assignment/my-assignments");
      let assignments = [];
      if (Array.isArray(assignmentsResponse)) {
        assignments = assignmentsResponse;
      } else if (assignmentsResponse?.data && Array.isArray(assignmentsResponse.data)) {
        assignments = assignmentsResponse.data;
      } else if (assignmentsResponse?.isSuccess && Array.isArray(assignmentsResponse.data)) {
        assignments = assignmentsResponse.data;
      }
      
      scheduleState.assignments = assignments;
      console.log("[loadSchedule] 📚 Toplam ödev sayısı:", assignments.length);
    } catch (err) {
      console.warn("[loadSchedule] Ödevler yüklenemedi:", err);
      scheduleState.assignments = [];
    }
    
    // Render
    renderSchedules();
    renderAssignments();
    renderClassesSummary();
    
    if (loadingIndicator) loadingIndicator.style.display = "none";
    
    if (scheduleState.classes.length === 0 && scheduleState.schedules.length === 0 && scheduleState.assignments.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
        const emptyTitle = emptyState.querySelector("h3");
        const emptyText = emptyState.querySelector("p");
        if (emptyTitle) emptyTitle.textContent = "Henüz sınıfa kayıtlı değilsiniz";
        if (emptyText) emptyText.textContent = "Ders programınızı görmek için önce bir sınıfa kayıt olmanız gerekiyor.";
      }
      if (scheduleContent) scheduleContent.style.display = "none";
    } else {
      if (scheduleContent) scheduleContent.style.display = "block";
      if (emptyState) emptyState.style.display = "none";
    }
    
  } catch (error) {
    console.error("[loadSchedule] Hata:", error);
    if (handleUnauthorized(error)) return;
    
    if (loadingIndicator) loadingIndicator.style.display = "none";
    if (errorState) errorState.style.display = "block";
    const errorMessage = scheduleSelectors.errorMessage();
    if (errorMessage) {
      errorMessage.textContent = error.message || "Ders programı yüklenirken bir hata oluştu.";
    }
  }
};

// Schedule'ları render et (alt alta liste)
const renderSchedules = () => {
  const container = scheduleSelectors.schedulesList();
  if (!container) return;

  if (scheduleState.schedules.length === 0) {
    container.innerHTML = '<p style="padding: 1rem; color: var(--text-secondary); text-align: center;">Henüz ders programı bulunmuyor.</p>';
    return;
  }

  // Günlere göre sırala (Pazartesi'den başlayarak)
  const sortedSchedules = [...scheduleState.schedules].sort((a, b) => {
    const dayA = a.dayOfWeek !== undefined ? a.dayOfWeek : (a.DayOfWeek !== undefined ? a.DayOfWeek : 0);
    const dayB = b.dayOfWeek !== undefined ? b.dayOfWeek : (b.DayOfWeek !== undefined ? b.DayOfWeek : 0);
    return dayA - dayB;
  });

  container.innerHTML = sortedSchedules
    .map((schedule) => {
      const dayOfWeek = schedule.dayOfWeek !== undefined ? schedule.dayOfWeek : (schedule.DayOfWeek !== undefined ? schedule.DayOfWeek : 0);
      const dayName = getDayName(dayOfWeek);
      const startTime = formatTime(schedule.startTime || schedule.StartTime);
      const endTime = formatTime(schedule.endTime || schedule.EndTime);
      const className = schedule.className || schedule.ClassName || "Sınıf";
      const courseCode = schedule.courseCode || schedule.CourseCode || "";
      const courseName = schedule.courseName || schedule.CourseName || "";
      const roomNumber = schedule.roomNumber || schedule.RoomNumber || "";
      const building = schedule.building || schedule.Building || "";
      const notes = schedule.notes || schedule.Notes || "";

      return `
        <div class="assignment-card" style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong style="font-size: 1.1rem; color: var(--text-primary);">${dayName}</strong>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${courseCode}</span>
          </div>
          <div style="margin-bottom: 0.5rem;">
            <span style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">🕐 ${startTime} - ${endTime}</span>
          </div>
          <div style="margin-bottom: 0.5rem;">
            <span style="font-size: 0.95rem; color: var(--text-primary); font-weight: 500;">📚 ${courseName}</span>
          </div>
          <div style="margin-bottom: 0.5rem;">
            <span style="font-size: 0.9rem; color: var(--text-secondary);">👥 ${className}</span>
          </div>
          ${roomNumber ? `<p style="margin: 0.25rem 0; color: var(--text-secondary); font-size: 0.9rem;">🏢 ${roomNumber}${building ? ` (${building})` : ''}</p>` : ''}
          ${notes ? `<p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.85rem; font-style: italic;">${notes}</p>` : ''}
        </div>
      `;
    })
    .join("");
};

// Assignment'ları render et (alt alta liste)
const renderAssignments = () => {
  const container = scheduleSelectors.assignmentsList();
  if (!container) return;

  if (scheduleState.assignments.length === 0) {
    container.innerHTML = '<p style="padding: 1rem; color: var(--text-secondary); text-align: center;">Henüz ödev bulunmuyor.</p>';
    return;
  }

  // DueDate'e göre sırala (yakın tarihli önce)
  const sortedAssignments = [...scheduleState.assignments].sort((a, b) => {
    const dateA = new Date(a.dueDate || a.DueDate || 0);
    const dateB = new Date(b.dueDate || b.DueDate || 0);
    return dateA - dateB;
  });

  container.innerHTML = sortedAssignments
    .map((assignment) => {
      const title = assignment.title || assignment.Title || "Ödev";
      const dueDate = assignment.dueDate || assignment.DueDate;
      const className = assignment.className || assignment.ClassName || "";
      const description = assignment.description || assignment.Description || "";
      const assignmentId = assignment.id || assignment.Id;
      
      let dueDateStr = "-";
      if (dueDate) {
        try {
          const date = new Date(dueDate);
          dueDateStr = date.toLocaleDateString("tr-TR", { 
            day: "2-digit", 
            month: "2-digit", 
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
        } catch (e) {
          console.warn("Tarih parse hatası:", e);
        }
      }

      return `
        <div class="assignment-card" style="margin-bottom: 1rem; cursor: pointer;" onclick="window.location.href='assignments.html?assignmentId=${assignmentId}'">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong style="font-size: 1.1rem; color: var(--text-primary);">📝 ${title}</strong>
            <span style="font-size: 0.85rem; color: var(--primary); font-weight: 600;">Teslim Tarihi</span>
          </div>
          ${className ? `<div style="margin-bottom: 0.5rem;"><span style="font-size: 0.9rem; color: var(--text-secondary);">👥 ${className}</span></div>` : ''}
          <div style="margin-bottom: 0.5rem;">
            <span style="font-size: 0.95rem; color: var(--text-primary); font-weight: 500;">⏰ ${dueDateStr}</span>
          </div>
          ${description ? `<p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.85rem;">${description.substring(0, 100)}${description.length > 100 ? '...' : ''}</p>` : ''}
        </div>
      `;
    })
    .join("");
};

// Sınıf özetini render et
const renderClassesSummary = () => {
  const classesList = scheduleSelectors.classesList();
  if (!classesList) return;
  
  if (scheduleState.classes.length === 0) {
    classesList.innerHTML = '<p class="empty-text">Henüz hiçbir sınıfa kayıtlı değilsiniz.</p>';
    return;
  }
  
  classesList.innerHTML = scheduleState.classes.map(classItem => {
    const classId = classItem.id || classItem.Id;
    const classSchedules = scheduleState.schedules.filter(s => {
      const scheduleClassId = s.classId || s.ClassId;
      return scheduleClassId === classId;
    });
    const classAssignments = scheduleState.assignments.filter(a => {
      const assignmentClassId = a.classId || a.ClassId;
      return assignmentClassId === classId;
    });
    
    const className = classItem.className || classItem.ClassName || "Sınıf";
    const classCode = classItem.classCode || classItem.ClassCode || "";
    const courseName = classItem.courseName || classItem.CourseName || "Ders";
    const courseCode = classItem.courseCode || classItem.CourseCode || "";
    const currentEnrollment = classItem.currentEnrollment || classItem.CurrentEnrollment || 0;
    
    return `
      <div class="class-card" style="padding: 0.75rem; margin-bottom: 0.75rem;">
        <div class="class-card-header" style="margin-bottom: 0.5rem;">
          <h3 style="font-size: 1rem; margin: 0;">${className}</h3>
          <span class="class-code" style="font-size: 0.85rem;">${classCode}</span>
        </div>
        <div class="class-card-body">
          <div class="class-info" style="margin-bottom: 0.5rem;">
            <span class="class-course" style="font-size: 0.9rem;">📚 ${courseName}</span>
            <span class="class-code-label" style="font-size: 0.85rem;">${courseCode}</span>
          </div>
          <div class="class-stats" style="font-size: 0.85rem;">
            <span class="stat-item">📅 ${classSchedules.length} Schedule</span>
            <span class="stat-item">📝 ${classAssignments.length} Ödev</span>
            <span class="stat-item">👥 ${currentEnrollment} Öğrenci</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
};

// Sayfa başlatma
const initSchedulePage = async () => {
  try {
    requireStudentRole();
    
    // Navigation menüsünü güncelle
    if (typeof updateNavigationByRole === "function") {
      updateNavigationByRole();
    }
    
    // Programı yükle
    await loadSchedule();
    
  } catch (error) {
    console.error("[initSchedulePage] Hata:", error);
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
  const schedulePage = document.querySelector(".schedule-container");
  if (schedulePage) {
    initSchedulePage();
  }
});
