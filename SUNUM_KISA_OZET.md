# 🎤 FRONTEND GELİŞTİRİCİ 
## 📋 GİRİŞ (30 saniye)

**Başlangıç:**
> "Merhaba hocam. Ben Ahmet Doğan Altay, bu projede frontend geliştirici olarak görev aldım. Vanilla JavaScript (framework’süz saf JS) kullanarak, hafif ve hızlı bir web uygulaması geliştirdim. Proje şu an tüm modülleriyle çalışır durumda."

---

## 🔌 1. BACKEND API BAĞLANTISI (1 dakika)

**Söyleyecekleriniz:**
> "Backend API (REST servis) ile bağlantıyı merkezi hale getirdim. `authUtils.js` içinde `apiFetch` fonksiyonu var; tüm API çağrılarını yönetiyor, JWT (JSON Web Token) otomatik header’a ekleniyor, hata yönetimi tek yerde."

**Gösterecekleriniz:**
- `authUtils.js` dosyasını açın
- `API_BASE_URL` ve `apiFetch` fonksiyonunu gösterin

**Önemli Nokta:**
- Backend: `http://localhost:8080/api`
- JWT (stateless kimlik doğrulama) header’a otomatik ekleniyor
- Tüm istekler merkezi fonksiyon üzerinden

---

## 🔐 2. KİMLİK DOĞRULAMA SİSTEMİ (1 dakika)

**Söyleyecekleriniz:**
> "Login sayfası ile kullanıcı email/şifre giriyor; backend JWT üretiyor; token sessionStorage’a (sekme bazlı depolama) kaydediliyor; her istekte otomatik gönderiliyor."

**Gösterecekleriniz:**
- `login.html` sayfasını açın
- Canlı demo: Giriş yapın

**Önemli Noktalar:**
- Token sessionStorage’da (sekme kapanınca silinir)
- Rol bazlı yönlendirme (Student/Instructor/Admin)
- 401’de otomatik logout

---

## 🗄️ 2.5 VERİTABANI / SQL SERVER (30–45 saniye)

**Söyleyecekleriniz:**
> "Veritabanı SQL Server üzerinde. EF Core 8 (ORM) ile migration’lar uygulanıyor. Bağlantı `Program.cs`’te `UseSqlServer` ile ayarlı."

**Gösterecekleriniz:**
- `AMS.API/appsettings.json` → `ConnectionStrings:DefaultConnection`
- İsterseniz kısa komut: `dotnet ef database update --project src/AMS.Infrastructure --startup-project src/AMS.API`

**Önemli Nokta:**
- Clean Architecture’da DB işlemleri Infrastructure katmanında (DbContext, Repositories, Migrations).
- Tablolar: Users, Courses, Classes, Enrollments, Assignments, Submissions, Grades, (LessonPlans).
- Migration’lar `AMS.Infrastructure/Migrations` klasöründe; şema değişiklikleri buradan yönetiliyor.

---

## 👨‍🎓 3. ÖĞRENCİ KONTROL PANELİ (30 saniye)

**Söyleyecekleriniz:**
> "Öğrenciler için bir kontrol paneli geliştirdim. Bu panelde öğrenciler kayıtlı oldukları dersleri görebilirler."

**Gösterecekleriniz:**
- `student_dashboard.html` (öğrenci paneli)
- API: `GET /api/Class` (sınıf listesi)

---

## 👨‍🏫 4. ÖĞRETMEN KONTROL PANELİ (1.5 dakika)

**Söyleyecekleriniz:**
> "Öğretmen paneliyle ders (Course) oluşturma, sınıf (Class) açma, öğrenci ekleme; ödev (Assignment) verme, teslimleri (Submission) görme ve not (Grade) verme akışı tamamlandı."

**Gösterecekleriniz:**
- `teacher_dashboard.html` sayfasını açın
- **Canlı Demo:**
  1. "Yeni Ders Oluştur" butonuna tıklayın
  2. Formu doldurun (MAT101, Matematik I, vb.)
  3. "Oluştur" butonuna tıklayın
  4. Dersin listeye eklendiğini gösterin
  5. "Yeni Sınıf Oluştur" butonuna tıklayın
  6. Ders seçin ve sınıf bilgilerini girin
  7. Sınıfın oluşturulduğunu gösterin

**API Endpoint'leri:**
- `POST /api/Course` (ders oluştur)
- `POST /api/Class` (sınıf oluştur)
- `GET /api/Course` (ders listesi)
- `GET /api/Class` (sınıf listesi)

**Özellikler:**
- Modal formlar, form validasyonu
- Başarı/hata mesajları
- Liste otomatik yenileme
- Dosya indirme

---

## 🎨 5. TASARIM VE RESPONSIVE (30 saniye)

**Söyleyecekleriniz:**
> "Tüm sayfalar için modern ve responsive bir tasarım oluşturdum. Mobil uyumlu, kullanıcı dostu bir arayüz geliştirdim."

**Gösterecekleriniz:**
- Tarayıcı boyutunu değiştirip responsive (farklı ekranlara uyum) gösterin
- CSS stillerinden kısa örnek

---

## 📊 ÖZET VE SONUÇ (30 saniye)

**Söyleyecekleriniz:**
> "Özetle: Auth (JWT), öğrenci/öğretmen panelleri, ders-sınıf-ödev-teslim-not akışı, analizler, dosya yönetimi tamamlandı. Modern, responsive UI ve merkezi API entegrasyonu var. Teşekkürler."

---


## 💡 ÖNEMLİ İPUÇLARI



2. **Kod Gösterimi:**
   - Sadece `authUtils.js` içindeki `apiFetch` fonksiyonunu gösterin
   - Çok detaya girmeyin

3. **Vurgulayın:**
   - Modüler yapı
   - API entegrasyonu
   - Responsive tasarım

4. **Zaman Yönetimi:**
   - En çok öğretmen paneli demo'suna zaman ayırın
