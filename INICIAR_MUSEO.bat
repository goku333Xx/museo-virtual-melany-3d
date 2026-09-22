@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
  start "Museo de Ciencias Naturales" http://localhost:8000
  python -m http.server 8000
  goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
  start "Museo de Ciencias Naturales" http://localhost:8000
  py -m http.server 8000
  goto :eof
)
echo No se encontro Python.
echo Instala Python 3 y vuelve a ejecutar este archivo.
pause
