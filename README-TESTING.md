# AMS API - Test Kılavuzu

Bu dokümantasyon, AMS API'nin tüm endpoint'lerini test etmek için kullanabileceğiniz araçları ve yöntemleri açıklar.

## 🚀 Hızlı Başlangıç

### 1. PowerShell Script (Windows)

```powershell
# Tüm endpoint'leri test et
.\test-all-endpoints.ps1

# Farklı base URL ile test et
.\test-all-endpoints.ps1 -BaseUrl "http://localhost:5281"

# Verbose mod ile detaylı çıktı
.\test-all-endpoints.ps1 -Verbose
```

### 2. Bash Script (Linux/Mac)

```bash
# Script'e çalıştırma izni ver
chmod +x test-all-endpoints.sh

# Tüm endpoint'leri test et
./test-all-endpoints.sh

# Farklı base URL ile test et
BASE_URL="http://localhost:5281" ./test-all-endpoints.sh
```

### 3. HTTP Dosyası (VS Code REST Client)

VS Code'da `ams-api-tests.http` dosyasını açın ve her endpoint'in üzerindeki "Send Request" butonuna tıklayın.

### 4. Postman/Newman Collection

```bash
# Newman ile test et (Node.js gerekli)
npm install -g newman
newman run newman/ams-collection.json -e newman/ams-environment.json

# HTML rapor ile
newman run newman/ams-collection.json -e newman/ams-environment.json -r html --reporter-html-export reports/test-report.html
```

## 📋 Test Edilen Endpoint'ler

### 1. Authentication
- ✅ Admin Login
- ✅ Instructor Login  
- ✅ Student Login
- ✅ Register
- ✅ Change Password

### 2. User Management
- ✅ Get All Users
- ✅ Get Students
- ✅ Get Instructors
- ✅ Get User by ID
- ✅ Get My Profile
- ✅ Update Profile

### 3. Course Management
- ✅ Create Course
- ✅ Get All Courses
- ✅ Get Course by ID
- ✅ Get Courses by Department
- ✅ Update Course
- ✅ Delete Course
- ✅ Assign Instructor to Course
- ✅ Get Course Instructors

### 4. Class Management
- ✅ Create Class
- ✅ Get All Classes
- ✅ Get Class by ID
- ✅ Get Classes by Course
- ✅ Get My Classes (Instructor)
- ✅ Get Classes by Instructor
- ✅ Update Class
- ✅ Enroll Student
- ✅ Unenroll Student
- ✅ Delete Class

### 5. Assignment Management
- ✅ Create Assignment
- ✅ Get All Assignments
- ✅ Get Assignment by ID
- ✅ Get Assignments by Class
- ✅ Get My Assignments (Student)
- ✅ Update Assignment
- ✅ Delete Assignment

### 6. Submission Management
- ✅ Submit Assignment
- ✅ Get Submission by ID
- ✅ Get Submissions by Assignment
- ✅ Get My Submissions
- ✅ Download Submission
- ✅ Resubmit Assignment
- ✅ Delete Submission

### 7. Grade Management
- ✅ Create Grade
- ✅ Get Grade by ID
- ✅ Get Grade by Submission
- ✅ Get Grades by Student
- ✅ Get My Grades
- ✅ Get Grades by Class
- ✅ Update Grade
- ✅ Publish Grades
- ✅ Delete Grade

### 8. Dashboard & Statistics
- ✅ Admin Dashboard
- ✅ Instructor Dashboard
- ✅ Student Dashboard
- ✅ Course Statistics
- ✅ Department Statistics
- ✅ My Class Statistics

### 9. Notification
- ✅ Get My Notifications
- ✅ Get Unread Count
- ✅ Mark as Read

### 10. Group Management
- ✅ Create Group
- ✅ Get Group by ID
- ✅ Get Groups by Assignment
- ✅ Add Member to Group
- ✅ Remove Member from Group
- ✅ Get Available Students

## 🔧 Test Senaryoları

### Senaryo 1: Tam Akış Testi

1. Admin olarak giriş yap
2. Course oluştur
3. Class oluştur
4. Instructor'a assignment oluştur
5. Student assignment'a submission yap
6. Instructor grade ver
7. Dashboard'ları kontrol et

### Senaryo 2: Rol Bazlı Erişim Testi

- Admin: Tüm endpoint'lere erişebilmeli
- Instructor: Sadece kendi class'larına erişebilmeli
- Student: Sadece kendi submission'larına erişebilmeli

### Senaryo 3: Hata Durumları

- Geçersiz token ile istek
- Olmayan ID ile istek
- Yetkisiz erişim denemeleri
- Geçersiz veri ile istek

## 📊 Test Sonuçları

Test script'leri çalıştırıldığında şu bilgileri gösterir:

- ✅ Toplam test sayısı
- ✅ Başarılı testler
- ❌ Başarısız testler
- ⊘ Atlanan testler (opsiyonel)
- 📈 Başarı oranı

## 🐛 Sorun Giderme

### API çalışmıyor
```powershell
# API'nin çalıştığından emin olun
curl http://localhost:5281/swagger/v1/swagger.json
```

### Token alınamıyor
- Kullanıcıların veritabanında olduğundan emin olun
- Şifrelerin doğru olduğunu kontrol edin
- JWT ayarlarını kontrol edin

### Test başarısız oluyor
- Verbose mod ile çalıştırın: `-Verbose`
- API loglarını kontrol edin
- Veritabanı bağlantısını kontrol edin

## 📝 Notlar

- Test script'leri mevcut verileri kullanır, yeni veri oluşturmaz (opsiyonel testler hariç)
- Bazı testler diğer testlere bağımlıdır (örn: Assignment testi için Class gerekir)
- Production ortamında test çalıştırmayın!

## 🔗 İlgili Dosyalar

- `test-all-endpoints.ps1` - PowerShell test script'i
- `test-all-endpoints.sh` - Bash test script'i
- `ams-api-tests.http` - VS Code REST Client test dosyası
- `newman/ams-collection.json` - Postman/Newman collection
- `ams-comprehensive-test.ps1` - Kapsamlı akış testi
