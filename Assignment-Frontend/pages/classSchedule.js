// Öğrenci Ders Programı Modülü

const scheduleState = {
  currentWeekStart: null,
  lessonPlans: [],
  classes: [],
  currentWeekNumber: 1
};

const scheduleSelectors = {
  loadingIndicator: () => document.getElementById("loadingIndicator"),
  scheduleContent: () => document.getElementById("scheduleContent"),
  emptyState: () => document.getElementById("emptyState"),
  errorState: () => document.getElementById("errorState"),
  errorMessage: () => document.getElementById("errorMessage"),
  currentWeekText: () => document.getElementById("currentWeekText"),
  prevWeekBtn: () => document.getElementById("prevWeekBtn"),
  nextWeekBtn: () => document.getElementById("nextWeekBtn"),
  currentWeekBtn: () => document.getElementById("currentWeekBtn"),
  classesList: () => document.getElementById("classesList"),
  timeSlots: () => document.querySelector(".time-slots"),
  daySlots: () => document.querySelectorAll(".day-slots")
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

// Hafta başlangıç tarihini hesapla (Pazartesi)
const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi'ye git
  return new Date(d.setDate(diff));
};

// Hafta numarasını hesapla
const getWeekNumber = (date = new Date()) => {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - start) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
};

// Tarih formatla (saat)
const formatTime = (dateString) => {
  if (!dateString) return "";
  try {
    // UTC string'ini Türkiye saatine çevir
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    // UTC'yi Türkiye saatine çevir (UTC+3)
    const utcTime = date.getTime();
    const turkishOffset = 3 * 60 * 60 * 1000; // UTC+3
    const turkishTime = new Date(utcTime + turkishOffset);
    
    return turkishTime.toLocaleTimeString("tr-TR", { 
      hour: "2-digit", 
      minute: "2-digit",
      timeZone: "Europe/Istanbul"
    });
  } catch {
    return "";
  }
};

