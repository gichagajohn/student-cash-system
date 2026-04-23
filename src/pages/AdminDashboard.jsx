import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Users, ArrowLeftRight, UserCog,
  TrendingUp, TrendingDown, ChevronRight, Activity
} from 'lucide-react';
import { getSystemStats, getAllTransactions, getAllStudents } from '../firebase/firestore';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTxs, setRecentTxs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function load() {
    try {
      const [s, txs, sts] = await Promise.all([
        getSystemStats(),
        getAllTransactions(),
        getAllStudents(),
      ]);
      setStats(s);
      setRecentTxs(txs.slice(0, 10));
      setStudents(sts);
    } catch (err) {
      console.error('Dashboard load error:', err);
      // Set empty defaults so dashboard renders instead of loading forever
      setStats({
        totalFundsHeld: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalTransactions: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
      });
      setRecentTxs([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }
  load();
}, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Funds Held', value: `KES ${stats?.totalFundsHeld?.toLocaleString() ?? 0}`, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Teachers', value: stats?.totalTeachers ?? 0, icon: UserCog, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Transactions', value: stats?.totalTransactions ?? 0, icon: ArrowLeftRight, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Total Deposits', value: `KES ${stats?.totalDeposits?.toLocaleString() ?? 0}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Withdrawals', value: `KES ${stats?.totalWithdrawals?.toLocaleString() ?? 0}`, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">System-wide overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className={`${card.bg} p-1.5 rounded-lg`}>
                <card.icon size={14} className={card.color} />
              </div>
            </div>
            <p className={`font-mono text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/admin/teachers', label: 'Manage Teachers', icon: UserCog },
          { to: '/admin/students', label: 'All Students', icon: Users },
          { to: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
          { to: '/admin/reports', label: 'Reports', icon: Activity },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card-hover p-4 flex flex-col items-center gap-2 text-center group"
          >
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
              <item.icon size={18} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </div>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-semibold text-slate-300 flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            Recent System Activity
          </h2>
          <Link to="/admin/transactions" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            View all <ChevronRight size={13} />
          </Link>
        </div>
        {recentTxs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No transactions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Note</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTxs.map((tx) => {
                  const student = students.find((s) => s.id === tx.studentId);
                  return (
                    <tr key={tx.id}>
                      <td>
                        <span className={tx.type === 'deposit' ? 'badge-deposit' : tx.isReversal ? 'badge-reversal' : 'badge-withdrawal'}>
                          {tx.isReversal ? 'Reversal' : tx.type}
                        </span>
                      </td>
                      <td>
                        <Link to={`/admin/students/${tx.studentId}`} className="hover:text-emerald-400 transition-colors">
                          {student?.fullName || tx.studentId}
                        </Link>
                      </td>
                      <td className={`font-mono font-semibold ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'deposit' ? '+' : '-'} {tx.amount?.toLocaleString()}
                      </td>
                      <td className="text-slate-500 max-w-[160px] truncate">{tx.note || '—'}</td>
                      <td className="text-slate-500 whitespace-nowrap">
                        {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'dd MMM, HH:mm') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
