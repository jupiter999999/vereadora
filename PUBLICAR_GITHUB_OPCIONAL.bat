@echo off
setlocal
cd /d "%~dp0"
title Portal Claudia Bezerra - Publicar no GitHub
where git >nul 2>nul
if errorlevel 1 (
 echo ERRO: Git para Windows nao encontrado.
 echo Instale o Git em https://git-scm.com/downloads/win
 pause
 exit /b 1
)
where gh >nul 2>nul
if errorlevel 1 (
 echo GitHub CLI nao encontrado.
 echo Para criar e publicar com este BAT, instale https://cli.github.com/
 echo Depois execute novamente este arquivo.
 pause
 exit /b 1
)
echo Projeto separado: jupiter999999/portal-claudia-bezerra
choice /c SN /m "Deseja criar um NOVO repositorio PRIVADO e publicar o site"
if errorlevel 2 exit /b 0
gh auth status >nul 2>nul
if errorlevel 1 (
 echo Faca login na sua conta pessoal do GitHub.
 gh auth login
 if errorlevel 1 goto :erro
)
if not exist ".git" (
 git init -b main
 if errorlevel 1 goto :erro
)
git add index.html styles.css app.js favicon.svg vercel.json README.md .gitignore assets dados
if errorlevel 1 goto :erro
git commit -m "Portal Claudia Bezerra - V4 premium editorial"
gh repo create jupiter999999/portal-claudia-bezerra --private --source . --remote origin --push
if errorlevel 1 (
 echo Nao foi possivel criar ou publicar o repositorio.
 echo Se o repositorio ja existir, confira no GitHub antes de tentar novamente.
 goto :erro
)
echo.
echo Publicado no GitHub! Importar em https://vercel.com/new
pause
exit /b 0
:erro
echo Verifique as mensagens exibidas acima.
pause
exit /b 1
