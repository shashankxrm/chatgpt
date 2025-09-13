# 🤖 ChatGPT Clone

A full-featured ChatGPT clone built with Next.js, featuring AI-powered conversations, file processing, memory system, and a modern UI. This project demonstrates advanced web development skills with real AI integration, database management, and file handling capabilities.

![ChatGPT Clone](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![AI](https://img.shields.io/badge/AI-Hugging%20Face-yellow?style=for-the-badge&logo=huggingface)

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
- **AI Vision Analysis**: Image captioning, object detection, and classification
- **Cloud Storage**: Secure file upload with Cloudinary integration
- **Content Extraction**: Intelligent text extraction from documents
- **File Context**: AI processes file content for relevant responses

### 🎨 **Modern UI/UX**
- **Pixel-Perfect Design**: ChatGPT-inspired interface
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Mode**: Built-in theme switching
- **Smooth Animations**: Polished interactions and transitions
- **Accessibility**: Full keyboard navigation and screen reader support

### 🔧 **Developer Features**
- **TypeScript**: Full type safety and better development experience
- **API Routes**: RESTful API design with proper error handling
- **Database Models**: Mongoose schemas for data persistence
- **Environment Config**: Secure configuration management
- **Linting**: ESLint for code quality and consistency

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- Cloudinary account
- Hugging Face API key

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
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **AI**: Hugging Face Inference API, Vercel AI SDK
- **File Storage**: Cloudinary
- **UI Components**: Radix UI, Lucide React

## 🔧 API Endpoints

### Chat
- `POST /api/chat` - Send message and get AI response
- `GET /api/chat/stream` - Stream AI responses

### Conversations
- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/[id]` - Get specific conversation
- `PUT /api/conversations/[id]` - Update conversation
- `DELETE /api/conversations/[id]` - Delete conversation

### Messages
- `PUT /api/conversations/[id]/messages/[messageId]` - Edit message
- `DELETE /api/conversations/[id]/messages/[messageId]` - Delete message

### Files
- `POST /api/upload` - Upload file to Cloudinary
- `POST /api/process-file` - Process file content

### Memory
- `GET /api/memories` - Get all memories
- `GET /api/memories/[conversationId]` - Get conversation memory
- `DELETE /api/memories/[conversationId]` - Delete conversation memory

## 🎯 Key Features Deep Dive

### Memory System
The app includes an intelligent memory system that:
- Extracts key points from conversations
- Stores important context for future reference
- Provides "general" context for new conversations
- Automatically cleans up old memories

### File Processing
Advanced file handling capabilities:
- **PDF**: Text extraction with custom parsing
- **DOCX**: Document processing with Mammoth
- **Images**: AI-powered analysis with multiple vision models
- **Text**: Direct content processing

### Context Management
Smart conversation context handling:
- Token counting and optimization
- Message trimming for long conversations
- Conversation summarization
- Memory-enhanced responses

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** with automatic builds

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



## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Hugging Face](https://huggingface.co/) for AI model access
- [Vercel AI SDK](https://sdk.vercel.ai/) for AI integration
- [Radix UI](https://www.radix-ui.com/) for accessible components(ShadCN)
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Review the code comments

---

**Built with Shashank**

*This project demonstrates advanced full-stack development skills with modern web technologies and AI integration.*