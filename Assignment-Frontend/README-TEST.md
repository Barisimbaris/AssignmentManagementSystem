# Web Frontend Test Kılavuzu

## 🚀 Hızlı Başlangıç

### Önkoşullar
1. **Backend'in çalışıyor olması gerekiyor**
   - Backend URL: `http://localhost:5281`
   - Swagger: `http://localhost:5281/swagger`
   - Backend'i başlatmak için:
     ```bash
     cd src/AMS.API
     dotnet run
     ```

### Web Frontend'i Başlatma

#### Yöntem 1: Python HTTP Sunucusu (Önerilen)

**Windows (PowerShell):**
```powershell
cd assignment-frontend
.\start-server.ps1
```

**Linux/Mac (Bash):**
```bash
cd assignment-frontend
chmod +x start-server.sh
./start-server.sh
```

**Manuel (Python 3):**
```bash
cd assignment-frontend
python3 -m http.server 8000
```

**Manuel (Python 2):**
```bash
cd assignment-frontend
python -m SimpleHTTPServer 8000
```

#### Yöntem 2: Node.js http-server

```bash
# http-server'ı global olarak yükle (bir kez)
npm install -g http-server

# Sunucuyu başlat
cd assignment-frontend
http-server -p 8000
```

#### Yöntem 3: VS Code Live Server

1. VS Code'da `assignment-frontend` klasörünü açın
2. `index.html` veya `pages/index.html` dosyasına sağ tıklayın
3. "Open with Live Server" seçeneğini seçin

#### Yöntem 4: Direkt Tarayıcıda Açma (CORS Sorunları Olabilir)

⚠️ **Not:** Bu yöntem CORS sorunlarına neden olabilir. API çağrıları çalışmayabilir.

```bash
# Windows
start pages\index.html

# Linux/Mac
open pages/index.html
# veya
xdg-open pages/index.html
```

## 🌐 Erişim

Sunucu başladıktan sonra:

- **Ana Sayfa:** http://localhost:8000/pages/index.html
- **Giriş Sayfası:** http://localhost:8000/pages/login.html
- **Öğretmen Dashboard:** http://localhost:8000/pages/teacher_dashboard.html
- **Öğrenci Dashboard:** http://localhost:8000/pages/student_dashboard.html

## 🧪 Test Senaryoları

### 1. Giriş Testi
1. http://localhost:8000/pages/index.html adresine gidin
2. "Öğrenci Girişi" veya "Öğretmen Girişi" butonuna tıklayın
3. Test kullanıcıları ile giriş yapın:
   - **Öğrenci:** `student@test.com` / `Test123!`
   - **Öğretmen:** `yakup.kalay@test.com` / `Test123!`
   - **Admin:** `admin@test.com` / `Admin123!`

### 2. Öğretmen Özellikleri
- ✅ Ödev oluşturma ve yönetme
- ✅ Sınıf yönetimi
- ✅ Ders programı oluşturma (`class-schedule-management.html`)
- ✅ Grup ödevlerini görüntüleme (`groups.html`)
- ✅ Grup detaylarını görüntüleme (`group-detail.html`)
- ✅ Analizler (`reports.html`)

### 3. Öğrenci Özellikleri
- ✅ Ödevleri görüntüleme
- ✅ Ödev teslim etme
- ✅ Grup oluşturma (grup ödevleri için)
- ✅ Ders programı görüntüleme

### 4. Yeni Özellikler
- ✅ **Grup Yönetimi:** `groups.html` ve `group-detail.html`
- ✅ **Ders Programı Yönetimi:** `class-schedule-management.html`
- ✅ **Gelişmiş Analytics:** `reports.html` (yeni endpoint)

## 🔧 Sorun Giderme

### CORS Hatası
- Backend'in CORS ayarlarını kontrol edin
- Backend'in `http://localhost:8000` origin'ini kabul ettiğinden emin olun

### API Bağlantı Hatası
- Backend'in çalıştığını kontrol edin: http://localhost:5281/swagger
- Browser console'da hata mesajlarını kontrol edin (F12)
- Network tab'inde API çağrılarını kontrol edin

### Sayfa Bulunamadı (404)
- Sunucunun `assignment-frontend` klasöründe başlatıldığından emin olun
- URL'de `pages/` prefix'ini unutmayın

### JavaScript Hataları
- Browser console'u açın (F12)
- Hata mesajlarını kontrol edin
- `authUtils.js` dosyasının yüklendiğinden emin olun

## 📝 Test Kullanıcıları

Backend'de `DbSeeder` ile oluşturulan test kullanıcıları:

**Öğrenci:**
- Email: `student@test.com`
- Şifre: `Test123!`
- Ad: `Test`
- Soyad: `Student`

**Öğretmen:**
- Email: `yakup.kalay@test.com`
- Şifre: `Test123!`
- Ad: `Yakup`
- Soyad: `Kalay`

**Admin:**
- Email: `admin@test.com`
- Şifre: `Admin123!`

## 🎯 Önemli Notlar

1. **Backend Port:** Web frontend `http://localhost:5281/api` adresini kullanıyor
2. **Session Storage:** Giriş bilgileri `sessionStorage`'da saklanıyor
3. **API Base URL:** `authUtils.js` dosyasında `API_BASE_URL` değişkeni ile kontrol edilebilir

## 📚 Ek Kaynaklar

- Backend API Dokümantasyonu: http://localhost:5281/swagger
- Browser Developer Tools: F12 (Console, Network, Application tabs)
