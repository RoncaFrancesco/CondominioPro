@echo off
setlocal ENABLEDELAYEDEXPANSION
chcp 65001 >nul

echo [Condominio] Avvio WebApp...

REM Directory progetto = cartella del batch
set "PROJ_DIR=%~dp0"
pushd "%PROJ_DIR%"

set "VENV_DIR=.venv"
set "PY_EXE=%VENV_DIR%\Scripts\python.exe"

REM Crea virtualenv se mancante
if not exist "%PY_EXE%" (
  echo [Setup] Creo virtualenv in %VENV_DIR% ...
  py -3 -m venv "%VENV_DIR%"
)

REM Aggiorna pip e installa dipendenze
echo [Setup] Aggiorno pip...
"%PY_EXE%" -m pip install --upgrade pip

echo [Setup] Installo dipendenze da requirements.txt...
"%PY_EXE%" -m pip install -r requirements.txt

REM Avvia backend
echo [Run] Server su http://localhost:5000
echo [Run] Login di default: admin / admin123
"%PY_EXE%" backend\app.py

popd
echo.
pause
endlocal
