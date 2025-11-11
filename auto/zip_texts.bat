@echo off
set "zipPath=C:\Program Files\7-Zip\7z.exe"
set "sourceDir=C:\Users\Admin\Downloads\TextFiles"

cd /d "%sourceDir%"

for %%F in (*.txt) do (
    "%zipPath%" a "%%~nF.zip" "%%F"
)
pause
