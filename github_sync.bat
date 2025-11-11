@echo off
setlocal enabledelayedexpansion

set "repo_url=https://github.com/scratchgamingone/Custom-Bot"

if not exist .git (
    goto :initial_setup
) else (
    REM Check if the remote URL is correct and fix it if it's not.
    for /f "delims=" %%i in ('git remote get-url origin 2^>nul') do set "current_remote_url=%%i"
    
    if "!current_remote_url!" neq "%repo_url%" (
        echo.
        echo --- Incorrect remote URL detected! ---
        echo Current URL: !current_remote_url!
        echo Expected URL: %repo_url%
        echo.
        echo --- Updating remote URL... ---
        git remote set-url origin %repo_url%
        echo URL updated successfully!
        echo.
    )
    goto :push_changes
)

:initial_setup
echo Initializing GitHub repository for Discord Bot...

REM Create .gitignore
(
    echo # .gitignore
    echo.
    echo # Ignore .env file
    echo .env
    echo.
    echo # Ignore node_modules directory
    echo node_modules/
    echo.
    echo # Ignore log files
    echo *.log
    echo.
    echo # Ignore OS generated files
    echo .DS_Store
    echo Thumbs.db
    echo.
    echo # Ignore npm debug log
    echo npm-debug.log*
    echo.
    echo # Ignore VSCode settings
    echo .vscode/
) > .gitignore

REM Initialize git repository
echo.
echo --- Initializing local repository ---
git init
git branch -M main

REM Add remote origin
echo.
echo --- Adding remote origin: %repo_url% ---
git remote add origin %repo_url%

echo.
echo Initial setup completed! Please commit your files for the first time.
git add .
set /p commit_msg="Enter initial commit message: "
git commit -m "%commit_msg%"

echo.
echo --- Pushing initial commit to GitHub ---
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo *****************************************************************
    echo * Initial push failed. This might be due to unrelated histories.*
    echo * Trying to pull and merge before pushing again.                *
    echo *****************************************************************
    echo.
    git pull origin main --allow-unrelated-histories
    git push -u origin main
)

echo Initial push completed!
goto :end

:push_changes
echo Pushing Discord Bot changes to GitHub...

REM Fetch and pull any changes from the remote repository to avoid conflicts
echo.
echo --- Pulling latest changes from remote ---
git pull origin main

REM Add all local changes
echo.
echo --- Staging your local changes ---
git add .

REM Show status
git status

REM Prompt for commit message
echo.
set /p commit_msg="Enter commit message: "

REM Commit changes
git commit -m "%commit_msg%"

REM Push to GitHub
echo.
echo --- Pushing changes to GitHub ---
git push -u origin main

echo Push completed!
goto :end

:end
echo.
echo Script finished. Press any key to exit.
pause