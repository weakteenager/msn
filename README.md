# MSN Chat

Kayıtsız, herkese açık, MSN Messenger esintili mini sohbet sitesi.

## Yerelde çalıştırma

Node.js 18 veya üzeri gerekir.

```bash
npm start
```

Tarayıcıda `http://localhost:3000` adresini aç.

## Render'a yükleme

1. Bu klasörü bir GitHub deposuna yükle.
2. Render'da **New + → Web Service** seç.
3. GitHub deposunu bağla.
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. Deploy et.

Render `PORT` ortam değişkenini otomatik sağlar.

## Notlar

- Kullanıcı adı sunucu tarafından otomatik atanır.
- Herkes aynı genel odayı görür.
- Mesajlar sayfa yenilenince de sunucu belleğinde kaldığı sürece görünür.
- Sunucu yeniden başlarsa mesaj geçmişi sıfırlanır.
- Bu ilk sürüm tek sunucu örneği ve küçük topluluk denemeleri içindir. Herkese açık kullanımda moderasyon ve kalıcı depolama sonradan eklenebilir.
- İstemci, mesajları `textContent` ile ekler; kullanıcı mesajı HTML olarak çalıştırılmaz.
