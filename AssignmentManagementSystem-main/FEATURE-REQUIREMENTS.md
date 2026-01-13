# Özellik Gereksinimleri ve Sorular

## 📋 Mevcut Durum Analizi

### ✅ Mevcut Özellikler

1. **Grup Sistemi (Backend)**
   - ✅ Grup oluşturma (`POST /Group/create`)
   - ✅ Grup lideri belirleme (ilk oluşturan lider oluyor)
   - ✅ Grup üyelerini görme (`GET /Group/{id}`)
   - ✅ Instructor grupları görme (`GET /Group/assignment/{assignmentId}`)
   - ✅ Müsait öğrencileri listeleme (`GET /Group/available-students/{assignmentId}`)

2. **Enrollment Sistemi**
   - ✅ Student class'a kayıt olabilir (`POST /Class/{id}/enroll-me`)
   - ✅ Enrollment repository ve service mevcut

3. **ClassSchedule Entity**
   - ✅ Database entity mevcut
   - ❌ Controller yok
   - ❌ Service yok

### ❌ Eksik Özellikler

1. **Instructor Öğrenci Filtreleme**
   - Şu anda tüm öğrencileri gösteriyor
   - Sadece kendi class'larına kayıtlı öğrencileri göstermeli

2. **ClassSchedule Yönetimi**
   - Entity var ama endpoint'ler yok
   - CRUD işlemleri gerekli

3. **Mobil Uygulama - Grup Özellikleri**
   - Grup oluşturma ekranı eksik
   - Grup üyelerini ekleme ekranı eksik
   - Instructor grup görüntüleme ekranı eksik

---

## ❓ Sorular

### 1. ClassSchedule Özellikleri

**Soru:** ClassSchedule için hangi bilgiler gerekli?

**Öneriler:**
- Gün (Pazartesi, Salı, vs.)
- Başlangıç saati
- Bitiş saati
- Derslik (Room)
- Haftalık tekrar mı? (Recurring)
- Tarih aralığı mı? (StartDate, EndDate)

**Örnek:**
```
ClassSchedule {
  ClassId: 1
  DayOfWeek: "Monday" // veya 1-7
  StartTime: "09:00"
  EndTime: "10:30"
  Room: "A-101"
  IsRecurring: true
  StartDate: "2024-01-01"
  EndDate: "2024-06-30"
}
```

---

### 2. Instructor Öğrenci Filtreleme

**Soru:** Instructor öğrencileri nasıl görmeli?

**Seçenek A:** Class bazında
- Instructor sadece kendi class'larına kayıtlı öğrencileri görsün
- Endpoint: `GET /User/students?classId={classId}` veya `GET /Class/{classId}/students`

**Seçenek B:** Course bazında
- Instructor kendi course'larına kayıtlı tüm öğrencileri görsün
- Endpoint: `GET /User/students?courseId={courseId}` veya `GET /Course/{courseId}/students`

**Seçenek C:** Tüm class'ları
- Instructor tüm class'larındaki öğrencileri görsün (class bazında gruplandırılmış)
- Endpoint: `GET /User/my-students` (instructor'ın tüm class'larındaki öğrenciler)

**Öneri:** Seçenek C - Instructor'ın tüm class'larındaki öğrenciler, class bazında gruplandırılmış

---

### 3. Grup Oluşturma Akışı

**Soru:** Grup oluşturma nasıl çalışmalı?

**Mevcut Durum:**
- Bir öğrenci grup oluşturur
- Grup adı ve üye ID'leri gönderilir
- İlk oluşturan otomatik lider olur

**İstenen Akış:**
> "İki kişi ödev sayfasına girip kullanıcı ekler ve o kişi o grubun lideri olur"

**Sorular:**
1. İki kişi aynı anda mı grup oluşturuyor? (Race condition riski)
2. Yoksa biri grup oluşturup diğeri mi katılıyor?
3. Grup oluşturulduktan sonra başka öğrenciler eklenebilir mi?
4. Grup lideri değiştirilebilir mi?

**Öneri:**
- İlk grup oluşturan lider olur ✅ (Mevcut)
- Diğer öğrenciler grup oluşturulduktan sonra eklenebilir (Yeni özellik gerekli)
- Grup lideri değiştirilemez (Basitlik için)

**Gerekli Endpoint'ler:**
- `POST /Group/{groupId}/add-member` - Grup üyesi ekleme (Lider tarafından)
- `POST /Group/{groupId}/remove-member` - Grup üyesi çıkarma (Lider tarafından)

---

### 4. Grup Ödev Yükleme

**Soru:** Grup ödev yükleme nasıl çalışmalı?

