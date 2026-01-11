# AMS Mobile App - Detaylı Analiz Raporu

## 📱 Uygulama Genel Bakış

**Teknoloji Stack:**
- React Native (0.81.5)
- Expo (~54.0.30)
- React Navigation (v7)
- Axios (HTTP Client)
- AsyncStorage (Token/User Storage)
- React Hook Form (Form Yönetimi)

## 🏗️ Proje Yapısı

```
ams-mobile/
├── src/
│   ├── api/                    # API Client & Endpoints
│   │   ├── client.js           # Axios instance + interceptors
│   │   └── endpoints/          # Endpoint fonksiyonları
│   ├── context/                # React Context (Auth)
│   ├── navigation/             # Navigation yapılandırması
│   ├── screens/                # Ekranlar
│   │   ├── auth/              # Login, Register, ForgotPassword
│   │   ├── student/           # Student ekranları
│   │   ├── instructor/        # Instructor ekranları
│   │   └── common/            # Ortak ekranlar (Profile)
│   ├── components/            # Reusable components
│   ├── theme/                 # Tema (colors, spacing, typography)
│   └── utils/                 # Yardımcı fonksiyonlar
```

## 🔌 API Entegrasyonu

### API Base URL
```javascript
// src/utils/constants.js
API_BASE_URL = 'https://kristin-squishier-beseechingly.ngrok-free.dev/api'
// veya local: 'http://192.168.1.152:5281/api'
```

### API Client (client.js)
- ✅ Axios instance oluşturulmuş
- ✅ Request interceptor: Token ekleme
- ✅ Response interceptor: Hata yönetimi
- ✅ Timeout: 30 saniye
- ✅ Logging: Tüm istekler loglanıyor

## 📡 Kullanılan Endpoint'ler

### 1. Authentication (`/api/Auth`)
- ✅ `POST /Auth/login` - Kullanıcı girişi
- ✅ `POST /Auth/register` - Yeni kullanıcı kaydı
- ✅ `POST /Auth/change-password` - Şifre değiştirme

**Kullanım:**
- `LoginScreen.js` → login()
- `RegisterScreen.js` → register()
- `ProfileScreen.js` → changePassword()

### 2. User Management (`/api/User`)
- ⚠️ `GET /User/me` - **HATA: `/User/profile` olmalı!**
- ✅ `GET /User/{id}` - Kullanıcı bilgisi
- ✅ `GET /User/students` - Tüm öğrenciler
- ✅ `GET /User/instructors` - Tüm eğitmenler
- ✅ `PUT /User/{userId}` - Kullanıcı güncelleme
- ✅ `DELETE /User/{userId}` - Kullanıcı silme

**Sorun:**
```javascript
// src/api/endpoints/users.js - Line 6
export const getCurrentUser = async () => {
  const response = await apiClient.get('/User/me');  // ❌ YANLIŞ
  // Doğrusu: '/User/profile'
};
```

### 3. Assignment Management (`/api/Assignment`)
- ✅ `GET /Assignment` - Tüm ödevler
- ✅ `GET /Assignment/{id}` - Ödev detayı
- ✅ `GET /Assignment/my-assignments` - Öğrenci ödevleri
- ✅ `POST /Assignment` - Ödev oluşturma (Instructor)
- ✅ `PUT /Assignment/{id}` - Ödev güncelleme
- ✅ `DELETE /Assignment/{id}` - Ödev silme

**Kullanım:**
- `StudentDashboard.js` → getMyAssignments()
- `AssignmentListScreen.js` → getAllAssignments()
- `CreateAssignmentScreen.js` → createAssignment()

### 4. Submission Management (`/api/Submission`)
- ✅ `GET /Submission/{id}` - Submission detayı
- ✅ `GET /Submission/my-submissions` - Öğrenci submission'ları
- ✅ `POST /Submission` - **File upload** (multipart/form-data)
- ✅ `PUT /Submission/{id}/resubmit` - **File upload** (resubmit)
- ✅ `GET /Submission/{id}/download` - Dosya indirme
- ✅ `DELETE /Submission/{id}` - Submission silme

