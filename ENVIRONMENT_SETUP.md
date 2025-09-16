# 🔧 Environment Variables Setup Guide

## **Required Environment Variables**

Create a `.env.local` file in your project root with the following variables:

### **1. Database Configuration**
```env
# MongoDB Atlas connection string
# Get this from: https://cloud.mongodb.com/
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatgpt
```

**How to get MongoDB URI:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account
3. Create a new cluster
4. Go to "Database Access" → "Add New Database User"
5. Go to "Network Access" → "Add IP Address" (0.0.0.0/0 for all IPs)
6. Go to "Database" → "Connect" → "Connect your application"
7. Copy the connection string and replace `<password>` with your user password

### **2. AI API Configuration**
```env
# Hugging Face API Key for AI models
# Get this from: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=hf_your_huggingface_api_key_here
```

**How to get Hugging Face API Key:**
1. Go to [Hugging Face](https://huggingface.co/)
2. Create a free account
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions
5. Copy the token (starts with `hf_`)

### **3. File Storage Configuration**
```env
# Cloudinary configuration for file uploads
# Get these from: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**How to get Cloudinary credentials:**
1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Go to Dashboard
4. Copy the "Cloud Name", "API Key", and "API Secret"

### **4. Authentication Configuration**
```env
# Clerk authentication keys
# Get these from: https://dashboard.clerk.com/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here


# Clerk URLs (for development)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

**How to get Clerk credentials:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Go to "API Keys" in the sidebar
4. Copy the "Publishable key" and "Secret key"
5. For development, use the test keys (they start with `pk_test_` and `sk_test_`)

### **5. Webhook Configuration (Optional)**
```env
# Webhook URL to receive events (optional)
# For testing: https://webhook.site/your-unique-id
# For production: https://your-domain.com/webhook
WEBHOOK_URL=https://webhook.site/your-unique-id

# Webhook secret for signature verification (optional)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
WEBHOOK_SECRET=your_webhook_secret_key_here
```

**How to set up webhooks:**

#### **Option A: Testing with Webhook.site (Recommended)**
1. Go to [webhook.site](https://webhook.site/)
2. Copy the unique URL (e.g., `https://webhook.site/abc123-def456`)
3. Use this as your `WEBHOOK_URL`
4. You can see all incoming webhooks in real-time

#### **Option B: Generate Webhook Secret**
```bash
# Run this command to generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### **Option C: Local Testing with ngrok**
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Use the ngrok URL as your webhook endpoint
```

## **Complete .env.local Example**

```env
# Database
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/chatgpt

# AI API
HUGGINGFACE_API_KEY=hf_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# File Storage
CLOUDINARY_CLOUD_NAME=my-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
CLERK_SECRET_KEY=sk_test_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Webhooks (Optional)
WEBHOOK_URL=https://webhook.site/abc123-def456-ghi789
WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Development
NODE_ENV=development
```

## **Verification**

After setting up your `.env.local` file, test the configuration:

```bash
# Start the development server
npm run dev

# Test webhook endpoint
curl http://localhost:3000/api/webhooks

# Test file upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.pdf" \
  -F "type=application/pdf"
```

## **Security Notes**

- ✅ Never commit `.env.local` to version control
- ✅ Use strong, unique passwords for all services
- ✅ Rotate API keys regularly
- ✅ Use environment-specific configurations for production
- ✅ Consider using a secrets management service for production

## **Troubleshooting**

### **Common Issues:**

1. **"MongoDB connection failed"**
   - Check your MongoDB URI format
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Verify your username/password

2. **"Hugging Face API error"**
   - Check your API key is correct
   - Ensure you have sufficient credits/quota
   - Verify the key has read permissions

3. **"Cloudinary upload failed"**
   - Check your Cloudinary credentials
   - Verify your cloud name is correct
   - Ensure you have sufficient storage quota

4. **"Webhook not working"**
   - Check your webhook URL is accessible
   - Verify the webhook secret matches
   - Check the webhook endpoint is responding

## **Production Deployment**

For production deployment on Vercel:

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add all the required environment variables
4. Set `NODE_ENV=production`
5. Redeploy your application

---

**Need help?** Check the logs in your terminal or browser console for specific error messages.
