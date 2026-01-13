// Profil Modülü

const profileState = {
  userProfile: null
};

const profileSelectors = {
  page: () => document.getElementById("profilePage"),
  welcome: () => document.getElementById("profileWelcome"),
  logoutButton: () => document.getElementById("logoutButton"),
  profileDisplay: () => document.getElementById("profileDisplay"),
  updateForm: () => document.getElementById("updateProfileForm"),
  updateResult: () => document.getElementById("updateResult"),
  passwordForm: () => document.getElementById("changePasswordForm"),
  passwordResult: () => document.getElementById("passwordResult"),
  nav: () => document.getElementById("profileNav")
};

const profileHandleUnauthorized = (error) => {
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

// Navigation artık navigation.js tarafından yapılıyor

const renderProfileDisplay = (profile) => {
  console.log("[renderProfileDisplay] Rendering profile:", profile);
  
  const container = profileSelectors.profileDisplay();
  const infoCard = document.getElementById("profileInfoCard");
  const avatar = document.getElementById("profileAvatar");
  
    // Profil verilerini normalize et
  const firstName = String(profile.firstName || "").trim();
  const lastName = String(profile.lastName || "").trim();
  const email = String(profile.email || "").trim();
  const role = String(profile.role || "").trim();
  const studentNumber = profile.studentNumber ? String(profile.studentNumber).trim() : null;
  const department = profile.department ? String(profile.department).trim() : null;
  const phoneNumber = profile.phoneNumber ? String(profile.phoneNumber).trim() : null;
  
  console.log("[renderProfileDisplay] Normalized values:", {
    firstName,
    lastName,
    email,
    role,
    firstNameLength: firstName.length,
    lastNameLength: lastName.length,
    firstNameTruthy: !!firstName,
    lastNameTruthy: !!lastName,
    firstNameType: typeof firstName,
    lastNameType: typeof lastName
  });
  
  // Avatar'ı güncelle
  if (avatar) {
    const firstInitial = firstName.length > 0 ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName.length > 0 ? lastName.charAt(0).toUpperCase() : "";
    const initials = (firstInitial + lastInitial) || "👤";
    avatar.textContent = initials;
  }
  
  // Mobil kart için
  if (infoCard) {
    const roleText = role === "Student" || role === "student" ? "Öğrenci" : 
                     role === "Instructor" || role === "instructor" ? "Öğretmen" : 
                     role === "Admin" || role === "admin" ? "Admin" : role;
    
    // Ad Soyad için özel kontrol - eğer boşsa "Bilinmiyor" göster
    // Önce her ikisini kontrol et, sonra tek tek kontrol et
    let fullName = "";
    if (firstName && firstName.length > 0 && lastName && lastName.length > 0) {
      fullName = `${firstName} ${lastName}`.trim();
    } else if (firstName && firstName.length > 0) {
      fullName = firstName.trim();
    } else if (lastName && lastName.length > 0) {
      fullName = lastName.trim();
    } else {
      fullName = "Bilinmiyor";
    }
    
    console.log("[renderProfileDisplay] Full name calculation:", {
      fullName,
      firstName,
      lastName,
      firstNameLength: firstName.length,
      lastNameLength: lastName.length,
      condition1: firstName && firstName.length > 0 && lastName && lastName.length > 0,
      condition2: firstName && firstName.length > 0,
      condition3: lastName && lastName.length > 0
    });
    
    let html = `
      <div class="profile-info-item">
        <span class="profile-info-label">Ad Soyad</span>
        <span class="profile-info-value">${fullName}</span>
      </div>
      <div class="profile-info-item">
        <span class="profile-info-label">E-posta</span>
        <span class="profile-info-value">${email || "Bilinmiyor"}</span>
      </div>
      <div class="profile-info-item">
        <span class="profile-info-label">Rol</span>
        <span class="profile-info-value">${roleText || "Bilinmiyor"}</span>
      </div>`;
    
    if (studentNumber) {
      html += `
      <div class="profile-info-item">
        <span class="profile-info-label">Öğrenci No</span>
        <span class="profile-info-value">${studentNumber}</span>
      </div>`;
    }
    
    if (department) {
      html += `
      <div class="profile-info-item">
        <span class="profile-info-label">Bölüm</span>
        <span class="profile-info-value">${department}</span>
      </div>`;
    }
    
    if (phoneNumber) {
      html += `
      <div class="profile-info-item">
        <span class="profile-info-label">Telefon</span>
        <span class="profile-info-value">${phoneNumber}</span>
      </div>`;
    }
    
    infoCard.innerHTML = html;
    console.log("[renderProfileDisplay] Info card updated");
  }
  
  // Desktop için eski görünüm
  if (container) {
    const roleText = role === "Student" || role === "student" ? "Öğrenci" : 
                     role === "Instructor" || role === "instructor" ? "Öğretmen" : 
                     role === "Admin" || role === "admin" ? "Admin" : role;
    
    // Ad Soyad için özel kontrol
    const fullName = (firstName && lastName) ? `${firstName} ${lastName}`.trim() : 
                     firstName ? firstName.trim() : 
                     lastName ? lastName.trim() : 
                     "Bilinmiyor";
    
    container.innerHTML = `
      <div class="profile-card">
        <div class="profile-avatar">👤</div>
        <div class="profile-details">
          <h3>${fullName}</h3>
          <p><strong>E-posta:</strong> ${email || "Bilinmiyor"}</p>
          <p><strong>Rol:</strong> ${roleText || "Bilinmiyor"}</p>
          ${studentNumber ? `<p><strong>Öğrenci No:</strong> ${studentNumber}</p>` : ""}
          ${department ? `<p><strong>Bölüm:</strong> ${department}</p>` : ""}
          ${phoneNumber ? `<p><strong>Telefon:</strong> ${phoneNumber}</p>` : ""}
        </div>
      </div>
    `;
  }
};

const loadUserProfile = async () => {
  const infoCard = document.getElementById("profileInfoCard");
  if (infoCard) {
    infoCard.innerHTML = "<p>Yükleniyor...</p>";
  }

  try {
    // Önce /User/profile endpoint'ini dene (current user için)
    let response;
    try {
      console.log("[loadUserProfile] /User/profile endpoint'i deneniyor...");
      response = await apiFetch(`/User/profile`);
      console.log("[loadUserProfile] /User/profile Response:", response);
    } catch (profileError) {
      // Eğer /User/profile çalışmazsa, userId ile dene
      console.log("[loadUserProfile] /User/profile başarısız, userId ile deneniyor...", profileError);
      const userId = getUserId();
      if (!userId) {
        console.error("[loadUserProfile] User ID bulunamadı");
        if (infoCard) {
          infoCard.innerHTML = "<p style='color:red'>Kullanıcı bilgisi alınamadı. Lütfen tekrar giriş yapın.</p>";
        }
        return;
      }
      console.log("[loadUserProfile] User ID:", userId);
      response = await apiFetch(`/User/${userId}`);
      console.log("[loadUserProfile] /User/{id} Response:", response);
    }
    
    // apiFetch zaten Result wrapper'ı kaldırıyor ve normalize ediyor
    // Ama property'ler hala PascalCase olabilir, normalize et
    console.log("[loadUserProfile] Raw response:", response);
    console.log("[loadUserProfile] Response type:", typeof response);
    
    // Eğer response null veya undefined ise hata ver
    if (!response) {
      throw new Error("API'den veri alınamadı. Lütfen tekrar giriş yapın.");
    }
    
    // Eğer response string ise (HTML sayfası gelmiş olabilir), hata ver
    if (typeof response === "string") {
      console.error("[loadUserProfile] Response string olarak geldi (HTML sayfası olabilir):", response.substring(0, 200));
      throw new Error("API'den beklenmeyen yanıt alındı. Lütfen ngrok bağlantısını kontrol edin.");
    }
    
    // Eğer response object değilse hata ver
    if (typeof response !== "object") {
      console.error("[loadUserProfile] Response object değil:", typeof response, response);
      throw new Error("API'den geçersiz yanıt alındı.");
    }
    
    console.log("[loadUserProfile] Response keys:", Object.keys(response || {}));
    console.log("[loadUserProfile] Response values:", response);
    
    // Backend Result<T> wrapper kullanıyor ve property'ler PascalCase
    // apiFetch normalizePayload ile Result wrapper'ı kaldırıyor ama property'ler hala PascalCase olabilir
    // Backend UserResponseDto: Id, FirstName, LastName, Email, Role, StudentNumber, Department, PhoneNumber
    
    // Response'un object olduğundan emin ol ve property'leri kontrol et
    let profile;
    try {
      // Önce PascalCase property'leri kontrol et (backend'in döndürdüğü format)
      // Backend C# kullanıyor, JSON serialization default olarak PascalCase döndürür
      profile = {
        id: response.Id || response.id || null,
        userId: response.Id || response.id || response.UserId || response.userId || null,
        firstName: (response.FirstName || response.firstName || "").trim(),
        lastName: (response.LastName || response.lastName || "").trim(),
        email: (response.Email || response.email || "").trim(),
        role: (response.Role || response.role || "").trim(),
        studentNumber: (response.StudentNumber || response.studentNumber) ? String(response.StudentNumber || response.studentNumber).trim() : null,
        department: (response.Department || response.department) ? String(response.Department || response.department).trim() : null,
        phoneNumber: (response.PhoneNumber || response.phoneNumber) ? String(response.PhoneNumber || response.phoneNumber).trim() : null
      };
      
      console.log("[loadUserProfile] Combined profile (both formats):", profile);
    } catch (parseError) {
      console.error("[loadUserProfile] Parse hatası:", parseError);
      throw new Error("Profil verileri parse edilemedi: " + parseError.message);
    }
    
    console.log("[loadUserProfile] After normalization:", {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      role: profile.role,
      firstNameLength: profile.firstName.length,
      lastNameLength: profile.lastName.length
    });
    
    console.log("[loadUserProfile] Normalized profile:", profile);
    
    // Eğer hala boşsa, session'dan bilgileri al
    if (!profile.firstName && !profile.lastName && !profile.email) {
      console.warn("[loadUserProfile] API'den veri gelmedi, session'dan alınıyor...");
      const sessionUser = getAuthUser();
      if (sessionUser) {
        profile.firstName = sessionUser.firstName || sessionUser.FirstName || "";
        profile.lastName = sessionUser.lastName || sessionUser.LastName || "";
        profile.email = sessionUser.email || sessionUser.Email || "";
        profile.role = sessionUser.role || sessionUser.Role || "";
      }
    }
    
    console.log("[loadUserProfile] Final profile:", profile);
    console.log("[loadUserProfile] Profile fields check:", {
      hasFirstName: !!profile.firstName,
      hasLastName: !!profile.lastName,
      hasEmail: !!profile.email,
      hasRole: !!profile.role,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      role: profile.role
    });
    
    if (!profile.email && !profile.firstName) {
      console.error("[loadUserProfile] Profil bilgileri tamamen boş!");
      throw new Error("Profil bilgileri alınamadı. Lütfen tekrar giriş yapın.");
    }
    
    profileState.userProfile = profile;

    renderProfileDisplay(profile);

    // Formu doldur (eğer varsa)
    const firstNameEl = document.getElementById("firstName");
    const lastNameEl = document.getElementById("lastName");
    const emailEl = document.getElementById("email");
    const studentNumberEl = document.getElementById("studentNumber");
    const departmentEl = document.getElementById("department");
    const phoneNumberEl = document.getElementById("phoneNumber");
    
    if (firstNameEl) firstNameEl.value = profile.firstName || "";
    if (lastNameEl) lastNameEl.value = profile.lastName || "";
    if (emailEl) emailEl.value = profile.email || "";
    if (studentNumberEl) studentNumberEl.value = profile.studentNumber || "";
    if (departmentEl) departmentEl.value = profile.department || "";
    if (phoneNumberEl) phoneNumberEl.value = profile.phoneNumber || "";

  } catch (error) {
    console.error("[loadUserProfile] Hata:", error);
    console.error("[loadUserProfile] Error stack:", error.stack);
    if (profileHandleUnauthorized(error)) return;
    
    // Ngrok warning sayfası hatası için özel mesaj
    let errorMessage = error.message || "Profil bilgileri yüklenirken hata oluştu";
    if (error.isNgrokWarning || error.message.includes("ngrok") || error.message.includes("Ngrok")) {
      errorMessage = "Ngrok browser warning sayfası görüntülendi. Lütfen ngrok URL'sine direkt tarayıcıdan gidip 'Visit Site' butonuna tıklayın, sonra tekrar deneyin.";
    }
    
    if (infoCard) {
      infoCard.innerHTML = `<p style="color:red">${errorMessage}</p>`;
    }
    showToast(errorMessage, true);
  }
};

const handleUpdateProfile = async (event) => {
  event.preventDefault();

  const form = profileSelectors.updateForm();
  if (!form) return;

  const resultContainer = profileSelectors.updateResult();
  const userId = getUserId();

  const body = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    studentNumber: document.getElementById("studentNumber").value.trim() || null,
    department: document.getElementById("department").value.trim() || null,
    phoneNumber: document.getElementById("phoneNumber").value.trim() || null
  };

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Güncelleniyor...";
  }

  try {
    await apiFetch(`/User/${userId}`, {
      method: "PUT",
      body
    });

    showToast("Profil başarıyla güncellendi");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green'>Bilgileriniz güncellendi.</p>";
    }

    // Session'daki kullanıcı bilgisini güncelle
    const currentSession = getAuthUser();
    if (currentSession) {
      saveAuthSession({
        token: getAuthToken(),
        user: {
          ...currentSession,
          fullName: `${body.firstName} ${body.lastName}`.trim()
        }
      });
    }

    await loadUserProfile();
  } catch (error) {
    if (profileHandleUnauthorized(error)) return;
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red'>${error.message}</p>`;
    }
    showToast(error.message || "Profil güncellenemedi", true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Bilgileri Güncelle";
    }
  }
};

