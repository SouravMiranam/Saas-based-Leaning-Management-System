# Mentora - AI-Powered Educational Companion Platform

**Mentora** is an innovative educational platform that provides personalized AI companions for interactive learning experiences. Students can engage with subject-specific AI tutors through voice conversations, upload documents for analysis, and receive detailed assessments of their learning progress.

## 🚀 Features

### Core Functionality
- **AI Companions**: Subject-specific AI tutors (Math, Science, History, Language, etc.)
- **Voice Interactions**: Real-time voice conversations using VAPI integration
- **Document Analysis**: Upload PDFs and ask questions about the content
- **Assessment Reports**: Automated learning progress evaluation
- **Session History**: Track learning journey and past conversations
- **Transcript Downloads**: Export conversation transcripts as PDF

### Technical Highlights
- **Real-time Voice AI**: Powered by VAPI for natural conversations
- **Document Processing**: PDF text extraction and AI-powered Q&A
- **User Authentication**: Secure login with Clerk
- **Database**: Supabase for data persistence
- **Responsive Design**: Modern UI with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase
- **Voice AI**: VAPI SDK
- **Document AI**: OpenAI GPT-3.5-turbo
- **PDF Processing**: pdf-parse-new
- **Charts**: Chart.js
- **PDF Generation**: jsPDF

## 📋 Prerequisites

Before running this project, ensure you have:

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager
- Supabase account and project
- Clerk account for authentication
- VAPI account for voice AI
- OpenAI API key

## ⚙️ Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/vishaltewari/Saas-App.git
   cd Saas-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # VAPI (Voice AI)
   NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
   VAPI_PRIVATE_KEY=your_vapi_private_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Sentry (Optional - for error monitoring)
   SENTRY_AUTH_TOKEN=your_sentry_auth_token
   ```

## 🗄️ Database Setup

1. **Supabase Tables**
   
   Create the following tables in your Supabase project:

   **Companions Table:**
   ```sql
   CREATE TABLE companions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name VARCHAR NOT NULL,
     subject VARCHAR NOT NULL,
     topic VARCHAR NOT NULL,
     voice VARCHAR NOT NULL,
     style VARCHAR NOT NULL,
     duration INTEGER NOT NULL,
     author VARCHAR NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

   **Session History Table:**
   ```sql
   CREATE TABLE session_history (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     companion_id UUID REFERENCES companions(id),
     user_id VARCHAR NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **Row Level Security (RLS)**
   
   Enable RLS and create policies for secure data access based on user authentication.

## 🚀 Getting Started

1. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

2. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

3. **Sign up/Sign in**
   
   Create an account or sign in to access the platform features.

## 📖 Usage Guide

### Creating AI Companions
1. Navigate to `/companions/new`
2. Fill in companion details:
   - **Name**: Give your companion a name
   - **Subject**: Choose from available subjects
   - **Topic**: Specify the learning topic
   - **Voice**: Select voice type
   - **Style**: Choose teaching style
   - **Duration**: Set session duration

### Starting Learning Sessions
1. Go to `/companions` to browse available companions
2. Click on a companion to start a session
3. Upload a PDF document (optional) for document-based discussions
4. Click "Start Conversation" to begin voice interaction

### Document Analysis
1. Upload a PDF document during a session
2. Ask questions about the document content
3. The AI will analyze and answer based on the uploaded material

### Viewing Progress
1. Visit `/my-journey` to see your learning progress
2. Review session history and created companions
3. Download conversation transcripts for review

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── documents/     # Document upload & query APIs
│   │   └── sentry-example-api/ # Error monitoring
│   ├── companions/        # Companion management pages
│   ├── my-journey/        # User profile and progress
│   └── sign-in/          # Authentication pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── CompanionComponent.tsx # Main companion interface
│   ├── DocumentUpload.tsx     # PDF upload component
│   └── AssessmentReport.tsx   # Assessment visualization
├── lib/                  # Utility functions
│   ├── actions/          # Server actions
│   ├── supabase.ts      # Database client
│   └── vapi.sdk.ts      # Voice AI SDK
├── types/               # TypeScript type definitions
└── constants/           # Application constants
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents/upload` | POST | Upload and process PDF documents |
| `/api/documents/query` | POST | Query uploaded documents with AI |
| `/api/sentry-example-api` | GET | Error monitoring test endpoint |

## 🧪 Testing

Run the test suite:
```bash
npm run test
# or
yarn test
```

## 📦 Building for Production

```bash
npm run build
npm start
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Other Platforms
The app can be deployed on any platform that supports Next.js applications.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email your-email@domain.com or create an issue in the GitHub repository.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [VAPI Documentation](https://docs.vapi.ai)
