import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const VendorRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    tags: '',
    payoutMethod: 'bank',
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchCode: '',
    swiftCode: '',
    paypalEmail: '',
  });
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.name === 'logo') setLogo(e.target.files[0]);
    if (e.target.name === 'banner') setBanner(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) data.append(key, formData[key]);
    });
    if (logo) data.append('logo', logo);
    if (banner) data.append('banner', banner);

    try {
      const response = await axios.post('/api/marketplace/vendor/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Vendor registration submitted! Awaiting approval.');
      navigate('/marketplace/vendor/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold text-center mb-8">Become a Vendor</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <label className="block font-medium mb-2">Store Name *</label>
            <input
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Store Description *</label>
            <textarea
              name="storeDescription"
              value={formData.storeDescription}
              onChange={handleChange}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Logo</label>
            <input type="file" name="logo" onChange={handleFileChange} accept="image/*" className="w-full" />
          </div>

          <div>
            <label className="block font-medium mb-2">Banner</label>
            <input type="file" name="banner" onChange={handleFileChange} accept="image/*" className="w-full" />
          </div>

          <div>
            <label className="block font-medium mb-2">Contact Email *</label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Contact Phone</label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2">Facebook</label>
              <input
                type="url"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-2">Instagram</label>
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-2">Address</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="street" placeholder="Street" value={formData.street} onChange={handleChange} className="border rounded-lg px-4 py-2" />
              <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} className="border rounded-lg px-4 py-2" />
              <input type="text" name="state" placeholder="State/Province" value={formData.state} onChange={handleChange} className="border rounded-lg px-4 py-2" />
              <input type="text" name="country" placeholder="Country" value={formData.country} onChange={handleChange} className="border rounded-lg px-4 py-2" />
              <input type="text" name="postalCode" placeholder="Postal Code" value={formData.postalCode} onChange={handleChange} className="border rounded-lg px-4 py-2" />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-2">Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. logo, business, modern"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Payout Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Payout Method</label>
                <select name="payoutMethod" value={formData.payoutMethod} onChange={handleChange} className="w-full border rounded-lg px-4 py-2">
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="payfast">PayFast</option>
                </select>
              </div>

              {formData.payoutMethod === 'bank' && (
                <>
                  <div><input type="text" name="bankName" placeholder="Bank Name" value={formData.bankName} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" /></div>
                  <div><input type="text" name="accountName" placeholder="Account Name" value={formData.accountName} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" /></div>
                  <div><input type="text" name="accountNumber" placeholder="Account Number" value={formData.accountNumber} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" /></div>
                  <div><input type="text" name="branchCode" placeholder="Branch Code" value={formData.branchCode} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" /></div>
                  <div><input type="text" name="swiftCode" placeholder="SWIFT Code (optional)" value={formData.swiftCode} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" /></div>
                </>
              )}

              {formData.payoutMethod === 'paypal' && (
                <div><input type="email" name="paypalEmail" placeholder="PayPal Email" value={formData.paypalEmail} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" /></div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Vendor Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VendorRegistration;
