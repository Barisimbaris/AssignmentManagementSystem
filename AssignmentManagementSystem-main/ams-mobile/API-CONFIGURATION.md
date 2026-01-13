# API Yapılandırma Kılavuzu

## 🔧 API Base URL Ayarları

Mobil uygulama backend API'nize bağlanmak için `src/utils/constants.js` dosyasındaki `API_BASE_URL` değişkenini kullanır.

### 📱 Platform Bazlı URL'ler

#### iOS Simulator
```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5281/api'
  : 'https://your-production-api.com/api';
```

#### Android Emulator
```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5281/api'  // Android emulator özel IP
  : 'https://your-production-api.com/api';
```

#### Gerçek Cihaz (iOS/Android)
Gerçek cihazda test etmek için bilgisayarınızın **local IP adresini** kullanın:

1. **Windows:**
   ```powershell
   ipconfig
   # IPv4 Address'i bulun (örn: 192.168.1.152)
   ```

2. **Mac/Linux:**
   ```bash
   ifconfig
   # veya
   ip addr show
   # inet adresini bulun (örn: 192.168.1.152)
   ```

3. **URL'yi ayarlayın:**
   ```javascript
   export const API_BASE_URL = __DEV__ 
     ? 'http://192.168.1.152:5281/api'  // Kendi IP'nizi yazın
     : 'https://your-production-api.com/api';
   ```

#### Ngrok (Geçici Test)
Ngrok kullanıyorsanız:
```javascript
export const API_BASE_URL = __DEV__ 
  ? 'https://your-ngrok-url.ngrok-free.dev/api'
  : 'https://your-production-api.com/api';
```

**Not:** Ngrok URL'leri geçicidir ve her başlatmada değişir.

## 🚀 Hızlı Başlangıç

### 1. Backend'i Başlatın
```bash
cd src/AMS.API
dotnet run
```

Backend şu adreste çalışacak: `http://localhost:5281`

### 2. API URL'ini Ayarlayın

`ams-mobile/src/utils/constants.js` dosyasını açın ve platformunuza göre URL'yi ayarlayın:

**iOS Simulator için:**
```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5281/api'
  : 'https://your-production-api.com/api';
```

**Android Emulator için:**
```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5281/api'
  : 'https://your-production-api.com/api';
```

**Gerçek Cihaz için:**
```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.152:5281/api'  // Kendi IP'nizi yazın
  : 'https://your-production-api.com/api';
```

### 3. Mobil Uygulamayı Başlatın
```bash
cd ams-mobile
npm install
npx expo start
```

## 🔍 Sorun Giderme

### "Network error" Hatası
- ✅ Backend'in çalıştığından emin olun: `http://localhost:5281/swagger`
- ✅ API URL'inin doğru olduğundan emin olun
- ✅ Gerçek cihaz kullanıyorsanız, cihaz ve bilgisayarın aynı WiFi ağında olduğundan emin olun
- ✅ Firewall'ın 5281 portunu engellemediğinden emin olun

### "Connection refused" Hatası
- ✅ Backend'in çalıştığını kontrol edin
- ✅ Android emulator için `10.0.2.2` kullandığınızdan emin olun
- ✅ iOS simulator için `localhost` kullandığınızdan emin olun

### "CORS" Hatası
- ✅ Backend'in CORS ayarlarını kontrol edin (`Program.cs`)
- ✅ Mobil uygulama origin'inin backend'de izin verildiğinden emin olun

### "401 Unauthorized" Hatası
- ✅ Giriş yaparken doğru email ve şifre kullandığınızdan emin olun
- ✅ Token'ın doğru kaydedildiğini kontrol edin (AsyncStorage)

## 📝 Test Kullanıcıları

Backend'de `DbSeeder` ile oluşturulan test kullanıcıları:

**Öğrenci:**
- Email: `student@test.com`
- Şifre: `Test123!`

**Öğretmen:**
- Email: `yakup.kalay@test.com`
- Şifre: `Test123!`

**Admin:**
- Email: `admin@test.com`
- Şifre: `Admin123!`

## 🔐 Güvenlik Notları

- ⚠️ Production'da HTTPS kullanın
- ⚠️ API URL'lerini environment variable'larda saklayın
- ⚠️ Token'ları güvenli bir şekilde saklayın (AsyncStorage şifreli)
