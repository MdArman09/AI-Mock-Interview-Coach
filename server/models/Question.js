import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['Behavioral', 'Technical-lite', 'Situational', 'Leadership', 'Resume'],
      default: 'Behavioral',
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Basic', 'Intermediate', 'Advanced', 'Easy', 'Medium', 'Hard'],
      default: 'Intermediate',
    },
    source: {
      type: String,
      enum: ['bank', 'resume-generated'],
      default: 'bank',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'Background',
        'Project',
        'Experience',
        'Technical',
        'Behavioral',
        'Scenario',
        'Leadership',
        'Growth',
      ],
      default: 'Behavioral',
      index: true,
    },
    anchor: {
      type: String,
      default: '',
    },
    sampleAnswer: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user resume-generated question queries
questionSchema.index({ userId: 1, resumeId: 1 });

export const Question = mongoose.model('Question', questionSchema);
export default Question;
