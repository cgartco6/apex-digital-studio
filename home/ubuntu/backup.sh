#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# MongoDB backup
mongodump --uri="mongodb://admin:YourSecurePassword123!@<DB_PRIVATE_IP>:27017/apex-digital" --out="$BACKUP_DIR/mongo_$DATE"

# Upload to object storage
oci os object put \
  --bucket-name apex-backups \
  --file "$BACKUP_DIR/mongo_$DATE.tar.gz" \
  --name "mongo_$DATE.tar.gz"

# Keep only last 7 days local
find $BACKUP_DIR -type f -mtime +7 -delete
