# Quad Instant Admin Panel - Kurulum Rehberi

PostgreSQL veritabanlarınız için anında profesyonel admin paneli oluşturun.

## 🎯 Özellikler

- ✅ **Kendi Sunucunuzda**: Tamamen self-hosted, dış bağımlılık yok
- ✅ **Sıfır Telemetri**: Hiçbir veri dışarı gönderilmez
- ✅ **Çoklu Veritabanı**: Birden fazla PostgreSQL veritabanına bağlanın
- ✅ **Anında CRUD**: Otomatik tablo yönetimi
- ✅ **SQL Sorgu Arayüzü**: Özel SQL sorguları çalıştırın
- ✅ **Modern UI**: Ant Design ile profesyonel görünüm
- ✅ **Otomatik Kurulum**: Veritabanı tabloları otomatik oluşturulur

## 📋 Gereksinimler

- Docker ve Docker Compose
- PostgreSQL veritabanı (mevcut veritabanınız)
- Node.js 18+ (isteğe bağlı, geliştirme için)

## 🚀 Hızlı Kurulum

### 1. Projeyi İndirin

```bash
git clone <repo-url>
cd quad-instant-admin-panel
```

### 2. Veritabanı Ayarları

`.env` dosyasını düzenleyin:

```env
# Admin Panel Veritabanı (mevcut PostgreSQL sunucunuzda)
ADMIN_DB_HOST=localhost
ADMIN_DB_PORT=5432
ADMIN_DB_NAME=quad_admin_panel
ADMIN_DB_USER=postgres
ADMIN_DB_PASSWORD=your-password

# JWT Güvenlik Anahtarı (production'da değiştirin!)
JWT_SECRET=super-gizli-anahtar-buraya

# Uygulama Ortamı
NODE_ENV=development
```

### 3. Admin Veritabanını Oluşturun

```bash
# Veritabanını oluşturun (tablolar otomatik oluşturulacak)
createdb -h localhost -U postgres quad_admin_panel
```

### 4. Admin Paneli Başlatın

```bash
# Otomatik kurulum scripti (önerilen)
./setup.sh

# Veya manuel olarak
npm install
docker-compose up -d
```

### 5. Admin Panele Erişin

Tarayıcınızda açın: **http://localhost:3000**

**İlk Çalıştırma:**
- Uygulama otomatik olarak veritabanı tablolarını oluşturacak
- İlk açılışta initialization ekranı göreceksiniz

**Varsayılan Giriş:**
- Kullanıcı Adı: `admin`
- Şifre: `admin123`

## 🔧 Kullanım

### Veritabanı Bağlantısı Ekleyin

1. Dashboard'da "Bağlantı Ekle" butonuna tıklayın
2. PostgreSQL veritabanı bilgilerinizi girin:
   - **İsim**: Veritabanı Adı
   - **Host**: localhost (veya sunucu IP'si)
   - **Port**: 5432
   - **Veritabanı**: uygulama_veritabani
   - **Kullanıcı**: kullanici_adi
   - **Şifre**: sifre
3. "Test Et" butonuyla bağlantıyı kontrol edin
4. Kaydedin ve kullanmaya başlayın!

### Tablolarınızı Yönetin

1. Sol menüden "Tablolar"a gidin
2. Veritabanı bağlantınızı seçin
3. Bir tablo seçin
4. Kayıtları görüntüleyin, düzenleyin, ekleyin veya silin

### SQL Sorguları Çalıştırın

1. Sol menüden "SQL Sorgu"ya gidin
2. Veritabanı bağlantınızı seçin
3. SQL sorgunuzu yazın
4. "Sorguyu Çalıştır" butonuna tıklayın
5. Sonuçları tablo halinde görün

## 🛡️ Güvenlik

- **Ayrı Veritabanları**: Admin panel verileri ile uygulama verileriniz ayrı tutulur
- **Şifreli Saklama**: Veritabanı şifreleri şifreli olarak saklanır
- **JWT Güvenlik**: Oturum yönetimi JWT token ile
- **Sıfır Telemetri**: Hiçbir veri dışarı gönderilmez
- **Otomatik Kurulum**: Güvenli varsayılan ayarlarla otomatik tablo oluşturma

## 🐳 Docker Komutları

```bash
# Admin paneli başlat
docker-compose up -d

# Admin paneli durdur
docker-compose down

# Logları görüntüle
docker-compose logs -f admin-panel

# Yeniden başlat
docker-compose restart
```

## ❓ Sorun Giderme

### Port Zaten Kullanımda
Port 3000 meşgulse, `docker-compose.yml` dosyasını düzenleyin:
```yaml
admin-panel:
  ports:
    - "3001:3000"  # Boş bir port kullanın
```

### Veritabanı Bağlantı Sorunu
1. PostgreSQL sunucunuzun çalıştığını kontrol edin
2. `.env` dosyasındaki bağlantı bilgilerini doğrulayın
3. PostgreSQL'in Docker'dan bağlantı kabul ettiğini kontrol edin
4. Güvenlik duvarı ayarlarını kontrol edin

### Admin Veritabanı Kurulum Sorunu
1. Veritabanının var olduğunu kontrol edin: `createdb quad_admin_panel`
2. Veritabanı izinlerini kontrol edin (tablo oluşturma yetkisi gerekli)
3. Admin panel otomatik olarak tabloları oluşturacak
4. İlk açılışta http://localhost:3000 adresinde initialization durumunu kontrol edin

### Admin Panele Erişemiyorum
1. Docker container'ının çalıştığını kontrol edin: `docker-compose ps`
2. Logları kontrol edin: `docker-compose logs admin-panel`
3. Yeniden başlatmayı deneyin: `docker-compose restart`

## 🎯 Sonraki Adımlar

- Varsayılan admin şifresini değiştirin
- Uygulama veritabanlarınızı bağlayın
- Sık kullandığınız SQL sorgularını kaydedin
- Dashboard'u kişiselleştirin

## 🤝 Destek

Sorun yaşarsanız:
- Logları kontrol edin: `docker-compose logs`
- README.md dosyasını inceleyin
- GitHub'da issue açın

---

**Kolay veri yönetimi! 🎉**