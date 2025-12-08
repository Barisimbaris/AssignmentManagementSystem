document.addEventListener("DOMContentLoaded", () => {
  // URL'den rol parametresini al
  const urlParams = new URLSearchParams(window.location.search);
  const selectedRole = urlParams.get("role") || null;
  
  console.log("[login.js] Seçilen rol parametresi:", selectedRole);
  
  // Rol bilgisini sayfada göster (varsa)
  if (selectedRole) {
    const subtitle = document.querySelector(".subtitle") || document.getElementById("roleSubtitle");
    if (subtitle) {
      const roleText = selectedRole === "student" ? "Öğrenci" : "Öğretmen";
      subtitle.textContent = `${roleText} girişi yapın`;
      subtitle.style.color = "#667eea";
      subtitle.style.fontWeight = "600";
    }
  }

  // Manuel form girişi - BACKEND API KULLANIR
  const form = document.getElementById("loginForm");
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showToast("Lütfen tüm alanları doldurun", true);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Giriş yapılıyor...";

    try {
      const data = await apiFetch("/Auth/login", {
        method: "POST",
        body: { email, password }
      });

      // Kullanıcının gerçek rolünü al
      const userRole = (data.role || "").toLowerCase();
      
      console.log("[login.js] Kullanıcı rolü:", userRole, "Seçilen rol:", selectedRole);
      
      // Eğer rol parametresi varsa, kontrol et (session kaydedilmeden önce)
      if (selectedRole) {
        const expectedRole = selectedRole.toLowerCase();
        
        // Rol eşleşmiyor mu?
        if (expectedRole === "student" && userRole !== "student") {
          const errorMsg = userRole === "instructor" || userRole === "admin" 
            ? "❌ Bu sayfa öğrenci girişi içindir. Girdiğiniz hesap öğretmen hesabıdır. Lütfen öğretmen giriş sayfasından giriş yapın."
            : "❌ Bu sayfa öğrenci girişi içindir. Girdiğiniz hesap uygun değildir.";
          
          console.warn("[login.js] Rol uyumsuzluğu:", { expected: expectedRole, actual: userRole });
          showToast(errorMsg, true);
          submitButton.disabled = false;
          submitButton.textContent = "Giriş Yap";
          return;
        }
        
        if (expectedRole === "instructor" && userRole !== "instructor" && userRole !== "admin") {
          const errorMsg = userRole === "student"
            ? "❌ Bu sayfa öğretmen girişi içindir. Girdiğiniz hesap öğrenci hesabıdır. Lütfen öğrenci giriş sayfasından giriş yapın."
            : "❌ Bu sayfa öğretmen girişi içindir. Girdiğiniz hesap uygun değildir.";
          
          console.warn("[login.js] Rol uyumsuzluğu:", { expected: expectedRole, actual: userRole });
          showToast(errorMsg, true);
          submitButton.disabled = false;
          submitButton.textContent = "Giriş Yap";
          return;
        }
      }

      saveAuthSession({
        token: data.token,
        user: {
          userId: data.userId,
          id: data.userId,
          email: data.email,
          role: data.role,
          fullName: `${data.firstName} ${data.lastName}`.trim()
        }
      });

      showToast("✅ Giriş başarılı!");

      const resolvedRole = userRole;
      const redirectUrl =
        resolvedRole === "instructor" || resolvedRole === "admin"
          ? "teacher_dashboard.html"
          : "student_dashboard.html";

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 800);
    } catch (err) {
      console.error("[login.js] ❌ HATA:", err);
      let errorMessage = err.message || "Giriş başarısız";
      
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
      submitButton.textContent = "Giriş Yap";
    }
  });
});