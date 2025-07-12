const express = require('express');
const { body, validationResult } = require('express-validator');
const SwapRequest = require('../models/SwapRequest');
const Item = require('../models/Item');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/swaps
// @desc    Create a swap request
// @access  Private
router.post('/', protect, [
  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required'),
  body('swapType')
    .isIn(['direct', 'points'])
    .withMessage('Invalid swap type'),
  body('offeredItemId')
    .optional()
    .notEmpty()
    .withMessage('Offered item ID cannot be empty if provided'),
  body('offeredPoints')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Offered points must be a positive integer'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
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

    const { itemId, swapType, offeredItemId, offeredPoints, message } = req.body;

    // Get the item being requested
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if item is available
    if (item.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Item is not available for swapping'
      });
    }

    // Check if user is requesting their own item
    if (item.uploader.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request swap for your own item'
      });
    }

    // Validate swap type requirements
    if (swapType === 'direct' && !offeredItemId) {
      return res.status(400).json({
        success: false,
        message: 'Direct swap requires an offered item'
      });
    }

    if (swapType === 'points' && (!offeredPoints || offeredPoints <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Points swap requires offered points'
      });
    }

    // Check if user has enough points for points swap
    if (swapType === 'points' && req.user.points < offeredPoints) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points for this swap'
      });
    }

    // Validate offered item if provided
    let offeredItem = null;
    if (offeredItemId) {
      offeredItem = await Item.findById(offeredItemId);
      if (!offeredItem) {
        return res.status(404).json({
          success: false,
          message: 'Offered item not found'
        });
      }

      // Check if offered item belongs to requester
      if (offeredItem.uploader.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only offer your own items'
        });
      }

      // Check if offered item is available
      if (offeredItem.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'Offered item is not available'
        });
      }
    }

    // Check if there's already a pending swap request for this item by this user
    const existingRequest = await SwapRequest.findOne({
      item: itemId,
      requester: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending swap request for this item'
      });
    }

    // Create swap request
    const swapRequest = await SwapRequest.create({
      item: itemId,
      requester: req.user._id,
      itemOwner: item.uploader,
      swapType,
      offeredItem: offeredItemId,
      offeredPoints,
      message
    });

    // Add swap request to item
    item.swapRequests.push(swapRequest._id);
    await item.save();

    // Populate the swap request with details
    await swapRequest.populate([
      { path: 'item', select: 'title images points' },
      { path: 'requester', select: 'name avatar' },
      { path: 'itemOwner', select: 'name avatar' },
      { path: 'offeredItem', select: 'title images points' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Swap request created successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create swap request',
      error: error.message
    });
  }
});

// @route   GET /api/swaps/received
// @desc    Get swap requests received by user
// @access  Private
router.get('/received', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { itemOwner: req.user._id };

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const swapRequests = await SwapRequest.find(filter)
      .populate([
        { path: 'item', select: 'title images points category size condition' },
        { path: 'requester', select: 'name avatar email' },
        { path: 'offeredItem', select: 'title images points category size condition' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SwapRequest.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        swapRequests,
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
    console.error('Get received swaps error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get received swap requests',
      error: error.message
    });
  }
});

// @route   GET /api/swaps/sent
// @desc    Get swap requests sent by user
// @access  Private
router.get('/sent', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { requester: req.user._id };

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const swapRequests = await SwapRequest.find(filter)
      .populate([
        { path: 'item', select: 'title images points category size condition' },
        { path: 'itemOwner', select: 'name avatar email' },
        { path: 'offeredItem', select: 'title images points category size condition' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SwapRequest.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        swapRequests,
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
    console.error('Get sent swaps error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sent swap requests',
      error: error.message
    });
  }
});

// @route   GET /api/swaps/:id
// @desc    Get single swap request
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.id)
      .populate([
        { path: 'item', select: 'title images points category size condition uploader' },
        { path: 'requester', select: 'name avatar email' },
        { path: 'itemOwner', select: 'name avatar email' },
        { path: 'offeredItem', select: 'title images points category size condition' }
      ]);

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is authorized to view this swap request
    if (swapRequest.requester.toString() !== req.user._id.toString() &&
        swapRequest.itemOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this swap request'
      });
    }

    res.json({
      success: true,
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Get swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get swap request',
      error: error.message
    });
  }
});

