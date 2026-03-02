import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Star, Download, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await axios.get(`/api/marketplace/listings/${id}`);
      setListing(response.data.data);
    } catch (error) {
      toast.error('Listing not found');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    dispatch(addToCart({
      id: listing._id,
      name: listing.title,
      price: listing.price,
      discountPrice: listing.discountPrice,
      images: listing.previewImages,
      category: listing.category,
      vendor: listing.vendor,
      quantity,
      type: 'marketplace'
    }));
    toast.success('Added to cart!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!listing) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images */}
            <div>
              <div className="mb-4 rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={listing.previewImages[selectedImage]?.url || 'https://via.placeholder.com/600'}
                  alt={listing.title}
                  className="w-full h-96 object-contain"
                />
              </div>
              {listing.previewImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {listing.previewImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === idx ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold">{listing.title}</h1>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full"><Heart /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-full"><Share2 /></button>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 mr-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={i < Math.floor(listing.rating) ? 'fill-current' : 'opacity-30'} />
                  ))}
                </div>
                <span className="text-gray-600">({listing.reviews.length} reviews)</span>
              </div>

              <p className="text-gray-700 text-lg mb-6">{listing.description}</p>

              <div className="mb-6">
                <span className="text-3xl font-bold">
                  {listing.discountPrice ? (
                    <>
                      <span className="text-gray-400 line-through text-2xl mr-2">R{listing.price}</span>
                      R{listing.discountPrice}
                    </>
                  ) : (
                    `R${listing.price}`
                  )}
                </span>
              </div>

              <div className="mb-6">
                <label className="block font-medium mb-2">Quantity</label>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border rounded-l-lg bg-gray-50 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-10 border-t border-b text-center"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border rounded-r-lg bg-gray-50 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition"
                >
                  Add to Cart
                </button>
                <button className="flex-1 border-2 border-gray-300 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition">
                  Buy Now
                </button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-2">Product Details</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><span className="font-medium">Vendor:</span> {listing.vendor?.storeName}</li>
                  <li><span className="font-medium">Category:</span> {listing.category}</li>
                  <li><span className="font-medium">License:</span> {listing.license}</li>
                  <li><span className="font-medium">Downloads:</span> {listing.downloads}</li>
                  {listing.softwareVersion && <li><span className="font-medium">Version:</span> {listing.softwareVersion}</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