**Özellikler:**
- FormData kullanımı ✅
- File upload desteği ✅
- Multipart/form-data header ✅

### 5. Grade Management (`/api/Grade`)
- ✅ `GET /Grade/{id}` - Not detayı
- ✅ `GET /Grade/my-grades` - Öğrenci notları
- ✅ `GET /Grade/class/{classId}` - Sınıf notları (Instructor)
- ✅ `POST /Grade` - Not oluşturma
- ✅ `PUT /Grade/{id}` - Not güncelleme
- ✅ `POST /Grade/publish` - Notları yayınlama
- ✅ `DELETE /Grade/{id}` - Not silme

**Kullanım:**
- `GradesScreen.js` → getMyGrades()
- `GradeSubmissionScreen.js` → createGrade(), updateGrade()

### 6. Class Management (`/api/Class`)
- ✅ `GET /Class` - Tüm sınıflar
- ✅ `GET /Class/{id}` - Sınıf detayı
- ✅ `GET /Class/my-classes` - Instructor sınıfları
- ✅ `POST /Class` - Sınıf oluşturma
- ⚠️ `POST /Class/{classId}/enroll` - **HATA: `/enroll-me` olmalı!**
- ⚠️ `POST /Class/{classId}/unenroll` - **HATA: `/unenroll-me` olmalı!**
- ✅ `PUT /Class/{id}` - Sınıf güncelleme
- ✅ `DELETE /Class/{id}` - Sınıf silme

**Sorun:**
```javascript
// src/api/endpoints/classes.js - Lines 44-60
export const enrollInClass = async (classId) => {
  const response = await apiClient.post(`/Class/${classId}/enroll`);  // ❌ YANLIŞ
  // Doğrusu: `/Class/${classId}/enroll-me`
};
```

### 7. Course Management (`/api/Course`)
- ✅ `GET /Course` - Tüm dersler
- ✅ `GET /Course/{id}` - Ders detayı
- ✅ `POST /Course` - Ders oluşturma (Admin)
- ✅ `PUT /Course/{id}` - Ders güncelleme
- ✅ `DELETE /Course/{id}` - Ders silme

**Not:** Dashboard endpoint'leri eksik!

## 🎯 Kullanıcı Rolleri

### Student (Rol: 1)
**Ekranlar:**
- `StudentDashboard.js` - Dashboard
- `AssignmentListScreen.js` - Ödev listesi
- `AssignmentDetailScreen.js` - Ödev detayı
- `SubmissionsScreen.js` - Submission'lar
- `GradesScreen.js` - Notlar
- `ProfileScreen.js` - Profil

**Navigator:** `StudentNavigator.js`

### Instructor (Rol: 2)
**Ekranlar:**
- `InstructorDashboard.js` - Dashboard
- `MyClassesScreen.js` - Sınıflarım
- `AssignmentListScreen.js` - Ödevlerim
- `CreateAssignmentScreen.js` - Ödev oluştur
- `SubmissionsListScreen.js` - Submission'lar
- `GradeSubmissionScreen.js` - Not verme
- `StudentsScreen.js` - Öğrenciler
- `ProfileScreen.js` - Profil

**Navigator:** `InstructorNavigator.js`

### Admin (Rol: 3)
- ⚠️ **Henüz implement edilmemiş!**
- Sadece placeholder ekran var

## 🐛 Tespit Edilen Sorunlar

### 1. Endpoint URL Hataları

#### ❌ `/User/me` → `/User/profile`
```javascript
// src/api/endpoints/users.js:6
// YANLIŞ:
const response = await apiClient.get('/User/me');
// DOĞRU:
const response = await apiClient.get('/User/profile');
```

#### ❌ `/Class/{id}/enroll` → `/Class/{id}/enroll-me`
```javascript
// src/api/endpoints/classes.js:46
// YANLIŞ:
const response = await apiClient.post(`/Class/${classId}/enroll`);
// DOĞRU:
const response = await apiClient.post(`/Class/${classId}/enroll-me`);
```

