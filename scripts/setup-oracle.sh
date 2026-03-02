#!/bin/bash

set -e

echo "🚀 Apex Digital Studio - Oracle Cloud Free Tier Installer"
echo "=========================================================="

# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw fail2ban

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install MongoDB (on same instance for simplicity; for production, use separate DB instance)
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

# Clone repo
git clone https://github.com/your-org/apex-digital-studio.git
cd apex-digital-studio

# Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-agents/.env.example ai-agents/.env

echo ""
echo "⚠️  Edit the .env files now. Use: nano backend/.env"
read -p "Press Enter after editing..."

# Backend
cd backend
npm install
pm2 start server.js --name apex-backend
pm2 startup systemd
pm2 save
cd ..

# Frontend
cd frontend
npm install
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
cd ..

# AI Agents
cd ai-agents
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pm2 start python3 --name ai-agents -- main.py
pm2 save
cd ..

# Nginx configuration (same as Ubuntu)
sudo tee /etc/nginx/sites-available/apex > /dev/null <<'EOF'
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
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/apex /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Optional: Attach and mount block volume (if you have 100GB free block storage)
# Assuming the volume is /dev/sdb
# sudo mkfs.ext4 /dev/sdb
# sudo mkdir /mnt/block
# sudo mount /dev/sdb /mnt/block
# echo "/dev/sdb /mnt/block ext4 defaults 0 0" | sudo tee -a /etc/fstab

echo ""
echo "✅ Oracle Cloud deployment complete!"
echo "Frontend: http://$(curl -s ifconfig.me)"
echo "Backend API: http://$(curl -s ifconfig.me)/api"
echo ""
echo "Remember to set up your domain and SSL with certbot."
