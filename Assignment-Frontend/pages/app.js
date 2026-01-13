const dashboardState = {
  assignments: []
};

const selectors = {
  enrolledClassesList: () => document.getElementById("enrolledClassesList"),
  allClassesList: () => document.getElementById("allClassesList"),
  assignmentsList: () => document.getElementById("assignmentsList"),
  assignmentSelect: () => document.getElementById("selectAssignment"),
  submissionResult: () => document.getElementById("submissionResult"),
  submissionForm: () => document.getElementById("submissionForm"),
  welcomeText: () => document.getElementById("welcomeText"),
  logoutButton: () => document.getElementById("logoutButton")
};

const formatDate = (value) => {
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

const handleUnauthorized = (error) => {
  if (error?.status === 401) {
    showToast("Oturumunuzun süresi doldu, lütfen yeniden giriş yapın.", true);
    clearAuthSession();
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
    return true;
  }
  return false;
};

const renderEnrolledClasses = (classes = []) => {
  const container = selectors.enrolledClassesList();
  if (!container) return;

  if (!classes.length) {
    container.innerHTML = `
      <div style="padding: 1rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; color: #856404; margin: 0 1.5rem;">
        <p><strong>ℹ️ Henüz hiçbir sınıfa kayıtlı değilsiniz.</strong></p>
      </div>
    `;
    return;
  }

  // Mobil uygulamaya göre course card'ları oluştur (pastel renkler)
  const getRandomColor = (index) => {
    const colors = [
      "var(--card-orange)",
      "var(--card-blue)",
      "var(--card-purple)",
      "var(--card-green)",
      "var(--card-pink)"
    ];
    return colors[index % colors.length];
  };

  const getRandomIcon = (index) => {
    const icons = ['🎨', '📱', '💻', '🗄️', '🧮', '🔬', '📊', '🎯'];
    return icons[index % icons.length];
  };

  container.style.display = "flex";
  container.style.gap = "12px";
  container.style.padding = "0 1.5rem 1rem";
  container.style.overflowX = "auto";
  container.style.overflowY = "hidden";
  container.style.scrollSnapType = "x mandatory";
  
  container.innerHTML = classes
    .map(
      (cls, index) => {
        const courseCode = cls.courseCode || cls.CourseCode || "";
        const className = cls.className || cls.ClassName || "";
        const courseName = cls.courseName || cls.CourseName || className;
        const backgroundColor = getRandomColor(index);
        const icon = getRandomIcon(index);
        
        return `
        <div class="course-card-mobile" style="min-width: 120px; width: 120px; height: 140px; background-color: ${backgroundColor}; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; flex-shrink: 0; scroll-snap-align: start;">
          <div style="font-size: 40px; text-align: center;">${icon}</div>
          <div>
            <div style="font-size: 14px; font-weight: bold; color: var(--text-primary); margin-bottom: 4px;">${courseName}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${courseCode || ""}</div>
          </div>
        </div>
      `;
      }
    )
    .join("");
};

const renderAllClasses = (classes = [], enrolledClassIds = []) => {
  const container = selectors.allClassesList();
  if (!container) return;

  if (!classes.length) {
    container.innerHTML = `
      <div style="padding: 1rem; background: #e7f3ff; border: 1px solid #2196F3; border-radius: 8px; color: #0d47a1;">
        <p><strong>ℹ️ Henüz hiçbir sınıf bulunmuyor.</strong></p>
        <p style="margin-top: 0.5rem; font-size: 0.9em;">Öğretmenler sınıf oluşturduğunda burada görünecektir.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = classes
    .map(
      (cls) => {
        const classId = cls.id || cls.Id;
        const courseCode = cls.courseCode || cls.CourseCode || "";
        const className = cls.className || cls.ClassName || "";
        const instructorName = cls.instructorName || cls.InstructorName || "";
        const semester = cls.semester || cls.Semester || "";
        const currentEnrollment = cls.currentEnrollment || cls.CurrentEnrollment || 0;
        const maxCapacity = cls.maxCapacity || cls.MaxCapacity || 0;
        
        const isEnrolled = enrolledClassIds.includes(classId);
        const isFull = currentEnrollment >= maxCapacity;
        
        return `
        <div class="assignment-card" style="${isEnrolled ? 'background: #e8f5e9;' : ''}">
          <strong>${courseCode} - ${className}</strong>
          <p><small>Öğretmen: ${instructorName}</small></p>
          <p><small>Dönem: ${semester}</small></p>
          <p><small>Kontenjan: ${currentEnrollment}/${maxCapacity}</small></p>
          ${isEnrolled ? 
            `<button onclick="handleUnenroll(${classId})" style="margin-top: 0.5rem; padding: 0.5rem; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Kayıttan Çık</button>` :
            (isFull ? 
              `<p style="color: red; margin-top: 0.5rem;">Sınıf Dolu</p>` :
              `<button onclick="handleEnroll(${classId})" style="margin-top: 0.5rem; padding: 0.5rem; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Kayıt Ol</button>`
            )
          }
        </div>
      `;
      }
    )
    .join("");
};

const renderAssignments = (assignments = []) => {
  const container = selectors.assignmentsList();
  if (!container) {
    // Yaklaşan ödevler için container'ı bul
    const upcomingContainer = document.getElementById("upcomingAssignmentsList");
    if (!upcomingContainer) return;
    
    if (!assignments.length) {
      upcomingContainer.innerHTML = "<p style='padding: 1rem 1.5rem; color: #666;'>Yaklaşan ödev bulunmuyor.</p>";
      return;
    }

    // Aktif ödevleri filtrele (dueDate gelecekte olanlar)
    const now = new Date();
    const upcoming = assignments.filter(a => {
      const rawDue = a.dueDate || a.DueDate;
      if (!rawDue) return false;
      
      // Backend'den gelen dueDate UTC olarak geliyor (ISO string formatında)
      // UTC olarak parse et ve karşılaştır
      let dueDateObj;
      if (typeof rawDue === 'string') {
        const dateStr = rawDue.endsWith('Z') ? rawDue : rawDue + 'Z';
        dueDateObj = new Date(dateStr);
      } else {
        dueDateObj = new Date(rawDue);
      }
      
      // UTC timestamp'leri direkt karşılaştır
      return dueDateObj.getTime() > now.getTime();
    }).slice(0, 5); // En fazla 5 ödev göster

    if (upcoming.length === 0) {
      upcomingContainer.innerHTML = "<p style='padding: 1rem 1.5rem; color: #666;'>Yaklaşan ödev bulunmuyor.</p>";
      return;
    }

    // Mobil uygulamaya göre assignment card'ları oluştur
    const getStatusColor = (dueDate) => {
      if (!dueDate) return "var(--text-secondary)";
      
      // Tarihleri günün başına (00:00:00) ayarla - sadece gün bazında karşılaştır
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      // Gün farkını hesapla (millisaniye cinsinden)
      const diffTime = due.getTime() - now.getTime();
      const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) return "var(--error)";
      if (daysLeft <= 2) return "var(--warning)";
      return "var(--success)";
    };

    const getStatusText = (dueDate) => {
      if (!dueDate) return "Tarih yok";
      
      // Tarihleri günün başına (00:00:00) ayarla - sadece gün bazında karşılaştır
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      // Gün farkını hesapla (millisaniye cinsinden)
      const diffTime = due.getTime() - now.getTime();
      const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) return "Süre Doldu";
      if (daysLeft === 0) return "Bugün";
      if (daysLeft === 1) return "Yarın";
      return `${daysLeft} gün kaldı`;
    };

    upcomingContainer.innerHTML = upcoming
      .map(
        (assignment) => {
          const rawDue = assignment.dueDate || assignment.DueDate;
          const assignmentType = assignment.assignmentType === 2 ? "👥 Grup" : "👤 Bireysel";
          const dueDate = formatDate(rawDue);
          const statusColor = getStatusColor(rawDue);
          const statusText = getStatusText(rawDue);
          
          const courseCode = assignment.courseCode || assignment.CourseCode || "";
          const className = assignment.className || assignment.ClassName || "";
          
          return `
            <div class="assignment-card-mobile" style="margin: 0 1.5rem 1rem; background: var(--background); border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid var(--border); position: relative;">
              <!-- Status Badge - Sağ Üstte -->
              <div style="position: absolute; top: 12px; right: 12px; background-color: ${statusColor}; color: var(--text-white); padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; z-index: 10;">
                ${statusText}
              </div>
              
              <!-- Type Badge - Sol Üstte -->
              <div style="position: absolute; top: 12px; left: 12px; background-color: var(--background-secondary); padding: 4px 10px; border-radius: 8px; font-size: 12px; color: var(--text-primary); z-index: 10;">
                ${assignmentType}
              </div>
              
              <!-- Header -->
              <div style="margin-top: 32px; margin-bottom: 12px;">
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${className || courseCode || "Ders Adı"}</div>
                <div style="font-size: 18px; font-weight: bold; color: var(--text-primary);">${assignment.title || "Ödev"}</div>
              </div>
              
              <!-- Description -->
              ${assignment.description ? `
                <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; line-height: 20px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  ${assignment.description}
                </div>
              ` : ""}
              
              <!-- Footer -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 16px;">📅</span>
                  <span style="font-size: 14px; color: var(--text-primary); font-weight: 600;">
                    Son Tarih: ${rawDue ? new Date(rawDue).toLocaleDateString('tr-TR') : "-"}
                  </span>
                </div>
                ${assignment.maxScore ? `
                  <div style="background-color: var(--background-secondary); padding: 6px 12px; border-radius: 12px;">
                    <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">🏆 ${assignment.maxScore} puan</span>
                  </div>
                ` : ""}
              </div>
              
              <!-- Actions -->
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button onclick="window.location.href='assignments.html'" style="flex: 1; background-color: var(--primary); color: var(--text-white); border: none; padding: 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
                  📎 Yükle
                </button>
                <a href="assignments.html" style="flex: 1; border: 1px solid var(--primary); padding: 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-align: center; text-decoration: none; color: var(--primary);">
                  Detay →
                </a>
              </div>
            </div>
          `;
        }
      )
      .join("");
    return;
  }

  if (!assignments.length) {
    container.innerHTML = "<p>Aktif ödev bulunamadı.</p>";
    return;
  }

  container.innerHTML = assignments
    .map(
      (assignment) => `
        <div class="assignment-card">
          <strong>${assignment.title}</strong>
          <p>${assignment.description || "Açıklama bulunmuyor."}</p>
          <p><small>Son teslim: ${formatDate(assignment.dueDate)}</small></p>
          <p><small>Puan: ${assignment.maxScore ?? "-"}</small></p>
        </div>
      `
    )
    .join("");
};

const populateAssignmentSelect = (assignments = []) => {
  const select = selectors.assignmentSelect();
  if (!select) return;

  select.innerHTML = '<option value="">Ödev seçiniz</option>';
  assignments.forEach((assignment) => {
    const option = document.createElement("option");
    option.value = assignment.id;
    option.textContent = `${assignment.title} - ${formatDate(
      assignment.dueDate
    )}`;
    select.appendChild(option);
  });
};

const loadStudentEnrollments = async () => {
  const container = selectors.enrolledClassesList();
  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    console.log("[loadStudentEnrollments] Öğrenci kayıtlı sınıfları yükleniyor...");
    
    // Backend'de my-enrollments endpoint'i yok, Assignment/my-assignments'ten class bilgilerini çıkarıyoruz
    // Alternatif: Tüm sınıfları alıp frontend'de filtreleme yapabiliriz ama bu verimsiz
    // En iyi çözüm: Assignment/my-assignments'ten class bilgilerini çıkar
    const assignmentsResponse = await apiFetch("/Assignment/my-assignments");
    console.log("[loadStudentEnrollments] Assignments Response:", assignmentsResponse);
    
    // apiFetch zaten normalize ediyor - direkt array gelmeli
    const assignments = Array.isArray(assignmentsResponse) ? assignmentsResponse : [];
    
    // Assignment'lerden unique class'ları çıkar
    const classMap = new Map();
    assignments.forEach(assignment => {
      const classId = assignment.classId || assignment.ClassId;
      const className = assignment.className || assignment.ClassName || "";
      const courseCode = assignment.courseCode || assignment.CourseCode || "";
      const courseName = assignment.courseName || assignment.CourseName || "";
      
      if (classId && !classMap.has(classId)) {
        classMap.set(classId, {
          id: classId,
          Id: classId,
          className: className,
          ClassName: className,
          courseCode: courseCode,
          CourseCode: courseCode,
          courseName: courseName,
          CourseName: courseName
        });
      }
    });
    
    const classes = Array.from(classMap.values());
    
    console.log("[loadStudentEnrollments] ✅ Yüklenen sınıf sayısı:", classes.length);
    if (classes.length > 0) {
      console.log("[loadStudentEnrollments] İlk sınıf:", classes[0]);
    }
    
    renderEnrolledClasses(classes);
    return classes.map(c => c.id || c.Id);
  } catch (error) {
    console.error("[loadStudentEnrollments] ❌ Hata:", error);
    if (handleUnauthorized(error)) return [];
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message || "Sınıflar yüklenirken hata oluştu"}</p>`;
    }
    return [];
  }
};

