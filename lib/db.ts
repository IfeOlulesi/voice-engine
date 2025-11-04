import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('Connected to MongoDB:', cached.conn.connection.db?.databaseName);
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

const postSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId() },
  original: { type: Object }, // {text, timestamp}
  variants: { type: Object }, // {x, ig, fb}
  scheduledAt: { type: [Date] }, // Array of timestamps
  status: { type: String, enum: ['queued', 'posted', 'failed'], default: 'queued' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

postSchema.pre('save', function(next) { 
  this.updatedAt = new Date(); 
  next(); 
});

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Firebase UID
  email: { type: String, required: true },
  name: { type: String },
  
  // Profile completion tracking
  profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
  onboardingCompleted: { type: Boolean, default: false },
  
  // Writing style preferences
  writingStyle: {
    tone: { type: String, enum: ['professional', 'casual', 'friendly', 'authoritative', 'conversational', 'humorous'], default: 'professional' },
    personality: { type: String, enum: ['enthusiastic', 'calm', 'witty', 'inspiring', 'analytical', 'storyteller'], default: 'calm' },
    formalityLevel: { type: String, enum: ['very-formal', 'formal', 'semi-formal', 'casual', 'very-casual'], default: 'semi-formal' },
    humorStyle: { type: String, enum: ['none', 'subtle', 'witty', 'playful', 'sarcastic'], default: 'subtle' }
  },
  
  // Brand voice and identity
  brandVoice: {
    adjectives: [{ type: String }], // e.g., ["innovative", "trustworthy", "bold"]
    values: [{ type: String }], // e.g., ["sustainability", "transparency", "excellence"]
    targetAudience: { type: String }, // e.g., "young professionals", "small business owners"
    industry: { type: String }, // e.g., "technology", "healthcare", "finance"
    brandType: { type: String, enum: ['personal', 'business', 'nonprofit', 'agency'], default: 'personal' }
  },
  
  // Content preferences
  contentPreferences: {
    topics: [{ type: String }], // e.g., ["AI", "entrepreneurship", "marketing"]
    contentPillars: [{ type: String }], // e.g., ["education", "inspiration", "behind-the-scenes"]
    preferredFormats: [{ type: String }], // e.g., ["tips", "stories", "questions", "quotes"]
    avoidTopics: [{ type: String }] // Topics to avoid
  },
  
  // Platform-specific styles
  platformStyles: {
    linkedin: {
      tone: { type: String },
      style: { type: String },
      hashtagStyle: { type: String, enum: ['minimal', 'moderate', 'heavy'], default: 'moderate' }
    },
    twitter: {
      tone: { type: String },
      style: { type: String },
      hashtagStyle: { type: String, enum: ['minimal', 'moderate', 'heavy'], default: 'moderate' }
    },
    instagram: {
      tone: { type: String },
      style: { type: String },
      hashtagStyle: { type: String, enum: ['minimal', 'moderate', 'heavy'], default: 'heavy' }
    },
    facebook: {
      tone: { type: String },
      style: { type: String },
      hashtagStyle: { type: String, enum: ['minimal', 'moderate', 'heavy'], default: 'minimal' }
    }
  },
  
  // Sample content for AI analysis
  sampleContent: {
    originalPosts: [{ type: String }], // User's original posts for style analysis
    analyzedPatterns: {
      averageLength: { type: Number },
      commonPhrases: [{ type: String }],
      sentenceStructure: { type: String },
      vocabularyLevel: { type: String, enum: ['simple', 'intermediate', 'advanced', 'expert'] },
      styleNotes: { type: String }
    }
  },
  
  // Learning and improvement tracking
  preferences: {
    feedbackData: [{
      generatedContent: { type: String },
      userEdit: { type: String },
      satisfaction: { type: Number, min: 1, max: 5 },
      timestamp: { type: Date, default: Date.now }
    }],
    styleConsistencyScore: { type: Number, default: 0 },
    lastAnalyzed: { type: Date }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function(next) { 
  this.updatedAt = new Date(); 
  next(); 
});

// Calculate profile completion percentage
userSchema.methods.calculateProfileCompletion = function() {
  let completion = 0;
  
  if (this.name) completion += 10;
  if (this.brandVoice.industry) completion += 15;
  if (this.brandVoice.targetAudience) completion += 15;
  if (this.writingStyle.tone !== 'professional') completion += 15;
  if (this.contentPreferences.topics.length > 0) completion += 15;
  if (this.brandVoice.adjectives.length > 0) completion += 10;
  if (this.sampleContent.originalPosts.length > 0) completion += 20;
  
  this.profileCompletion = completion;
  if (completion >= 80) {
    this.onboardingCompleted = true;
  }
  
  return completion;
};

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema, 'Users');

export { connectDB, Post, User };