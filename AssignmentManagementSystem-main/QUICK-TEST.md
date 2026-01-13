# Hızlı Test Kılavuzu

## ⚠️ ÖNEMLİ: API'yi Başlatın!

Test yapmadan önce API'yi başlatmanız gerekiyor:

```powershell
cd src/AMS.API
dotnet run
```

API başladıktan sonra başka bir terminal'de test script'ini çalıştırın.

## Test Script'leri

### 1. Yeni Özellikler Testi
```powershell
.\test-new-features.ps1
```

**Test Edilen Endpoint'ler:**
- ✅ `GET /api/User/my-students` - Instructor öğrencileri
- ✅ `GET /api/ClassSchedule/class/{classId}` - Class schedule'ları
- ✅ `GET /api/ClassSchedule/my-schedules` - Instructor schedule'ları
- ✅ `POST /api/ClassSchedule` - Schedule oluştur
- ✅ `PUT /api/ClassSchedule/{id}` - Schedule güncelle

### 2. Tüm Endpoint'ler Testi
```powershell
.\test-all-endpoints-full.ps1
```

## Beklenen Sonuçlar

### ✅ Başarılı Test Senaryoları

1. **Instructor Login** → Token alınır
2. **Get My Students** → Instructor'ın class'larındaki öğrenciler listelenir
3. **Get My Classes** → Instructor'ın class'ları listelenir
4. **Create Schedule** → Yeni schedule oluşturulur
5. **Get Schedule by ID** → Schedule detayları getirilir

### ❌ Hata Senaryoları

- **404 Not Found** → API çalışmıyor veya route yanlış
- **400 Bad Request** → Request body formatı yanlış
- **401 Unauthorized** → Token geçersiz veya eksik

## Sorun Giderme

### API Çalışmıyor
```powershell
# API'yi başlat
cd src/AMS.API
dotnet run

# Başka bir terminal'de test et
cd ..
.\test-new-features.ps1
```

### 404 Hatası
- Controller route'unu kontrol edin: `[Route("api/[controller]")]`
- API'nin çalıştığından emin olun
- Swagger'ı açın: `http://localhost:5281/swagger`

### 400 Bad Request
- Request body formatını kontrol edin
- DayOfWeek değeri: 0-6 (0=Sunday, 1=Monday, ...)
- TimeSpan formatı: "HH:mm:ss" (örn: "09:00:00")

## Test Verileri

**Instructor:**
- Email: `yakup.kalay@test.com`
- Password: `Test123!`

**Student:**
- Email: `student@test.com`
- Password: `Test123!`
