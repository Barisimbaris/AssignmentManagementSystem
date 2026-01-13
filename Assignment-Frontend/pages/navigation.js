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

  // Öğretmen menü öğeleri - SVG ikonlar ile
  const teacherMenuItems = [
    { href: "teacher_dashboard.html", label: "Ana Sayfa", icon: getHomeIcon() },
    { href: "assignments.html", label: "Ödevler", icon: getDocumentIcon() },
    { href: "grading.html", label: "Not Ver", icon: getPencilIcon() },
    { href: "class_management.html", label: "Sınıf Yönetimi", icon: getPeopleIcon() },
    { href: "lesson_planning.html", label: "Ders Planlama", icon: getCalendarIcon() },
    { href: "reports.html", label: "Analizler", icon: getChartIcon() },
    { href: "profile.html", label: "Profil", icon: getPersonIcon() }
  ];

  // Öğrenci menü öğeleri - SVG ikonlar ile
  const studentMenuItems = [
    { href: "student_dashboard.html", label: "Ana Sayfa", icon: getHomeIcon() },
    { href: "assignments.html", label: "Ödevlerim", icon: getDocumentIcon() },
    { href: "class_schedule.html", label: "Ders Programı", icon: getCalendarIcon() },
    { href: "exam_results.html", label: "Sınav Karnesi", icon: getChartIcon() },
    { href: "profile.html", label: "Profil", icon: getPersonIcon() }
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
    return `<li><a href="${item.href}"${activeClass}><span class="nav-icon">${item.icon}</span> ${item.label}</a></li>`;
  }).join("");

  // Çıkış butonunu ekle
  const logoutLi = document.createElement("li");
  logoutLi.innerHTML = `<a href="index.html" onclick="window.clearAuthSession(); return true;"><span class="nav-icon">${getDoorIcon()}</span> Çıkış</a>`;
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

// SVG İkon fonksiyonları - Düz siyah çizgi ikonlar
function getHomeIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>`;
}

function getDocumentIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="9" y1="15" x2="15" y2="15"></line>
  </svg>`;
}

function getPencilIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>`;
}

function getPeopleIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>`;
}

function getCalendarIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>`;
}

function getChartIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>`;
}

function getPersonIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>`;
}

function getDoorIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>`;
}

// Global scope'a ekle
window.updateNavigationByRole = updateNavigationByRole;

