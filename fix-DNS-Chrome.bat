@echo off
:: Chrome/Thorium "IP bulunamadi" duzeltmesi - Yonetici olarak calistirin
echo DNS 1.1.1.1 / 8.8.8.8 ayarlaniyor...
netsh interface ipv4 set dnsservers name="Ethernet" static 1.1.1.1 primary
netsh interface ipv4 add dnsservers name="Ethernet" 8.8.8.8 index=2
ipconfig /flushdns
echo.
echo Tamam. Chrome ve Thorium'u tamamen kapatip yeniden acin.
echo Site: https://izmirisilanlari35.com
pause
