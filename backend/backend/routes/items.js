const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Item = require('../models/Item');
const User = require('../models/User');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// @route   POST /api/items
// @desc    Create a new item
// @access  Private
router.post('/', protect, upload.array('images', 5), (req, res, next) => {
  if (typeof req.body.tags === 'string') {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch (e) {
      req.body.tags = [];
    }
  }
  next();
}, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('category')
    .isIn(['Tops', 'Dresses', 'Outerwear', 'Bottoms', 'Footwear', 'Accessories', 'Other'])
    .withMessage('Invalid category'),
  body('size')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', 'One Size'])
    .withMessage('Invalid size'),
  body('condition')
    .isIn(['Excellent', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition'),
  body('points')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Points must be between 1 and 1000'),
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 tags allowed')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }
    const itemData = {
      ...req.body,
      uploader: req.user._id,
      images: req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        originalName: file.originalname
      })),
      tags: req.body.tags ? req.body.tags : []
    };
    const item = await Item.create(itemData);
    await req.user.incrementItemsListed();
    await item.populate('uploader', 'name email avatar');
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: { item }
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create item',
      error: error.message
    });
  }
});

// @route   GET /api/items
// @desc    Get all items with filtering and pagination
// @access  Public
router.get('/', optionalAuth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('category')
    .optional()
    .isIn(['Tops', 'Dresses', 'Outerwear', 'Bottoms', 'Footwear', 'Accessories', 'Other'])
    .withMessage('Invalid category'),
  query('size')
    .optional()
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', 'One Size'])
    .withMessage('Invalid size'),
  query('condition')
    .optional()
    .isIn(['Excellent', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition'),
  query('minPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min points must be a positive integer'),
  query('maxPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max points must be a positive integer'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'points-low', 'points-high', 'popular'])
    .withMessage('Invalid sort option')
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

    const {
      page = 1,
      limit = 12,
      search,
      category,
      size,
      condition,
      minPoints,
      maxPoints,
      sort = 'newest',
      featured
    } = req.query;

    // Build filter object
    const filter = { status: 'available' };

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) filter.category = category;
    if (size) filter.size = size;
    if (condition) filter.condition = condition;
    if (featured === 'true') filter.isFeatured = true;

    if (minPoints || maxPoints) {
      filter.points = {};
      if (minPoints) filter.points.$gte = parseInt(minPoints);
      if (maxPoints) filter.points.$lte = parseInt(maxPoints);
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'points-low':
        sortObj = { points: 1 };
        break;
      case 'points-high':
        sortObj = { points: -1 };
        break;
      case 'popular':
        sortObj = { views: -1 };
        break;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get items with pagination
    const items = await Item.find(filter)
      .populate('uploader', 'name avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Item.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          hasNextPage,
          hasPrevPage,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get items',
      error: error.message
    });
  }
});

// @route   GET /api/items/featured
// @desc    Get featured items
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const items = await Item.find({
      status: 'available',
      isFeatured: true,
      featuredUntil: { $gt: new Date() }
    })
    .populate('uploader', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(6);

    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    console.error('Get featured items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured items',
      error: error.message
    });
  }
});

// @route   GET /api/items/:id
// @desc    Get single item by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('uploader', 'name email avatar bio location stats')
      .populate('swapRequests');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Increment views if user is authenticated
    if (req.user) {
      await item.incrementViews();
    }

    // Check if current user liked the item
    if (req.user) {
      item.isLiked = item.isLikedBy(req.user._id);
    }

    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get item',
      error: error.message
    });
  }
});

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private (owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check ownership
    if (item.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item'
      });
    }

    // Only allow updates if item is not swapped
    if (item.status === 'swapped') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update swapped item'
      });
    }

    // Update item
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('uploader', 'name avatar');

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: { item: updatedItem }
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error.message
    });
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check ownership
    if (item.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item'
      });
    }

    // Delete images from Cloudinary
    const deletePromises = item.images.map(img => {
      return cloudinary.uploader.destroy(img.publicId);
    });

    await Promise.all(deletePromises);

    // Delete item
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

// @route   POST /api/items/:id/like
// @desc    Toggle like on item
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Toggle like
    await item.toggleLike(req.user._id);

    res.json({
      success: true,
      message: 'Like toggled successfully',
      data: {
        isLiked: item.isLikedBy(req.user._id),
        likeCount: item.likeCount
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message
    });
  }
});

// @route   GET /api/items/user/:userId
// @desc    Get items by user
// @access  Public
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12, status } = req.query;
    const filter = { uploader: req.params.userId };

    if (status) {
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

module.exports = router; 