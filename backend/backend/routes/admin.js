const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Item = require('../models/Item');
const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authorization
router.use(protect, authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (admin)
router.get('/dashboard', async (req, res) => {
  try {
    // Get various statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const totalItems = await Item.countDocuments();
    const pendingItems = await Item.countDocuments({ status: 'pending' });
    const availableItems = await Item.countDocuments({ status: 'available' });
    const swappedItems = await Item.countDocuments({ status: 'swapped' });
    const totalSwaps = await SwapRequest.countDocuments();
    const pendingSwaps = await SwapRequest.countDocuments({ status: 'pending' });
    const completedSwaps = await SwapRequest.countDocuments({ status: 'completed' });

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    const recentItems = await Item.find()
      .populate('uploader', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt uploader');

    const recentSwaps = await SwapRequest.find()
      .populate('requester', 'name')
      .populate('itemOwner', 'name')
      .populate('item', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status createdAt requester itemOwner item');

    // Get category distribution
    const categoryStats = await Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get points distribution
    const pointsStats = await User.aggregate([
      { $group: { _id: null, avgPoints: { $avg: '$points' }, totalPoints: { $sum: '$points' } } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          users: {
            total: totalUsers,
            active: activeUsers,
            verified: verifiedUsers
          },
          items: {
            total: totalItems,
            pending: pendingItems,
            available: availableItems,
            swapped: swappedItems
          },
          swaps: {
            total: totalSwaps,
            pending: pendingSwaps,
            completed: completedSwaps
          },
          points: pointsStats[0] || { avgPoints: 0, totalPoints: 0 }
        },
        recentActivity: {
          users: recentUsers,
          items: recentItems,
          swaps: recentSwaps
        },
        categoryStats
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin dashboard',
      error: error.message
    });
  }
});

// @route   GET /api/admin/items
// @desc    Get items for moderation
// @access  Private (admin)
router.get('/items', [
  query('status')
    .optional()
    .isIn(['pending', 'available', 'swapped', 'removed'])
    .withMessage('Invalid status'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
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

    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find(filter)
      .populate('uploader', 'name email')
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
    console.error('Get admin items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get items',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/items/:id/approve
// @desc    Approve an item
// @access  Private (admin)
router.put('/items/:id/approve', [
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin notes cannot exceed 500 characters')
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

    const { adminNotes } = req.body;

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Approve the item
    await item.approve(req.user._id);

    // Add admin notes if provided
    if (adminNotes) {
      item.adminNotes = adminNotes;
      await item.save();
    }

    // Populate uploader info
    await item.populate('uploader', 'name email');

    res.json({
      success: true,
      message: 'Item approved successfully',
      data: { item }
    });
  } catch (error) {
    console.error('Approve item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve item',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/items/:id/reject
// @desc    Reject an item
// @access  Private (admin)
router.put('/items/:id/reject', [
  body('reason')
    .notEmpty()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Rejection reason is required and cannot exceed 200 characters')
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

    const { reason } = req.body;

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Reject the item
    await item.reject(reason);

    // Populate uploader info
    await item.populate('uploader', 'name email');

    res.json({
      success: true,
      message: 'Item rejected successfully',
      data: { item }
    });
  } catch (error) {
    console.error('Reject item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject item',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/items/:id
// @desc    Delete an item (admin)
// @access  Private (admin)
router.delete('/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Delete the item
    await Item.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get users for admin management
// @access  Private (admin)
router.get('/users', [
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status'),
  query('verified')
    .optional()
    .isBoolean()
    .withMessage('Verified must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
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

    const { status, verified, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (verified !== undefined) filter.isVerified = verified === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
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
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/feature
// @desc    Feature a user's item
// @access  Private (admin)
router.put('/users/:id/feature', [
  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Duration must be between 1 and 30 days')
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

    const { itemId, duration = 7 } = req.body;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if item belongs to the user
    if (item.uploader.toString() !== req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Item does not belong to this user'
      });
    }

    // Feature the item
    item.isFeatured = true;
    item.featuredUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    await item.save();

    res.json({
      success: true,
      message: `Item featured for ${duration} days`,
      data: { item }
    });
  } catch (error) {
    console.error('Feature item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to feature item',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/unfeature
// @desc    Unfeature a user's item
// @access  Private (admin)
router.put('/users/:id/unfeature', [
  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
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

    const { itemId } = req.body;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if item belongs to the user
    if (item.uploader.toString() !== req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Item does not belong to this user'
      });
    }

    // Unfeature the item
    item.isFeatured = false;
    item.featuredUntil = null;
    await item.save();

    res.json({
      success: true,
      message: 'Item unfeatured successfully',
      data: { item }
    });
  } catch (error) {
    console.error('Unfeature item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfeature item',
      error: error.message
    });
  }
});

// @route   GET /api/admin/reports
// @desc    Get reports and analytics
// @access  Private (admin)
router.get('/reports', [
  query('type')
    .optional()
    .isIn(['users', 'items', 'swaps', 'points'])
    .withMessage('Invalid report type'),
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Invalid period')
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

    const { type, period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    let reportData = {};

    if (!type || type === 'users') {
      const newUsers = await User.countDocuments({
        createdAt: { $gte: startDate }
      });
      const activeUsers = await User.countDocuments({
        lastLogin: { $gte: startDate }
      });

      reportData.users = {
        newUsers,
        activeUsers,
        totalUsers: await User.countDocuments()
      };
    }

    if (!type || type === 'items') {
      const newItems = await Item.countDocuments({
        createdAt: { $gte: startDate }
      });
      const swappedItems = await Item.countDocuments({
        status: 'swapped',
        updatedAt: { $gte: startDate }
      });

      reportData.items = {
        newItems,
        swappedItems,
        totalItems: await Item.countDocuments()
      };
    }

    if (!type || type === 'swaps') {
      const newSwaps = await SwapRequest.countDocuments({
        createdAt: { $gte: startDate }
      });
      const completedSwaps = await SwapRequest.countDocuments({
        status: 'completed',
        completedAt: { $gte: startDate }
      });

      reportData.swaps = {
        newSwaps,
        completedSwaps,
        totalSwaps: await SwapRequest.countDocuments()
      };
    }

    if (!type || type === 'points') {
      const pointsStats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalPoints: { $sum: '$points' },
            avgPoints: { $avg: '$points' },
            maxPoints: { $max: '$points' },
            minPoints: { $min: '$points' }
          }
        }
      ]);

      reportData.points = pointsStats[0] || {
        totalPoints: 0,
        avgPoints: 0,
        maxPoints: 0,
        minPoints: 0
      };
    }

    res.json({
      success: true,
      data: {
        period,
        reportData
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports',
      error: error.message
    });
  }
});

module.exports = router; 