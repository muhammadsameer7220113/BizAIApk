@echo off
REM BizAI APK Build Script for Windows
REM Run this after installing Flutter and Android Studio

echo Building BizAI APK...
echo.

REM Check Flutter
where flutter >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Flutter not found. Install from: https://flutter.dev
    pause
    exit /b 1
)

REM Navigate to Flutter project
cd flutter_app

REM Get dependencies
echo Installing dependencies...
flutter pub get

REM Build APK
echo Building APK...
flutter build apk --release

REM Check if build succeeded
if exist "build\app\outputs\flutter-apk\app-release.apk" (
    echo.
    echo SUCCESS!
    echo APK location: flutter_app\build\app\outputs\flutter-apk\app-release.apk
    echo.
    echo To install on your phone:
    echo    1. Transfer app-release.apk to your Android phone
    echo    2. Enable 'Install from Unknown Sources' in Settings
    echo    3. Tap the APK file to install
) else (
    echo Build failed. Check errors above.
    pause
    exit /b 1
)

pause
