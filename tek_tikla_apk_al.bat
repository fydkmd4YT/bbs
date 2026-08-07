@echo off
chcp 65001 >nul
title Ezan Vakti Alarm - APK Olusturucu
color 0b

echo ========================================================
echo   Android SDK Yolu Tanimlaniyor...
echo ========================================================

:: Doğrudan sistem ortam değişkeni olarak SDK yolunu veriyoruz
set ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk

echo SDK Yolu: %ANDROID_SDK_ROOT%
echo.
echo ========================================================
echo   Android APK Derleniyor (Lutfen Bekleyin)...
echo ========================================================

cd /d C:\Ezan-Vakti-Alarm\android
call gradlew assembleRelease

if not exist "app\build\outputs\apk\release\app-release.apk" (
    echo.
    echo [HATA] APK olusturulamadi!
    pause
    exit
)

echo.
echo ========================================================
echo   ISLEM BASARIYLA TAMAMLANDI!
echo ========================================================
echo   APK dosyaniz dogrudan MASAUSTUNUZE kopyalaniyor...
copy "app\build\outputs\apk\release\app-release.apk" "%USERPROFILE%\Desktop\EzanVaktiAlarm.apk"

echo.
echo   Islem Tamam! Masaustunuzu kontrol edebilirsiniz.
echo ========================================================
echo.
pause