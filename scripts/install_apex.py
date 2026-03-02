#!/usr/bin/env python3
"""
Universal One-Click Installer for Apex Digital Studio
Detects OS, installs missing dependencies, and deploys the platform.
"""

import os
import sys
import platform
import subprocess
import shutil
import getpass
import time
from pathlib import Path

# ANSI colors for pretty output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_color(text, color=Colors.GREEN):
    print(f"{color}{text}{Colors.END}")

def run_cmd(cmd, check=True, shell=False, capture_output=False):
    """Run a shell command and return result."""
    print_color(f"Running: {cmd}", Colors.YELLOW)
    try:
        if capture_output:
            result = subprocess.run(cmd, shell=shell, check=check, capture_output=True, text=True)
            return result.stdout.strip()
        else:
            subprocess.run(cmd, shell=shell, check=check)
            return None
    except subprocess.CalledProcessError as e:
        if check:
            print_color(f"Command failed: {e}", Colors.RED)
            sys.exit(1)
        return None

def command_exists(cmd):
    """Check if a command exists in PATH."""
    return shutil.which(cmd) is not None

def get_os():
    """Detect OS and distribution."""
    system = platform.system().lower()
    if system == "windows":
        return "windows"
    elif system == "darwin":
        return "macos"
    elif system == "linux":
        # Try to detect distribution
        if os.path.exists("/etc/debian_version"):
            return "debian"
        elif os.path.exists("/etc/redhat-release"):
            return "redhat"
        elif os.path.exists("/etc/fedora-release"):
            return "fedora"
        elif os.path.exists("/etc/arch-release"):
            return "arch"
        else:
            return "linux"
    else:
        return system

def install_package(pkg, os_type):
    """Install a single package using the appropriate package manager."""
    if os_type == "windows":
        # Prefer winget if available, else chocolatey
        if command_exists("winget"):
            run_cmd(f"winget install --silent --accept-package-agreements {pkg}", check=False)
        elif command_exists("choco"):
            run_cmd(f"choco install -y {pkg}", check=False)
        else:
            print_color(f"Please install {pkg} manually (winget or chocolatey not found).", Colors.RED)
            return False
    elif os_type == "macos":
        if command_exists("brew"):
            run_cmd(f"brew install {pkg}", check=False)
        else:
            print_color(f"Please install {pkg} via Homebrew (brew install {pkg}).", Colors.RED)
            return False
    else:  # Linux
        if os_type == "debian":
            run_cmd(f"sudo apt update && sudo apt install -y {pkg}", check=False)
        elif os_type in ["redhat", "fedora"]:
            run_cmd(f"sudo dnf install -y {pkg}", check=False)
        elif os_type == "arch":
            run_cmd(f"sudo pacman -S --noconfirm {pkg}", check=False)
        else:
            print_color(f"Please install {pkg} manually.", Colors.RED)
            return False
    return True

def check_and_install_deps(os_type):
    """Check for required dependencies and install if missing."""
    required = {
        "git": "git",
        "node": "node",
        "npm": "npm",
        "python3": "python3",
        "pip3": "pip3",
        "mongod": "mongodb",
        "redis-server": "redis",
        "nginx": "nginx",
        "pm2": "pm2"
    }
    # Platform-specific adjustments
    if os_type == "windows":
        required["mongod"] = "mongodb"
        required["redis-server"] = "redis-64"
    if os_type == "macos":
        required["mongod"] = "mongodb-community"
        required["redis-server"] = "redis"

    missing = []
    for cmd, pkg in required.items():
        if not command_exists(cmd):
            missing.append(pkg)

    if missing:
        print_color("The following dependencies are missing and will be installed:", Colors.YELLOW)
        for pkg in missing:
            print(f"  - {pkg}")
        print()
        if os_type != "windows":
            # On Unix, may need sudo password upfront
            if any(p in missing for p in ["mongodb", "redis", "nginx"]):
                print_color("Installing system packages may require sudo.", Colors.YELLOW)
        for pkg in missing:
            if not install_package(pkg, os_type):
                print_color(f"Failed to install {pkg}. Please install it manually and rerun.", Colors.RED)
                sys.exit(1)
        print_color("All dependencies installed.", Colors.GREEN)
    else:
        print_color("All required dependencies already present.", Colors.GREEN)

