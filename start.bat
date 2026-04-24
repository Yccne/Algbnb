@echo off
set ROOT=%~dp0
start cmd /k "cd /d %ROOT%rout && node index.js"
start cmd /k "cd /d %ROOT%apps\web-view && npm.cmd run dev -- --host 0.0.0.0"
