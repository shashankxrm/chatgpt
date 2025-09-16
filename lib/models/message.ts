import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  cloudinaryId?: string;
}

export interface IMessage extends Document {
  _id: string;
  userId: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: IAttachedFile[];
  timestamp: Date;
  tokenCount?: number;
  aiModel?: string;
  isEdited?: boolean;
  editedAt?: Date;
}

const AttachedFileSchema = new Schema<IAttachedFile>({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  cloudinaryId: {
    type: String,
    trim: true
  }
}, { _id: false });

const MessageSchema = new Schema<IMessage>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [AttachedFileSchema],
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokenCount: {
    type: Number,
    min: 0
  },
  aiModel: {
    type: String,
    trim: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  collection: 'messages'
});

// Indexes for efficient queries
// Compound index for user's messages in conversations sorted by timestamp
MessageSchema.index({ userId: 1, conversationId: 1, timestamp: 1 });
// Index for user's messages by role
MessageSchema.index({ userId: 1, role: 1 });

// Pre-save middleware to update conversation stats
MessageSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Conversation = mongoose.model('Conversation');
      await Conversation.findByIdAndUpdate(
        this.conversationId,
        {
          $inc: { messageCount: 1 },
          $set: { lastMessageAt: this.timestamp }
        }
      );
    } catch (error) {
      console.error('Error updating conversation stats:', error);
    }
  }
  next();
});

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
