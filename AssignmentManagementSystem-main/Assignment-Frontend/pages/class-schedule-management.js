const scheduleManagementState = {
  classes: [],
  selectedClassId: null,
  schedules: []
};

const scheduleManagementSelectors = {
  page: () => document.getElementById("scheduleManagementPage"),
  classSelect: () => document.getElementById("classSelect"),
  schedulesSection: () => document.getElementById("schedulesSection"),
  selectedClassName: () => document.getElementById("selectedClassName"),
  schedulesList: () => document.getElementById("schedulesList"),
  createScheduleModal: () => document.getElementById("createScheduleModal"),
  createScheduleForm: () => document.getElementById("createScheduleForm"),
  scheduleClassId: () => document.getElementById("scheduleClassId"),
  scheduleFormResult: () => document.getElementById("scheduleFormResult")
};

const requireInstructorRole = () => {
  const user = getAuthUser();
  if (!user) {
    throw new Error("Lütfen giriş yapın");
  }
  if ((user.role || "").toLowerCase() !== "instructor" && (user.role || "").toLowerCase() !== "admin") {
    throw new Error("Bu sayfa sadece öğretmenler içindir");
  }
  return user;
};

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

const dayNames = {
  1: "Pazartesi",
  2: "Salı",
  3: "Çarşamba",
  4: "Perşembe",
  5: "Cuma"
};

const formatTime = (timeString) => {
  if (!timeString) return "-";
  try {
    // "HH:mm:ss" formatından "HH:mm" formatına çevir
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  } catch {
    return timeString;
  }
};

const renderSchedulesList = (schedules = []) => {
  const container = scheduleManagementSelectors.schedulesList();
  if (!container) return;

  if (!schedules.length) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📅</div>
        <p style="font-size: 1.2rem; color: #666;">Henüz ders programı eklenmemiş</p>
      </div>
    `;
    return;
  }

  container.innerHTML = schedules
    .map((schedule) => {
      const scheduleId = schedule.id || schedule.Id;
      const dayOfWeek = schedule.dayOfWeek || schedule.dayOfWeek || schedule.DayOfWeek || 1;
      const startTime = formatTime(schedule.startTime || schedule.StartTime);
      const endTime = formatTime(schedule.endTime || schedule.EndTime);
      const roomNumber = schedule.roomNumber || schedule.RoomNumber || "-";
      const building = schedule.building || schedule.Building || "-";
      const notes = schedule.notes || schedule.Notes || "";
      const isActive = schedule.isActive !== undefined ? schedule.isActive : (schedule.IsActive !== undefined ? schedule.IsActive : true);
      
      return `
        <div class="assignment-card">
          <div class="assignment-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <strong>${dayNames[dayOfWeek] || "Gün"}</strong>
              <p style="margin-top: 0.5rem; color: #666;">
                ⏰ ${startTime} - ${endTime}
              </p>
            </div>
            <div>
              ${isActive ? 
                '<span style="background: #4CAF50; color: white; padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">✅ Aktif</span>' : 
                '<span style="background: #ccc; color: white; padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">❌ Pasif</span>'
              }
            </div>
          </div>
          
          <div class="assignment-info" style="margin-top: 1rem;">
            <p><small>🏢 Bina: ${building}</small></p>
            <p><small>🚪 Derslik: ${roomNumber}</small></p>
            ${notes ? `<p><small>📝 Notlar: ${notes}</small></p>` : ''}
          </div>
          
          <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
            <button class="btn-secondary" onclick="editSchedule(${scheduleId})" style="flex: 1;">Düzenle</button>
            <button class="btn-danger" onclick="deleteSchedule(${scheduleId})" style="flex: 1; background: #f44336;">Sil</button>
          </div>
        </div>
      `;
    })
    .join("");
};

const loadClasses = async () => {
  const select = scheduleManagementSelectors.classSelect();
  
  if (select) {
    select.innerHTML = '<option value="">Yükleniyor...</option>';
  }

  try {
    const response = await apiFetch("/Class/my-classes");
    const classes = Array.isArray(response) ? response : (response?.data || response?.Data || []);
    
    scheduleManagementState.classes = classes;
    
    if (select) {
      select.innerHTML = '<option value="">Sınıf seçiniz...</option>';
      classes.forEach((cls) => {
        const option = document.createElement("option");
        option.value = cls.id || cls.Id;
        option.textContent = `${cls.className || cls.ClassName} (${cls.courseCode || cls.CourseCode || ""})`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error("[loadClasses] Hata:", error);
    if (handleUnauthorized(error)) return;
    
    if (select) {
      select.innerHTML = '<option value="">Sınıflar yüklenemedi</option>';
    }
    showToast(error.message || "Sınıflar yüklenirken hata oluştu", true);
  }
};

const loadSchedules = async (classId) => {
  const container = scheduleManagementSelectors.schedulesList();
  const section = scheduleManagementSelectors.schedulesSection();
  
  if (!classId) {
    if (section) section.style.display = "none";
    return;
  }

  if (section) section.style.display = "block";
  if (container) {
    container.innerHTML = "<p>Yükleniyor...</p>";
  }

  try {
    const response = await apiFetch(`/ClassSchedule/class/${classId}`);
    const schedules = Array.isArray(response) ? response : (response?.data || response?.Data || []);
    
    scheduleManagementState.schedules = schedules;
    
    // Seçili sınıf adını göster
    const selectedClass = scheduleManagementState.classes.find(c => (c.id || c.Id) == classId);
    const classNameEl = scheduleManagementSelectors.selectedClassName();
    if (classNameEl && selectedClass) {
      classNameEl.textContent = `${selectedClass.className || selectedClass.ClassName} - Ders Programı`;
    }
    
    renderSchedulesList(schedules);
  } catch (error) {
    console.error("[loadSchedules] Hata:", error);
    if (handleUnauthorized(error)) return;
    
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message || "Ders programı yüklenirken hata oluştu"}</p>`;
    }
    showToast(error.message || "Ders programı yüklenirken hata oluştu", true);
  }
};

