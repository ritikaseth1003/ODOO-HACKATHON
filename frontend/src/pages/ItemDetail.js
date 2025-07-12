import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Heart, Share2, User, Calendar, Tag, Gift, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const ItemDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [currentImage, setCurrentImage] = useState(0);
  const [showSwapModal, setShowSwapModal] = useState(false);

  // Mock data - replace with real data from backend
  const item = {
    id: parseInt(id),
    title: "Vintage Denim Jacket",
    description: "A beautiful vintage denim jacket in excellent condition. This classic piece features a comfortable fit and timeless style. Perfect for layering or as a statement piece. The jacket has been well-maintained and shows minimal signs of wear.",
    category: "Outerwear",
    size: "M",
    condition: "Good",
    points: 25,
    images: [
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=600&h=600&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=600&h=600&fit=crop&crop=entropy"
    ],
    uploader: {
      name: "John Doe",
      id: "user1",
      rating: 4.8,
      memberSince: "2023"
    },
    tags: ["vintage", "denim", "casual", "unisex"],
    createdAt: "2024-01-15",
    status: "available"
  };

  const handleSwapRequest = () => {
    if (!currentUser) {
      toast.error('Please log in to request a swap');
      return;
    }
    setShowSwapModal(true);
  };

  const handleRedeemPoints = () => {
    if (!currentUser) {
      toast.error('Please log in to redeem points');
      return;
    }
    if (currentUser.points < item.points) {
      toast.error('Insufficient points. You need ' + item.points + ' points to redeem this item.');
      return;
    }
    toast.success('Item redeemed successfully!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `Check out this ${item.title} on ReWear!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link to="/" className="hover:text-primary-600">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/browse" className="hover:text-primary-600">Browse Items</Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">{item.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="relative">
              <img
                src={item.images[currentImage]}
                alt={item.title}
                className="w-full h-96 lg:h-[500px] object-cover rounded-lg"
              />
              <button
                onClick={handleShare}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Thumbnail Images */}
            {item.images.length > 1 && (
              <div className="mt-4 flex space-x-2">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      currentImage === index ? 'border-primary-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${item.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div>
            <div className="card">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary-600">{item.points} points</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'available' 
                      ? 'text-green-600 bg-green-100' 
                      : 'text-red-600 bg-red-100'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Item Info */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-gray-900">{item.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <p className="text-gray-900">{item.size}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <p className="text-gray-900">{item.condition}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Listed</label>
                    <p className="text-gray-900">{item.createdAt}</p>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>

              {/* Uploader Info */}
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Uploaded by</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.uploader.name}</p>
                    <p className="text-sm text-gray-600">Member since {item.uploader.memberSince}</p>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-600">Rating:</span>
                      <span className="text-sm font-medium text-gray-900">{item.uploader.rating}/5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {item.status === 'available' && (
                  <>
                    <button
                      onClick={handleSwapRequest}
                      className="w-full btn-primary flex items-center justify-center"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Request Swap
                    </button>
                    <button
                      onClick={handleRedeemPoints}
                      disabled={!currentUser || currentUser.points < item.points}
                      className="w-full btn-secondary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      Redeem with Points
                      {currentUser && (
                        <span className="ml-2 text-sm">
                          ({currentUser.points}/{item.points})
                        </span>
                      )}
                    </button>
                  </>
                )}
                
                {!currentUser && (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-2">Please log in to interact with this item</p>
                    <Link to="/login" className="btn-primary">
                      Log In
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Items Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Add similar items here */}
          </div>
        </div>
      </div>

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Swap</h3>
            <p className="text-gray-600 mb-6">
              You're requesting to swap for "{item.title}". The uploader will be notified and can accept or decline your request.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSwapModal(false)}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success('Swap request sent!');
                  setShowSwapModal(false);
                }}
                className="flex-1 btn-primary"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail; 