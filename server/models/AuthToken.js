import mongoose from 'mongoose';

const authTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for authentication token'],
      index: true,
    },
    type: {
      type: String,
      enum: ['verify', 'reset'],
      required: [true, 'Token type is required'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    usedAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index to automatically purge expired tokens from MongoDB
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for querying active tokens and invalidating previous tokens
authTokenSchema.index({ userId: 1, type: 1, usedAt: 1 });

export const AuthToken = mongoose.model('AuthToken', authTokenSchema);
export default AuthToken;
