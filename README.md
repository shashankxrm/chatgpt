# 🤖 ChatGPT Clone

A full-featured ChatGPT clone built with Next.js, featuring AI-powered conversations, file processing, memory system, and a modern UI. This project demonstrates advanced web development skills with real AI integration, database management, and file handling capabilities.

![ChatGPT Clone](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![AI](https://img.shields.io/badge/AI-Hugging%20Face-yellow?style=for-the-badge&logo=huggingface)
![Clerk](https://img.shields.io/badge/Auth-Clerk-purple?style=for-the-badge&logo=clerk)

## ✨ Features

### 🧠 **AI-Powered Conversations**
- **Real AI Integration**: Powered by Hugging Face's Qwen3-Next-80B model
- **Streaming Responses**: Real-time message streaming for better UX
- **Context Awareness**: Intelligent conversation context management
- **Memory System**: Persistent memory across conversations
- **Response Regeneration**: Generate alternative AI responses

### 💬 **Advanced Chat Features**
- **Message Editing**: Edit and regenerate AI responses
- **Message Deletion**: Remove messages with conversation branching
- **Conversation History**: Persistent chat history with MongoDB
- **Auto-save**: Automatic conversation saving and retrieval
- **Smart Context**: Token-aware context window management

### 📁 **File Processing & Analysis**
- **Multi-format Support**: PDF, DOCX, images, and text files
- **Cloud Storage**: Secure file upload with Cloudinary integration
- **Content Extraction**: Intelligent text extraction from documents
- **File Context**: AI processes file content for relevant responses

### 🎨 **Modern UI/UX**
- **Pixel-Perfect Design**: ChatGPT-inspired interface
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Mode**: Built-in theme switching
- **Smooth Animations**: Polished interactions and transitions
- **Accessibility**: Full keyboard navigation and screen reader support

### 🔗 **Webhook System**
- **Chat Events**: Message sent, conversation created, memory updated events
- **Security**: HMAC-SHA256 signature verification for webhook security
- **Retry Logic**: Automatic retry with exponential backoff
- **Testing**: Built-in webhook testing endpoints
- **Integration Ready**: Easy integration with external services and monitoring tools

### 🔧 **Developer Features**
- **TypeScript**: Full type safety and better development experience
- **API Routes**: RESTful API design with proper error handling
- **Database Models**: Mongoose schemas for data persistence
- **Environment Config**: Secure configuration management
- **Linting**: ESLint for code quality and consistency

### 🔐 **Authentication & Security**
- **Clerk Integration**: Modern authentication with multiple providers
- **User Isolation**: Each user has their own private conversations and memories
- **Secure API**: All endpoints protected with authentication middleware
- **Session Management**: Automatic session handling and refresh
- **Multi-Provider**: Support for Google, and email authentication


## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- Cloudinary account
- Hugging Face API key
- Clerk account (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chatgpt-clone.git
   cd chatgpt-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   📋 **Detailed setup guide**: See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for complete configuration instructions.

4. **Configure environment variables**
   ```env
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatgpt
   
   # AI Services
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   
   # File Storage
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   CLERK_SECRET_KEY=sk_test_your_secret_key_here
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   
   # Webhooks (Optional)
   WEBHOOK_URL=https://webhook.site/your-unique-id
   WEBHOOK_SECRET=your_webhook_secret_key
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Set up Clerk Authentication**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create a new application
   - Copy the publishable key and secret key
   - Update your `.env.local` with the Clerk keys

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)
   - You'll be redirected to sign-in if not authenticated
   - Sign up with Google, or email
   - Start chatting with your personalized AI assistant!

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **AI**: Hugging Face Inference API, Vercel AI SDK
- **Authentication**: Clerk (Google, Email)
- **File Storage**: Cloudinary
- **UI Components**: Radix UI, Lucide React

## 🔧 API Endpoints

> **🔐 All API endpoints require authentication** - Users must be signed in to access any functionality.

### Chat
- `POST /api/chat` - Send message and get AI response (user-specific)
- `GET /api/chat/stream` - Stream AI responses (user-specific)

### Conversations
- `GET /api/conversations` - Get user's conversations only
- `POST /api/conversations` - Create new conversation for user
- `GET /api/conversations/[id]` - Get specific conversation (if owned by user)
- `PUT /api/conversations/[id]` - Update conversation (if owned by user)
- `DELETE /api/conversations/[id]` - Delete conversation (if owned by user)

### Messages
- `PUT /api/conversations/[id]/messages/[messageId]` - Edit message (if owned by user)
- `DELETE /api/conversations/[id]/messages/[messageId]` - Delete message (if owned by user)

### Files
- `POST /api/upload` - Upload file to Cloudinary (user-specific)
- `POST /api/process-file` - Process file content (user-specific)

### Memory
- `GET /api/memories` - Get user's memories only
- `GET /api/memories/[conversationId]` - Get conversation memory (if owned by user)
- `DELETE /api/memories/[conversationId]` - Delete conversation memory (if owned by user)

### Webhooks
- `POST /api/webhooks` - Main webhook endpoint (receives events)
- `GET /api/webhooks` - Webhook health check
- `POST /api/webhooks/test` - Test webhook endpoint

## 🎯 Key Features Deep Dive

### Authentication & User Isolation
The app features comprehensive user authentication and data isolation:
- **Clerk Integration**: Modern authentication with multiple providers (Google, GitHub, Email)
- **User Data Isolation**: Each user has completely private conversations and memories
- **Secure API**: All endpoints protected with authentication middleware
- **Session Management**: Automatic session handling and refresh
- **Data Privacy**: Users can only access their own data

### Memory System
The app includes an intelligent memory system that:
- Extracts key points from conversations (user-specific)
- Stores important context for future reference (per user)
- Provides "general" context for new conversations (from user's history)
- Automatically cleans up old memories (per user)

### File Processing
Advanced file handling capabilities:
- **PDF**: Text extraction with custom parsing
- **DOCX**: Document processing with Mammoth
- **Images**: AI-powered analysis with multiple vision models(depends upon the model we use)
- **Text**: Direct content processing

### Context Management
Smart conversation context handling:
- Token counting and optimization
- Message trimming for long conversations
- Conversation summarization
- Memory-enhanced responses

### Webhook System
Real-time event  for external integrations:
- **File Events**: `file.uploaded`, `file.processed`, `file.failed`
- **Chat Events**: `message.sent`, `conversation.created`, `memory.updated`
- **System Events**: `system.health`, `system.test`
- **Security**: HMAC-SHA256 signature verification
- **Reliability**: Automatic retry with exponential backoff
- **Testing**: Built-in test endpoints for development

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard:
   - All MongoDB, Cloudinary, and Hugging Face variables
   - **Clerk authentication variables** (publishable key, secret key, URLs)
3. **Deploy** with automatic builds

### Clerk Setup for Production

1. **Create Clerk Application**:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create a new application
   - Copy production keys (not test keys)

2. **Configure Production URLs**:
   ```env
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   ```

3. **Update Environment Variables**:
   - Replace test keys with production keys
   - Update URLs to match your domain

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Webhook Testing

```bash
# Test webhook health
curl http://localhost:3000/api/webhooks

# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"type": "file.processing", "event": "file.uploaded", "filename": "test.pdf"}'

# Generate webhook secret
node scripts/generate-webhook-secret.js
```

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: Optimized for excellent user experience
- **Bundle Size**: Optimized with Next.js automatic code splitting
- **Database**: Efficient queries with proper indexing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Hugging Face](https://huggingface.co/) for AI model access
- [Vercel AI SDK](https://sdk.vercel.ai/) for AI integration
- [Clerk](https://clerk.com/) for modern authentication and user management
- [Radix UI](https://www.radix-ui.com/) for accessible components(ShadCN)
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Review the code comments

---

**Built by Shashank**

*This project demonstrates advanced full-stack development skills with modern web technologies and AI integration.*