#### ❌ `/Class/{id}/unenroll` → `/Class/{id}/unenroll-me`
```javascript
// src/api/endpoints/classes.js:56
// YANLIŞ:
const response = await apiClient.post(`/Class/${classId}/unenroll`);
// DOĞRU:
const response = await apiClient.post(`/Class/${classId}/unenroll-me`);
```

### 2. Eksik Endpoint'ler

#### Dashboard Endpoint'leri
- ❌ `GET /Dashboard/student` - Student dashboard
- ❌ `GET /Dashboard/instructor` - Instructor dashboard
- ❌ `GET /Dashboard/statistics/my-classes` - Instructor istatistikleri

**Kullanım:**
- `StudentDashboard.js` - Dashboard verisi çekilmiyor
- `InstructorDashboard.js` - Dashboard verisi çekilmiyor

#### Submission Endpoint'leri
- ❌ `GET /Submission/assignment/{assignmentId}` - Assignment'a ait submission'lar (Instructor için)

#### Notification Endpoint'leri
- ❌ `GET /Notification/my-notifications` - Bildirimler
- ❌ `GET /Notification/unread-count` - Okunmamış sayısı
- ❌ `PUT /Notification/{id}/mark-read` - Okundu işaretle

### 3. API Response Format

**Beklenen Format:**
```javascript
{
  isSuccess: true,
  data: { ... },
  message: "...",
  errors: []
}
```

**Kontrol:** Tüm endpoint'ler bu formatı kullanıyor mu?

## ✅ İyi Yapılmış Kısımlar

1. **API Client Yapısı**
   - ✅ Interceptor'lar doğru kullanılmış
   - ✅ Token yönetimi otomatik
   - ✅ Hata yönetimi merkezi

2. **File Upload**
   - ✅ FormData kullanımı doğru
   - ✅ Multipart/form-data header'ı var

3. **Authentication**
   - ✅ Token storage (AsyncStorage)
   - ✅ User context yönetimi
   - ✅ Auto-login (token kontrolü)

4. **Navigation**
   - ✅ Role-based navigation
   - ✅ Auth guard
   - ✅ Loading states

## 📋 Yapılması Gerekenler

### Öncelik 1: Endpoint Düzeltmeleri
1. `/User/me` → `/User/profile` düzelt
2. `/Class/{id}/enroll` → `/Class/{id}/enroll-me` düzelt
3. `/Class/{id}/unenroll` → `/Class/{id}/unenroll-me` düzelt

### Öncelik 2: Eksik Endpoint Entegrasyonları
1. Dashboard endpoint'lerini ekle
2. Notification endpoint'lerini ekle
3. Submission list endpoint'ini ekle (Instructor için)

### Öncelik 3: Error Handling
1. Network error handling iyileştir
2. 401 Unauthorized durumunda auto-logout
3. User-friendly error messages

### Öncelik 4: Testing
1. Tüm endpoint'leri test et
2. File upload test et
3. Error scenarios test et

## 🔗 Endpoint Mapping

| Mobil Fonksiyon | API Endpoint | Durum |
|----------------|-------------|-------|
| `login()` | `POST /Auth/login` | ✅ |
| `register()` | `POST /Auth/register` | ✅ |
| `changePassword()` | `POST /Auth/change-password` | ✅ |
| `getCurrentUser()` | `GET /User/profile` | ⚠️ URL yanlış |
| `getMyAssignments()` | `GET /Assignment/my-assignments` | ✅ |
| `submitAssignment()` | `POST /Submission` | ✅ |
| `getMyGrades()` | `GET /Grade/my-grades` | ✅ |
| `enrollInClass()` | `POST /Class/{id}/enroll-me` | ⚠️ URL yanlış |
| `getMyClasses()` | `GET /Class/my-classes` | ✅ |

## 📝 Notlar

1. **API Base URL:** Şu anda ngrok kullanılıyor, production'da değiştirilmeli
2. **Token Expiry:** Token expiry kontrolü yok, refresh token mekanizması yok
3. **Offline Support:** Offline durumda cache mekanizması yok
4. **Loading States:** Bazı ekranlarda loading state eksik
