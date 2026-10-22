@echo off
setlocal
cd /d "%~dp0"
if not exist "index.html" (
 echo ERRO: o arquivo index.html nao foi encontrado.
 pause
 exit /b 1
)
echo Iniciando o Portal Claudia Bezerra...
start "" "index.html"
exit /b 0
