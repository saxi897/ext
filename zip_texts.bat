@echo off
set "zipPath=C:\Program Files\7-Zip\7z.exe"
set "sourceDir=C:\ThưMục\TextFiles"

cd /d "%sourceDir%"

for %%F in (*.txt) do (
    "%zipPath%" a "%%~nF.zip" "%%F"
)
pause