const loadAllClasses = async (enrolledClassIds = []) => {
  const container = selectors.allClassesList();
  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    console.log("[loadAllClasses] Tüm sınıflar yükleniyor...");
    const response = await apiFetch("/Class");
    console.log("[loadAllClasses] API Response:", response);
    
    // apiFetch zaten normalize ediyor - direkt array gelmeli
    const allClasses = Array.isArray(response) ? response : [];
    
    console.log("[loadAllClasses] ✅ Yüklenen sınıf sayısı:", allClasses.length);
    
    renderAllClasses(allClasses, enrolledClassIds);
  } catch (error) {
    console.error("[loadAllClasses] ❌ Hata:", error);
    if (handleUnauthorized(error)) return;
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message || "Sınıflar yüklenirken hata oluştu"}</p>`;
    }
  }
};

const handleEnroll = async (classId) => {
  try {
    // Backend artık body gerektirmiyor, sadece POST isteği yeterli
    await apiFetch(`/Class/${classId}/enroll`, {
      method: "POST"
    });
    showToast("Sınıfa başarıyla kayıt oldunuz!");
    // Listeleri yenile
    const enrolledIds = await loadStudentEnrollments();
    await loadAllClasses(enrolledIds);
  } catch (error) {
    console.error("[handleEnroll] Hata:", error);
    const errorMessage = error.message || error.response?.message || "Kayıt olurken hata oluştu";
    showToast(errorMessage, true);
  }
};

const handleUnenroll = async (classId) => {
  if (!confirm("Bu sınıftan kayıttan çıkmak istediğinize emin misiniz?")) {
    return;
  }

  try {
    // Backend artık body gerektirmiyor, sadece POST isteği yeterli
    await apiFetch(`/Class/${classId}/unenroll`, {
      method: "POST"
    });
    showToast("Sınıftan başarıyla kayıttan çıktınız!");
    // Listeleri yenile
    const enrolledIds = await loadStudentEnrollments();
    await loadAllClasses(enrolledIds);
  } catch (error) {
    console.error("[handleUnenroll] Hata:", error);
    const errorMessage = error.message || error.response?.message || "Kayıttan çıkarken hata oluştu";
    showToast(errorMessage, true);
  }
};

// Global scope'a ekle
window.handleEnroll = handleEnroll;
window.handleUnenroll = handleUnenroll;

const loadStudentAssignments = async () => {
  const container = selectors.assignmentsList();
  
  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    console.log("[loadStudentAssignments] Öğrenci ödevleri yükleniyor...");
    const response = await apiFetch("/Assignment/my-assignments");
    console.log("[loadStudentAssignments] API Response:", response);
    
    // apiFetch zaten normalize ediyor - direkt array gelmeli
    const assignments = Array.isArray(response) ? response : [];
    
    console.log("[loadStudentAssignments] ✅ Yüklenen ödev sayısı:", assignments.length);
    if (assignments.length > 0) {
      console.log("[loadStudentAssignments] İlk ödev:", assignments[0]);
    }
    
    // dashboardState'e kaydet (ana sayfa için)
    dashboardState.assignments = assignments;
    
    // Eğer assignments sayfasındaysak render et
    if (container) {
      renderAssignments(assignments);
      populateAssignmentSelect(assignments);
    } else {
      // Ana sayfadaysak sadece renderAssignments çağır (upcomingAssignmentsList için)
      renderAssignments(assignments);
    }
  } catch (error) {
    console.error("[loadStudentAssignments] ❌ Hata:", error);
    if (handleUnauthorized(error)) return;
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message || "Ödevler yüklenirken hata oluştu"}</p>`;
    }
  }
};

