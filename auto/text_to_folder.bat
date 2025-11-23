@echo off
for %%f in (*.txt) do (
    set "name=%%~nf"
    echo Đang xử lý file %%f...

    if not exist "%%~nf" (
        mkdir "%%~nf"
    )

    move "%%f" "%%~nf\"
)
echo Hoàn thành!
pause
