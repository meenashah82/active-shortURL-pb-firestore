# URL Shortener Powered by Firestore

A modern, real-time URL shortener built with Next.js 15, Firebase Firestore, and TypeScript. Features comprehensive analytics, admin management, and a clean, responsive interface.

## 🚀 Features

- **URL Shortening**: Create short, memorable links from long URLs
- **Real-time Analytics**: Track clicks, referrers, user agents, and geographic data
- **Admin Dashboard**: Manage URLs and view comprehensive analytics
- **User Authentication**: Secure admin access with JWT tokens
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Firebase Integration**: Leverages Firestore for real-time data synchronization

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Firebase Firestore
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: JWT with Firebase integration
- **Database**: Firebase Firestore with real-time listeners
- **Deployment**: Vercel (recommended)

## 📦 Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd url-shortener-firestore
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Get your Firebase configuration

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   \`\`\`env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   JWT_SECRET=your_jwt_secret_key
   \`\`\`

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Create your first admin user**
   \`\`\`bash
   npm run create-admin
   \`\`\`

## 🏗️ Project Structure

\`\`\`
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── analytics/         # Analytics pages
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   └── [shortCode]/       # Dynamic redirect pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── *.tsx             # Custom components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── scripts/              # Database scripts
└── public/               # Static assets
\`\`\`

## 🔥 Firebase Setup

### Firestore Collections

The application uses the following Firestore collections:

1. **`urls`** - Stores shortened URLs
   \`\`\`typescript
   {
     shortCode: string
     originalUrl: string
     createdAt: Timestamp
     isActive: boolean
   }
   \`\`\`

2. **`analytics`** - Stores click analytics
   \`\`\`typescript
   {
     totalClicks: number
     createdAt: Timestamp
     lastClickAt: Timestamp
   }
   \`\`\`

3. **`analytics/{shortCode}/clicks`** - Individual click records
   \`\`\`typescript
   {
     timestamp: Timestamp
     userAgent: string
     referer: string
     ip: string
     country: string
     city: string
   }
   \`\`\`

4. **`admin_users`** - Admin user management
   \`\`\`typescript
   {
     username: string
     passwordHash: string
     createdAt: Timestamp
     isActive: boolean
   }
   \`\`\`

### Firestore Security Rules

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access to URLs for redirects
    match /urls/{shortCode} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Analytics - read/write for authenticated users
    match /analytics/{shortCode} {
      allow read, write: if true;
      
      match /clicks/{clickId} {
        allow read, write: if true;
      }
    }
    
    // Admin users - restricted access
    match /admin_users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
\`\`\`

## 🎯 Usage

### Creating Short URLs

1. Visit the homepage
2. Enter a long URL in the input field
3. Click "Shorten URL"
4. Copy and share your short link

### Viewing Analytics

1. Click on any short URL from your history
2. View real-time click statistics
3. Analyze referrer data and user agents
4. Monitor geographic distribution

### Admin Features

1. Access `/admin` to log in
2. View all URLs and their analytics
3. Manage admin users
4. Monitor system-wide statistics

## 🔧 API Endpoints

- `POST /api/shorten` - Create a new short URL
- `GET /api/redirect/[shortCode]` - Redirect and track analytics
- `GET /api/analytics/[shortCode]` - Get analytics data
- `POST /api/auth/validate` - Validate admin authentication

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment

1. Build the application:
   \`\`\`bash
   npm run build
   \`\`\`

2. Start the production server:
   \`\`\`bash
   npm start
   \`\`\`

## 🔒 Security Features

- JWT-based authentication for admin access
- Secure password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- Firestore security rules

## 📊 Analytics Features

- Real-time click tracking
- Geographic data collection
- Referrer analysis
- User agent detection
- Historical data visualization
- Export capabilities

## 🎨 Customization

### Styling
- Built with Tailwind CSS
- Uses shadcn/ui component library
- Fully customizable theme system
- Responsive design patterns

### Components
- Modular React components
- TypeScript for type safety
- Custom hooks for data management
- Real-time updates with Firebase

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the GitHub Issues page
2. Review the Firebase documentation
3. Ensure all environment variables are set correctly
4. Verify Firestore security rules are properly configured

## 🔄 Updates

This project is actively maintained. Check the releases page for the latest updates and features.
