# URL Shortener with Firebase Firestore

A modern, full-featured URL shortener built with Next.js 14, Firebase Firestore, and TypeScript. Features real-time analytics, admin dashboard, and comprehensive click tracking.

## Features

- 🔗 **URL Shortening**: Create short, memorable links
- 📊 **Real-time Analytics**: Track clicks, referrers, and user agents
- 👨‍💼 **Admin Dashboard**: Manage URLs and view comprehensive analytics
- 🔐 **Authentication**: Secure admin access with JWT tokens
- 📱 **Responsive Design**: Works perfectly on all devices
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui
- ⚡ **Real-time Updates**: Live analytics without page refresh
- 🌐 **Geographic Tracking**: Track clicks by location
- 📈 **Charts & Graphs**: Visual analytics with Recharts

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: JWT with bcryptjs
- **Styling**: Tailwind CSS, shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn or pnpm
- Firebase project

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/url-shortener-firestore.git
   cd url-shortener-firestore
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   \`\`\`

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
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
   # or
   yarn dev
   # or
   pnpm dev
   \`\`\`

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Creating Short URLs

1. Visit the homepage
2. Enter a long URL in the input field
3. Click "Shorten URL"
4. Copy and share your short URL

### Admin Access

1. Navigate to `/admin`
2. Create an admin account (first user becomes admin)
3. Login with your credentials
4. Access the admin dashboard at `/dashboard`

### Analytics

- View analytics for any short URL by visiting `/analytics/[shortCode]`
- Admin dashboard provides comprehensive analytics for all URLs
- Real-time updates show live click data

## API Endpoints

### POST /api/shorten
Create a new short URL
\`\`\`json
{
  "url": "https://example.com/very/long/url"
}
\`\`\`

### GET /api/redirect/[shortCode]
Redirect to original URL and track analytics

### GET /api/analytics/[shortCode]
Get analytics data for a short URL

### POST /api/auth/validate
Validate admin JWT token

## Database Structure

### Collections

- **urls**: Main collection for shortened URLs
  - `shortCode`: Unique identifier
  - `originalUrl`: Original long URL
  - `createdAt`: Creation timestamp
  - `totalClicks`: Total click count
  - `clicks`: Subcollection of individual clicks

- **admins**: Admin users
  - `email`: Admin email
  - `password`: Hashed password
  - `createdAt`: Account creation date

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/url-shortener-firestore/issues) on GitHub.

## Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Firebase](https://firebase.google.com/) for the backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
