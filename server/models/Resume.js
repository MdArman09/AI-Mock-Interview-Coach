import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    fileName: String,
    label: {
      type: String,
      trim: true,
      default: '',
    },
    level: {
      type: String,
      enum: ['fresher', 'junior', 'mid', 'senior'],
      default: 'fresher',
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    plannedQuestionCount: {
      type: Number,
      default: 0,
    },
    questionsGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for user resume listing and ordering
resumeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Resume', resumeSchema);
