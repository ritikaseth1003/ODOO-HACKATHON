const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  swapType: {
    type: String,
    enum: ['direct', 'points'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  offeredItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  offeredPoints: {
    type: Number,
    min: [0, 'Offered points cannot be negative']
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  responseMessage: {
    type: String,
    maxlength: [500, 'Response message cannot exceed 500 characters']
  },
  meetingLocation: {
    type: String,
    maxlength: [200, 'Meeting location cannot exceed 200 characters']
  },
  meetingDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  pointsTransferred: {
    type: Boolean,
    default: false
  },
  transferAmount: {
    type: Number,
    min: [0, 'Transfer amount cannot be negative']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
swapRequestSchema.index({ requester: 1, status: 1 });
swapRequestSchema.index({ itemOwner: 1, status: 1 });
swapRequestSchema.index({ item: 1 });
swapRequestSchema.index({ createdAt: -1 });
swapRequestSchema.index({ status: 1 });

// Virtual for is expired (pending requests older than 7 days)
swapRequestSchema.virtual('isExpired').get(function() {
  if (this.status !== 'pending') return false;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.createdAt < sevenDaysAgo;
});

// Virtual for can be cancelled
swapRequestSchema.virtual('canBeCancelled').get(function() {
  return this.status === 'pending' && !this.isExpired;
});

// Method to accept swap request
swapRequestSchema.methods.accept = async function(responseMessage) {
  this.status = 'accepted';
  this.responseMessage = responseMessage;
  
  // If it's a points swap, transfer points immediately
  if (this.swapType === 'points' && this.offeredPoints > 0) {
    const User = require('./User');
    const requester = await User.findById(this.requester);
    const itemOwner = await User.findById(this.itemOwner);
    
    if (requester.points >= this.offeredPoints) {
      await requester.spendPoints(this.offeredPoints);
      await itemOwner.addPoints(this.offeredPoints);
      this.pointsTransferred = true;
      this.transferAmount = this.offeredPoints;
    } else {
      throw new Error('Insufficient points for swap');
    }
  }
  
  return await this.save();
};

// Method to reject swap request
swapRequestSchema.methods.reject = async function(responseMessage) {
  this.status = 'rejected';
  this.responseMessage = responseMessage;
  return await this.save();
};

// Method to complete swap
swapRequestSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  
  // Update user stats
  const User = require('./User');
  const requester = await User.findById(this.requester);
  const itemOwner = await User.findById(this.itemOwner);
  
  await requester.incrementSwapsCompleted();
  await itemOwner.incrementSwapsCompleted();
  
  // Mark items as swapped
  const Item = require('./Item');
  const item = await Item.findById(this.item);
  await item.markAsSwapped();
  
  if (this.offeredItem) {
    const offeredItem = await Item.findById(this.offeredItem);
    await offeredItem.markAsSwapped();
  }
  
  return await this.save();
};

// Method to cancel swap request
swapRequestSchema.methods.cancel = async function(userId, reason) {
  this.status = 'cancelled';
  this.cancelledBy = userId;
  this.cancelledReason = reason;
  
  // If points were transferred, reverse the transaction
  if (this.pointsTransferred && this.transferAmount > 0) {
    const User = require('./User');
    const requester = await User.findById(this.requester);
    const itemOwner = await User.findById(this.itemOwner);
    
    await requester.addPoints(this.transferAmount);
    await itemOwner.spendPoints(this.transferAmount);
    this.pointsTransferred = false;
  }
  
  return await this.save();
};

// Method to mark as read
swapRequestSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Pre-save middleware to validate swap request
swapRequestSchema.pre('save', function(next) {
  // Validate that either offeredItem or offeredPoints is provided
  if (!this.offeredItem && (!this.offeredPoints || this.offeredPoints === 0)) {
    return next(new Error('Either an offered item or points must be provided'));
  }
  
  // Validate that requester and itemOwner are different
  if (this.requester.toString() === this.itemOwner.toString()) {
    return next(new Error('Cannot request swap for your own item'));
  }
  
  next();
});

// JSON transformation
swapRequestSchema.methods.toJSON = function() {
  const swapObject = this.toObject();
  swapObject.isExpired = this.isExpired;
  swapObject.canBeCancelled = this.canBeCancelled;
  return swapObject;
};

module.exports = mongoose.model('SwapRequest', swapRequestSchema); 