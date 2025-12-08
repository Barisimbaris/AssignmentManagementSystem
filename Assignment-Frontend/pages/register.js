document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirmPassword").value,
      role: parseInt(
        document.querySelector('input[name="user-type"]:checked')?.value || "1",
        10
      ),
      studentNumber: document.getElementById("studentNumber").value.trim(),
      department: document.getElementById("department").value.trim(),
      phoneNumber: document.getElementById("phoneNumber").value.trim()
    };

    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.email ||
      !payload.password ||
      !payload.confirmPassword
    ) {
      showToast("Lütfen zorunlu alanları doldurun", true);
      return;
    }

    // Şifre ve tekrar şifre kontrolü
    if (payload.password !== payload.confirmPassword) {
      showToast("❌ Şifreler eşleşmiyor! Lütfen şifrelerin aynı olduğundan emin olun.", true);
      
      // Şifre alanlarını vurgula
      const passwordInput = document.getElementById("password");
      const confirmPasswordInput = document.getElementById("confirmPassword");
      
      if (passwordInput && confirmPasswordInput) {
        passwordInput.style.borderColor = "#ff4444";
        confirmPasswordInput.style.borderColor = "#ff4444";
        
        // 3 saniye sonra border rengini normale döndür
        setTimeout(() => {
          passwordInput.style.borderColor = "#e0e0e0";
          confirmPasswordInput.style.borderColor = "#e0e0e0";
        }, 3000);
      }
      
      return;
    }

    if (payload.role !== 1 && payload.role !== 2) {
      showToast("Geçersiz rol seçimi", true);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Kaydediliyor...";

    try {
      await apiFetch("/Auth/register", {
        method: "POST",
        body: {
          ...payload,
          studentNumber: payload.studentNumber || null,
          department: payload.department || null,
          phoneNumber: payload.phoneNumber || null
        }
      });

      showToast("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz.");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    } catch (err) {
      console.error("[register.js] ❌ HATA:", err);
      let errorMessage = err.message || "Kayıt başarısız";
      
      // Backend'den gelen hata mesajlarını parse et
      if (err.response) {
        // FluentValidation hataları
        if (err.response.errors && typeof err.response.errors === 'object') {
          const errorList = [];
          for (const key in err.response.errors) {
            if (Array.isArray(err.response.errors[key])) {
              errorList.push(...err.response.errors[key]);
            } else if (typeof err.response.errors[key] === 'string') {
              errorList.push(err.response.errors[key]);
            }
          }
          if (errorList.length > 0) {
            errorMessage = errorList.join(", ");
          }
        } else if (err.response.message) {
          errorMessage = err.response.message;
        } else if (err.response.Message) {
          errorMessage = err.response.Message;
        }
      }
      
      // Şifre uyuşmazlığı hatalarını Türkçe'ye çevir
      if (errorMessage.toLowerCase().includes("password") && errorMessage.toLowerCase().includes("match")) {
        errorMessage = "❌ Şifreler eşleşmiyor! Lütfen şifrelerin aynı olduğundan emin olun.";
        // Şifre alanlarını vurgula
        const passwordInput = document.getElementById("password");
        const confirmPasswordInput = document.getElementById("confirmPassword");
        if (passwordInput && confirmPasswordInput) {
          passwordInput.style.borderColor = "#ff4444";
          confirmPasswordInput.style.borderColor = "#ff4444";
          setTimeout(() => {
            passwordInput.style.borderColor = "#e0e0e0";
            confirmPasswordInput.style.borderColor = "#e0e0e0";
          }, 3000);
        }
      }
      
      // Diğer İngilizce hata mesajlarını Türkçe'ye çevir
      const errorTranslations = {
        "email already registered": "Bu e-posta adresi zaten kayıtlı!",
        "password must be at least": "Şifre en az 6 karakter olmalıdır!",
        "password must contain at least one uppercase": "Şifre en az bir büyük harf içermelidir!",
        "password must contain at least one lowercase": "Şifre en az bir küçük harf içermelidir!",
        "password must contain at least one number": "Şifre en az bir rakam içermelidir!",
        "invalid email format": "Geçersiz e-posta formatı!",
        "first name is required": "Ad alanı zorunludur!",
        "last name is required": "Soyad alanı zorunludur!",
        "email is required": "E-posta alanı zorunludur!",
        "password is required": "Şifre alanı zorunludur!",
        "confirm password is required": "Şifre tekrar alanı zorunludur!"
      };
      
      const lowerErrorMessage = errorMessage.toLowerCase();
      for (const [key, value] of Object.entries(errorTranslations)) {
        if (lowerErrorMessage.includes(key)) {
          errorMessage = value;
          break;
        }
      }
      
      // Backend bağlantı hatası için özel mesaj
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Backend bağlantısı")) {
        errorMessage = "Backend bağlantısı kurulamadı! Backend'in çalıştığını kontrol edin (http://localhost:8080/swagger)";
      }
      
      showToast(errorMessage, true);
      
      // Backend çalışmıyorsa kullanıcıyı bilgilendir
      if (errorMessage.includes("Backend")) {
        const resultDiv = document.createElement("div");
        resultDiv.style.cssText = "background: #fee; padding: 1rem; margin: 1rem 0; border-radius: 8px; border: 1px solid #fcc;";
        resultDiv.innerHTML = `
          <strong>⚠️ Backend Bağlantı Hatası</strong><br>
          <p>Backend çalışmıyor görünüyor. Lütfen:</p>
          <ol style="text-align: left; margin: 0.5rem 0;">
            <li>Backend'in çalıştığını kontrol edin: <a href="http://localhost:8080/swagger" target="_blank">http://localhost:8080/swagger</a></li>
            <li>Eğer açılmıyorsa, backend'i başlatın</li>
            <li>Sayfayı yenileyin (F5)</li>
          </ol>
        `;
        form.parentNode.insertBefore(resultDiv, form.nextSibling);
        setTimeout(() => resultDiv.remove(), 10000);
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Kaydol";
    }
  });
});