// Tarih formatla (gün/ay)
const formatDateShort = (dateString) => {
  if (!dateString) return "";
  try {
    if (typeof window.formatDateTurkish === 'function') {
      const formatted = window.formatDateTurkish(dateString);
      return formatted.split(' ')[0]; // Sadece tarih kısmı
    }
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
};

// Saat slotları oluştur (08:00 - 18:00)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

// Gün adını döndür (0=Pazar, 1=Pazartesi, ...)
const getDayName = (date) => {
  const days = ["pazar", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[date.getDay()];
};

// Haftanın günlerini döndür (Pazartesi-Cuma)
const getWeekDays = (weekStart) => {
  const days = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    days.push({
      date: new Date(date),
      name: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"][i],
      key: ["monday", "tuesday", "wednesday", "thursday", "friday"][i]
    });
  }
  return days;
};

// Ders planını zaman slotuna yerleştir
const getTimeSlotIndex = (timeString) => {
  if (!timeString) return -1;
  try {
    const [hours] = timeString.split(':');
    const hour = parseInt(hours, 10);
    if (hour >= 8 && hour <= 18) {
      return hour - 8;
    }
  } catch {
    return -1;
  }
  return -1;
};

// Ders programını yükle
const loadSchedule = async () => {
  const loadingIndicator = scheduleSelectors.loadingIndicator();
  const scheduleContent = scheduleSelectors.scheduleContent();
  const emptyState = scheduleSelectors.emptyState();
  const errorState = scheduleSelectors.errorState();
  
  // Loading göster
  if (loadingIndicator) loadingIndicator.style.display = "block";
  if (scheduleContent) scheduleContent.style.display = "none";
  if (emptyState) emptyState.style.display = "none";
  if (errorState) errorState.style.display = "none";

  try {
    requireStudentRole();
    
    console.log("[loadSchedule] 📅 Ders programı yükleniyor...");
    console.log("[loadSchedule] 📅 API çağrısı yapılıyor: /LessonPlan/my-schedule");
    
    const response = await apiFetch("/LessonPlan/my-schedule");
    
    // Debug: Response'un tamamını logla
    console.log("═══════════════════════════════════════════");
    console.log("[loadSchedule] 🔍 API Response Type:", typeof response);
    console.log("[loadSchedule] 🔍 API Response:", response);
    console.log("[loadSchedule] 🔍 API Response (JSON):", JSON.stringify(response, null, 2));
    console.log("═══════════════════════════════════════════");
    
    // Backend'den direkt object geliyor: { lessonPlans: [...], classes: [...] }
    // apiFetch normalize ediyor, ama bu endpoint Result wrapper döndürmüyor, direkt object döndürüyor
    let lessonPlans = [];
    let classes = [];
    
    if (response) {
      // Direkt object formatı (normalize edilmiş)
      if (typeof response === 'object' && !Array.isArray(response)) {
        // lessonPlans için - hem camelCase hem PascalCase
        if (Array.isArray(response.lessonPlans)) {
          lessonPlans = response.lessonPlans;
        } else if (Array.isArray(response.LessonPlans)) {
          lessonPlans = response.LessonPlans;
        } else if (response.data && Array.isArray(response.data.lessonPlans)) {
          lessonPlans = response.data.lessonPlans;
        }
        
        // classes için - hem camelCase hem PascalCase
        if (Array.isArray(response.classes)) {
          classes = response.classes;
        } else if (Array.isArray(response.Classes)) {
          classes = response.Classes;
        } else if (response.data && Array.isArray(response.data.classes)) {
          classes = response.data.classes;
        }
      }
      // Eğer array ise (yanlış format)
      else if (Array.isArray(response)) {
        console.warn("[loadSchedule] ⚠️ Response direkt array - beklenmeyen format");
        lessonPlans = [];
        classes = [];
      }
    }
    
    scheduleState.lessonPlans = lessonPlans;
    scheduleState.classes = classes;
    
    console.log("[loadSchedule] ✅ Lesson Plans Count:", scheduleState.lessonPlans.length);
    console.log("[loadSchedule] ✅ Classes Count:", scheduleState.classes.length);
    
    if (scheduleState.lessonPlans.length > 0) {
      console.log("[loadSchedule] 📚 İlk ders planı:", scheduleState.lessonPlans[0]);
    }
    
    if (scheduleState.classes.length > 0) {
      console.log("[loadSchedule] 🏫 İlk sınıf:", scheduleState.classes[0]);
    }
    
    // Her zaman programı render et - sınıflar varsa bile ders planı olmasa da göster
    renderSchedule();
    renderClassesSummary();
    
    if (loadingIndicator) loadingIndicator.style.display = "none";
    
    // Eğer hem sınıf hem de ders planı yoksa boş durum göster
    if (scheduleState.classes.length === 0 && scheduleState.lessonPlans.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
        // Boş durum mesajını güncelle
        const emptyTitle = emptyState.querySelector("h3");
        const emptyText = emptyState.querySelector("p");
        if (emptyTitle) {
          emptyTitle.textContent = "Henüz sınıfa kayıtlı değilsiniz";
        }
        if (emptyText) {
          emptyText.textContent = "Ders programınızı görmek için önce bir sınıfa kayıt olmanız gerekiyor. Öğretmeniniz sizi bir sınıfa eklediğinde burada görünecektir.";
        }
      }
      if (scheduleContent) scheduleContent.style.display = "none";
    } else {
      // Sınıflar varsa programı göster (ders planı olsa da olmasa da)
      if (scheduleContent) scheduleContent.style.display = "block";
      if (emptyState) emptyState.style.display = "none";
      
      // Eğer ders planı yoksa ama sınıf varsa, bilgilendirme mesajı ekle
      if (scheduleState.lessonPlans.length === 0 && scheduleState.classes.length > 0) {
        console.log("[loadSchedule] ⚠️ Sınıflar var ama ders planı yok");
        const scheduleContentEl = scheduleSelectors.scheduleContent();
        if (scheduleContentEl) {
          const infoMsg = document.createElement("div");
          infoMsg.className = "info-message";
          infoMsg.style.cssText = "padding: 1rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; margin-bottom: 1rem; color: #856404;";
          infoMsg.innerHTML = "ℹ️ Kayıtlı olduğunuz sınıflar için henüz ders planı eklenmemiş. Öğretmenleriniz ders planı eklediğinde burada görünecektir.";
          scheduleContentEl.insertBefore(infoMsg, scheduleContentEl.firstChild);
        }
      }
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

// Haftalık programı render et
const renderSchedule = () => {
  const weekStart = scheduleState.currentWeekStart || getWeekStart();
  const weekDays = getWeekDays(weekStart);
  const timeSlots = generateTimeSlots();
  
  // Zaman slotlarını render et
  const timeSlotsEl = scheduleSelectors.timeSlots();
  if (timeSlotsEl) {
    timeSlotsEl.innerHTML = timeSlots.map(time => 
      `<div class="time-slot">${time}</div>`
    ).join("");
  }
  
  // Her gün için slotları temizle ve yeniden oluştur
  weekDays.forEach((day, dayIndex) => {
    const dayColumn = document.querySelector(`[data-day="${day.key}"]`);
    if (!dayColumn) return;
    
    const daySlots = dayColumn.querySelector(".day-slots");
    if (!daySlots) return;
    
    daySlots.innerHTML = timeSlots.map(() => `<div class="lesson-slot" style="position: relative; min-height: 60px;"></div>`).join("");
    
    // Bu güne ait ders planlarını bul ve yerleştir
    const dayPlans = scheduleState.lessonPlans.filter(plan => {
      if (!plan.startDate && !plan.StartDate) return false;
      
      const startDateStr = plan.startDate || plan.StartDate;
      try {
        // UTC string'ini parse et
        const planDate = new Date(startDateStr);
        if (isNaN(planDate.getTime())) {
          console.warn("[renderSchedule] Geçersiz tarih:", startDateStr);
          return false;
        }
        
        // UTC'yi Türkiye saatine çevir (UTC+3)
        const utcTime = planDate.getTime();
        const turkishOffset = 3 * 60 * 60 * 1000;
        const turkishPlanDate = new Date(utcTime + turkishOffset);
        
        // Tarihleri sadece gün/ay/yıl olarak karşılaştır (Türkiye saatine göre)
        const planDay = turkishPlanDate.getDate();
        const planMonth = turkishPlanDate.getMonth();
        const planYear = turkishPlanDate.getFullYear();
        
        const dayDate = day.date;
        const dayDay = dayDate.getDate();
        const dayMonth = dayDate.getMonth();
        const dayYear = dayDate.getFullYear();
        
        const matches = planDay === dayDay && planMonth === dayMonth && planYear === dayYear;
        
        if (matches) {
          console.log(`[renderSchedule] ✅ Plan eşleşti: ${plan.topic || plan.Topic} - ${planDay}/${planMonth + 1}/${planYear} = ${dayDay}/${dayMonth + 1}/${dayYear}`);
        }
        
        return matches;
      } catch (e) {
        console.warn("[renderSchedule] Tarih parse hatası:", e, startDateStr);
        return false;
      }
    });
    
    console.log(`[renderSchedule] ${day.name} için ${dayPlans.length} ders planı bulundu:`, dayPlans);
    
    // Dersleri slot index'lerine göre grupla ve çakışma kontrolü yap
    const plansWithSlots = dayPlans.map(plan => {
      const startDateStr = plan.startDate || plan.StartDate;
      const endDateStr = plan.endDate || plan.EndDate;
      
      if (!startDateStr || !endDateStr) {
        return null;
      }
      
      const startTime = formatTime(startDateStr);
      const endTime = formatTime(endDateStr);
      const slotIndex = getTimeSlotIndex(startTime);
      const endSlotIndex = getTimeSlotIndex(endTime);
      
      // Saat bilgilerini parse et (çakışma kontrolü için)
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + (startMin || 0);
      const endMinutes = endHour * 60 + (endMin || 0);
      
      return {
        plan,
        startTime,
        endTime,
        slotIndex,
        endSlotIndex,
        startMinutes,
        endMinutes,
        duration: Math.max(1, (endSlotIndex >= 0 ? endSlotIndex - slotIndex + 1 : 1))
      };
    }).filter(item => item !== null && item.slotIndex >= 0 && item.slotIndex < timeSlots.length);
    
    // Slot'lara göre grupla
    const plansBySlot = {};
    plansWithSlots.forEach(planData => {
      const slotIndex = planData.slotIndex;
      if (!plansBySlot[slotIndex]) {
        plansBySlot[slotIndex] = [];
      }
      plansBySlot[slotIndex].push(planData);
    });
    
    // Her slot için dersleri render et
    Object.keys(plansBySlot).forEach(slotIndexStr => {
      const slotIndex = parseInt(slotIndexStr, 10);
      const plans = plansBySlot[slotIndex].sort((a, b) => a.startMinutes - b.startMinutes);
      const slots = daySlots.querySelectorAll(".lesson-slot");
      
      if (!slots[slotIndex]) return;
      
      const slotContainer = slots[slotIndex];
      slotContainer.style.position = "relative";
      
      // Çakışma kontrolü yap - aynı slot içindeki dersler çakışıyor mu?
      const overlappingGroups = [];
      let currentGroup = [plans[0]];
      
      for (let i = 1; i < plans.length; i++) {
        const prev = currentGroup[currentGroup.length - 1];
        const curr = plans[i];
        
        // Çakışıyor mu kontrol et (önceki ders bitmeden yeni ders başlıyor mu?)
        if (curr.startMinutes < prev.endMinutes) {
          // Çakışıyor, aynı gruba ekle
          currentGroup.push(curr);
        } else {
          // Çakışmıyor, yeni grup başlat
          overlappingGroups.push(currentGroup);
          currentGroup = [curr];
        }
      }
      overlappingGroups.push(currentGroup); // Son grubu ekle
      
      // En uzun süreli dersin yüksekliğini hesapla
      const maxDuration = Math.max(...plans.map(p => p.duration));
      const slotHeight = maxDuration * 60;
      slotContainer.style.minHeight = `${slotHeight}px`;
      
      // Her grup için dersleri render et
      overlappingGroups.forEach((group, groupIndex) => {
        group.forEach((planData, planIndex) => {
          const { plan, startTime, endTime, duration } = planData;
          
          const planCard = document.createElement("div");
          planCard.className = "lesson-card";
          
          // Eğer grupta birden fazla ders varsa yan yana yerleştir
          if (group.length > 1) {
            planCard.style.position = "absolute";
            planCard.style.top = "0.25rem";
            const cardWidth = `calc(${100 / group.length}% - ${(group.length - 1) * 0.25}rem)`;
            planCard.style.width = cardWidth;
            planCard.style.left = `calc(${planIndex * (100 / group.length)}% + ${planIndex * 0.25}rem)`;
            planCard.style.height = `${duration * 60 - 0.5}px`;
          } else {
            // Tek ders varsa tam genişlik
            planCard.style.position = "absolute";
            planCard.style.top = "0.25rem";
            planCard.style.left = "0.25rem";
            planCard.style.right = "0.25rem";
            planCard.style.height = `${duration * 60 - 0.5}px`;
          }
          
          planCard.style.overflow = "hidden";
          planCard.style.zIndex = groupIndex + 1;
          
          // Renk çeşitliliği için farklı renkler
          const colors = [
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          ];
          planCard.style.background = colors[planIndex % colors.length];
          
          const className = plan.className || plan.ClassName || "Sınıf";
          const topic = plan.topic || plan.Topic || "Konu";
          const description = plan.description || plan.Description || "";
          const courseCode = plan.courseCode || plan.CourseCode || "";
          const weekNumber = plan.weekNumber || plan.WeekNumber || "";
          
          planCard.innerHTML = `
            <div class="lesson-card-header">
              <span class="lesson-time">${startTime} - ${endTime}</span>
              <span class="lesson-class">${className}</span>
            </div>
            <div class="lesson-card-title">${topic}</div>
            ${description ? `<div class="lesson-card-description">${description.substring(0, 50)}${description.length > 50 ? "..." : ""}</div>` : ''}
            <div class="lesson-card-footer">
              <span class="lesson-code">${courseCode}</span>
              <span class="lesson-week">Hafta ${weekNumber}</span>
            </div>
          `;
          
          slotContainer.appendChild(planCard);
        });
      });
    });
  });
  
  // Hafta bilgisini güncelle
  updateWeekIndicator();
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
    const classPlans = scheduleState.lessonPlans.filter(p => {
      const planClassId = p.classId || p.ClassId;
      return planClassId === classId;
    });
    
    const className = classItem.className || classItem.ClassName || "Sınıf";
    const classCode = classItem.classCode || classItem.ClassCode || "";
    const courseName = classItem.courseName || classItem.CourseName || "Ders";
    const courseCode = classItem.courseCode || classItem.CourseCode || "";
    const currentEnrollment = classItem.currentEnrollment || classItem.CurrentEnrollment || 0;
    
    return `
      <div class="class-card">
        <div class="class-card-header">
          <h3>${className}</h3>
          <span class="class-code">${classCode}</span>
        </div>
        <div class="class-card-body">
          <div class="class-info">
            <span class="class-course">📚 ${courseName}</span>
            <span class="class-code-label">${courseCode}</span>
          </div>
          <div class="class-stats">
            <span class="stat-item">📅 ${classPlans.length} Ders Planı</span>
            <span class="stat-item">👥 ${currentEnrollment} Öğrenci</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
};

// Hafta göstergesini güncelle
const updateWeekIndicator = () => {
  const weekStart = scheduleState.currentWeekStart || getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4);
  
  const weekText = scheduleSelectors.currentWeekText();
  if (weekText) {
    const startStr = formatDateShort(weekStart.toISOString());
    const endStr = formatDateShort(weekEnd.toISOString());
    weekText.textContent = `${startStr} - ${endStr}`;
  }
};

// Hafta değiştir
const changeWeek = (direction) => {
  const weekStart = scheduleState.currentWeekStart || getWeekStart();
  const newWeekStart = new Date(weekStart);
  newWeekStart.setDate(weekStart.getDate() + (direction * 7));
  scheduleState.currentWeekStart = newWeekStart;
  renderSchedule();
};

// Bu haftaya git
const goToCurrentWeek = () => {
  scheduleState.currentWeekStart = getWeekStart();
  renderSchedule();
};

// Event listeners
const bindScheduleEvents = () => {
  const prevWeekBtn = scheduleSelectors.prevWeekBtn();
  const nextWeekBtn = scheduleSelectors.nextWeekBtn();
  const currentWeekBtn = scheduleSelectors.currentWeekBtn();
  
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener("click", () => changeWeek(-1));
  }
  
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener("click", () => changeWeek(1));
  }
  
  if (currentWeekBtn) {
    currentWeekBtn.addEventListener("click", goToCurrentWeek);
  }
};

// Sayfa başlatma
const initSchedulePage = async () => {
  try {
    requireStudentRole();
    
    // Navigation menüsünü güncelle
    if (typeof updateNavigationByRole === "function") {
      updateNavigationByRole();
    }
    
    // İlk hafta başlangıcını ayarla
    scheduleState.currentWeekStart = getWeekStart();
    
    // Event'leri bağla
    bindScheduleEvents();
    
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

