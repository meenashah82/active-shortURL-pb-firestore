# URL Shortener Powered by Firestore

A modern URL shortener built with Next.js 15, Firebase Firestore, and real-time analytics.

## Features

- **URL Shortening**: Create short URLs with custom or auto-generated codes
- **Real-time Analytics**: Live click tracking with WebSocket updates
- **Admin Dashboard**: User management and analytics overview
- **Click History**: Detailed tracking of each click with headers and metadata
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase Firestore
- **UI Components**: shadcn/ui
- **Authentication**: JWT-based admin authentication
- **Real-time**: Firestore WebSocket subscriptions

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase configuration in environment variables
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
JWT_SECRET=your_jwt_secret
\`\`\`

## Database Structure

- `urls/{shortCode}` - Main URL documents with click counts
- `urls/{shortCode}/clicks/{clickId}` - Individual click records
- `admin_users/{userId}` - Admin user accounts

## License

MIT License
