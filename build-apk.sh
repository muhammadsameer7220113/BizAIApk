#!/bin/bash
# BizAI APK Build Script
# Run this on your computer after installing Flutter and Android Studio

echo "🚀 Building BizAI APK..."
echo ""

# Check Flutter
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter not found. Install from: https://flutter.dev"
    exit 1
fi

# Check Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME not set. Install Android Studio and set ANDROID_HOME"
    exit 1
fi

# Navigate to Flutter project
cd flutter_app

# Get dependencies
echo "📦 Installing dependencies..."
flutter pub get

# Build APK
echo "🔨 Building APK..."
flutter build apk --release

# Check if build succeeded
if [ -f "build/app/outputs/flutter-apk/app-release.apk" ]; then
    echo ""
    echo "✅ SUCCESS!"
    echo "APK location: flutter_app/build/app/outputs/flutter-apk/app-release.apk"
    echo ""
    echo "📱 To install on your phone:"
    echo "   1. Transfer app-release.apk to your Android phone"
    echo "   2. Enable 'Install from Unknown Sources' in Settings"
    echo "   3. Tap the APK file to install"
else
    echo "❌ Build failed. Check errors above."
    exit 1
fi
