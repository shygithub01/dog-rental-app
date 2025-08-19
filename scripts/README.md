# Firebase Admin Scripts

This directory contains scripts to manage your Firebase data and admin users via command line.

## 🚀 Quick Start

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

## 📁 Available Scripts

### 🔥 Shell Script (Recommended)
```bash
./scripts/firebase-admin.sh
```

**Features:**
- Interactive menu
- Clear all data
- Create admin users
- Show project info
- Built-in safety checks

### 📜 Node.js Script
```bash
node scripts/clear-data.js
```

**Features:**
- Simple data clearing
- Requires Firebase config setup
- Faster execution

## 🧹 Clear All Data

### Option A: Shell Script
```bash
./scripts/firebase-admin.sh
# Choose option 2: Clear all data
```

### Option B: Node.js Script
```bash
# First, copy your Firebase config to scripts/clear-data.js
node scripts/clear-data.js
```

### Option C: Firebase Console (Manual)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Delete collections manually

## 👑 Create Admin User

### Option A: Automated (Recommended) 🤖
```bash
# Make the latest user an admin automatically
node scripts/auto-admin.js
```

### Option B: Specific User Email
```bash
# Make a specific user admin by email
node scripts/create-admin.js mohapatra.shyam@gmail.com
```

### Option C: Shell Script
```bash
./scripts/firebase-admin.sh
# Choose option 3: Create admin user
```

### Option D: Firebase Console (Manual)
1. Go to Firebase Console → Firestore Database
2. Create collection `users` (if not exists)
3. Create document with your UID
4. Add fields:
   ```json
   {
     "role": "admin",
     "isAdmin": true,
     "email": "your-email@domain.com",
     "displayName": "Your Name",
     "createdAt": [timestamp]
   }
   ```

## 🔧 Firebase CLI Commands

### List Projects
```bash
firebase projects:list
```

### Switch Project
```bash
firebase use [project-id]
```

### Show Current Project
```bash
firebase use
```

### Login Status
```bash
firebase auth:list
```

## ⚠️ Important Notes

1. **Backup First**: Always backup important data before clearing
2. **Admin Access**: You need Firebase project permissions
3. **Authentication**: Must be logged in to Firebase CLI
4. **Safety**: Scripts include confirmation prompts

## 🆘 Troubleshooting

### Permission Denied
```bash
sudo npm install -g firebase-tools
```

### Not Logged In
```bash
firebase login
```

### Wrong Project
```bash
firebase use [correct-project-id]
```

### Script Not Executable
```bash
chmod +x scripts/firebase-admin.sh
```

## 🎯 Complete Automated Workflow

### 🚀 Super Easy (Recommended):
```bash
# 1. Clear all data
firebase firestore:delete --all-collections --force

# 2. Sign in to your app (creates user profile)
# (Go to browser, sign in with Google)

# 3. Make yourself admin automatically
node scripts/auto-admin.js

# 4. Refresh app - you're now admin! 🎉
```

### 📝 Step by Step:
1. **Clear all data** using Firebase CLI
2. **Sign in to app** (creates fresh user profile)
3. **Run auto-admin script** (grants admin privileges)
4. **Refresh app** (see admin features)
5. **Test admin functionality** 
6. **Remove scripts** before production

## 🚨 Production Warning

**NEVER use these scripts in production!** They are for development and testing only.
