#!/bin/bash

# Firebase Admin Management Script
# This script clears all data and creates admin users

echo "🔥 Firebase Admin Management Script"
echo "=================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase first:"
    echo "   firebase login"
    exit 1
fi

echo "✅ Firebase CLI ready"

# Function to clear all data
clear_all_data() {
    echo ""
    echo "🧹 Clearing all data..."
    
    # Get project ID from current directory
    PROJECT_ID=$(firebase use --json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$PROJECT_ID" ]; then
        echo "❌ Could not determine project ID, using default: dog-rental-app"
        PROJECT_ID="dog-rental-app"
    fi
    
    echo "📁 Project ID: $PROJECT_ID"
    
    # Clear all collections using Firestore REST API
    echo "🗑️ Clearing users collection..."
    curl -X DELETE "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/users" \
         -H "Authorization: Bearer $(gcloud auth print-access-token 2>/dev/null || echo 'NO_TOKEN')" \
         2>/dev/null || echo "⚠️ Could not clear users (may need gcloud auth)"
    
    echo "🗑️ Clearing dogs collection..."
    curl -X DELETE "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/dogs" \
         -H "Authorization: Bearer $(gcloud auth print-access-token 2>/dev/null || echo 'NO_TOKEN')" \
         2>/dev/null || echo "⚠️ Could not clear dogs (may need gcloud auth)"
    
    echo "🗑️ Clearing rentals collection..."
    curl -X DELETE "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/rentals" \
         -H "Authorization: Bearer $(gcloud auth print-access-token 2>/dev/null || echo 'NO_TOKEN')" \
         2>/dev/null || echo "⚠️ Could not clear rentals (may need gcloud auth)"
    
    echo "🗑️ Clearing messages collection..."
    curl -X DELETE "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/messages" \
         -H "Authorization: Bearer $(gcloud auth print-access-token 2>/dev/null || echo 'NO_TOKEN')" \
         2>/dev/null || echo "⚠️ Could not clear messages (may need gcloud auth)"
    
    echo "🗑️ Clearing notifications collection..."
    curl -X DELETE "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/notifications" \
         -H "Authorization: Bearer $(gcloud auth print-access-token 2>/dev/null || echo 'NO_TOKEN')" \
         2>/dev/null || echo "⚠️ Could not clear notifications (may need gcloud auth)"
    
    echo "🗑️ Clearing reviews collection..."
    curl -X DELETE "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/reviews" \
         -H "Authorization: Bearer $(gcloud auth print-access-token 2>/dev/null || echo 'NO_TOKEN')" \
         2>/dev/null || echo "⚠️ Could not clear reviews (may need gcloud auth)"
    
    echo "✅ Data clearing attempted (check Firebase console for results)"
}

# Function to create admin user
create_admin_user() {
    echo ""
    echo "👑 Creating admin user..."
    
    read -p "Enter admin email: " ADMIN_EMAIL
    read -p "Enter admin display name: " ADMIN_NAME
    
    if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_NAME" ]; then
        echo "❌ Email and display name are required"
        return 1
    fi
    
    # Generate a random UID (you can replace this with actual UID from Firebase Auth)
    ADMIN_UID=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 28 | head -n 1)
    
    echo "🆔 Generated UID: $ADMIN_UID"
    echo "📧 Email: $ADMIN_EMAIL"
    echo "👤 Name: $ADMIN_NAME"
    
    # Create admin user document
    echo "📝 Creating admin user document..."
    
    # This would require Firebase Admin SDK or manual creation in console
    echo "⚠️ Manual step required:"
    echo "1. Go to Firebase Console → Firestore Database"
    echo "2. Create collection 'users'"
    echo "3. Create document with ID: $ADMIN_UID"
    echo "4. Add fields:"
    echo "   - role: 'admin' (string)"
    echo "   - isAdmin: true (boolean)"
    echo "   - email: '$ADMIN_EMAIL' (string)"
    echo "   - displayName: '$ADMIN_NAME' (string)"
    echo "   - createdAt: [current timestamp]"
    
    echo "✅ Admin user setup instructions provided"
}

# Function to show Firebase project info
show_project_info() {
    echo ""
    echo "📊 Firebase Project Information:"
    echo "================================"
    
    firebase projects:list
    echo ""
    firebase use
}

# Main menu
while true; do
    echo ""
    echo "🎯 Choose an option:"
    echo "1. Show Firebase project info"
    echo "2. Clear all data"
    echo "3. Create admin user"
    echo "4. Exit"
    echo ""
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            show_project_info
            ;;
        2)
            read -p "⚠️ Are you sure you want to clear ALL data? (yes/no): " confirm
            if [ "$confirm" = "yes" ]; then
                clear_all_data
            else
                echo "❌ Data clearing cancelled"
            fi
            ;;
        3)
            create_admin_user
            ;;
        4)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please enter 1-4."
            ;;
    esac
done
