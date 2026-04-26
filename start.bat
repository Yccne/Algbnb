@echo off
set ROOT=%~dp0

=======
start "algbnb-api" cmd /k "cd /d %ROOT%controller\api && node index.js"
start "algbnb-web" cmd /k "cd /d %ROOT%view\web && npm.cmd run dev -- --host 0.0.0.0"

timeout /t 4 /nobreak >nul
start "" http://127.0.0.1:5173
