# BizAI APK Build Instructions

## Quick Start (3 Steps)

### 1. Install Flutter
- Download: https://flutter.dev/docs/get-started/install
- Choose your OS (Windows/Mac/Linux)
- Follow installation guide

### 2. Install Android Studio
- Download: https://developer.android.com/studio
- Install Android SDK (included with Android Studio)
- Set ANDROID_HOME environment variable

### 3. Build APK

**On Windows:**
```cmd
git clone https://github.com/muhammadsameer7220113/BizAIApk.git
cd BizAIApk
flutter_app\build-apk.bat
```

**On Mac/Linux:**
```bash
git clone https://github.com/muhammadsameer7220113/BizAIApk.git
cd BizAIApk
chmod +x build-apk.sh
./build-apk.sh
```

**Manual Build:**
```bash
cd flutter_app
flutter pub get
flutter build apk --release
```

**APK Location:**
```
flutter_app/build/app/outputs/flutter-apk/app-release.apk
```

---

## Detailed Installation Guide

### Windows Installation

1. **Download Flutter SDK**
   - Go to https://flutter.dev/docs/get-started/install/windows
   - Download and extract to `C:\flutter`

2. **Add to PATH**
   - Open System Properties → Environment Variables
   - Add `C:\flutter\bin` to PATH

3. **Install Android Studio**
   - Download from https://developer.android.com/studio
   - Install with default settings
   - Open Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
   - Install Android SDK

4. **Set ANDROID_HOME**
   - Add environment variable: `ANDROID_HOME = C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`
   - Add to PATH: `%ANDROID_HOME%\platform-tools`

5. **Verify Installation**
   ```cmd
   flutter doctor
   ```
   All checks should pass ✓

6. **Build APK**
   ```cmd
   cd flutter_app
   flutter pub get
   flutter build apk --release
   ```

### Mac Installation

1. **Install Flutter**
   ```bash
   brew install flutter
   # OR download from https://flutter.dev/docs/get-started/install/macos
   ```

2. **Install Android Studio**
   - Download from https://developer.android.com/studio
   - Install Android SDK

3. **Set Environment Variables**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

4. **Verify**
   ```bash
   flutter doctor
   ```

5. **Build**
   ```bash
   cd flutter_app
   flutter pub get
   flutter build apk --release
   ```

### Linux Installation

1. **Install Flutter**
   ```bash
   cd ~/development
   git clone https://github.com/flutter/flutter.git -b stable
   export PATH="$PATH:$HOME/development/flutter/bin"
   ```

2. **Install Android Studio**
   ```bash
   sudo apt install android-studio
   # OR download from https://developer.android.com/studio
   ```

3. **Set Environment**
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

4. **Verify & Build**
   ```bash
   flutter doctor
   cd flutter_app
   flutter pub get
   flutter build apk --release
   ```

---

## Install APK on Phone

1. **Transfer APK** to your Android phone:
   - USB cable
   - Email
   - Google Drive
   - Any file sharing method

2. **Enable Unknown Sources**:
   - Settings → Security → Unknown Sources → Enable
   - OR Settings → Apps → Special Access → Install Unknown Apps → Enable for your file manager

3. **Install**:
   - Open file manager
   - Find the APK file
   - Tap to install
   - Grant permissions when prompted

---

## Troubleshooting

### "Flutter not found"
- Make sure Flutter is in your PATH
- Restart terminal after adding to PATH
- Run `flutter doctor` to verify

### "Android SDK not found"
- Install Android Studio
- Set ANDROID_HOME environment variable
- Accept Android licenses: `flutter doctor --android-licenses`

### Build fails with "Gradle error"
- Update Gradle: `cd flutter_app/android && ./gradlew wrapper --gradle-version=7.5`
- Clean build: `flutter clean` then `flutter pub get`

### APK too large
- Normal Flutter APK is 15-30 MB
- If larger, check for unused assets or dependencies

### Phone won't install APK
- Enable "Install from Unknown Sources"
- Check Android version (minimum Android 5.0+)
- Try installing via ADB: `adb install app-release.apk`

---

## Alternative: Use Online Build Service

If you don't want to install Flutter locally:

### Codemagic.io
1. Go to https://codemagic.io
2. Sign up with GitHub
3. Add your repository
4. Click "Build" → Get APK in 10 minutes
5. Free tier: 500 build minutes/month

### GitHub Actions (Free)
I can set up automatic builds. Just ask: "Set up GitHub Actions for APK builds"

---

## What's Included in the APK

✅ POS / Billing System
✅ Inventory Management
✅ Customer Management
✅ Supplier Management
✅ Purchase Tracking
✅ Expense Tracking
✅ Udhaar/Credit Management
✅ Dashboard with Real Metrics
✅ Reports & Excel/CSV Export
✅ AI Business Assistant (Text Chat)
✅ Auto WhatsApp/Email Receipts
✅ Galla Patti (Cash Drawer)
✅ Date Range Filters
✅ Multi-Business Support

---

## Need Help?

If you encounter any issues:
1. Check `flutter doctor` output
2. Make sure all dependencies are installed
3. Run `flutter pub get` before building
4. Check the troubleshooting section above

**GitHub Repository**: https://github.com/muhammadsameer7220113/BizAIApk

---

## Backend Setup (Optional)

The app works without backend for UI testing, but for full functionality:

```bash
cd backend
npm install
cp .env.example .env
# Configure MySQL and API keys
node ../database/migrate.js
npm start
```

Update Flutter app to point to your backend:
Edit `flutter_app/lib/core/services/api_service.dart`
Change baseUrl to your server URL