**Mevcut Durum:**
- Submission entity'de GroupId yok (Comments içinde saklanıyor - geçici çözüm)
- Her öğrenci kendi submission'ını yükleyebilir

**İstenen:**
> "Ödev yüklemesini falan o öğrenci yapar" (Grup lideri)

**Sorular:**
1. Sadece grup lideri mi yükleyebilir?
2. Yoksa tüm grup üyeleri yükleyebilir ama tek bir submission mı olur?
3. Submission'da GroupId olmalı mı?

**Öneri:**
- Sadece grup lideri submission yükleyebilir
- Submission entity'sine GroupId eklenmeli (şu anda Comments'te saklanıyor)
- Submission yüklendiğinde tüm grup üyelerine bildirim gönderilmeli

**Gerekli Değişiklikler:**
1. Submission entity'sine `GroupId` nullable field ekle
2. Submission service'de grup lideri kontrolü
3. Submission yükleme endpoint'inde grup kontrolü

---

### 5. Instructor Grup Görüntüleme

**Soru:** Instructor grup görüntüleme nasıl olmalı?

**Mevcut Durum:**
- `GET /Group/assignment/{assignmentId}` - Tüm grupları getiriyor ✅
- `GET /Group/{id}` - Grup detaylarını getiriyor ✅

**İstenen:**
> "Hoca kendi tarafında grupları görebilir tıklayınca grubun üyelerini de görebilir"

**Sorular:**
1. Mobil uygulamada grup listesi ekranı var mı?
2. Grup detay ekranı var mı?
3. Grup üyeleri nasıl gösterilmeli? (Liste, kart, vs.)

**Öneri:**
- Instructor için grup listesi ekranı oluştur
- Grup detay ekranı oluştur (üyeler, submission durumu, vs.)
- Mobil uygulamada bu ekranları ekle

---

## 📝 Önerilen Çözümler

### 1. Instructor Öğrenci Filtreleme

**Yeni Endpoint:**
```csharp
// UserController.cs
[Authorize(Roles = "Instructor")]
[HttpGet("my-students")]
public async Task<IActionResult> GetMyStudents()
{
    var instructorId = GetCurrentUserId();
    var result = await _userService.GetInstructorStudentsAsync(instructorId);
    return Ok(result);
}
```

**Response Format:**
```json
{
  "isSuccess": true,
  "data": [
    {
      "classId": 1,
      "className": "CS101-01",
      "students": [
        { "id": 1, "name": "Ahmet Yılmaz", "email": "...", "studentNumber": "..." }
      ]
    }
  ]
}
```

---

### 2. ClassSchedule CRUD

**Yeni Controller:**
```csharp
// ClassScheduleController.cs
[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Instructor,Admin")]
public class ClassScheduleController : BaseController
{
    // GET /ClassSchedule/class/{classId}
    // POST /ClassSchedule
    // PUT /ClassSchedule/{id}
    // DELETE /ClassSchedule/{id}
}
```

---

### 3. Grup Üye Yönetimi

**Yeni Endpoint'ler:**
```csharp
// GroupController.cs
[Authorize(Roles = "Student")]
[HttpPost("{groupId}/add-member")]
public async Task<IActionResult> AddMember(int groupId, [FromBody] AddMemberRequestDto request)

[Authorize(Roles = "Student")]
[HttpPost("{groupId}/remove-member")]
public async Task<IActionResult> RemoveMember(int groupId, [FromBody] RemoveMemberRequestDto request)
```

---

### 4. Submission GroupId

**Entity Değişikliği:**
```csharp
// Submission.cs
public int? GroupId { get; set; }
public AssignmentGroup? Group { get; set; }
```

**Migration gerekli!**

---

## 🎯 Öncelik Sırası

1. **Yüksek Öncelik:**
   - Instructor öğrenci filtreleme
   - Grup üye ekleme/çıkarma endpoint'leri
   - Submission GroupId ekleme

2. **Orta Öncelik:**
   - ClassSchedule CRUD
   - Mobil grup ekranları

3. **Düşük Öncelik:**
   - Grup lideri değiştirme
   - Grup bildirimleri

---

## ❓ Onay Bekleyen Sorular

1. **ClassSchedule:** Hangi bilgiler gerekli? (Gün, saat, derslik, vs.)
2. **Instructor Öğrenciler:** Class bazında mı, course bazında mı?
3. **Grup Üye Ekleme:** Grup oluşturulduktan sonra üye eklenebilir mi?
4. **Grup Submission:** Sadece lider mi yükleyebilir?
5. **Mobil Ekranlar:** Hangi ekranlar öncelikli?
