#!/bin/bash

set -e  # exit on error

echo "🚀 Apex Digital Studio Ubuntu Installer"
echo "========================================"

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw fail2ban

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Python & pip
sudo apt install -y python3 python3-pip python3-venv

# Clone repository (replace with your actual repo)
git clone https://github.com/your-org/apex-digital-studio.git
cd apex-digital-studio

# Create .env files from examples
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-agents/.env.example ai-agents/.env

echo ""
echo "⚠️  Please edit the .env files with your actual secrets before continuing."
echo "   For example:"
echo "   nano backend/.env"
echo "   nano frontend/.env"
echo "   nano ai-agents/.env"
read -p "Press Enter after you've updated the .env files..."

# Backend setup
echo "Setting up backend..."
cd backend
npm install

# Start backend with PM2
pm2 start server.js --name apex-backend
pm2 startup systemd
pm2 save

cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend
npm install
npm run build

# Copy build to nginx web root
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/

cd ..

# AI Agents setup
echo "Setting up AI agents..."
cd ai-agents
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run AI agents with PM2
pm2 start python3 --name ai-agents -- main.py
pm2 save

cd ..

# Configure Nginx
sudo tee /etc/nginx/sites-available/apex > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain if any

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
EOF

sudo ln -sf /etc/nginx/sites-available/apex /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Optional: Set up SSL with Let's Encrypt (if domain is set)
read -p "Do you have a domain name for SSL? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your domain (e.g., yourdomain.com): " DOMAIN
    read -p "Enter your API domain (e.g., api.yourdomain.com): " API_DOMAIN
    sudo certbot --nginx -d $DOMAIN -d $API_DOMAIN
fi

echo ""
echo "✅ Installation complete!"
echo "Frontend: http://$(curl -s ifconfig.me)"
echo "Backend API: http://$(curl -s ifconfig.me)/api"
echo ""
echo "Use 'pm2 list' to check running services."
