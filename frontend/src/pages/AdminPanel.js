import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, CheckCircle, XCircle, Eye, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedItems, setSelectedItems] = useState([]);

  // Mock data - replace with real data from backend
  const pendingItems = [
    {
      id: 1,
      title: "Vintage Denim Jacket",
      category: "Outerwear",
      uploader: "John Doe",
      uploaderEmail: "john@example.com",
      createdAt: "2024-01-20",
      image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=300&h=300&fit=crop",
      status: "pending"
    },
    {
      id: 2,
      title: "Summer Dress",
      category: "Dresses",
      uploader: "Jane Smith",
      uploaderEmail: "jane@example.com",
      createdAt: "2024-01-19",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop",
      status: "pending"
    }
  ];

  const approvedItems = [
    {
      id: 3,
      title: "Casual Sneakers",
      category: "Footwear",
      uploader: "Mike Johnson",
      uploaderEmail: "mike@example.com",
      createdAt: "2024-01-18",
      approvedAt: "2024-01-19",
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop",
      status: "approved"
    }
  ];

  const rejectedItems = [
    {
      id: 4,
      title: "Inappropriate Item",
      category: "Other",
      uploader: "Unknown User",
      uploaderEmail: "user@example.com",
      createdAt: "2024-01-17",
      rejectedAt: "2024-01-18",
      reason: "Inappropriate content",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
      status: "rejected"
    }
  ];

  // Check if user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const handleApprove = (itemId) => {
    // Simulate API call
    toast.success('Item approved successfully!');
    // Update item status in real implementation
  };

  const handleReject = (itemId, reason) => {
    // Simulate API call
    toast.success('Item rejected successfully!');
    // Update item status in real implementation
  };

  const handleDelete = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      // Simulate API call
      toast.success('Item deleted successfully!');
      // Delete item in real implementation
    }
  };

  const handleBulkAction = (action) => {
    if (selectedItems.length === 0) {
      toast.error('Please select items first');
      return;
    }

    if (action === 'approve') {
      selectedItems.forEach(itemId => handleApprove(itemId));
      setSelectedItems([]);
    } else if (action === 'reject') {
      selectedItems.forEach(itemId => handleReject(itemId, 'Bulk rejection'));
      setSelectedItems([]);
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getItemsByStatus = (status) => {
    switch (status) {
      case 'pending':
        return pendingItems;
      case 'approved':
        return approvedItems;
      case 'rejected':
        return rejectedItems;
      default:
        return [];
    }
  };

  const currentItems = getItemsByStatus(activeTab);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-gray-600">Moderate and manage item listings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingItems.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{approvedItems.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedItems.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingItems.length + approvedItems.length + rejectedItems.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Review ({pendingItems.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approved'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approved ({approvedItems.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rejected'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rejected ({rejectedItems.length})
            </button>
          </nav>
        </div>

        {/* Bulk Actions */}
        {activeTab === 'pending' && selectedItems.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedItems.length} item(s) selected
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="btn-primary text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve All
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="btn-outline text-sm"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="card">
          {currentItems.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                {activeTab === 'pending' && 'No items are pending review.'}
                {activeTab === 'approved' && 'No items have been approved yet.'}
                {activeTab === 'rejected' && 'No items have been rejected.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {/* Checkbox for pending items */}
                    {activeTab === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="mt-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    )}

                    {/* Item Image */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    {/* Item Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Category: {item.category}</p>
                        <p>Uploaded by: {item.uploader} ({item.uploaderEmail})</p>
                        <p>Created: {item.createdAt}</p>
                        {item.approvedAt && <p>Approved: {item.approvedAt}</p>}
                        {item.rejectedAt && <p>Rejected: {item.rejectedAt}</p>}
                        {item.reason && <p>Reason: {item.reason}</p>}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2">
                      {activeTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="btn-primary text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(item.id, 'Inappropriate content')}
                            className="btn-outline text-sm"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      
                      {activeTab !== 'pending' && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn-outline text-sm text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 