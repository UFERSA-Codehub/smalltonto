# Tonto Project Setup Script for Windows
# Run from project root: .\setup.ps1

param(
    [switch]$Force  # Force reinstall even if already set up
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Step { param($msg) Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "   $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "   $msg" -ForegroundColor Gray }
function Write-Warn { param($msg) Write-Host "   $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "   $msg" -ForegroundColor Red }

$projectRoot = $PSScriptRoot

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  Tonto Project Setup" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

# ============================================================
# 1. Check Prerequisites
# ============================================================

Write-Step "Checking prerequisites..."

# Check Python
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python (\d+)\.(\d+)") {
        $major = [int]$Matches[1]
        $minor = [int]$Matches[2]
        if ($major -ge 3 -and $minor -ge 11) {
            Write-Success "Python $major.$minor found"
        } else {
            Write-Err "Python 3.11+ required, found $major.$minor"
            Write-Info "Download from: https://www.python.org/downloads/"
            exit 1
        }
    }
} catch {
    Write-Err "Python not found!"
    Write-Info "Download from: https://www.python.org/downloads/"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Success "Node.js $nodeVersion found"
} catch {
    Write-Err "Node.js not found!"
    Write-Info "Download from: https://nodejs.org/"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>&1
    Write-Success "npm $npmVersion found"
} catch {
    Write-Err "npm not found!"
    Write-Info "npm should come with Node.js installation"
    exit 1
}

# ============================================================
# 2. Root npm install (husky/commitlint)
# ============================================================

Write-Step "Installing root dependencies (husky/commitlint)..."

Set-Location $projectRoot

if ((Test-Path "node_modules") -and -not $Force) {
    Write-Info "node_modules exists, skipping (use -Force to reinstall)"
} else {
    if ($Force -and (Test-Path "node_modules")) {
        Write-Warn "Removing existing node_modules..."
        Remove-Item -Recurse -Force "node_modules"
    }
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Err "npm install failed!"; exit 1 }
    Write-Success "Root dependencies installed"
}

# ============================================================
# 3. Create Python venv (apps/core/.venv)
# ============================================================

Write-Step "Setting up Python virtual environment..."

$coreDir = Join-Path $projectRoot "apps\core"
$venvDir = Join-Path $coreDir ".venv"

Set-Location $coreDir

if ((Test-Path $venvDir) -and -not $Force) {
    Write-Info ".venv exists, skipping (use -Force to reinstall)"
} else {
    if ($Force -and (Test-Path $venvDir)) {
        Write-Warn "Removing existing .venv..."
        Remove-Item -Recurse -Force $venvDir
    }
    Write-Info "Creating virtual environment..."
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) { Write-Err "Failed to create venv!"; exit 1 }
    Write-Success "Virtual environment created"
}

Write-Info "Installing Python dependencies..."
& "$venvDir\Scripts\pip.exe" install -r requirements.txt --quiet
if ($LASTEXITCODE -ne 0) { Write-Err "pip install failed!"; exit 1 }
Write-Success "Python dependencies installed"

# ============================================================
# 4. Setup Frontend (apps/viewer/frontend)
# ============================================================

Write-Step "Setting up frontend..."

$frontendDir = Join-Path $projectRoot "apps\viewer\frontend"

Set-Location $frontendDir

if ((Test-Path "node_modules") -and -not $Force) {
    Write-Info "node_modules exists, skipping (use -Force to reinstall)"
} else {
    if ($Force -and (Test-Path "node_modules")) {
        Write-Warn "Removing existing node_modules..."
        Remove-Item -Recurse -Force "node_modules"
    }
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Err "npm install failed!"; exit 1 }
    Write-Success "Frontend dependencies installed"
}

Write-Info "Building frontend..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Err "Frontend build failed!"; exit 1 }
Write-Success "Frontend built successfully"

# ============================================================
# 5. Navigate to viewer and print instructions
# ============================================================

$viewerDir = Join-Path $projectRoot "apps\viewer"
Set-Location $viewerDir

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "To run the Tonto Viewer:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Activate the Python virtual environment:" -ForegroundColor Gray
Write-Host "     ..\core\.venv\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Run the application:" -ForegroundColor Gray
Write-Host "     python .\app.py" -ForegroundColor Yellow
Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Development Mode (optional):" -ForegroundColor White
Write-Host ""
Write-Host "  To run frontend with hot-reload:" -ForegroundColor Gray
Write-Host "     cd apps\viewer\frontend" -ForegroundColor Yellow
Write-Host "     npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Then in another terminal, run the Python app." -ForegroundColor Gray
Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Build Executable (optional):" -ForegroundColor White
Write-Host ""
Write-Host "  To build a standalone .exe with PyInstaller:" -ForegroundColor Gray
Write-Host "     ..\core\.venv\Scripts\pyinstaller.exe viewer.spec --noconfirm" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Output: apps\viewer\dist\TontoViewer.exe" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
