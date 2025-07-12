const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Item = require('../models/Item');
const SwapRequest = require('../models/SwapRequest');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Bio cannot exceed 200 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('preferences.categories')
    .optional()
    .isArray({ max: 7 })
    .withMessage('Maximum 7 categories allowed'),
  body('preferences.sizes')
    .optional()
    .isArray({ max: 17 })
    .withMessage('Maximum 17 sizes allowed')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, bio, location, preferences } = req.body;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name || req.user.name,
        bio: bio !== undefined ? bio : req.user.bio,
        location: location !== undefined ? location : req.user.location,
        preferences: preferences || req.user.preferences
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
});

// @route   GET /api/users/:id/items
// @desc    Get items by user ID
// @access  Public
router.get('/:id/items', async (req, res) => {
  try {
    const { page = 1, limit = 12, status = 'available' } = req.query;
    const filter = { uploader: req.params.id };

    if (status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find(filter)
      .populate('uploader', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user items',
      error: error.message
    });
  }
});

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Public
router.get('/:id/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('stats points');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional stats
    const itemsListed = await Item.countDocuments({ uploader: req.params.id });
    const itemsSwapped = await Item.countDocuments({ 
      uploader: req.params.id, 
      status: 'swapped' 
    });
    const swapRequestsSent = await SwapRequest.countDocuments({ 
      requester: req.params.id 
    });
    const swapRequestsReceived = await SwapRequest.countDocuments({ 
      itemOwner: req.params.id 
    });

    const stats = {
      ...user.stats.toObject(),
      currentPoints: user.points,
      itemsListed,
      itemsSwapped,
      swapRequestsSent,
      swapRequestsReceived
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: error.message
    });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get user leaderboard
// @access  Public
router.get('/leaderboard/points', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const users = await User.find({ isActive: true })
      .select('name avatar points stats')
      .sort({ points: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message
    });
  }
});

// @route   GET /api/users/leaderboard/swaps
// @desc    Get swap leaderboard
// @access  Public
router.get('/leaderboard/swaps', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const users = await User.find({ isActive: true })
      .select('name avatar stats')
      .sort({ 'stats.swapsCompleted': -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get swap leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get swap leaderboard',
      error: error.message
    });
  }
});

// @route   POST /api/users/points/add
// @desc    Add points to user (admin only)
// @access  Private (admin)
router.post('/points/add', protect, authorize('admin'), [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('points')
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId, points, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add points
    await user.addPoints(points);

    res.json({
      success: true,
      message: `Added ${points} points to user`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          points: user.points
        },
        reason
      }
    });
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add points',
      error: error.message
    });
  }
});

// @route   POST /api/users/points/deduct
// @desc    Deduct points from user (admin only)
// @access  Private (admin)
router.post('/points/deduct', protect, authorize('admin'), [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('points')
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId, points, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Deduct points
    await user.spendPoints(points);

    res.json({
      success: true,
      message: `Deducted ${points} points from user`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          points: user.points
        },
        reason
      }
    });
  } catch (error) {
    console.error('Deduct points error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deduct points',
      error: error.message
    });
  }
});

// @route   PUT /api/users/:id/verify
// @desc    Verify user (admin only)
// @access  Private (admin)
router.put('/:id/verify', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User verified successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify user',
      error: error.message
    });
  }
});

// @route   PUT /api/users/:id/deactivate
// @desc    Deactivate user (admin only)
// @access  Private (admin)
router.put('/:id/deactivate', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error.message
    });
  }
});

// @route   PUT /api/users/:id/activate
// @desc    Activate user (admin only)
// @access  Private (admin)
router.put('/:id/activate', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User activated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: error.message
    });
  }
});

module.exports = router; 