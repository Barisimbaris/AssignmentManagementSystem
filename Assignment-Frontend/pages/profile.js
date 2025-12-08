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
  const container = profileSelectors.profileDisplay();
  if (!container) return;

  container.innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">👤</div>
      <div class="profile-details">
        <h3>${profile.firstName} ${profile.lastName}</h3>
        <p><strong>E-posta:</strong> ${profile.email}</p>
        <p><strong>Rol:</strong> ${profile.role === "Student" ? "Öğrenci" : profile.role === "Instructor" ? "Öğretmen" : "Admin"}</p>
        ${profile.studentNumber ? `<p><strong>Öğrenci No:</strong> ${profile.studentNumber}</p>` : ""}
        ${profile.department ? `<p><strong>Bölüm:</strong> ${profile.department}</p>` : ""}
        ${profile.phoneNumber ? `<p><strong>Telefon:</strong> ${profile.phoneNumber}</p>` : ""}
      </div>
    </div>
  `;
};

const loadUserProfile = async () => {
  const container = profileSelectors.profileDisplay();
  if (container) {
    container.textContent = "Yükleniyor...";
  }

  try {
    const userId = getUserId();
    const profile = await apiFetch(`/User/${userId}`);
    profileState.userProfile = profile;

    renderProfileDisplay(profile);

    // Formu doldur
    document.getElementById("firstName").value = profile.firstName || "";
    document.getElementById("lastName").value = profile.lastName || "";
    document.getElementById("email").value = profile.email || "";
    document.getElementById("studentNumber").value = profile.studentNumber || "";
    document.getElementById("department").value = profile.department || "";
    document.getElementById("phoneNumber").value = profile.phoneNumber || "";

  } catch (error) {
    if (profileHandleUnauthorized(error)) return;
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message}</p>`;
    }
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




