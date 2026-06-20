@echo off
title Lanzador de Cyto Avatar
color 0B

echo ========================================================
echo                 INICIANDO CYTO AVATAR
echo ========================================================
echo.

:: 1. Iniciar el Backend en una nueva ventana
echo [1/3] Iniciando el cerebro de Cyto (Backend)...
start "Cyto Backend" cmd /k "cd /d %~dp0talking_avatar_backend-main && npm start"

:: Esperar 5 segundos
timeout /t 5 /nobreak > nul

:: 2. Iniciar el Frontend (evitando que abra el navegador por defecto)
echo [2/3] Preparando la interfaz grafica (Frontend)...
start "Cyto Frontend" cmd /k "cd /d %~dp0talking_avatar-main && set BROWSER=none && npm start"

:: Esperar 15 segundos para que React compile la primera vez
echo [3/3] Esperando que la interfaz este lista... (15 segundos)
timeout /t 15 /nobreak > nul

:: 3. Abrir Chrome en modo Kiosco (Pantalla completa sin bordes)
echo.
echo Abriendo aplicacion en el Totem (Modo Kiosco)...
:: Nota: Si no usan Chrome, podes cambiar 'chrome' por 'msedge'
start chrome --kiosk http://localhost:3000

echo.
echo ========================================================
echo ¡SISTEMA INICIADO CORRECTAMENTE!
echo Para salir de la pantalla completa presiona ALT + F4
echo ========================================================
timeout /t 5 > nul
exit
