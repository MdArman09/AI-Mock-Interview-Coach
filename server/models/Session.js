import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
  {
    starStructure: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    clarity: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    fillerWordCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    fillerScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 10,
    },
    overall: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false }
);

const starComponentSchema = new mongoose.Schema(
  {
    present: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    evidence: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const starBreakdownSchema = new mongoose.Schema(
  {
    situation: {
      type: starComponentSchema,
      default: () => ({}),
    },
    task: {
      type: starComponentSchema,
      default: () => ({}),
    },
    action: {
      type: starComponentSchema,
      default: () => ({}),
    },
    result: {
      type: starComponentSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required to associate session'],
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: false,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
    },
    transcript: {
      type: String,
      required: [true, 'Transcript text is required'],
      trim: true,
    },
    audioDuration: {
      type: Number, // duration in seconds
      default: 0,
    },
    wpm: {
      type: Number, // words per minute pace
      default: 0,
    },
    scores: {
      type: scoreSchema,
      required: true,
      default: () => ({}),
    },
    suggestions: {
      type: [String],
      default: [],
    },
    starBreakdown: {
      type: starBreakdownSchema,
      default: () => ({}),
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    improvedOpening: {
      type: String,
      default: '',
    },
    isGibberishOrOffTopic: {
      type: Boolean,
      default: false,
    },
    modelAnswerType: {
      type: String,
      enum: ['restructure', 'exemplary_benchmark'],
      default: 'restructure',
    },
    questionSource: {
      type: String,
      enum: ['bank', 'resume'],
      default: 'bank',
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: false,
      default: null,
      index: true,
    },
    resumeLabel: {
      type: String,
      required: false,
      default: null,
    },
    difficulty: {
      type: String,
      required: false,
      default: null,
    },
    questionType: {
      type: String,
      required: false,
      default: null,
    },
    anchor: {
      type: String,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast user session history retrieval
sessionSchema.index({ userId: 1, createdAt: -1 });

export const Session = mongoose.model('Session', sessionSchema);
export default Session;
