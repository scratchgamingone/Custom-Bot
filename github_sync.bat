@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: GitHub Synchronization Script for Discord Bot
:: ============================================================================
:: This script handles two main scenarios:
:: 1. Initial Setup: If the project is not a Git repository, it initializes it,
::    creates a .gitignore file, and performs the first push to GitHub.
:: 2. Push Changes: If the repository is already set up, it pulls the latest
::    changes, prompts for a commit message, and pushes your local changes.
:: ============================================================================

set "repo_url=https://github.com/scratchgamingone/Discord-Bot.git"
set "default_branch=main"

:: Check if this is a Git repository by looking for the .git directory
if not exist .git (
    goto :initial_setup
) else (
    goto :push_changes
)

:initial_setup
echo.
echo [INFO] No Git repository found. Starting initial setup...
echo.

REM -------------------------------------------------
REM Create .gitignore to protect sensitive files
REM -------------------------------------------------
echo [SETUP] Creating .gitignore file to hide .env and other files...
(
    echo # Ignore environment variables file - THIS HIDES YOUR SECRETS
    echo .env
    echo.
    echo # Ignore Node.js dependencies
    echo node_modules/
    echo.
    echo # Ignore log files
    echo *.log
    echo npm-debug.log*
    echo.
    echo # Ignore OS-generated files
    echo .DS_Store
    echo Thumbs.db
    echo.
    echo # Ignore IDE/Editor specific settings
    echo .vscode/
    echo.
    echo # Ignore package manager lock files (optional, but good for libraries)
    echo package-lock.json
    echo yarn.lock
) > .gitignore
echo [SUCCESS] .gitignore created.

REM -------------------------------------------------
REM Initialize Git and perform the first commit
REM -------------------------------------------------
echo [SETUP] Initializing Git repository...
git init
git branch -M %default_branch%
echo [SUCCESS] Git initialized and branch set to '%default_branch%'.

echo [SETUP] Adding all files to Git (respecting .gitignore)...
git add .
git commit -m "Initial commit: Project setup"
echo [SUCCESS] Initial commit created.

REM -------------------------------------------------
REM Connect to the remote GitHub repository and push
REM -------------------------------------------------
echo [SETUP] Connecting to remote repository: %repo_url%
git remote add origin %repo_url%
echo [SETUP] Pushing initial commit to GitHub...
git push -u origin %default_branch%

echo.
echo [COMPLETE] Initial repository setup and push completed successfully!
echo.
goto :end

:push_changes
echo.
echo [INFO] Git repository found. Syncing changes with GitHub...
echo.

REM -------------------------------------------------
REM Pull latest changes from the remote repository
REM -------------------------------------------------
echo [SYNC] Pulling latest changes from the '%default_branch%' branch...
git pull origin %default_branch%
echo.

REM -------------------------------------------------
REM Add, commit, and push local changes
REM -------------------------------------------------
echo [SYNC] Staging all local changes...
git add .
echo.
echo [STATUS] Current repository status:
git status
echo.

set "commit_msg="
set /p commit_msg="Enter your commit message: "

if not defined commit_msg (
    echo [ERROR] Commit message cannot be empty. Aborting.
    goto :end
)

echo [SYNC] Committing changes...
git commit -m "%commit_msg%"

echo [SYNC] Pushing changes to GitHub...
git push

echo.
echo [COMPLETE] Your changes have been pushed to GitHub successfully!
echo.
goto :end

:end
pause