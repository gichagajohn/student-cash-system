import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowDownLeft, ArrowUpRight, RotateCcw, Calendar } from 'lucide-react';
import {
  getAllTransactions,
  getTransactionsByTeacher,
  getAllStudents,
  getStudentsByTeacher,
} from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export default function TransactionsPage() {
  const { userProfile, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const base = isAdmin ? '/admin' : '/teacher';

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [txs, sts] = await Promise.all([
        isAdmin ? getAllTransactions() : getTransactionsByTeacher(userProfile.id),
        isAdmin ? getAllStudents() : getStudentsByTeacher(userProfile.id),
      ]);
      setTransactions(txs);
      setStudents(sts);
      setLoading(false);
    }
    load();
  }, [userProfile?.id]);

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const filtered = transactions.filter((tx) => {
    const student = studentMap[tx.studentId];
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      student?.fullName.toLowerCase().includes(q) ||
      student?.admissionNumber.toLowerCase().includes(q) ||
      tx.note?.toLowerCase().includes(q);

    const matchType = !typeFilter || (typeFilter === 'reversal' ? tx.isReversal : tx.type === typeFilter && !tx.isReversal);
    const matchStudent = !studentFilter || tx.studentId === studentFilter;

    let matchDate = true;
    if (tx.createdAt?.toDate) {
      const txDate = tx.createdAt.toDate();
      if (dateFrom) matchDate = matchDate && txDate >= startOfDay(new Date(dateFrom));
      if (dateTo) matchDate = matchDate && txDate <= endOfDay(new Date(dateTo));
    }

    return matchSearch && matchType && matchStudent && matchDate;
  });

  const totalDeposits = filtered.filter((t) => t.type === 'deposit' && !t.isReversal).reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = filtered.filter((t) => t.type === 'withdrawal' && !t.isReversal).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-slate-400 text-sm mt-0.5">{filtered.length} records shown</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Deposits</p>
          <p className="font-mono font-bold text-emerald-400 text-lg">KES {totalDeposits.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Withdrawals</p>
          <p className="font-mono font-bold text-red-400 text-lg">KES {totalWithdrawals.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Net</p>
          <p className={`font-mono font-bold text-lg ${totalDeposits - totalWithdrawals >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            KES {(totalDeposits - totalWithdrawals).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input pl-9"
              placeholder="Search student name, number, or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input appearance-none min-w-[140px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="reversal">Reversals</option>
          </select>
          <select
            className="input appearance-none min-w-[160px]"
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
          >
            <option value="">All Students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="flex items-center gap-2 flex-1">
            <Calendar size={14} className="text-slate-500 flex-shrink-0" />
            <input
              type="date"
              className="input flex-1"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From"
            />
            <span className="text-slate-500 text-sm">to</span>
            <input
              type="date"
              className="input flex-1"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          {(search || typeFilter || studentFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setTypeFilter(''); setStudentFilter(''); setDateFrom(''); setDateTo(''); }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-500 text-sm">No transactions match your filters</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Note</th>
                  <th>Date & Time</th>
                  <th>Ref</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const student = studentMap[tx.studentId];
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {tx.isReversal ? (
                            <span className="badge-reversal"><RotateCcw size={10} /> Reversal</span>
                          ) : tx.type === 'deposit' ? (
                            <span className="badge-deposit"><ArrowDownLeft size={10} /> Deposit</span>
                          ) : (
                            <span className="badge-withdrawal"><ArrowUpRight size={10} /> Withdrawal</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {student ? (
                          <Link
                            to={`${base}/students/${tx.studentId}`}
                            className="hover:text-emerald-400 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-slate-200">{student.fullName}</p>
                              <p className="text-xs text-slate-500 font-mono">{student.admissionNumber}</p>
                            </div>
                          </Link>
                        ) : (
                          <span className="text-slate-500 text-xs">Unknown</span>
                        )}
                      </td>
                      <td className={`font-mono font-semibold ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'deposit' ? '+' : '-'} {tx.amount?.toLocaleString()}
                      </td>
                      <td className="text-slate-500 max-w-[200px]">
                        <p className="truncate">{tx.note || '—'}</p>
                      </td>
                      <td className="text-slate-400 whitespace-nowrap text-xs">
                        {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'dd MMM yyyy, HH:mm') : '—'}
                      </td>
                      <td className="font-mono text-xs text-slate-600">{tx.id.slice(0, 8)}…</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
