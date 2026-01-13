# Mobil Uygulama Güncellemeleri

## ✅ Tamamlanan Güncellemeler

### 1. API Endpoint'leri Eklendi
- ✅ `groups.js` - Grup endpoint'leri
  - `createGroup()` - Grup oluştur
  - `getMyGroup()` - Grup bilgisi al
  - `getAvailableStudents()` - Müsait öğrenciler
  - `getAssignmentGroups()` - Assignment grupları (Instructor)
  - `getGroupDetails()` - Grup detayları
  - `isGroupLeader()` - Grup lideri kontrolü

- ✅ `schedules.js` - ClassSchedule endpoint'leri
  - `getSchedulesByClass()` - Class schedule'ları
  - `getMySchedules()` - Instructor schedule'ları
  - `createSchedule()` - Schedule oluştur
  - `updateSchedule()` - Schedule güncelle
  - `deleteSchedule()` - Schedule sil

- ✅ `users.js` - Güncellendi
  - `getMyStudents()` - Instructor'ın öğrencileri eklendi

### 2. Ekran Güncellemeleri
- ✅ `StudentsScreen.js` - Instructor öğrenci filtreleme güncellendi
  - Artık `/User/my-students` endpoint'ini kullanıyor
  - Class bazında gruplandırılmış öğrenci listesi

## 🔄 Yapılacaklar

### 3. Grup Oluşturma Ekranı (Student)
- [ ] `CreateGroupScreen.js` oluştur
- [ ] Assignment detail'den grup oluşturma butonu
- [ ] Öğrenci numarasına göre öğrenci ekleme
- [ ] Grup lideri belirleme

### 4. Instructor Grup Görüntüleme
- [ ] `GroupsListScreen.js` - Assignment grupları listesi
- [ ] `GroupDetailScreen.js` - Grup detayları ve üyeleri
- [ ] SubmissionsListScreen'e grup görüntüleme ekle

### 5. Assignment Detail - Grup Ödevi Desteği
- [ ] Grup ödevi kontrolü
- [ ] Grup varsa grup bilgisi göster
- [ ] Grup yoksa grup oluştur butonu
- [ ] Sadece grup lideri submission yükleyebilir kontrolü

### 6. ClassSchedule Ekranları (Instructor)
- [ ] `ClassScheduleScreen.js` - Class schedule listesi
- [ ] `CreateScheduleScreen.js` - Schedule oluşturma
- [ ] MyClassesScreen'e schedule butonu ekle

## 📝 Notlar

- Tüm endpoint'ler hazır ✅
- API entegrasyonu tamamlandı ✅
- Ekranlar oluşturulacak ⏳
