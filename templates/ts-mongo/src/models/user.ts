import { model, Schema } from 'mongoose';

/**
 * Canonical mongoose schema for local-auth user records.
 *
 * Usage: keep validation rules and JWT payload fields aligned with this shape.
 * Expects user credential/profile fields and returns a schema ready for model
 * construction with auth-friendly defaults.
 */
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Reusable mongoose model for user-account persistence operations.
 *
 * Usage: import in controllers/services for user CRUD and auth lookups.
 * Expects the schema definition above and returns a compiled mongoose model.
 */
export default model('User', userSchema);
