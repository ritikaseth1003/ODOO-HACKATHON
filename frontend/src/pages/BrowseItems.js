import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';

const BrowseItems = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Mock data - replace with real data from backend
  const allItems = [
    {
      id: 1,
      title: "Vintage Denim Jacket",
      category: "Outerwear",
      size: "M",
      condition: "Good",
      points: 25,
      image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop",
      uploader: "John Doe"
    },
    {
      id: 2,
      title: "Summer Dress",
      category: "Dresses",
      size: "S",
      condition: "Excellent",
      points: 30,
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop",
      uploader: "Jane Smith"
    },
    {
      id: 3,
      title: "Casual Sneakers",
      category: "Footwear",
      size: "42",
      condition: "Good",
      points: 20,
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
      uploader: "Mike Johnson"
    },
    {
      id: 4,
      title: "Winter Sweater",
      category: "Tops",
      size: "L",
      condition: "Excellent",
      points: 35,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
      uploader: "Sarah Wilson"
    },
    {
      id: 5,
      title: "Leather Handbag",
      category: "Accessories",
      size: "One Size",
      condition: "Good",
      points: 40,
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
      uploader: "Emma Davis"
    },
    {
      id: 6,
      title: "Formal Shirt",
      category: "Tops",
      size: "M",
      condition: "Excellent",
      points: 15,
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop",
      uploader: "Alex Brown"
    }
  ];

  const categories = ["All", "Tops", "Dresses", "Outerwear", "Footwear", "Accessories"];
  const sizes = ["All", "XS", "S", "M", "L", "XL", "42", "43", "44", "One Size"];
  const conditions = ["All", "Excellent", "Good", "Fair"];

  // Filter items based on search and filters
  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSize = selectedSize === '' || selectedSize === 'All' || item.size === selectedSize;
    const matchesCondition = selectedCondition === '' || selectedCondition === 'All' || item.condition === selectedCondition;
    
    return matchesSearch && matchesCategory && matchesSize && matchesCondition;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Items</h1>
          <p className="text-gray-600">Discover amazing pieces from our community</p>
        </div>

        {/* Search and Filters */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="input-field"
              >
                <option value="">All Sizes</option>
                {sizes.slice(1).map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Condition:</span>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All</option>
                {conditions.slice(1).map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {currentItems.length} of {filteredItems.length} items
          </p>
        </div>

        {/* Items Grid/List */}
        {currentItems.length === 0 ? (
          <div className="card text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {currentItems.map((item) => (
                <div key={item.id} className={`card ${viewMode === 'list' ? 'flex' : ''}`}>
                  <div className={`${viewMode === 'list' ? 'flex-shrink-0 w-48' : ''}`}>
                    <img
                      src={item.image}
                      alt={item.title}
                      className={`${viewMode === 'list' ? 'w-full h-32' : 'w-full h-48'} object-cover rounded-lg`}
                    />
                  </div>
                  <div className={`${viewMode === 'list' ? 'ml-6 flex-1' : 'mt-4'}`}>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Category: {item.category}</p>
                      <p>Size: {item.size}</p>
                      <p>Condition: {item.condition}</p>
                      <p>Uploaded by: {item.uploader}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-primary-600 font-semibold">{item.points} points</span>
                      <Link to={`/item/${item.id}`} className="btn-primary">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded border ${
                        currentPage === page
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrowseItems; 