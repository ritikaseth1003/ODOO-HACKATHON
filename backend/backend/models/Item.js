const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Tops', 'Dresses', 'Outerwear', 'Bottoms', 'Footwear', 'Accessories', 'Other']
  },
  size: {
    type: String,
    required: [true, 'Size is required'],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', 'One Size']
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['Excellent', 'Good', 'Fair', 'Poor']
  },
  points: {
    type: Number,
    required: [true, 'Points value is required'],
    min: [1, 'Points must be at least 1'],
    max: [1000, 'Points cannot exceed 1000']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    originalName: {
      type: String
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'available', 'swapped', 'removed'],
    default: 'pending'
  },
  swapType: {
    type: String,
    enum: ['direct', 'points', 'both'],
    default: 'both'
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  brand: {
    type: String,
    maxlength: [50, 'Brand cannot exceed 50 characters']
  },
  color: {
    type: String,
    maxlength: [30, 'Color cannot exceed 30 characters']
  },
  material: {
    type: String,
    maxlength: [50, 'Material cannot exceed 50 characters']
  },
  season: {
    type: String,
    enum: ['Spring', 'Summer', 'Fall', 'Winter', 'All Season']
  },
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Unisex', 'Kids']
  },
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    length: Number,
    shoulders: Number,
    sleeve: Number,
    inseam: Number
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  swapRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SwapRequest'
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: {
    type: Date
  },
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedReason: {
    type: String,
    maxlength: [200, 'Rejection reason cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
itemSchema.index({ status: 1, category: 1 });
itemSchema.index({ uploader: 1 });
itemSchema.index({ points: 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ isFeatured: 1 });
itemSchema.index({ tags: 1 });
itemSchema.index({ title: 'text', description: 'text' });

// Virtual for like count
itemSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for swap request count
itemSchema.virtual('swapRequestCount').get(function() {
  return this.swapRequests.length;
});

// Virtual for is liked by user
itemSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Virtual for is owned by user
itemSchema.methods.isOwnedBy = function(userId) {
  return this.uploader.toString() === userId.toString();
};

// Method to increment views
itemSchema.methods.incrementViews = async function() {
  this.views += 1;
  return await this.save();
};

// Method to toggle like
itemSchema.methods.toggleLike = async function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (existingLike) {
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  } else {
    this.likes.push({ user: userId });
  }
  
  return await this.save();
};

// Method to approve item
itemSchema.methods.approve = async function(adminId) {
  this.status = 'available';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  return await this.save();
};

// Method to reject item
itemSchema.methods.reject = async function(reason) {
  this.status = 'removed';
  this.rejectedReason = reason;
  return await this.save();
};

// Method to mark as swapped
itemSchema.methods.markAsSwapped = async function() {
  this.status = 'swapped';
  return await this.save();
};

// JSON transformation
itemSchema.methods.toJSON = function() {
  const itemObject = this.toObject();
  itemObject.likeCount = this.likeCount;
  itemObject.swapRequestCount = this.swapRequestCount;
  return itemObject;
};

module.exports = mongoose.model('Item', itemSchema); 