const handleChangePassword = async (event) => {
  event.preventDefault();

  const form = profileSelectors.passwordForm();
  if (!form) return;

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmNewPassword = document.getElementById("confirmNewPassword").value;
  const resultContainer = profileSelectors.passwordResult();

  if (newPassword !== confirmNewPassword) {
    showToast("Yeni şifreler eşleşmiyor", true);
    return;
  }

  if (newPassword.length < 6) {
    showToast("Şifre en az 6 karakter olmalı", true);
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Değiştiriliyor...";
  }

  try {
    await apiFetch("/Auth/change-password", {
      method: "POST",
      body: {
        currentPassword,
        newPassword
      }
    });

    showToast("Şifre başarıyla değiştirildi");
    if (resultContainer) {
      resultContainer.innerHTML = "<p style='color:green'>Şifreniz güncellendi.</p>";
    }
    form.reset();
  } catch (error) {
    if (profileHandleUnauthorized(error)) return;
    if (resultContainer) {
      resultContainer.innerHTML = `<p style='color:red'>${error.message}</p>`;
    }
    showToast(error.message || "Şifre değiştirilemedi", true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Şifreyi Değiştir";
    }
  }
};

const updateProfileWelcome = () => {
  const user = getAuthUser();
  const welcome = profileSelectors.welcome();
  if (user && welcome) {
    welcome.textContent = `${user.fullName || user.email} - Profil Ayarları`;
  }
};