const submitAssignment = async (event) => {
  event.preventDefault();

  const form = selectors.submissionForm();
  if (!form) return;

  const assignmentId = selectors.assignmentSelect()?.value;
  const groupIdInput = document.getElementById("groupId")?.value.trim();
  const fileInput = document.getElementById("fileInput");
  const comments = document.getElementById("commentsInput")?.value.trim();
  const resultContainer = selectors.submissionResult();

  if (!assignmentId) {
    showToast("Lütfen bir ödev seçin", true);
    return;
  }

  if (!fileInput?.files?.length) {
    showToast("Lütfen yüklemek için bir dosya seçin", true);
    return;
  }

  // Grup ID'yi kontrol et - sadece geçerli bir sayı ise ekle
  let groupIdValue = null;
  if (groupIdInput && groupIdInput.trim() !== "") {
    const parsedGroupId = parseInt(groupIdInput.trim(), 10);
    if (!isNaN(parsedGroupId) && parsedGroupId > 0) {
      groupIdValue = parsedGroupId.toString();
    } else {
      showToast("Grup ID geçerli bir pozitif sayı olmalıdır. Boş bırakabilirsiniz.", true);
      return;
    }
  }

  const formData = new FormData();
  formData.append("assignmentId", assignmentId.toString());
  
  // Grup ID'yi sadece geçerli bir değer varsa ekle
  if (groupIdValue !== null) {
    formData.append("groupId", groupIdValue);
  }
  
  if (comments && comments.trim() !== "") {
    formData.append("comments", comments.trim());
  }
  
  formData.append("file", fileInput.files[0]);

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Gönderiliyor...";
  }

  try {
    console.log("[submitAssignment] Teslim gönderiliyor:", { assignmentId, groupId, hasFile: !!fileInput.files[0] });
    
    const response = await apiFetch("/Submission", {
      method: "POST",
      body: formData
    });

    showToast("✅ Ödev başarıyla teslim edildi!");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green; padding:1rem;'>✅ Tesliminiz başarıyla alındı.</p>";
    }
    form.reset();
    await loadStudentAssignments(); // Ödev listesini yenile
    return response;
  } catch (error) {
    console.error("[submitAssignment] ❌ Hata:", error);
    if (handleUnauthorized(error)) return;
    
    // Backend'den gelen hata mesajını parse et
    let errorMessage = "Teslim sırasında hata oluştu";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response?.errors) {
      // FluentValidation hataları
      const errors = error.response.errors;
      if (typeof errors === 'object') {
        const errorList = [];
        for (const key in errors) {
          if (Array.isArray(errors[key])) {
            errorList.push(...errors[key]);
          }
        }
        errorMessage = errorList.length > 0 ? errorList.join(", ") : errorMessage;
      }
    } else if (error.response?.message) {
      errorMessage = error.response.message;
    }
    
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red; padding:1rem;'>❌ ${errorMessage}</p>`;
    }
    showToast(errorMessage, true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Teslim Et";
    }
  }
};

