# Firebase Setup Guide

The authentication system is failing because you need to set up a real Firebase project. Here's how to do it:

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "codenest-platform")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click on it and toggle "Enable"
   - **Google**: Click on it, toggle "Enable", and add your project's domain

## Step 3: Set up Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users

## Step 4: Get Firebase Configuration

1. Go to "Project settings" (gear icon in the left sidebar)
2. Scroll down to "Your apps" section
3. Click "Add app" and select the web icon (`</>`)
4. Register your app with a nickname (e.g., "CodeNest Web")
5. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

## Step 5: Update Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef...
```

## Step 6: Restart Development Server

After updating the environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Step 7: Test Authentication

1. Go to your app at `http://localhost:3000`
2. Try to register a new account or sign in
3. Check the Firebase Console > Authentication > Users to see if users are being created

## Troubleshooting

- **"Firebase: Error (auth/configuration-not-found)"**: Make sure all environment variables are set correctly
- **"Firebase: Error (auth/api-key-not-valid)"**: Double-check your API key
- **"Firebase: Error (auth/project-not-found)"**: Verify your project ID is correct
- **Still getting demo-api-key errors**: Make sure you restarted the development server after updating `.env.local`

## Security Notes

- Never commit `.env.local` to version control
- The Firebase config values are safe to expose in client-side code
- For production, set these environment variables in your hosting platform (Vercel, Netlify, etc.)