def prompt_env_files(repo_path):
    """Create .env files from examples and prompt for user input."""
    env_examples = {
        "backend": ".env.example",
        "frontend": ".env.example",
        "ai-agents": ".env.example"
    }
    for dirname, example in env_examples.items():
        src = repo_path / dirname / example
        dst = repo_path / dirname / ".env"
        if src.exists() and not dst.exists():
            shutil.copy(src, dst)
            print_color(f"Created {dst}", Colors.GREEN)
        elif not src.exists():
            print_color(f"Warning: {src} not found, skipping.", Colors.YELLOW)

    print_color("\nPlease edit the .env files with your actual secrets.", Colors.BOLD)
    print("You need at least:")
    print("  - OPENAI_API_KEY")
    print("  - JWT_SECRET (generate with: openssl rand -base64 32)")
    print("  - STRIPE keys (if using payments)")
    print("  - Email credentials")
    print("  - Database URI (if not local)")
    print()
    input("Press Enter after you have edited the .env files...")

def clone_repo(repo_url="https://github.com/your-org/apex-digital-studio.git", target_dir="apex-digital-studio"):
    """Clone the repository."""
    if os.path.exists(target_dir):
        print_color(f"Directory {target_dir} already exists. Using it.", Colors.YELLOW)
        return Path(target_dir).resolve()
    run_cmd(f"git clone {repo_url} {target_dir}")
    return Path(target_dir).resolve()

