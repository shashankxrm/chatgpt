To ensure consistency, maintainable code, and efficient collaboration, your submission must
strictly follow these mandatory technical guidelines. Submissions that do not meet these
standards will not be approved or considered.
Developer Guidelines (Must Read)
Develop a pixel-perfect Ul/OX clone of ChatGPT, using the Vercel Al SDK for responses,
equipped with advanced capabilities including chat memory, image/file upload support,
message editing, long-context handling, and more. The final product must demonstrate
engineering excellence, complete user experience parity with ChatGPT, and seamless
backend integration.
• Functional Requirements
• Core Chat Interface (UI/UX)
• Match ChatGPT Ul exactly — replicate layout, spacing, fonts, animations, scrolling
behavior, modals, etc.
• Ensure full mobile responsiveness and accessibility (ARIA-compliant).
• Edit Message: User must be able to edit previously submitted messages with
seamless regeneration behavior.
Chat Functionality (Vercel Al SDK)
• Integrate Vercel AI SDK for handling chat responses.
• Include context window handling logic: segment or trim historical messages for
models with limited context size.
• Implement message streaming with graceful Ul updates.
Memory / Conversation Context
• Add memory capability (using memo)
• File & Image Upload Support
• Support uploading:
• Images (PNG, JPG, etc.)
• Documents (PDF, DOCX, TXT, etc.)
Backend Specifications
* API Architecture
• Next.js backend.
•
Token limits managed per model constraints (e.g., GPT-4-turbo context window).
File Storage
• Use Cloudinary or Uploadcare for secure storage.
• Webhook Support
• Support for external service callbacks (e.g., background processors or file
transformation triggers).
• Deliverables Checklist
•
•
V Pixel-perfect ChatGPT clone Ul
• Fully functional chat using Vercel AI SDK.
Chat memory, file/image upload, message editing.
Backend with MongoDB, Cloudinary integration.
Deployed on Vercel.
• Complete README and environment setup.
V Well-documented, maintainable, modular codebase.