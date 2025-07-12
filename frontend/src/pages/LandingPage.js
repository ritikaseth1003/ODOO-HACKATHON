import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, Award, TrendingUp, ArrowLeft } from 'lucide-react';

// Use the same items as BrowseItems
const featuredItems = [
  {
    id: 1,
    title: "Vintage Denim Jacket",
    category: "Outerwear",
    image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop",
    points: 25
  },
  {
    id: 2,
    title: "Summer Dress",
    category: "Dresses",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop",
    points: 30
  },
  {
    id: 3,
    title: "Casual Sneakers",
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    points: 20
  },
  {
    id: 4,
    title: "Winter Sweater",
    category: "Tops",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    points: 35
  },
  {
    id: 5,
    title: "Leather Handbag",
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
    points: 40
  },
  {
    id: 6,
    title: "Formal Shirt",
    category: "Tops",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop",
    points: 15
  }
];

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? featuredItems.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredItems.length);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Sustainable Fashion
              <span className="text-primary-600"> Starts Here</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join our community of eco-conscious fashion lovers. Swap clothes, earn points, 
              and reduce textile waste while looking fabulous.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center justify-center">
                Start Swapping
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/browse" className="btn-outline text-lg px-8 py-3">
                Browse Items
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">1,000+</h3>
              <p className="text-gray-600">Active Members</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">5,000+</h3>
              <p className="text-gray-600">Items Swapped</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">2,500kg</h3>
              <p className="text-gray-600">Waste Prevented</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Items</h2>
            <p className="text-gray-600">Discover amazing pieces from our community</p>
          </div>
          <div className="relative flex flex-col items-center">
            {/* Carousel */}
            <div className="w-full max-w-md mx-auto">
              <div className="relative">
                <img
                  src={featuredItems[currentSlide].image}
                  alt={featuredItems[currentSlide].title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                {/* Left Arrow */}
                <button
                  onClick={goToPrev}
                  className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-primary-100"
                  aria-label="Previous"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                {/* Right Arrow */}
                <button
                  onClick={goToNext}
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-primary-100"
                  aria-label="Next"
                >
                  <ArrowRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{featuredItems[currentSlide].title}</h3>
              <p className="text-gray-600 mb-2">{featuredItems[currentSlide].category}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-primary-600 font-semibold">{featuredItems[currentSlide].points} points</span>
                <Link to={`/item/${featuredItems[currentSlide].id}`} className="btn-primary">
                  View Details
                </Link>
              </div>
            </div>
            {/* Carousel Indicators */}
            <div className="flex justify-center mt-4 space-x-2">
              {featuredItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-3 h-3 rounded-full ${currentSlide === idx ? 'bg-primary-600' : 'bg-gray-300'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">Get started in three simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">List Your Items</h3>
              <p className="text-gray-600">Upload photos and details of clothes you no longer wear</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-secondary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Browse & Request</h3>
              <p className="text-gray-600">Find items you love and request swaps or redeem with points</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Swap & Earn</h3>
              <p className="text-gray-600">Complete swaps and earn points for future exchanges</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Sustainable Fashion Journey?</h2>
          <p className="text-primary-100 mb-8 text-lg">
            Join thousands of eco-conscious fashion lovers today
          </p>
          <Link to="/register" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200">
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 