const bindDashboardEvents = () => {
  const form = selectors.submissionForm();
  if (form) {
    form.addEventListener("submit", submitAssignment);
  }

  const logoutButton = selectors.logoutButton();
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearAuthSession();
      window.location.href = "index.html";
    });
  }
};

const updateWelcomeMessage = async () => {
  const user = getAuthUser();
  const welcomeNameEl = document.getElementById("studentWelcomeName");
  const infoDetailsEl = document.getElementById("studentInfoDetails");
  const mobileGreeting = document.getElementById("mobileGreeting");
  const mobileUserName = document.getElementById("mobileUserName");
  
  const userName = user?.fullName?.split(" ")[0] || user?.firstName || user?.email?.split("@")[0] || "Öğrenci";
  
  // Mobil uygulamaya göre header
  if (mobileGreeting) {
    mobileGreeting.textContent = "👋 Hoş geldin,";
  }
  if (mobileUserName) {
    mobileUserName.textContent = `${userName}!`;
  }
  
  if (user && welcomeNameEl) {
    welcomeNameEl.textContent = `👋 Hoş geldiniz, ${userName}!`;
  }
  
  // Öğrenci bilgilerini yükle
  try {
    // Backend'de my-enrollments endpoint'i yok, Assignment/my-assignments'ten class bilgilerini çıkarıyoruz
    const assignmentsResponse = await apiFetch("/Assignment/my-assignments");
    const assignmentList = Array.isArray(assignmentsResponse) ? assignmentsResponse : [];
    
    // Assignment'lerden unique class'ları çıkar
    const classMap = new Map();
    assignmentList.forEach(assignment => {
      const classId = assignment.classId || assignment.ClassId;
      const className = assignment.className || assignment.ClassName || "";
      const courseCode = assignment.courseCode || assignment.CourseCode || "";
      const courseName = assignment.courseName || assignment.CourseName || "";
      
      if (classId && !classMap.has(classId)) {
        classMap.set(classId, {
          id: classId,
          Id: classId,
          className: className,
          ClassName: className,
          courseCode: courseCode,
          CourseCode: courseCode,
          courseName: courseName,
          CourseName: courseName
        });
      }
    });
    
    const classes = Array.from(classMap.values());
    
    // Bu hafta istatistiklerini güncelle
    const weekAssignmentsEl = document.getElementById("weekAssignments");
    const weekSubmissionsEl = document.getElementById("weekSubmissions");
    const weekGradesEl = document.getElementById("weekGrades");
    const weekClassesEl = document.getElementById("weekClasses");
    
    if (weekClassesEl) {
      weekClassesEl.textContent = classes.length;
    }
    
    // Aktif ödev sayısını hesapla ve stats bar'ı göster (mobil uygulamaya göre)
    const dashboardAssignments = dashboardState.assignments || [];
    const now = new Date();
    const activeAssignments = dashboardAssignments.filter(a => {
      const rawDue = a.dueDate || a.DueDate;
      if (!rawDue) return false;
      
      // Backend'den gelen dueDate UTC olarak geliyor (ISO string formatında)
      // UTC olarak parse et ve karşılaştır
      let dueDateObj;
      if (typeof rawDue === 'string') {
        const dateStr = rawDue.endsWith('Z') ? rawDue : rawDue + 'Z';
        dueDateObj = new Date(dateStr);
      } else {
        dueDateObj = new Date(rawDue);
      }
      
      // UTC timestamp'leri direkt karşılaştır
      return dueDateObj.getTime() > now.getTime();
    });
    
    // Stats Bar (mobil uygulamaya göre)
    const statsBar = document.getElementById("statsBar");
    const activeAssignmentsCount = document.getElementById("activeAssignmentsCount");
    if (statsBar && activeAssignmentsCount) {
      activeAssignmentsCount.textContent = activeAssignments.length;
      statsBar.style.display = "block";
    }
    
    // Bu Hafta İstatistikleri (mobil uygulamaya göre)
    const completedEl = document.getElementById("completedAssignments");
    const averageGradeEl = document.getElementById("averageGrade");
    const streakEl = document.getElementById("streak");
    
    if (weekAssignmentsEl) {
      weekAssignmentsEl.textContent = activeAssignments.length;
    }
    
    // Tamamlanan ve ortalama not hesapla
    if (completedEl || averageGradeEl) {
      // Teslimlerimi çek
      try {
        const submissions = await apiFetch("/Submission/my-submissions");
        const mySubmissions = Array.isArray(submissions) ? submissions : [];
        
        // Tamamlanan ödevler (teslim edilmiş olanlar)
        const completedAssignments = dashboardAssignments.filter(a => 
          mySubmissions.some(sub => sub.assignmentId === a.id)
        );
        
        if (completedEl) {
          completedEl.textContent = `${completedAssignments.length}/${dashboardAssignments.length}`;
        }
        
        // Notlandırılmış ödevlerden ortalama not hesapla
        const gradedSubmissions = mySubmissions.filter(s => s.score !== null && s.score !== undefined);
        const averageGrade = gradedSubmissions.length > 0
          ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length)
          : 0;
        
        if (averageGradeEl) {
          averageGradeEl.textContent = averageGrade || "-";
        }
        
        // Seri hesaplama (basitleştirilmiş)
        if (streakEl) {
          streakEl.textContent = gradedSubmissions.length > 0 ? "1 gün" : "0 gün";
        }
      } catch (error) {
        console.error("İstatistikler yüklenirken hata:", error);
      }
    }
    
    if (infoDetailsEl) {
      const courseCount = classes.length;
      const courseNames = classes.map(c => c.courseName || c.CourseName || "Bilinmeyen Ders").slice(0, 5);
      
      infoDetailsEl.innerHTML = `
        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 10px;">
          <strong style="display: block; margin-bottom: 0.5rem;">📚 Toplam Sınıf</strong>
          <span style="font-size: 1.5rem; font-weight: bold;">${courseCount}</span>
        </div>
        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 10px;">
          <strong style="display: block; margin-bottom: 0.5rem;">🎓 Dersler</strong>
          <div style="font-size: 0.9rem;">
            ${courseNames.length > 0 ? courseNames.map(name => `<div>• ${name}</div>`).join("") : "Henüz ders yok"}
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Öğrenci bilgileri yüklenemedi:", error);
    if (infoDetailsEl) {
      infoDetailsEl.innerHTML = `<p>Bilgiler yüklenemedi.</p>`;
    }
  }
};

const initStudentDashboard = async () => {
  try {
    ensureAuthenticated();
    
    // Rol kontrolü - sadece öğrenci veya admin erişebilir
    const user = getAuthUser();
    const userRole = (user?.role || "").toLowerCase();
    
    if (userRole === "instructor") {
      showToast("Bu sayfa sadece öğrenciler içindir. Öğretmen paneline yönlendiriliyorsunuz...", false);
      setTimeout(() => {
        window.location.href = "teacher_dashboard.html";
      }, 1500);
      return;
    }
    
    if (userRole !== "student" && userRole !== "admin") {
      showToast("Bu sayfaya erişim yetkiniz yok", true);
      window.location.href = "login.html";
      return;
    }
    
    // Navigation menüsünü rol bazlı güncelle
    if (typeof updateNavigationByRole === "function") {
      updateNavigationByRole();
    }
  } catch (error) {
    showToast(error.message, true);
    window.location.href = "login.html";
    return;
  }

  bindDashboardEvents();
  
  // Önce kayıtlı sınıfları yükle, sonra tüm sınıfları yükle
  const enrolledIds = await loadStudentEnrollments();
  await Promise.all([loadAllClasses(enrolledIds), loadStudentAssignments()]);
  
  // Son olarak hoş geldin mesajını güncelle (bu ödevleri de yükler)
  await updateWelcomeMessage();
  
  // Yaklaşan ödevleri render et
  renderAssignments(dashboardState.assignments);
};

document.addEventListener("DOMContentLoaded", () => {
  const dashboard = document.getElementById("studentDashboard");
  if (!dashboard) return;
  initStudentDashboard();
});
