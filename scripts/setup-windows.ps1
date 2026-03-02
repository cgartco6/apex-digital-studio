# setup-windows.ps1 - One-click installer for Windows

Write-Host "🚀 Apex Digital Studio Windows Installer" -ForegroundColor Cyan

# Function to check if command exists
Function CommandExists($cmd) {
    try { Get-Command $cmd -ErrorAction Stop; return $true } catch { return $false }
}

# Install Chocolatey if missing
if (-not (CommandExists "choco")) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    refreshenv
}

# Install required packages via Chocolatey
$packages = @(
    "nodejs-lts",
    "python",
    "mongodb",
    "redis-64",
    "git"
)

foreach ($pkg in $packages) {
    Write-Host "Installing $pkg..." -ForegroundColor Yellow
    choco install $pkg -y
}

# Refresh environment variables
refreshenv

# Clone repository (replace with your actual repo)
Write-Host "Cloning repository..." -ForegroundColor Yellow
git clone https://github.com/your-org/apex-digital-studio.git
Set-Location apex-digital-studio

# Create .env files from templates
Write-Host "Creating environment files..." -ForegroundColor Yellow
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
Copy-Item ai-agents\.env.example ai-agents\.env

Write-Host "⚠️  Please edit the .env files with your actual secrets before continuing." -ForegroundColor Magenta
Read-Host "Press Enter after you've updated the .env files"

# Backend setup
Write-Host "Setting up backend..." -ForegroundColor Yellow
Set-Location backend
npm install
# Start MongoDB as a service
Start-Service MongoDB
# Start Redis as a service
Start-Service Redis

# Start backend with PM2 (install globally)
npm install -g pm2
pm2 start server.js --name apex-backend
pm2 startup
pm2 save

Set-Location ..

# Frontend setup
Write-Host "Setting up frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build

# Serve frontend with a simple static server (or use IIS)
npm install -g serve
serve -s build -l 3000 &

Set-Location ..

# AI Agents setup
Write-Host "Setting up AI agents..." -ForegroundColor Yellow
Set-Location ai-agents
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Run AI agents in background (using start-job or a separate window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $pwd; .\venv\Scripts\activate; python main.py"

Set-Location ..

Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "AI Agents running in background."
