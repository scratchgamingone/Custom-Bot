@echo off
setlocal enabledelayedexpansion

set "repo_url=https://github.com/scratchgamingone/Discord-Bot.git"

if not exist .git (
    goto :initial_setup
) else (
    goto :push_changes
)

:initial_setup
echo Initializing GitHub repository for Discord Bot...

REM Create README.md
echo # Discord Bot > README.md

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
echo # Ignore yarn integrity file
echo .yarn-integrity
echo.
echo # Ignore VSCode settings
echo .vscode/
echo.
echo # Ignore package-lock.json for projects using npm
echo package-lock.json
echo.
echo # Ignore yarn.lock for projects using Yarn
echo yarn.lock
echo.
echo # Ignore any local configuration files
echo config.json
) > .gitignore

REM Initialize git repository
git init

REM Add all files except those in .gitignore
git add .

REM Initial commit
git commit -m "Initial commit: Discord Bot setup"

REM Set up main branch
git branch -M main

REM Add remote origin
git remote add origin %repo_url%

REM Push to GitHub
git push -u origin main

echo Initial setup completed!
goto :end

:push_changes
echo Pushing Discord Bot changes to GitHub...

REM Fetch and pull any changes from the remote repository
git fetch
git pull origin main

REM Add all changes
git add .

REM Show status
git status

REM Prompt for commit message
set /p commit_msg="Enter commit message: "

REM Commit changes
git commit -m "%commit_msg%"

REM Push to GitHub
git push -u origin main

echo Push completed!
goto :end

:end
pause