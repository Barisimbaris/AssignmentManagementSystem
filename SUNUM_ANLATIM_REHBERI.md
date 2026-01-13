# 🎤 FRONTEND GELİŞTİRİCİ SUNUM REHBERİ
## Ödev Yönetim Sistemi - Adım Adım Geliştirme Süreci

---

## 📋 SUNUM GİRİŞİ (1 dakika)

**Söyleyecekleriniz:**
> "Merhaba hocam. Ben Ahmet Doğan Altay, bu projede frontend geliştirici olarak görev aldım. Bugün sizlere frontend tarafında yaptığım çalışmaları, baştan sona sırasıyla anlatacağım."

---

## 🎯 1. ADIM: PROJE ALTYAPISININ KURULUMU

**Söyleyecekleriniz:**
> "İlk olarak, frontend projesinin temel yapısını oluşturdum. Vanilla JavaScript kullanarak, framework bağımlılığı olmadan hafif ve hızlı bir uygulama geliştirmeyi tercih ettik."

**Gösterecekleriniz:**
- Proje klasör yapısı
- `Assignment-Frontend/pages/` klasörü

**Yapılanlar:**
- HTML5, CSS3, Vanilla JavaScript ile proje yapısı oluşturuldu
- Modüler JavaScript yapısı planlandı
- Her sayfa için ayrı HTML ve JS dosyası yaklaşımı benimsendi

---

## 🔌 2. ADIM: BACKEND API BAĞLANTISININ KURULUMU

**Söyleyecekleriniz:**
> "Backend geliştiricimiz Barış Akarkan, .NET 9 ile RESTful API geliştirdi. Ben de frontend'den bu API'ye bağlanmak için merkezi bir sistem kurdum."

**Gösterecekleriniz:**
- `authUtils.js` dosyasını açın
- `API_BASE_URL` tanımını gösterin

**Yapılanlar:**

1. **API Base URL Tanımlama:**
   ```javascript
   const API_BASE_URL = "http://localhost:8080/api";
   ```
   - Backend API'nin adresini merkezi bir yerden yönetiyoruz
   - (Değişiklik yapmak gerektiğinde tek yerden güncellenebilir)

