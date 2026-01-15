// Create Schedule Modülü (Instructor)

const createScheduleState = {
  classId: null,
  className: null,
  selectedDay: 1 // Pazartesi
};

const createScheduleSelectors = {
  page: () => document.getElementById("createSchedulePage"),
  form: () => document.getElementById("createScheduleForm"),
  daysContainer: () => document.getElementById("daysContainer"),
  startTime: () => document.getElementById("startTime"),
  endTime: () => document.getElementById("endTime"),
  roomNumber: () => document.getElementById("roomNumber"),
  building: () => document.getElementById("building"),
  notes: () => document.getElementById("notes"),
  // ✅ KALDIRILDI: isActive selector kaldırıldı
  result: () => document.getElementById("createScheduleResult"),
  submitBtn: () => document.getElementById("createScheduleSubmitBtn"),
  classInfoText: () => document.getElementById("classInfoText")
};

const requireInstructorRoleCreateSchedule = () => {
  const user = getAuthUser();
  if (!user) {
    throw new Error("Lütfen giriş yapın");
  }
  if ((user.role || "").toLowerCase() !== "instructor" && (user.role || "").toLowerCase() !== "admin") {
    throw new Error("Bu sayfa sadece öğretmenler içindir");
  }
  return user;
};

const createScheduleHandleUnauthorized = (error) => {
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
const getCreateScheduleUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const classId = parseInt(params.get("classId"), 10);
  const className = params.get("className") || "Sınıf";
  return { classId, className };
};

// Gün butonlarını render et
const renderDayButtons = () => {
  const container = createScheduleSelectors.daysContainer();
  if (!container) return;

  const days = [
    { value: 0, label: 'Pazar' },
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' },
  ];

  container.innerHTML = days
    .map((day) => {
      const isSelected = createScheduleState.selectedDay === day.value;
      return `
        <button type="button" 
                class="day-button" 
                data-day="${day.value}"
                style="padding: 0.75rem 1.25rem; border-radius: 8px; border: 2px solid var(--border); background: ${isSelected ? 'var(--primary)' : 'white'}; color: ${isSelected ? 'white' : 'var(--text-primary)'}; font-weight: 600; cursor: pointer; transition: all 0.3s;"
                onclick="selectDay(${day.value})">
          ${day.label}
        </button>
      `;
    })
    .join("");
};

// Gün seç
window.selectDay = (dayValue) => {
  createScheduleState.selectedDay = dayValue;
  renderDayButtons();
};

// TimeSpan formatını doğrula ve düzelt (HH:mm -> HH:mm:ss)
const validateAndFormatTime = (time) => {
  // "HH:mm" formatını kontrol et
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return null;
  }
  
  // "HH:mm:ss" formatına çevir (saniyeleri ekle)
  const parts = time.split(':');
  const hours = parts[0].padStart(2, '0'); // Tek haneli saatleri 0 ile doldur
  const minutes = parts[1];
  return `${hours}:${minutes}:00`;
};

// Form submit handler
const handleCreateSchedule = async (event) => {
  event.preventDefault();

  const form = createScheduleSelectors.form();
  const resultContainer = createScheduleSelectors.result();
  const submitBtn = createScheduleSelectors.submitBtn();

  if (!form) return;

  // Form değerlerini al
  const startTime = createScheduleSelectors.startTime()?.value.trim();
  const endTime = createScheduleSelectors.endTime()?.value.trim();
  const roomNumber = createScheduleSelectors.roomNumber()?.value.trim();
  const building = createScheduleSelectors.building()?.value.trim();
  const notes = createScheduleSelectors.notes()?.value.trim();
  // ✅ DEĞİŞTİRİLDİ: Her zaman aktif olarak gönder
  const isActive = true;

  // Validasyon
  if (!startTime || !endTime) {
    showToast("Başlangıç ve bitiş saati gereklidir", true);
    return;
  }

  // TimeSpan formatını doğrula ve düzelt
  const startTimeSpan = validateAndFormatTime(startTime);
  const endTimeSpan = validateAndFormatTime(endTime);

  if (!startTimeSpan || !endTimeSpan) {
    showToast("Saat formatı hatalı. Lütfen HH:mm formatında girin (örn: 09:00, 14:30)", true);
    return;
  }

  // Submit butonunu devre dışı bırak
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Oluşturuluyor...";
  }

  // Result container'ı temizle
  if (resultContainer) {
    resultContainer.innerHTML = "";
  }

  try {
    // Payload'u hazırla
    const payload = {
      classId: createScheduleState.classId,
      dayOfWeek: createScheduleState.selectedDay,
      startTime: startTimeSpan,  // "09:00:00" formatında
      endTime: endTimeSpan,      // "10:30:00" formatında
      roomNumber: roomNumber && roomNumber.trim() !== '' ? roomNumber.trim() : null,
      building: building && building.trim() !== '' ? building.trim() : null,
      notes: notes && notes.trim() !== '' ? notes.trim() : null,
      isActive: true, // ✅ DEĞİŞTİRİLDİ: Her zaman aktif olarak gönder
    };

    console.log('📤 Schedule payload:', JSON.stringify(payload, null, 2));

    const response = await apiFetch("/ClassSchedule", {
      method: "POST",
      body: payload
    });

    console.log('✅ Schedule oluşturuldu:', response);

    showToast("Schedule başarıyla oluşturuldu! 🎉");
    
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green; font-weight:bold; padding: 1rem; background: #e8f5e9; border-radius: 8px;'>✅ Schedule başarıyla oluşturuldu!</p>";
    }

    // 1.5 saniye sonra schedule listesine yönlendir
    setTimeout(() => {
      window.location.href = `class_schedules.html?classId=${createScheduleState.classId}&className=${encodeURIComponent(createScheduleState.className || "Sınıf")}`;
    }, 1500);

  } catch (error) {
    console.error('❌ Schedule oluşturma hatası:', error);
    
    if (createScheduleHandleUnauthorized(error)) return;

    // Daha detaylı hata mesajı
    let errorMessage = 'Schedule oluşturulamadı';
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors;
      errorMessage = Object.keys(errors)
        .map(key => `${key}: ${errors[key].join(', ')}`)
        .join('\n');
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showToast(errorMessage, true);
    
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red; font-weight:bold; padding: 1rem; background: #ffebee; border-radius: 8px;'>❌ ${errorMessage}</p>`;
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Schedule Oluştur";
    }
  }
};

// Sayfa başlatma
const initCreateSchedulePage = async () => {
  try {
    requireInstructorRoleCreateSchedule();

    // Navigation menüsünü güncelle
    if (typeof updateNavigationByRole === "function") {
      updateNavigationByRole();
    }

    // URL parametrelerinden classId ve className'i al
    const { classId, className } = getCreateScheduleUrlParams();
    if (!classId) {
      throw new Error("Sınıf ID bulunamadı");
    }

    createScheduleState.classId = classId;
    createScheduleState.className = className;

    // Class bilgisini göster
    const classInfoText = createScheduleSelectors.classInfoText();
    if (classInfoText) {
      classInfoText.textContent = `📚 ${className}`;
    }

    // Gün butonlarını render et
    renderDayButtons();

    // Form submit event'ini bağla
    const form = createScheduleSelectors.form();
    if (form) {
      form.addEventListener("submit", handleCreateSchedule);
    }

  } catch (error) {
    console.error("[initCreateSchedulePage] Hata:", error);
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
  const page = createScheduleSelectors.page();
  if (page) {
    initCreateSchedulePage();
  }
});