def setup_backend(repo_path, os_type):
    """Install backend dependencies and start with PM2 or background."""
    print_color("\n--- Setting up Backend ---", Colors.BOLD)
    backend_path = repo_path / "backend"
    os.chdir(backend_path)

    # Install npm packages
    run_cmd("npm install")

    # Start with PM2 if available, else as background process
    if command_exists("pm2"):
        run_cmd("pm2 start server.js --name apex-backend")
        run_cmd("pm2 save")
        if os_type != "windows":
            run_cmd("pm2 startup", check=False)
        print_color("Backend started with PM2.", Colors.GREEN)
    else:
        # Simple background process
        if os_type == "windows":
            # Use start command
            subprocess.Popen(["start", "node", "server.js"], shell=True)
        else:
            subprocess.Popen(["node", "server.js"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print_color("Backend started in background (no PM2).", Colors.YELLOW)

def setup_frontend(repo_path, os_type):
    """Build frontend and configure static serving."""
    print_color("\n--- Setting up Frontend ---", Colors.BOLD)
    frontend_path = repo_path / "frontend"
    os.chdir(frontend_path)

    run_cmd("npm install")
    run_cmd("npm run build")

    # Copy to web root or serve
    if os_type in ["debian", "redhat", "fedora", "arch"]:
        # Use nginx
        web_root = "/var/www/html"
        run_cmd(f"sudo rm -rf {web_root}/*")
        run_cmd(f"sudo cp -r build/* {web_root}/")
        print_color(f"Frontend copied to {web_root}", Colors.GREEN)
    else:
        # Use a simple static server
        if command_exists("serve"):
            serve_cmd = ["serve", "-s", "build", "-l", "3000"]
        else:
            run_cmd("npm install -g serve")
            serve_cmd = ["serve", "-s", "build", "-l", "3000"]
        if os_type == "windows":
            subprocess.Popen(serve_cmd, shell=True)
        else:
            subprocess.Popen(serve_cmd)
        print_color("Frontend served on http://localhost:3000", Colors.GREEN)

def setup_ai_agents(repo_path):
    """Set up Python virtual environment and run AI agents."""
    print_color("\n--- Setting up AI Agents ---", Colors.BOLD)
    agents_path = repo_path / "ai-agents"
    os.chdir(agents_path)

    # Create venv
    if not (agents_path / "venv").exists():
        run_cmd("python3 -m venv venv")
    # Activate and install
    if os.name == "nt":  # Windows
        activate = ".\\venv\\Scripts\\activate"
        pip_cmd = f"{activate} && pip install -r requirements.txt"
    else:
        activate = "source venv/bin/activate"
        pip_cmd = f"bash -c '{activate} && pip install -r requirements.txt'"
    run_cmd(pip_cmd, shell=True)

    # Run with PM2 if available
    if command_exists("pm2"):
        if os.name == "nt":
            # PM2 on Windows can run Python directly
            run_cmd("pm2 start python --name ai-agents -- main.py")
        else:
            run_cmd("pm2 start python3 --name ai-agents -- main.py")
        run_cmd("pm2 save")
        print_color("AI Agents started with PM2.", Colors.GREEN)
    else:
        # Background process
        if os.name == "nt":
            subprocess.Popen(["start", "python", "main.py"], shell=True)
        else:
            subprocess.Popen(["python3", "main.py"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print_color("AI Agents started in background.", Colors.YELLOW)

def configure_nginx(os_type):
    """Set up Nginx configuration on Linux."""
    if os_type not in ["debian", "redhat", "fedora", "arch"]:
        return
    nginx_conf = """
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
"""
    conf_path = "/etc/nginx/sites-available/apex"
    with open("/tmp/apex_nginx.conf", "w") as f:
        f.write(nginx_conf)
    run_cmd(f"sudo cp /tmp/apex_nginx.conf {conf_path}")
    run_cmd("sudo ln -sf /etc/nginx/sites-available/apex /etc/nginx/sites-enabled/")
    run_cmd("sudo rm -f /etc/nginx/sites-enabled/default")
    run_cmd("sudo nginx -t")
    run_cmd("sudo systemctl reload nginx")
    print_color("Nginx configured.", Colors.GREEN)

def main():
    print_color("="*60, Colors.HEADER)
    print_color("🚀 Apex Digital Studio Universal Installer", Colors.HEADER)
    print_color("="*60, Colors.HEADER)

    os_type = get_os()
    print_color(f"Detected OS: {os_type}", Colors.BLUE)

    # Check and install dependencies
    check_and_install_deps(os_type)

    # Clone repository (you can change the URL)
    repo_url = input("\nEnter repository URL (default: https://github.com/your-org/apex-digital-studio.git): ").strip()
    if not repo_url:
        repo_url = "https://github.com/your-org/apex-digital-studio.git"
    repo_path = clone_repo(repo_url)

    # Prompt to edit .env files
    prompt_env_files(repo_path)

    # Setup components
    setup_backend(repo_path, os_type)
    setup_frontend(repo_path, os_type)
    setup_ai_agents(repo_path)

    # Configure Nginx on Linux
    if os_type in ["debian", "redhat", "fedora", "arch"]:
        configure_nginx(os_type)

    # Final message
    print_color("\n" + "="*60, Colors.GREEN)
    print_color("✅ Installation Complete!", Colors.GREEN)
    print_color("="*60, Colors.GREEN)
    print()
    print("Services:")
    print("  - Backend API: http://localhost:5000")
    print("  - Frontend:    http://localhost (if using Nginx) or http://localhost:3000 (if using serve)")
    print("  - AI Agents:   Running in background")
    print()
    print("To check running processes:")
    if command_exists("pm2"):
        print("  pm2 list")
    else:
        print("  Use your system's process monitor.")
    print()
    print("Don't forget to:")
    print("  - Set up your domain and SSL (optional)")
    print("  - Configure payout accounts via admin dashboard")
    print("  - Add your OpenAI and other API keys if not already done")
    print()

if __name__ == "__main__":
    main()
