import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Users, ArrowDownLeft, ArrowUpRight,
  TrendingUp, Clock, ChevronRight, Plus
} from 'lucide-react';
import {
  subscribeToTeacherStudents,
  getTransactionsByTeacher,
  calculateBalance,
  getTransactionsByStudent,
} from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import TransactionModal from '../components/shared/TransactionModal';
import AddStudentModal from '../components/shared/AddStudentModal';
import { format } from 'date-fns';

export default function TeacherDashboard() {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [studentBalances, setStudentBalances] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showTransaction, setShowTransaction] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id) return;
    const unsub = subscribeToTeacherStudents(userProfile.id, (data) => {
      setStudents(data);
      setLoading(false);
    });
    return unsub;
  }, [userProfile?.id]);

  useEffect(() => {
    if (!userProfile?.id) return;
    getTransactionsByTeacher(userProfile.id).then(setTransactions);
  }, [userProfile?.id]);

  // Compute per-student balances
  useEffect(() => {
    async function fetchBalances() {
      const map = {};
      await Promise.all(
        students.map(async (s) => {
          const txs = await getTransactionsByStudent(s.id);
          map[s.id] = calculateBalance(txs);
        })
      );
      setStudentBalances(map);
    }
    if (students.length > 0) fetchBalances();
  }, [students]);

  const totalHeld = Object.values(studentBalances).reduce((a, b) => a + b, 0);
  const todayTxs = transactions.filter((t) => {
    if (!t.createdAt?.toDate) return false;
    const d = t.createdAt.toDate();
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const recentTxs = transactions.slice(0, 8);

  const openTransaction = (student, type) => {
    setSelectedStudent(student);
    setShowTransaction(type);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Welcome back, {userProfile?.name?.split(' ')[0]}</p>
        </div>
        <button onClick={() => setShowAddStudent(true)} className="btn-primary">
          <Plus size={15} />
          Add Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Held</span>
            <Wallet size={15} className="text-emerald-400" />
          </div>
          <p className="font-mono text-2xl font-bold text-emerald-400">
            KES {totalHeld.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">Across all students</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students</span>
            <Users size={15} className="text-blue-400" />
          </div>
          <p className="font-mono text-2xl font-bold">{students.length}</p>
          <p className="text-xs text-slate-500">Registered</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today</span>
            <Clock size={15} className="text-amber-400" />
          </div>
          <p className="font-mono text-2xl font-bold">{todayTxs.length}</p>
          <p className="text-xs text-slate-500">Transactions</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Txns</span>
            <TrendingUp size={15} className="text-purple-400" />
          </div>
          <p className="font-mono text-2xl font-bold">{transactions.length}</p>
          <p className="text-xs text-slate-500">All time</p>
        </div>
      </div>

      {/* Quick Actions */}
      {students.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <ArrowDownLeft size={16} className="text-emerald-400" />
            Quick Transaction
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {students.map((s) => {
              const bal = studentBalances[s.id] ?? 0;
              return (
                <div key={s.id} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                  <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-slate-300">{s.fullName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.fullName}</p>
                    <p className="text-xs font-mono text-emerald-400">KES {bal.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openTransaction(s, 'deposit')}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Deposit"
                    >
                      <ArrowDownLeft size={13} />
                    </button>
                    <button
                      onClick={() => openTransaction(s, 'withdrawal')}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Withdraw"
                    >
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-semibold text-slate-300">Recent Transactions</h2>
          <Link to="/teacher/transactions" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            View all <ChevronRight size={13} />
          </Link>
        </div>
        {recentTxs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No transactions yet</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {recentTxs.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/30 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'deposit' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {tx.type === 'deposit'
                    ? <ArrowDownLeft size={14} className="text-emerald-400" />
                    : <ArrowUpRight size={14} className="text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {students.find((s) => s.id === tx.studentId)?.fullName || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'dd MMM, HH:mm') : '—'}
                    {tx.note && ` · ${tx.note}`}
                  </p>
                </div>
                <p className={`font-mono font-semibold text-sm flex-shrink-0 ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'deposit' ? '+' : '-'} {tx.amount?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTransaction && selectedStudent && (
        <TransactionModal
          student={selectedStudent}
          balance={studentBalances[selectedStudent.id] ?? 0}
          onClose={() => { setShowTransaction(false); setSelectedStudent(null); }}
          onSuccess={() => {
            getTransactionsByTeacher(userProfile.id).then(setTransactions);
          }}
        />
      )}
      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
