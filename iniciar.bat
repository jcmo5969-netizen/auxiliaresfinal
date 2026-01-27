@echo off
echo ========================================
echo   Iniciando Sistema de Auxiliares
echo ========================================
echo.

echo [1/2] Iniciando servidor...
start "Servidor Node" cmd /k "cd server && node index.js"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando cliente...
start "Cliente Vite" cmd /k "cd client && npm run dev"

echo.
echo ========================================
echo   Servicios iniciados
echo ========================================
echo.
echo Servidor: http://localhost:5000
echo Cliente:  http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
