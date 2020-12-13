@echo off
set /p w=请输入文件格式(即扩展名并以回车结束):
set /p wf=请输入要修改的文字(以回车结束):
set /p cb=请输入要改成的文字(若是删除则直接回车，以回车结束):
for /f "delims=" %%i in ('dir /b /a-d "*.%w%"' ) do ( 
set str1=%%i 
setlocal EnableDelayedExpansion
set "str1=!str1:%wf%=%cb%!"
ren "%%i" "!str1!"
endlocal
)
pause