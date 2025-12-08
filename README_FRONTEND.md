#  Assignment Management System – Frontend README

Vanilla JS + HTML/CSS frontend for the AMS project. Talks to the .NET 9 backend API.

##  Hızlı Başlangıç
1) Backend’i çalıştırın  
```powershell
cd AssignmentManagementSystem-main
dotnet run --project src/AMS.API --launch-profile http
```
API: `http://localhost:8080/api`, Swagger: `http://localhost:8080/swagger`

2) Frontend’i çalıştırın (basit static server)  
```powershell
cd Assignment-Frontend/pages
python -m http.server 3333
```
Ön yüz: `http://localhost:3333/login.html`

> Port değiştirirseniz `authUtils.js` içindeki `API_BASE_URL`’i güncelleyin.

## 🔑 Kimlik Doğrulama
- JWT tabanlı. Login sonrası token ve user sessionStorage’da tutulur.
- Role-based yönlendirme: Student → `student_dashboard`, Instructor → `teacher_dashboard`.
- 401 alınca otomatik logout ve login sayfasına dönüş.

## 🧭 Başlıca Sayfalar / JS (detaylı)
- `login.html` / `login.js`: Giriş, rol kontrolü, token kaydetme, 401’de logout.
- `teacher_dashboard.html` / `teacher.js`: Ders (Course) oluştur, sınıf (Class) oluştur, öğretmenin ders/sınıf listeleri
- `student_dashboard.html` / `app.js`: Öğrenci paneli; kayıtlı sınıflar listesi (`GET /api/Class`).
- `assignments.html` / `assignments.js`: Ödev verme (bireysel/grup, dosya opsiyonel), ödev listeleme, dosya indirme.
- `grading.html` / `grading.js`: Teslimleri gör, not ver/güncelle, publish; teslim dosyası indirirken orijinal isim.
- `exam_results.html` / `examResults.js`: “Notlarım”; ders bazında, gönderilme tarihine göre sıralı; genel istatistik ve ders bazlı analiz.
- `reports.html` / `reports.js` / `analytics.js`: Sınıf ve öğrenci analizleri, teslim oranı grafikleri.
- `class_management.html` / `classManagement.js`: Sınıfa öğrenci ekleme/çıkarma, kayıtlı öğrencileri görüntüleme.
- `lesson_planning.html` / `lessonPlanning.js`: Ders planlama (backend API hazırsa haftalık program).
- Ortak: `authUtils.js` (apiFetch + JWT header, sessionStorage), `navigation.js` (rol bazlı menü, logout), `styles/styles.css` (responsive).

## 📦 API Uçları (kısaltılmış)
- Auth: `POST /api/Auth/login`, `POST /api/Auth/register`, `POST /api/Auth/change-password`
- Course: `GET/POST/PUT/DELETE /api/Course`
- Class: `GET/POST /api/Class`, `POST /api/Class/{id}/enroll`, `POST /api/Class/{id}/unenroll`
- Assignment: `GET /api/Assignment`, `GET /api/Assignment/my-assignments`, `POST /api/Assignment` (form-data, dosya opsiyonel)
- Submission: `POST /api/Submission` (dosya), `GET /api/Submission/{id}/download`
- Grade: `POST /api/Grade`, `POST /api/Grade/publish`, `GET /api/Grade/my-grades`, `GET /api/Grade/class/{classId}`
- Analytics: `GET /api/Analytics`

## 🗄️ Veritabanı
- SQL Server, EF Core 8 (ORM). Bağlantı `appsettings.json` → `DefaultConnection`.
- Migration komutu:  
```powershell
dotnet ef database update --project src/AMS.Infrastructure --startup-project src/AMS.API
```
- Temel tablolar: Users, Courses, Classes, Enrollments, Assignments, Submissions, Grades, (LessonPlans).

## 🧪 Test / Kontroller
- Backend ayakta mı? `http://localhost:8080/swagger`
- Frontend ayakta mı? `http://localhost:3333/login.html`
- Öğretmen demo: Ders oluştur → Sınıf oluştur → Ödev ver → Teslim indir → Not ver/publish.
- Öğrenci demo: Ödev listele → Dosya yükle → Notlarım’da sıralı sonuçları gör.

## ⚠️ Notlar
- Responsive tasarım: flex/grid, breakpoints; mobile/tablet/desktop uyumlu.

## 📄 Lisans
Eğitim amaçlı kullanım.

