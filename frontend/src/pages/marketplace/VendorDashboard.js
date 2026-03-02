import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, DollarSign, Star, ShoppingBag, PlusCircle, TrendingUp, Clock } from 'lucide-react';

const VendorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, listingsRes, ordersRes] = await Promise.all([
        axios.get('/api/marketplace/vendor/stats'),
        axios.get('/api/marketplace/listings/my?limit=5'),
        axios.get('/api/marketplace/orders/vendor?limit=5'),
      ]);
      setStats(statsRes.data.data);
      setListings(listingsRes.data.data);
      setOrders(ordersRes.data.data);
    } catch (error) {
      console.error('Failed to fetch vendor data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">Vendor Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Total Sales</p>
                <p className="text-3xl font-bold">{stats?.totalSales || 0}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Revenue</p>
                <p className="text-3xl font-bold">R{stats?.totalRevenue?.toLocaleString() || 0}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Listings</p>
                <p className="text-3xl font-bold">{stats?.totalListings || 0}</p>
              </div>
              <Package className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Rating</p>
                <p className="text-3xl font-bold">{stats?.averageRating?.toFixed(1) || 0}</p>
              </div>
              <Star className="w-12 h-12 text-yellow-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex gap-4">
          <Link
            to="/marketplace/vendor/listings/new"
            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add New Listing
          </Link>
          <Link
            to="/marketplace/vendor/payouts"
            className="inline-flex items-center border border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Request Payout
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3">Order ID</th>
                    <th className="text-left py-3">Customer</th>
                    <th className="text-left py-3">Items</th>
                    <th className="text-left py-3">Total</th>
                    <th className="text-left py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id} className="border-b border-gray-100">
                      <td className="py-3">{order.orderId}</td>
                      <td className="py-3">{order.user?.firstName} {order.user?.lastName}</td>
                      <td className="py-3">{order.items.length}</td>
                      <td className="py-3 font-bold">R{order.total}</td>
                      <td className="py-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          order.orderStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Listings */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Listings</h2>
            <Link to="/marketplace/vendor/listings" className="text-blue-600 hover:underline">View All</Link>
          </div>
          {listings.length === 0 ? (
            <p className="text-gray-500">You haven't created any listings yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(listing => (
                <div key={listing._id} className="border rounded-lg p-4 hover:shadow-lg transition">
                  <h3 className="font-bold">{listing.title}</h3>
                  <p className="text-sm text-gray-600">Category: {listing.category}</p>
                  <p className="text-sm text-gray-600">Status: 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      listing.status === 'approved' ? 'bg-green-100 text-green-800' :
                      listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      listing.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {listing.status}
                    </span>
                  </p>
                  <p className="text-lg font-bold mt-2">R{listing.finalPrice}</p>
                  <Link to={`/marketplace/vendor/listings/${listing._id}/edit`} className="text-blue-600 hover:underline text-sm">
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
