import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PayoutManagement = () => {
  const [payouts, setPayouts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', bank: '', accountNumber: '', branchCode: '', beneficiaryName: '', percentage: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [historyRes, accountsRes] = await Promise.all([
        axios.get('/api/admin/payouts/history'),
        axios.get('/api/admin/payouts/accounts')
      ]);
      setPayouts(historyRes.data.data.payouts);
      setAccounts(accountsRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const triggerPayout = async () => {
    if (!window.confirm('Manually trigger weekly payout?')) return;
    setLoading(true);
    try {
      await axios.post('/api/admin/payouts/trigger');
      toast.success('Payout triggered');
      fetchData();
    } catch (error) {
      toast.error('Failed to trigger');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/payouts/accounts', newAccount);
      toast.success('Account added');
      fetchData();
      setNewAccount({ name: '', bank: '', accountNumber: '', branchCode: '', beneficiaryName: '', percentage: 0 });
    } catch (error) {
      toast.error('Failed to add account');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Payout Management</h1>
      
      <div className="mb-8">
        <button
          onClick={triggerPayout}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Trigger Weekly Payout'}
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-4">Payout Accounts</h2>
      <div className="bg-white rounded-lg shadow overflow-x-auto mb-8">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Bank</th>
              <th className="px-6 py-3 text-left">Account</th>
              <th className="px-6 py-3 text-left">Percentage</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc._id} className="border-t">
                <td className="px-6 py-4">{acc.name}</td>
                <td className="px-6 py-4">{acc.bank}</td>
                <td className="px-6 py-4">{acc.accountNumber}</td>
                <td className="px-6 py-4">{acc.percentage}%</td>
                <td className="px-6 py-4">{acc.isActive ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-2xl font-bold mb-4">Add Account</h2>
      <form onSubmit={handleAddAccount} className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Name" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} className="border rounded-lg px-4 py-2" required />
          <input type="text" placeholder="Bank" value={newAccount.bank} onChange={e => setNewAccount({...newAccount, bank: e.target.value})} className="border rounded-lg px-4 py-2" required />
          <input type="text" placeholder="Account Number" value={newAccount.accountNumber} onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})} className="border rounded-lg px-4 py-2" required />
          <input type="text" placeholder="Branch Code" value={newAccount.branchCode} onChange={e => setNewAccount({...newAccount, branchCode: e.target.value})} className="border rounded-lg px-4 py-2" />
          <input type="text" placeholder="Beneficiary Name" value={newAccount.beneficiaryName} onChange={e => setNewAccount({...newAccount, beneficiaryName: e.target.value})} className="border rounded-lg px-4 py-2" required />
          <input type="number" step="0.1" placeholder="Percentage" value={newAccount.percentage} onChange={e => setNewAccount({...newAccount, percentage: parseFloat(e.target.value)})} className="border rounded-lg px-4 py-2" required />
        </div>
        <button type="submit" className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Add Account</button>
      </form>

      <h2 className="text-2xl font-bold mb-4">Payout History</h2>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Week</th>
              <th className="px-6 py-3 text-left">Period</th>
              <th className="px-6 py-3 text-left">Revenue</th>
              <th className="px-6 py-3 text-left">Allocations</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(p => (
              <tr key={p._id} className="border-t">
                <td className="px-6 py-4">{p.week}</td>
                <td className="px-6 py-4">
                  {format(new Date(p.startDate), 'dd MMM')} - {format(new Date(p.endDate), 'dd MMM yyyy')}
                </td>
                <td className="px-6 py-4 font-bold">R{p.totalRevenue.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <ul>
                    {p.allocations.map(a => (
                      <li key={a._id}>{a.account?.name}: R{a.amount.toLocaleString()} ({a.status})</li>
                    ))}
                  </ul>
                </td>
                <td className="px-6 py-4">
                  {p.status === 'completed' ? <CheckCircle className="text-green-500" /> : <AlertCircle className="text-red-500" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayoutManagement;
