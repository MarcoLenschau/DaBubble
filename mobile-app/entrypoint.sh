source ~/.bashrc
mkdir /app/apk
cd /opt/mobile-app/
cp -r /app/www/* www/
cp /app/config.xml .
cordova build android --no-telemetry
cp platforms/android/app/build/outputs/apk/debug/app-debug.apk /app/apk/app.apk