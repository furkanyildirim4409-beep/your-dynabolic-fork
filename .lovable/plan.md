

# Capacitor iOS Entegrasyonu

## Yapılacaklar

### 1. Capacitor Bağımlılıklarını Kur
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` paketlerini yükle

### 2. Capacitor Yapılandırması Oluştur
- `npx cap init` ile `capacitor.config.ts` oluştur
- **appId**: `app.lovable.81cfe6d0aa164027bfc40c501d2474a7`
- **appName**: `blossom-db-forge`
- **webDir**: `dist`
- Hot-reload için server URL ekle: `https://81cfe6d0-aa16-4027-bfc4-0c501d2474a7.lovableproject.com?forceHideBadge=true`

### 3. Senden Yapman Gerekenler (Lovable'da yapılamaz)

Capacitor'ın iOS platformunu eklemek ve Xcode'da build almak senin bilgisayarında yapılması gereken adımlar:

1. GitHub'a aktar: Lovable'da **"Export to GitHub"** butonuna tıkla
2. Projeyi klonla: `git clone <repo-url> && cd <repo>`
3. Bağımlılıkları kur: `npm install`
4. iOS platformunu ekle: `npx cap add ios`
5. Projeyi derle: `npm run build`
6. Sync et: `npx cap sync ios`
7. Xcode'da aç: `npx cap open ios`
8. Xcode'da cihaz seç ve **Run** butonuna bas

**Not:** iOS build için macOS + Xcode gereklidir.

## Dosya Değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `package.json` | Capacitor paketleri eklenir |
| `capacitor.config.ts` | Yeni dosya oluşturulur |