2. **Merkezi API Çağrı Fonksiyonu (`apiFetch`):**
   - Tüm API istekleri bu fonksiyon üzerinden yapılıyor
   - JWT token otomatik olarak header'a ekleniyor
   - Hata yönetimi merkezi olarak yapılıyor
   - Response normalizasyonu (backend'den gelen farklı formatları tek formata çeviriyor)

**Teknik Detay:**
- Fetch API kullanıldı (modern JavaScript)
- Async/await ile asenkron işlemler
- CORS yapılandırması backend'de yapıldı

---

## 🔐 3. ADIM: KİMLİK DOĞRULAMA SİSTEMİ (AUTHENTICATION)

**Söyleyecekleriniz:**
> "Kullanıcıların sisteme giriş yapabilmesi için kimlik doğrulama sistemini geliştirdim. JWT token tabanlı bir sistem kullandık."

**Gösterecekleriniz:**
- `login.html` sayfasını açın
- `login.js` dosyasını gösterin
- `authUtils.js` içindeki token yönetimini açıklayın

**Yapılanlar:**

### 3.1. Login Sayfası (`login.html`)
- Modern ve kullanıcı dostu arayüz tasarlandı
- Responsive tasarım (mobil uyumlu)
- Form validasyonu eklendi

### 3.2. Token Yönetimi (`authUtils.js`)
```javascript
// Token'ı sessionStorage'da saklıyoruz
sessionStorage.setItem("ams.auth.token", token);
sessionStorage.setItem("ams.auth.user", JSON.stringify(user));
```

**Neden sessionStorage?**
- Sayfa kapatıldığında otomatik silinir (güvenlik)
- Tarayıcı sekmesi bazlı çalışır
- LocalStorage'dan daha güvenli

### 3.3. Login İşlevselliği (`login.js`)
1. Form submit event'i yakalanıyor
2. Email ve password alınıyor
3. API'ye POST isteği gönderiliyor: `POST /api/Auth/login`
4. Backend'den token ve kullanıcı bilgileri alınıyor
5. Token sessionStorage'a kaydediliyor
6. Kullanıcı rolüne göre yönlendirme yapılıyor:
   - Student → `student_dashboard.html`
   - Instructor → `teacher_dashboard.html`

**Önemli Özellik:**
- Her API isteğinde token otomatik olarak `Authorization: Bearer {token}` header'ına ekleniyor
- 401 Unauthorized hatası alındığında otomatik logout ve login sayfasına yönlendirme

---

## 🧭 4. ADIM: NAVİGASYON SİSTEMİ

**Söyleyecekleriniz:**
> "Kullanıcıların sayfalar arasında kolayca gezinmesi için dinamik bir navigasyon sistemi geliştirdim. Bu sistem, kullanıcının rolüne göre farklı menüler gösteriyor."

**Gösterecekleriniz:**
- `navigation.js` dosyasını açın
- `index.html` ana sayfayı gösterin

**Yapılanlar:**

### 4.1. Ana Sayfa (`index.html`)
- Hoş geldin sayfası
- Giriş ve kayıt butonları

### 4.2. Dinamik Navigasyon (`navigation.js`)
- `updateNavigationByRole()` fonksiyonu ile menü dinamik oluşturuluyor
- Rol bazlı menü öğeleri:
  - **Öğrenci:** Ana Sayfa, Ödevlerim, Sınav Karnesi, Profil
  - **Öğretmen:** Ana Sayfa, Derslerim, Sınıflarım, Ödevler, Not Ver, Analiz, Profil

**Teknik Detay:**
- Her sayfada `navigation.js` import ediliyor
- Sayfa yüklendiğinde otomatik olarak menü güncelleniyor
- Kullanıcı bilgileri sessionStorage'dan çekiliyor

---

## 👨‍🎓 5. ADIM: ÖĞRENCİ KONTROL PANELİ

**Söyleyecekleriniz:**
> "Öğrenciler için bir kontrol paneli geliştirdim. Bu panelde öğrenciler kayıtlı oldukları dersleri görebilir ve ödevlerine erişebilirler."

**Gösterecekleriniz:**
- `student_dashboard.html` sayfasını açın
- `app.js` dosyasını gösterin
- Canlı olarak çalıştırıp gösterin

**Yapılanlar:**

### 5.1. Öğrenci Dashboard Sayfası (`student_dashboard.html`)
- Hoş geldin kartı (gradient tasarım)
- Kullanıcı bilgileri gösterimi (isim, email, rol)
- Kayıtlı dersler listesi bölümü

### 5.2. Dashboard İşlevselliği (`app.js`)
```javascript
// API'den kayıtlı sınıfları çekme
const loadEnrolledClasses = async () => {
  const classes = await apiFetch("/Class");
  // Sınıfları kart formatında göster
  renderClassesList(classes);
};
```

**API Entegrasyonu:**
- `GET /api/Class` - Tüm sınıfları çekme
- Her sınıf için kart görünümü oluşturuluyor
- Responsive grid layout kullanıldı

**Özellikler:**
- Loading state'leri (veri yüklenirken "Yükleniyor..." gösterimi)
- Hata yönetimi (API hatası durumunda kullanıcıya bilgi)
- Modern UI/UX tasarımı

---

## 👨‍🏫 6. ADIM: ÖĞRETMEN KONTROL PANELİ

**Söyleyecekleriniz:**
> "Öğretmenler için daha kapsamlı bir kontrol paneli geliştirdim. Öğretmenler bu panelden ders oluşturabilir, sınıf açabilir ve öğrencileri yönetebilirler."

**Gösterecekleriniz:**
- `teacher_dashboard.html` sayfasını açın
- `teacher.js` dosyasını gösterin
- Canlı demo yapın (ders oluşturma, sınıf oluşturma)

**Yapılanlar:**

### 6.1. Öğretmen Dashboard Sayfası (`teacher_dashboard.html`)
- Hoş geldin kartı
- Dersler bölümü (liste + oluştur butonu)
- Sınıflar bölümü (liste + oluştur butonu)
- Modal'lar (Ders oluştur, Sınıf oluştur)

### 6.2. Ders Oluşturma Özelliği

**Form Alanları:**
- Course Code (ders kodu) - örn: MAT101
- Course Name (ders adı) - örn: Matematik I
- Department (bölüm) - örn: Matematik Bölümü
- Credit Hours (AKTS) - örn: 4
- Academic Year (akademik yıl) - örn: 2025-2026

**API Entegrasyonu:**
```javascript
// Ders oluşturma
const handleCreateCourse = async (event) => {
  event.preventDefault();
  
  const formData = {
    courseCode: form.courseCode.value,
    courseName: form.courseName.value,
    department: form.department.value,
    creditHours: parseInt(form.creditHours.value),
    academicYear: form.academicYear.value
  };
  
  // API'ye POST isteği
  const result = await apiFetch("/Course", {
    method: "POST",
    body: formData
  });
  
  // Başarı mesajı ve liste yenileme
  showToast("Ders başarıyla oluşturuldu!", false);
  loadCourses(); // Liste otomatik yenileniyor
};
```

**API Endpoint:** `POST /api/Course`

### 6.3. Sınıf Oluşturma Özelliği

**Form Alanları:**
- Course seçimi (dropdown - önceden oluşturulan derslerden)
- Class Name (sınıf adı) - örn: A Şubesi
- Class Code (sınıf kodu) - örn: MAT101-A
- Capacity (kontenjan) - örn: 50
- Semester (dönem) - örn: 2024-2025 Güz

**API Entegrasyonu:**
```javascript
// Sınıf oluşturma
const handleCreateClass = async (event) => {
  const formData = {
    courseId: parseInt(form.courseSelect.value),
    className: form.className.value,
    classCode: form.classCode.value,
    maxCapacity: parseInt(form.maxCapacity.value),
    semester: form.semester.value
  };
  
  await apiFetch("/Class", {
    method: "POST",
    body: formData
  });
};
```

**API Endpoint:** `POST /api/Class`

### 6.4. Liste Görüntüleme

**Dersler Listesi:**
- `GET /api/Course` ile tüm dersler çekiliyor
- Kart formatında gösteriliyor
- Her kart: Ders kodu, adı, bölüm, AKTS bilgileri

**Sınıflar Listesi:**
- `GET /api/Class` ile tüm sınıflar çekiliyor
- Kart formatında gösteriliyor
- Her kart: Sınıf adı, ders, kontenjan bilgileri

**Özellikler:**
- Form validasyonu (client-side)
- Başarı/hata mesajları (toast bildirimleri)
- Modal yönetimi (açma/kapama, ESC tuşu ile kapanma)
- Form submit sonrası otomatik liste yenileme

---

## 🎨 7. ADIM: CSS STİL DOSYASI

**Söyleyecekleriniz:**
> "Tüm sayfalar için tutarlı ve modern bir tasarım oluşturdum. Responsive tasarım prensiplerini kullanarak mobil uyumlu bir arayüz geliştirdim."

**Gösterecekleriniz:**
- `styles/styles.css` dosyasını açın
- Farklı sayfaları göstererek tutarlı tasarımı vurgulayın

**Yapılanlar:**

### 7.1. Tasarım Sistemi
- Modern gradient renkler (mor-mavi tonları)
- Tutarlı renk paleti
- Responsive breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### 7.2. Component Stilleri
- Kart tasarımları
- Buton stilleri
- Form elemanları
- Modal stilleri
- Navigasyon menüsü

### 7.3. Responsive Tasarım
- Flexbox ve Grid Layout kullanımı
- Mobile-first yaklaşım
- Touch-friendly butonlar

---

## 🔧 8. ADIM: TEKNİK DETAYLAR VE ÇÖZÜMLER 
 // anlatmasak da olur
**Söyleyecekleriniz:**
> "Geliştirme sürecinde bazı teknik zorluklarla karşılaştım ve bunları çözdüm."

### 8.1. CORS Sorunu
**Problem:** Frontend'den backend API'ye istek yaparken CORS hatası alınıyordu.

**Çözüm:** Backend geliştiricimizle birlikte CORS middleware'ini yapılandırdık. Development ortamı için güvenlik ayarlarını gevşettik.

### 8.2. JWT Token Yönetimi
**Problem:** Token'ın her API isteğinde gönderilmesi ve süresi dolduğunda yönetimi karmaşıktı.

**Çözüm:** 
- Merkezi `authUtils.js` modülü oluşturdum
- `apiFetch` fonksiyonu token'ı otomatik olarak header'a ekliyor
- 401 Unauthorized durumunda otomatik logout ve yönlendirme

### 8.3. Rol Bazlı Erişim Kontrolü
**Problem:** Farklı roller için farklı sayfalar ve menüler gösterilmesi gerekiyordu.

**Çözüm:**
- `navigation.js` modülü ile dinamik menü oluşturdum
- Her sayfada rol kontrolü yapılıyor
- Yetkisiz erişimde yönlendirme yapılıyor

### 8.4. Form Validasyonu ve Hata Yönetimi
**Problem:** Form gönderimlerinde hata yönetimi ve kullanıcıya geri bildirim verme zordu.

**Çözüm:**
- Client-side form validasyonu ekledim
- API hatalarını yakalayıp kullanıcıya gösteriyorum
- Toast bildirimleri ile başarı/hata mesajları

---

## 📊 9. ADIM: API ENTEGRASYONLARI ÖZETİ

**Söyleyecekleriniz:**
> "Backend API ile entegrasyon yaparken şu endpoint'leri kullandım:"

**Kullanılan API Endpoint'leri:**

1. **Authentication:**
   - `POST /api/Auth/login` - Kullanıcı girişi
   - `POST /api/Auth/register` - Kullanıcı kaydı

2. **Course (Ders):**
   - `GET /api/Course` - Tüm dersleri çekme
   - `GET /api/Course/my-courses` - Öğretmenin derslerini çekme
   - `POST /api/Course` - Yeni ders oluşturma

3. **Class (Sınıf):**
   - `GET /api/Class` - Tüm sınıfları çekme
   - `POST /api/Class` - Yeni sınıf oluşturma

**API Çağrı Yapısı:**
```javascript
// Örnek API çağrısı
const courses = await apiFetch("/Course", {
  method: "GET"
});

// POST isteği
const newCourse = await apiFetch("/Course", {
  method: "POST",
  body: {
    courseCode: "MAT101",
    courseName: "Matematik I",
    department: "Matematik",
    creditHours: 4,
    academicYear: "2024-2025"
  }
});
```

---

## 🎯 10. ADIM: TAMAMLANAN ÖZELLİKLER ÖZETİ

**Söyleyecekleriniz:**
> "Şu ana kadar tamamladığım modüller:"

1. ✅ **Giriş ve Kayıt Sistemi**
   - Login sayfası
   - Token yönetimi
   - Rol bazlı yönlendirme

2. ✅ **Ana Sayfa ve Navigasyon**
   - Dinamik menü sistemi
   - Rol bazlı menü gösterimi

3. ✅ **Öğrenci Kontrol Paneli**
   - Dashboard sayfası
   - Kayıtlı dersler listesi

4. ✅ **Öğretmen Kontrol Paneli**
   - Dashboard sayfası
   - Ders oluşturma
   - Sınıf oluşturma
   - Liste görüntüleme

5. ✅ **CSS Stil Dosyası**
   - Modern ve responsive tasarım
   - Tutarlı component stilleri

---

## 🚀 11. ADIM: SONRAKİ ADIMLAR

**Söyleyecekleriniz:**
> "Önümüzdeki haftalarda şu modülleri geliştireceğim:"

1. **Ödev Yönetim Modülü**
   - Öğretmen için ödev verme formu
   - Öğrenci için ödev görüntüleme
   - Dosya yükleme özelliği

2. **Ödev Teslim Sistemi**
   - Öğrenci ödev teslim formu
   - Dosya yükleme (PDF, JPG, PNG)
   - Teslim geçmişi

3. **Notlandırma Modülü**
   - Not verme sayfası
   - Geri bildirim yazma
   - Not yayınlama

4. **Diğer Modüller**
   - Sınav karnesi
   - Sınıf yönetimi
   - Analiz ve raporlama
   - Profil yönetimi

---

## 💡 12. ADIM: ÖĞRENİLEN DERSLER VE DENEYİMLER

**Söyleyecekleriniz:**
> "Bu projede şunları öğrendim:"

1. **API Entegrasyonu:**
   - RESTful API ile çalışma
   - JWT token yönetimi
   - Async/await kullanımı

2. **Modüler JavaScript:**
   - Kod organizasyonu
   - Merkezi utility fonksiyonları
   - Kod tekrarını önleme

3. **Responsive Tasarım:**
   - Mobile-first yaklaşım
   - Flexbox ve Grid Layout
   - Kullanıcı deneyimi (UX)

4. **Hata Yönetimi:**
   - Try-catch blokları
   - Kullanıcıya anlaşılır hata mesajları
   - Loading state'leri

---

## 🎬 SUNUM SONU (1 dakika)

**Söyleyecekleriniz:**
> "Özetlemek gerekirse, frontend tarafında kullanıcı kimlik doğrulama sistemi, öğrenci ve öğretmen kontrol panelleri, API entegrasyonları ve modern bir kullanıcı arayüzü,... geliştirdim. Teşekkürler, sorularınızı alabilirim."

---

## 📝 SUNUM İPUÇLARI

1. **Canlı Demo Yapın:**
   - Backend'i çalıştırın
   - Frontend'i açın
   - Giriş yapın
   - Ders oluşturma işlemini gösterin
   - Sınıf oluşturma işlemini gösterin

2. **Kod Örnekleri Gösterin:**
   - `authUtils.js` dosyasını açın
   - `apiFetch` fonksiyonunu gösterin
   - `teacher.js` içindeki ders oluşturma kodunu gösterin

3. **Zaman Yönetimi:**
   - Toplam 10-15 dakika
   - Her adım için 1-2 dakika
   - Sorular için zaman bırakın

4. **Vurgulayın:**
   - Modüler yapı
   - API entegrasyonu
   - Responsive tasarım
   - Kullanıcı deneyimi

---

**Başarılar! 🚀**












