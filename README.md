# CodeNest Platform

CodeNest is a full-stack online coding platform designed to help users practice programming through adaptive difficulty levels, AI-generated questions, and gamification features.

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript, TailwindCSS, Framer Motion
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Code Editor**: Monaco Editor
- **Code Execution**: Judge0 API
- **AI Integration**: Google Gemini API
- **Deployment**: Vercel (Frontend), Firebase (Backend)

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Library configurations (Firebase, etc.)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and constants
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Auth, Firestore, and Functions enabled
- Judge0 API key (for code execution)
- Google Gemini API key (for AI question generation)

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd codenest-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Fill in your Firebase configuration and API keys in `.env.local`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password and Google providers
3. Create a Firestore database
4. Set up Firebase Functions for external API integrations
5. Copy your Firebase config to `.env.local`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features

- 🔐 Firebase Authentication (Email/Password + Google OAuth)
- 👤 User profiles with skill level preferences
- 🎯 Adaptive difficulty based on user level
- 🤖 AI-generated coding questions using Google Gemini
- 💻 Monaco Editor with multi-language support
- ⚡ Real-time code execution via Judge0 API
- 🏆 Gamification with streaks and XP system
- 📱 Responsive design with dark/light themes
- 🔥 Daily challenges and progress tracking

## Contributing

This project follows a spec-driven development approach. See the `.kiro/specs/` directory for detailed requirements, design, and implementation tasks.

## License

This project is private and proprietary.
