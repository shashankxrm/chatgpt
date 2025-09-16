import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  _id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessageAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    default: 'New conversation'
  },
  messageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'conversations'
});

// Indexes for better query performance
ConversationSchema.index({ userId: 1, updatedAt: -1 });
ConversationSchema.index({ userId: 1, createdAt: -1 });

// Virtual for getting messages count
ConversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId'
});

// Ensure virtual fields are serialized
ConversationSchema.set('toJSON', { virtuals: true });

const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
