# Test Talimatları

## ⚠️ ÖNEMLİ: API'yi Başlatın

Test yapmadan önce API'yi başlatmanız gerekiyor:

```powershell
cd src/AMS.API
dotnet run
```

API `http://localhost:5281` adresinde çalışacak.

## Test Script'leri

### 1. Yeni Özellikler Testi
```powershell
.\test-new-features.ps1
```

Bu script test eder:
- ✅ Instructor öğrenci filtreleme (`GET /api/User/my-students`)
- ✅ ClassSchedule CRUD işlemleri
  - `GET /api/ClassSchedule/class/{classId}`
  - `GET /api/ClassSchedule/my-schedules`
  - `GET /api/ClassSchedule/class/{classId}/weekly`
  - `POST /api/ClassSchedule`
  - `PUT /api/ClassSchedule/{id}`
  - `DELETE /api/ClassSchedule/{id}`

### 2. Tüm Endpoint'ler Testi
```powershell
.\test-all-endpoints-full.ps1
```

## Beklenen Sonuçlar

### ClassSchedule Endpoint'leri
- ✅ `GET /api/ClassSchedule/{id}` - Schedule detayı
- ✅ `GET /api/ClassSchedule/class/{classId}` - Class'a ait schedule'lar
- ✅ `GET /api/ClassSchedule/my-schedules` - Instructor'ın schedule'ları
- ✅ `GET /api/ClassSchedule/class/{classId}/weekly` - Haftalık schedule
- ✅ `POST /api/ClassSchedule` - Schedule oluştur
- ✅ `PUT /api/ClassSchedule/{id}` - Schedule güncelle
- ✅ `DELETE /api/ClassSchedule/{id}` - Schedule sil

### Instructor Students Endpoint
- ✅ `GET /api/User/my-students` - Instructor'ın class'larındaki öğrenciler

## Sorun Giderme

### 404 Not Found
- API çalışıyor mu kontrol edin
- Route'lar doğru mu kontrol edin (`api/ClassSchedule` vs `api/ClassSchedules`)

### 400 Bad Request
- Request body formatını kontrol edin
- Validation hatalarını kontrol edin

### 401 Unauthorized
- Token'ın geçerli olduğundan emin olun
- Token'ın doğru header'da gönderildiğinden emin olun

## Test Verileri

**Instructor:**
- Email: `yakup.kalay@test.com`
- Password: `Test123!`

**Admin:**
- Email: `admin@ams.com`
- Password: `Admin123!`

**Student:**
- Email: `student@test.com`
- Password: `Test123!`