const bindProfileEvents = () => {
  const logoutButton = profileSelectors.logoutButton();
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearAuthSession();
      window.location.href = "index.html";
    });
  }

  const updateForm = profileSelectors.updateForm();
  if (updateForm) {
    updateForm.addEventListener("submit", handleUpdateProfile);
  }

  const passwordForm = profileSelectors.passwordForm();
  if (passwordForm) {
    passwordForm.addEventListener("submit", handleChangePassword);
  }

  // Güvenlik butonuna tıklandığında şifre değiştirme formunu göster/gizle
  const securityBtn = document.getElementById("securityBtn");
  const changePasswordSection = document.getElementById("changePasswordSection");
  if (securityBtn && changePasswordSection) {
    securityBtn.addEventListener("click", () => {
      const isVisible = changePasswordSection.style.display !== "none";
      changePasswordSection.style.display = isVisible ? "none" : "block";
      
      // Smooth scroll
      if (!isVisible) {
        setTimeout(() => {
          changePasswordSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
      }
    });
  }
};

const initProfile = async () => {
  try {
    ensureAuthenticated();
  } catch (error) {
    showToast(error.message, true);
    window.location.href = "login.html";
    return;
  }

  // Navigation menüsünü rol bazlı güncelle
  if (typeof updateNavigationByRole === "function") {
    updateNavigationByRole();
  }

  bindProfileEvents();
  updateProfileWelcome();
  await loadUserProfile();
};

document.addEventListener("DOMContentLoaded", () => {
  const page = profileSelectors.page();
  if (!page) return;
  initProfile();
});




