// Ders Planlama Modülü

const lessonPlanState = {
  classes: [],
  lessonPlans: []
};

const lessonPlanSelectors = {
  page: () => document.getElementById("lessonPlanningPage"),
  teacherName: () => document.getElementById("teacherName"),
  logoutButton: () => document.getElementById("logoutButton"),
  planClassSelect: () => document.getElementById("planClassSelect"),
  weeklySchedule: () => document.getElementById("weeklySchedule"),
  lessonPlansList: () => document.getElementById("lessonPlansList"),
  lessonPlanForm: () => document.getElementById("lessonPlanForm"),
  planResult: () => document.getElementById("planResult")
};

const requireInstructorRoleLessonPlan = () => {
  const user = getAuthUser();
  if (!user) {
    throw new Error("Lütfen giriş yapın");
  }
  if ((user.role || "").toLowerCase() !== "instructor" && (user.role || "").toLowerCase() !== "admin") {
    throw new Error("Bu sayfa sadece öğretmenler içindir");
  }
  return user;
};

const lessonPlanHandleUnauthorized = (error) => {
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

const formatDateTime = (value) => {
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

const getDayName = (date) => {
  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  return days[new Date(date).getDay()];
};

const populatePlanClassSelect = (classes = []) => {
  const select = lessonPlanSelectors.planClassSelect();
  if (!select) return;

  select.innerHTML = '<option value="">Sınıf seçiniz</option>';
  classes.forEach((cls) => {
    const option = document.createElement("option");
    option.value = cls.id;
    option.textContent = `${cls.courseCode} - ${cls.className}`;
    select.appendChild(option);
  });
};

const renderWeeklySchedule = (plans = []) => {
  const container = lessonPlanSelectors.weeklySchedule();
  if (!container) return;

  if (!plans.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>Henüz ders planı eklenmemiş</h3>
        <p>Yeni ders planı ekleyerek haftalık programınızı oluşturabilirsiniz.</p>
      </div>
    `;
    return;
  }

  // Bugünün tarihini al
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Bu hafta planlarını filtrele (bugünden sonraki 7 gün)
  const nextWeekDate = new Date(today);
  nextWeekDate.setDate(today.getDate() + 7);

  const upcomingPlans = plans.filter((plan) => {
    const startDate = plan.startDate || plan.StartDate;
    const planDate = new Date(startDate);
    planDate.setHours(0, 0, 0, 0);
    return planDate >= today && planDate <= nextWeekDate;
  });

  // Haftaya göre grupla
  const groupedByWeek = {};
  plans.forEach((plan) => {
    const week = plan.weekNumber || plan.WeekNumber || 1;
    if (!groupedByWeek[week]) {
      groupedByWeek[week] = [];
    }
    groupedByWeek[week].push(plan);
  });

  const weeksHTML = Object.keys(groupedByWeek)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((week) => {
      const weekPlans = groupedByWeek[week];
      const isCurrentWeek = weekPlans.some((plan) => {
        const startDate = plan.startDate || plan.StartDate;
        const planDate = new Date(startDate);
        planDate.setHours(0, 0, 0, 0);
        return planDate >= today && planDate <= nextWeekDate;
      });

      return `
        <div class="week-block ${isCurrentWeek ? 'current-week' : ''}">
          <div class="week-header">
            <h3>📆 Hafta ${week}</h3>
            ${isCurrentWeek ? '<span class="week-badge current">Bu Hafta</span>' : ''}
          </div>
          <div class="week-plans">
            ${weekPlans
              .map(
                (plan) => {
                  const startDate = plan.startDate || plan.StartDate;
                  const endDate = plan.endDate || plan.EndDate;
                  const planDate = new Date(startDate);
                  const isPast = planDate < today;
                  const isToday = planDate.toDateString() === today.toDateString();
                  
                  const topic = plan.topic || plan.Topic || 'Başlıksız';
                  const courseCode = plan.courseCode || plan.CourseCode || '';
                  const className = plan.className || plan.ClassName || 'Sınıf bilgisi yok';
                  const description = plan.description || plan.Description || 'Açıklama yok';
                  
                  return `
                <div class="plan-card ${isPast ? 'past' : ''} ${isToday ? 'today' : ''}">
                  <div class="plan-header">
                    <div class="plan-date-info">
                      <span class="plan-day">${getDayName(startDate)}</span>
                      <span class="plan-time">${formatDateTime(startDate)}</span>
                    </div>
                    ${isToday ? '<span class="plan-badge today-badge">Bugün</span>' : ''}
                    ${isPast ? '<span class="plan-badge past-badge">Geçti</span>' : ''}
                  </div>
                  <h4>${topic}</h4>
                  <p class="plan-class">
                    <span class="icon">🏫</span>
                    ${courseCode} - ${className}
                  </p>
                  <p class="plan-desc">${description}</p>
                  <div class="plan-footer">
                    <span class="plan-duration">
                      <span class="icon">⏱️</span>
                      ${formatDateTime(endDate)}
                    </span>
                  </div>
                </div>
              `;
                }
              )
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = weeksHTML;
};

const renderLessonPlansList = (plans = []) => {
  const container = lessonPlanSelectors.lessonPlansList();
  if (!container) return;

  if (!plans.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>Henüz ders planı eklenmemiş</h3>
        <p>Sol taraftaki formu kullanarak yeni ders planları ekleyebilirsiniz.</p>
      </div>
    `;
    return;
  }

  // Tarihe göre sırala (en yakın önce)
  const sortedPlans = [...plans].sort((a, b) => {
    const dateA = new Date(a.startDate || a.StartDate);
    const dateB = new Date(b.startDate || b.StartDate);
    return dateA - dateB;
  });

  container.innerHTML = sortedPlans
    .map(
      (plan) => {
        const startDate = plan.startDate || plan.StartDate;
        const endDate = plan.endDate || plan.EndDate;
        const planDate = new Date(startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        planDate.setHours(0, 0, 0, 0);
        
        const isPast = planDate < today;
        const isToday = planDate.toDateString() === today.toDateString();
        const isUpcoming = planDate > today;

        const weekNumber = plan.weekNumber || plan.WeekNumber || '?';
        const topic = plan.topic || plan.Topic || 'Başlıksız Ders Planı';
        const courseCode = plan.courseCode || plan.CourseCode || '';
        const className = plan.className || plan.ClassName || 'Sınıf bilgisi yok';
        const description = plan.description || plan.Description || 'Açıklama eklenmemiş';

        return `
      <div class="lesson-plan-item ${isPast ? 'past-item' : ''} ${isToday ? 'today-item' : ''} ${isUpcoming ? 'upcoming-item' : ''}">
        <div class="plan-item-header">
          <div class="plan-week-badge">
            <span class="week-number">Hafta ${weekNumber}</span>
          </div>
          ${isToday ? '<span class="status-badge today-status">Bugün</span>' : ''}
          ${isPast ? '<span class="status-badge past-status">Tamamlandı</span>' : ''}
          ${isUpcoming ? '<span class="status-badge upcoming-status">Yaklaşan</span>' : ''}
        </div>
        <div class="plan-info">
          <h4>${topic}</h4>
          <p class="plan-meta">
            <span class="meta-item">
              <span class="meta-icon">🏫</span>
              ${courseCode} - ${className}
            </span>
          </p>
          <p class="plan-description">${description}</p>
          <div class="plan-date-info">
            <div class="date-item">
              <span class="date-label">🕐 Başlangıç:</span>
              <span class="date-value">${formatDateTime(startDate)}</span>
            </div>
            <div class="date-item">
              <span class="date-label">🕐 Bitiş:</span>
              <span class="date-value">${formatDateTime(endDate)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
      }
    )
    .join("");
};

const loadTeacherClassesForPlan = async () => {
  const select = lessonPlanSelectors.planClassSelect();
  if (select) {
    select.innerHTML = '<option value="">Sınıflar yükleniyor...</option>';
  }

  try {
    const response = await apiFetch("/Class/my-classes");
    // API response'u normalize et
    let classes = [];
    if (Array.isArray(response)) {
      classes = response;
    } else if (response?.data && Array.isArray(response.data)) {
      classes = response.data;
    } else if (response?.Data && Array.isArray(response.Data)) {
      classes = response.Data;
    }
    
    lessonPlanState.classes = classes;
    populatePlanClassSelect(lessonPlanState.classes);
  } catch (error) {
    if (lessonPlanHandleUnauthorized(error)) return;
    if (select) {
      select.innerHTML = `<option value="">Sınıflar alınamadı (${error.message})</option>`;
    }
  }
};

const loadLessonPlans = async () => {
  const listContainer = lessonPlanSelectors.lessonPlansList();
  const scheduleContainer = lessonPlanSelectors.weeklySchedule();
  
  // Loading durumunu göster
  if (listContainer) {
    listContainer.innerHTML = `
      <div class="loading-placeholder">
        <div class="loading-spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    `;
  }
  if (scheduleContainer) {
    scheduleContainer.innerHTML = `
      <div class="loading-placeholder">
        <div class="loading-spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    `;
  }

  try {
    console.log("[loadLessonPlans] Ders planları yükleniyor...");
    const response = await apiFetch("/LessonPlan");
    console.log("[loadLessonPlans] API Response:", response);
    
    // apiFetch zaten Result wrapper'ı normalize ediyor, direkt array veya null dönebilir
    let plans = [];
    if (Array.isArray(response)) {
      plans = response;
    } else if (response && typeof response === 'object') {
      // Eğer hala wrapper içindeyse
      if (Array.isArray(response.data)) {
        plans = response.data;
      } else if (Array.isArray(response.Data)) {
        plans = response.Data;
      }
    }
    
    console.log("[loadLessonPlans] Normalize edilmiş planlar:", plans);
    lessonPlanState.lessonPlans = plans || [];
    
    // Boş liste normal bir durum, hata değil - render fonksiyonları boş durumu handle ediyor
    renderLessonPlansList(lessonPlanState.lessonPlans);
    renderWeeklySchedule(lessonPlanState.lessonPlans);
  } catch (error) {
    // 500 hatası durumunda boş liste olarak devam et (migration yapılmamış olabilir)
    if (error.status === 500) {
      console.warn("[loadLessonPlans] 500 hatası - Migration yapılmamış olabilir. Boş liste ile devam ediliyor.");
      lessonPlanState.lessonPlans = [];
      renderLessonPlansList([]);
      renderWeeklySchedule([]);
      return;
    }
    if (lessonPlanHandleUnauthorized(error)) return;
    
    console.error("[loadLessonPlans] Hata:", error);
    
    // Hata mesajını detaylı şekilde çıkar
    let errorMessage = "Beklenmeyen bir hata oluştu";
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response) {
      if (typeof error.response === 'string') {
        errorMessage = error.response;
      } else if (error.response.message) {
        errorMessage = error.response.message;
      } else if (Array.isArray(error.response.errors) && error.response.errors.length > 0) {
        errorMessage = error.response.errors[0];
      }
    } else if (error.status === 404 || error.status === 500) {
      // 404 veya 500 hatası - muhtemelen migration yapılmamış veya tablo yok
      // Boş liste ile devam et
      console.warn("[loadLessonPlans] HTTP", error.status, "hatası - Boş liste ile devam ediliyor");
      lessonPlanState.lessonPlans = [];
      renderLessonPlansList([]);
      renderWeeklySchedule([]);
      return;
    }
    
    // Her iki container için de hata mesajı göster
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Ders planları yüklenemedi</h3>
          <p style="color:red">${errorMessage}</p>
        </div>
      `;
    }
    
    if (scheduleContainer) {
      scheduleContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Haftalık program yüklenemedi</h3>
          <p style="color:red">${errorMessage}</p>
        </div>
      `;
    }
  }
};

const handleLessonPlanSubmit = async (event) => {
  event.preventDefault();

  const form = lessonPlanSelectors.lessonPlanForm();
  if (!form) return;

  const classId = parseInt(lessonPlanSelectors.planClassSelect()?.value || "", 10);
  const weekNumber = parseInt(document.getElementById("weekNumber")?.value || "1", 10);
  const topic = document.getElementById("lessonTopic")?.value.trim();
  const description = document.getElementById("lessonDescription")?.value.trim();
  const startDate = document.getElementById("startDate")?.value;
  const endDate = document.getElementById("endDate")?.value;
  const resultContainer = lessonPlanSelectors.planResult();

  if (!classId || !topic || !description || !startDate || !endDate) {
    showToast("Lütfen tüm alanları doldurun", true);
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Ekleniyor...";
  }

  try {
    console.log("[handleLessonPlanSubmit] Ders planı oluşturuluyor...", {
      classId,
      weekNumber,
      topic,
      description,
      startDate,
      endDate
    });

    // Tarih validasyonu
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime())) {
      throw new Error("Geçerli bir başlangıç tarihi seçiniz");
    }
    
    if (isNaN(endDateObj.getTime())) {
      throw new Error("Geçerli bir bitiş tarihi seçiniz");
    }
    
    if (endDateObj <= startDateObj) {
      throw new Error("Bitiş tarihi başlangıç tarihinden sonra olmalıdır");
    }

    const body = {
      classId,
      weekNumber,
      topic,
      description,
      startDate: startDateObj.toISOString(),
      endDate: endDateObj.toISOString()
    };

    console.log("[handleLessonPlanSubmit] Request body:", body);

    await apiFetch("/LessonPlan", {
      method: "POST",
      body
    });
    
    console.log("[handleLessonPlanSubmit] Başarılı!");

    showToast("✅ Ders planı başarıyla eklendi");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green; padding: 1rem; background: #e8f5e9; border-radius: 8px;'>✅ Yeni ders planı eklendi.</p>";
    }
    
    // Formu temizle
    form.reset();
    
    // Sınıf select'ini yeniden yükle
    populatePlanClassSelect(lessonPlanState.classes);
    
    // Planları yeniden yükle
    await loadLessonPlans();
  } catch (error) {
    if (lessonPlanHandleUnauthorized(error)) return;
    
    // Hata detaylarını logla
    console.error("[handleLessonPlanSubmit] ❌ Hata detayları:", {
      error: error,
      message: error.message,
      response: error.response,
      status: error.status,
      stack: error.stack
    });
    
    // Hata mesajını daha açıklayıcı hale getir
    let errorMessage = "Ders planı eklenemedi";
    
    // Önce error.message kontrol et
    if (error.message && error.message !== "Ders planı eklenemedi" && error.message !== "Beklenmeyen bir hata oluştu") {
      errorMessage = error.message;
    }
    
    // Sonra error.response kontrol et (öncelikli)
    if (error.response) {
      console.log("[handleLessonPlanSubmit] error.response:", error.response);
      
      if (typeof error.response === 'string') {
        errorMessage = error.response;
      } else if (error.response.message) {
        errorMessage = error.response.message;
      } else if (error.response.Message) {
        errorMessage = error.response.Message;
      } else if (Array.isArray(error.response.errors) && error.response.errors.length > 0) {
        errorMessage = error.response.errors[0];
      } else if (Array.isArray(error.response.Errors) && error.response.Errors.length > 0) {
        errorMessage = error.response.Errors[0];
      }
    }
    
    // Status code'a göre mesaj belirle
    if (error.status === 400) {
      // BadRequest - backend'den gelen mesajı kullan, yoksa default mesaj
      if (!errorMessage || errorMessage === "Ders planı eklenemedi" || errorMessage === "Beklenmeyen bir hata oluştu") {
        errorMessage = "İstek verisi geçersiz. Lütfen tüm alanları kontrol ediniz.";
      }
    } else if (error.status === 401) {
      errorMessage = "Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapınız.";
    } else if (error.status === 403) {
      errorMessage = "Bu işlem için yetkiniz bulunmamaktadır.";
    } else if (error.status === 404) {
      errorMessage = "Seçilen sınıf bulunamadı. Lütfen geçerli bir sınıf seçiniz.";
    } else if (error.status === 500) {
      // 500 hatası - migration yapılmamış olabilir
      console.warn("[handleLessonPlanSubmit] 500 hatası - Detaylı hata bilgisi:", error);
      if (errorMessage && (errorMessage.includes("migration") || errorMessage.includes("tablo") || errorMessage.includes("table") || errorMessage.includes("LessonPlans"))) {
        // Migration mesajını koru
      } else {
        // Backend'den gelen hata mesajını kontrol et
        if (error.response && error.response.message) {
          errorMessage = error.response.message;
        } else if (error.response && Array.isArray(error.response.errors) && error.response.errors.length > 0) {
          errorMessage = error.response.errors[0];
        } else {
          errorMessage = "Sunucu hatası oluştu. Ders planları tablosu henüz oluşturulmamış olabilir. Migration yapmanız gerekebilir.";
        }
      }
    }
    
    // Türkçe hata mesajları için özel çeviriler
    if (errorMessage.toLowerCase().includes("not found") || errorMessage.includes("bulunamadı")) {
      if (!errorMessage.includes("sınıf") && !errorMessage.includes("migration")) {
        errorMessage = "Seçilen sınıf bulunamadı. Lütfen geçerli bir sınıf seçiniz.";
      }
    } else if (errorMessage.toLowerCase().includes("unauthorized") || errorMessage.includes("yetkisiz") || errorMessage.includes("yetkiniz")) {
      if (!errorMessage.includes("yetkiniz")) {
        errorMessage = "Bu işlem için yetkiniz bulunmamaktadır.";
      }
    } else if (errorMessage.toLowerCase().includes("validation") || errorMessage.includes("doğrulama") || errorMessage.includes("geçersiz")) {
      if (!errorMessage.includes("Lütfen") && !errorMessage.includes("migration")) {
        errorMessage = "Lütfen tüm alanları doğru şekilde doldurunuz.";
      }
    }
    
    // Eğer hala generic mesaj ise, daha açıklayıcı bir mesaj ver
    if (errorMessage === "Ders planı eklenemedi" || errorMessage === "Beklenmeyen bir hata oluştu" || !errorMessage || errorMessage.trim() === "") {
      errorMessage = "Ders planı eklenirken bir hata oluştu. Lütfen tüm alanları kontrol edip tekrar deneyiniz. Hata devam ederse yöneticiye bildirin.";
    }
    
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red; padding: 1rem; background: #ffe6e6; border-radius: 8px;'>❌ ${errorMessage}</p>`;
    }
    showToast(errorMessage, true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Ders Planı Ekle";
    }
  }
};

const updateTeacherWelcomePlan = () => {
  const user = getAuthUser();
  const nameEl = lessonPlanSelectors.teacherName();
  if (user && nameEl) {
    nameEl.textContent = `${user.fullName || user.email} - Ders Planlama`;
  }
};

const bindLessonPlanEvents = () => {
  const logoutButton = lessonPlanSelectors.logoutButton();
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearAuthSession();
      window.location.href = "index.html";
    });
  }

  const form = lessonPlanSelectors.lessonPlanForm();
  if (form) {
    form.addEventListener("submit", handleLessonPlanSubmit);
  }
};

const initLessonPlanning = async () => {
  try {
    requireInstructorRoleLessonPlan();
  } catch (error) {
    showToast(error.message, true);
    window.location.href = "login.html";
    return;
  }

  // Navigation menüsünü rol bazlı güncelle
  if (typeof updateNavigationByRole === "function") {
    updateNavigationByRole();
  }

  bindLessonPlanEvents();
  updateTeacherWelcomePlan();
  await Promise.all([loadTeacherClassesForPlan(), loadLessonPlans()]);
};

document.addEventListener("DOMContentLoaded", () => {
  const page = lessonPlanSelectors.page();
  if (!page) return;
  initLessonPlanning();
});