const openCreateScheduleModal = () => {
  const modal = scheduleManagementSelectors.createScheduleModal();
  const classIdInput = scheduleManagementSelectors.scheduleClassId();
  const form = scheduleManagementSelectors.createScheduleForm();
  const resultDiv = scheduleManagementSelectors.scheduleFormResult();
  
  if (!scheduleManagementState.selectedClassId) {
    showToast("Lütfen önce bir sınıf seçin", true);
    return;
  }
  
  if (classIdInput) {
    classIdInput.value = scheduleManagementState.selectedClassId;
  }
  
  if (form) {
    form.reset();
    if (classIdInput) classIdInput.value = scheduleManagementState.selectedClassId;
    document.getElementById("scheduleIsActive").checked = true;
  }
  
  if (resultDiv) {
    resultDiv.innerHTML = "";
  }
  
  if (modal) {
    modal.classList.remove("hidden");
  }
};

const closeCreateScheduleModal = () => {
  const modal = scheduleManagementSelectors.createScheduleModal();
  if (modal) {
    modal.classList.add("hidden");
  }
  
  const form = scheduleManagementSelectors.createScheduleForm();
  if (form) {
    form.reset();
  }
  
  const resultDiv = scheduleManagementSelectors.scheduleFormResult();
  if (resultDiv) {
    resultDiv.innerHTML = "";
  }
};

