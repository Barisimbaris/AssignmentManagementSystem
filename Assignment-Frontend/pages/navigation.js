// Navigation menüsünü rol bazlı oluştur/güncelle

const updateNavigationByRole = () => {
  const user = getAuthUser();
  if (!user) {
    // Kullanıcı yoksa basit menü göster
    renderSimpleNavigation();
    return;
  }

  const userRole = (user.role || "").toLowerCase();
  const nav = document.querySelector("nav");
  if (!nav) return;

  // Mevcut sayfa adını al
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // Nav içinde ul var mı kontrol et, yoksa oluştur
  let ul = nav.querySelector("ul");
  if (!ul) {
    ul = document.createElement("ul");
    nav.appendChild(ul);
  }

  // Öğretmen menü öğeleri
  const teacherMenuItems = [
    { href: "teacher_dashboard.html", label: "Kontrol Paneli", icon: "🏠" },
    { href: "assignments.html", label: "Ödevler", icon: "📝" },
    { href: "grading.html", label: "Not Ver", icon: "✏️" },
    { href: "class_management.html", label: "Sınıf Yönetimi", icon: "👥" },
    { href: "lesson_planning.html", label: "Ders Planlama", icon: "📅" },
    { href: "reports.html", label: "Analizler", icon: "📊" },
    { href: "profile.html", label: "Profil", icon: "👤" }
  ];

  // Öğrenci menü öğeleri
  const studentMenuItems = [
    { href: "student_dashboard.html", label: "Ana Sayfa", icon: "🏠" },
    { href: "assignments.html", label: "Ödevlerim", icon: "📝" },
    { href: "class_schedule.html", label: "Ders Programı", icon: "📅" },
    { href: "exam_results.html", label: "Sınav Karnesi", icon: "📊" },
    { href: "profile.html", label: "Profil", icon: "👤" }
  ];

  // Menü öğelerini belirle
  let menuItems = [];
  if (userRole === "student") {
    menuItems = studentMenuItems;
  } else if (userRole === "instructor" || userRole === "admin") {
    menuItems = teacherMenuItems;
  } else {
    // Varsayılan olarak öğrenci menüsü göster
    menuItems = studentMenuItems;
  }

  // Menüyü oluştur
  ul.innerHTML = menuItems.map(item => {
    const isActive = currentPage === item.href || 
                     (currentPage === "assignments.html" && item.href === "assignments.html");
    const activeClass = isActive ? ' class="active"' : '';
    return `<li><a href="${item.href}"${activeClass}>${item.icon} ${item.label}</a></li>`;
  }).join("");

  // Çıkış butonunu ekle
  const logoutLi = document.createElement("li");
  logoutLi.innerHTML = `<a href="index.html" onclick="window.clearAuthSession(); return true;">🚪 Çıkış</a>`;
  ul.appendChild(logoutLi);
};

// Basit navigasyon (kullanıcı giriş yapmamışsa)
const renderSimpleNavigation = () => {
  const nav = document.querySelector("nav");
  if (!nav) return;

  let ul = nav.querySelector("ul");
  if (!ul) {
    ul = document.createElement("ul");
    nav.appendChild(ul);
  }

  ul.innerHTML = `
    <li><a href="login.html">Giriş Yap</a></li>
    <li><a href="register.html">Kayıt Ol</a></li>
  `;
};

// Global scope'a ekle
window.updateNavigationByRole = updateNavigationByRole;

