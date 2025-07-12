const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  points: {
    type: Number,
    default: 0, // Starting points for new users
    min: [0, 'Points cannot be negative']
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters']
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  preferences: {
    categories: [{
      type: String,
      enum: ['Tops', 'Dresses', 'Outerwear', 'Bottoms', 'Footwear', 'Accessories', 'Other']
    }],
    sizes: [{
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', 'One Size']
    }],
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  stats: {
    itemsListed: { type: Number, default: 0 },
    itemsSwapped: { type: Number, default: 0 },
    swapsCompleted: { type: Number, default: 0 },
    totalPointsEarned: { type: Number, default: 0 },
    totalPointsSpent: { type: Number, default: 0 },
    memberSince: { type: Date, default: Date.now }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ points: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add points method
userSchema.methods.addPoints = async function(points) {
  this.points += points;
  this.stats.totalPointsEarned += points;
  return await this.save();
};

// Spend points method
userSchema.methods.spendPoints = async function(points) {
  if (this.points < points) {
    throw new Error('Insufficient points');
  }
  this.points -= points;
  this.stats.totalPointsSpent += points;
  return await this.save();
};

// Update stats methods
userSchema.methods.incrementItemsListed = async function() {
  this.stats.itemsListed += 1;
  return await this.save();
};

userSchema.methods.incrementItemsSwapped = async function() {
  this.stats.itemsSwapped += 1;
  return await this.save();
};

userSchema.methods.incrementSwapsCompleted = async function() {
  this.stats.swapsCompleted += 1;
  return await this.save();
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for member duration
userSchema.virtual('memberDuration').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.stats.memberSince);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// JSON transformation
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema); 