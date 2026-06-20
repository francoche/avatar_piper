@echo off
title Cerrar Cyto Avatar
color 0C

echo ========================================================
echo                 CERRANDO CYTO AVATAR
echo ========================================================
echo.

echo Cerrando procesos de Node (Backend y Frontend)...
taskkill /F /IM node.exe /T > nul 2>&1

echo Cerrando el navegador Chrome...
taskkill /F /IM chrome.exe /T > nul 2>&1

echo.
echo ¡El sistema se ha cerrado correctamente!
timeout /t 3 > nul
exit
