import mongoose, { Document, Schema } from 'mongoose';

export interface IMemoryItem {
  key: string;
  value: string;
  importance: number; // 1-10 scale
  createdAt: Date;
}

export interface IMemory extends Document {
  _id: string;
  conversationId: string;
  summary: string;
  keyPoints: IMemoryItem[];
  totalTokens: number;
  lastUpdated: Date;
  version: number;
}

const MemoryItemSchema = new Schema<IMemoryItem>({
  key: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  importance: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const MemorySchema = new Schema<IMemory>({
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  summary: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  keyPoints: [MemoryItemSchema],
  totalTokens: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  collection: 'memories'
});

// Indexes for efficient queries
MemorySchema.index({ conversationId: 1 });
MemorySchema.index({ lastUpdated: -1 });

// Pre-save middleware to update version and timestamp
MemorySchema.pre('save', function(next) {
  if (!this.isNew) {
    this.version += 1;
    this.lastUpdated = new Date();
  }
  next();
});

// Method to add key point
MemorySchema.methods.addKeyPoint = function(key: string, value: string, importance: number = 5) {
  this.keyPoints.push({
    key,
    value,
    importance,
    createdAt: new Date()
  });
  
  // Keep only top 20 most important key points
  if (this.keyPoints.length > 20) {
    this.keyPoints.sort((a, b) => b.importance - a.importance);
    this.keyPoints = this.keyPoints.slice(0, 20);
  }
};

// Method to get context for AI
MemorySchema.methods.getContext = function(): string {
  const importantPoints = this.keyPoints
    .filter(point => point.importance >= 7)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10);
  
  let context = `Conversation Summary: ${this.summary}\n\n`;
  
  if (importantPoints.length > 0) {
    context += 'Key Context:\n';
    importantPoints.forEach(point => {
      context += `- ${point.key}: ${point.value}\n`;
    });
  }
  
  return context;
};

const Memory = mongoose.models.Memory || mongoose.model<IMemory>('Memory', MemorySchema);

export default Memory;