// @route   PUT /api/swaps/:id/accept
// @desc    Accept a swap request
// @access  Private (item owner only)
router.put('/:id/accept', protect, [
  body('responseMessage')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Response message cannot exceed 500 characters')
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

    const { responseMessage } = req.body;

    const swapRequest = await SwapRequest.findById(req.params.id);
    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is the item owner
    if (swapRequest.itemOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this swap request'
      });
    }

    // Check if swap request is still pending
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Swap request is no longer pending'
      });
    }

    // Accept the swap request
    await swapRequest.accept(responseMessage);

    // Mark items as swapped
    const item = await Item.findById(swapRequest.item);
    await item.markAsSwapped();

    // Award points to the uploader (seller) when a swap is accepted
    const uploader = await User.findById(item.uploader);
    if (uploader && item.points) {
      await uploader.addPoints(item.points);
    }

    if (swapRequest.offeredItem) {
      const offeredItem = await Item.findById(swapRequest.offeredItem);
      await offeredItem.markAsSwapped();
    }

    // Populate the updated swap request
    await swapRequest.populate([
      { path: 'item', select: 'title images points' },
      { path: 'requester', select: 'name avatar email' },
      { path: 'itemOwner', select: 'name avatar email' },
      { path: 'offeredItem', select: 'title images points' }
    ]);

    res.json({
      success: true,
      message: 'Swap request accepted successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Accept swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept swap request',
      error: error.message
    });
  }
});

// @route   PUT /api/swaps/:id/reject
// @desc    Reject a swap request
// @access  Private (item owner only)
router.put('/:id/reject', protect, [
  body('responseMessage')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Response message cannot exceed 500 characters')
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

    const { responseMessage } = req.body;

    const swapRequest = await SwapRequest.findById(req.params.id);
    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is the item owner
    if (swapRequest.itemOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this swap request'
      });
    }

    // Check if swap request is still pending
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Swap request is no longer pending'
      });
    }

    // Reject the swap request
    await swapRequest.reject(responseMessage);

    // Populate the updated swap request
    await swapRequest.populate([
      { path: 'item', select: 'title images points' },
      { path: 'requester', select: 'name avatar email' },
      { path: 'itemOwner', select: 'name avatar email' },
      { path: 'offeredItem', select: 'title images points' }
    ]);

    res.json({
      success: true,
      message: 'Swap request rejected successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Reject swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject swap request',
      error: error.message
    });
  }
});

// @route   PUT /api/swaps/:id/complete
// @desc    Complete a swap
// @access  Private (both parties)
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.id);
    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is involved in the swap
    if (swapRequest.requester.toString() !== req.user._id.toString() &&
        swapRequest.itemOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this swap'
      });
    }

    // Check if swap request is accepted
    if (swapRequest.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Swap request must be accepted before completion'
      });
    }

    // Complete the swap
    await swapRequest.complete();

    // Populate the completed swap request
    await swapRequest.populate([
      { path: 'item', select: 'title images points' },
      { path: 'requester', select: 'name avatar email' },
      { path: 'itemOwner', select: 'name avatar email' },
      { path: 'offeredItem', select: 'title images points' }
    ]);

    res.json({
      success: true,
      message: 'Swap completed successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Complete swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete swap',
      error: error.message
    });
  }
});

// @route   PUT /api/swaps/:id/cancel
// @desc    Cancel a swap request
// @access  Private (requester only)
router.put('/:id/cancel', protect, [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Cancellation reason cannot exceed 200 characters')
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

    const swapRequest = await SwapRequest.findById(req.params.id);
    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is the requester
    if (swapRequest.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this swap request'
      });
    }

    // Check if swap request can be cancelled
    if (!swapRequest.canBeCancelled) {
      return res.status(400).json({
        success: false,
        message: 'Swap request cannot be cancelled'
      });
    }

    // Cancel the swap request
    await swapRequest.cancel(req.user._id, reason);

    // Populate the cancelled swap request
    await swapRequest.populate([
      { path: 'item', select: 'title images points' },
      { path: 'requester', select: 'name avatar email' },
      { path: 'itemOwner', select: 'name avatar email' },
      { path: 'offeredItem', select: 'title images points' }
    ]);

    res.json({
      success: true,
      message: 'Swap request cancelled successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Cancel swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel swap request',
      error: error.message
    });
  }
});

// @route   PUT /api/swaps/:id/read
// @desc    Mark swap request as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.id);
    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is involved in the swap
    if (swapRequest.requester.toString() !== req.user._id.toString() &&
        swapRequest.itemOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this swap request as read'
      });
    }

    // Mark as read
    await swapRequest.markAsRead();

    res.json({
      success: true,
      message: 'Swap request marked as read'
    });
  } catch (error) {
    console.error('Mark swap as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark swap request as read',
      error: error.message
    });
  }
});

module.exports = router; 