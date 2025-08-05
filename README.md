# URL Shortener

A modern URL shortener built with Next.js, Firebase Firestore, and real-time analytics.

## Features

- 🔗 Create short URLs from long URLs
- 📊 Real-time analytics with click tracking
- 🔥 Live updates via Firestore WebSocket
- 👨‍💼 Admin dashboard for URL management
- 🔐 Authentication system
- 📱 Responsive design

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS, shadcn/ui
- **Authentication**: Custom JWT with Wodify integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase project with Firestore enabled

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. Configure Firebase:
   - Add your Firebase config to environment variables
   - Set up Firestore security rules

5. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Environment Variables

\`\`\`
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
JWT_SECRET=
\`\`\`

## Database Structure

### URLs Collection
\`\`\`
urls/{shortCode}
├── originalUrl: string
├── shortCode: string
├── createdAt: timestamp
├── totalClicks: number
├── isActive: boolean
└── clicks/{clickId}
    ├── timestamp: timestamp
    ├── User-Agent: string
    ├── X-Forwarded-For: string
    └── [other headers]
\`\`\`

## API Routes

- `POST /api/shorten` - Create short URL
- `GET /api/redirect/[shortCode]` - Redirect and track click
- `POST /api/auth/validate` - Validate authentication token

## License

MIT License