const handleCreateSchedule = async (event) => {
  event.preventDefault();
  
  const form = scheduleManagementSelectors.createScheduleForm();
  const resultDiv = scheduleManagementSelectors.scheduleFormResult();
  
  const classId = parseInt(scheduleManagementSelectors.scheduleClassId()?.value || "", 10);
  const dayOfWeek = parseInt(document.getElementById("scheduleDayOfWeek")?.value || "", 10);
  const startTime = document.getElementById("scheduleStartTime")?.value;
  const endTime = document.getElementById("scheduleEndTime")?.value;
  const roomNumber = document.getElementById("scheduleRoomNumber")?.value.trim() || null;
  const building = document.getElementById("scheduleBuilding")?.value.trim() || null;
  const notes = document.getElementById("scheduleNotes")?.value.trim() || null;
  const isActive = document.getElementById("scheduleIsActive")?.checked ?? true;
  
  if (!classId || !dayOfWeek || !startTime || !endTime) {
    showToast("Lütfen zorunlu alanları doldurun", true);
    return;
  }
  
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Kaydediliyor...";
  }
  
  if (resultDiv) {
    resultDiv.innerHTML = "";
  }
  
  try {
    await apiFetch("/ClassSchedule", {
      method: "POST",
      body: {
        classId,
        dayOfWeek,
        startTime,
        endTime,
        roomNumber,
        building,
        notes,
        isActive
      }
    });
    
    showToast("✅ Ders programı başarıyla eklendi");
    if (resultDiv) {
      resultDiv.innerHTML = "<p style='color:green; padding:1rem;'>✅ Ders programı eklendi.</p>";
    }
    
    form.reset();
    scheduleManagementSelectors.scheduleClassId().value = classId;
    document.getElementById("scheduleIsActive").checked = true;
    
    setTimeout(() => {
      closeCreateScheduleModal();
      loadSchedules(classId);
    }, 1500);
  } catch (error) {
    console.error("[handleCreateSchedule] Hata:", error);
    if (handleUnauthorized(error)) return;
    
    let errorMessage = error.message || "Ders programı eklenemedi";
    if (resultDiv) {
      resultDiv.innerHTML = `<p style='color:red; padding:1rem;'>❌ ${errorMessage}</p>`;
    }
    showToast(errorMessage, true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Kaydet";
    }
  }
};

const editSchedule = (scheduleId) => {
  const schedule = scheduleManagementState.schedules.find(s => (s.id || s.Id) == scheduleId);
  if (!schedule) {
    showToast("Ders programı bulunamadı", true);
    return;
  }
  
  // Basit düzenleme - şimdilik prompt ile
  showToast("Düzenleme özelliği yakında eklenecek", false);
  // TODO: Edit modal ekle
};

const deleteSchedule = async (scheduleId) => {
  if (!confirm("Bu ders programını silmek istediğinize emin misiniz?")) {
    return;
  }
  
  try {
    await apiFetch(`/ClassSchedule/${scheduleId}`, {
      method: "DELETE"
    });
    
    showToast("✅ Ders programı silindi");
    loadSchedules(scheduleManagementState.selectedClassId);
  } catch (error) {
    console.error("[deleteSchedule] Hata:", error);
    if (handleUnauthorized(error)) return;
    showToast(error.message || "Ders programı silinemedi", true);
  }
};

window.openCreateScheduleModal = openCreateScheduleModal;
window.closeCreateScheduleModal = closeCreateScheduleModal;
window.editSchedule = editSchedule;
window.deleteSchedule = deleteSchedule;

const bindScheduleManagementEvents = () => {
  const classSelect = scheduleManagementSelectors.classSelect();
  if (classSelect) {
    classSelect.addEventListener("change", (event) => {
      const classId = parseInt(event.target.value || "", 10);
      scheduleManagementState.selectedClassId = classId;
      loadSchedules(classId);
    });
  }
  
  const form = scheduleManagementSelectors.createScheduleForm();
  if (form) {
    form.addEventListener("submit", handleCreateSchedule);
  }
  
  // Modal dışına tıklayınca kapat
  const modal = scheduleManagementSelectors.createScheduleModal();
  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeCreateScheduleModal();
      }
    });
  }
};

const initScheduleManagementPage = async () => {
  try {
    requireInstructorRole();
    
    // Navigation menüsünü güncelle
    if (typeof updateNavigationByRole === "function") {
      updateNavigationByRole();
    }
    
    bindScheduleManagementEvents();
    await loadClasses();
  } catch (error) {
    console.error("[initScheduleManagementPage] Hata:", error);
    showToast(error.message || "Sayfa yüklenirken hata oluştu", true);
    
    if (error.message.includes("giriş yapın") || error.message.includes("yetki")) {
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const page = scheduleManagementSelectors.page();
  if (!page) return;
  initScheduleManagementPage();
});
