import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight, Wallet,
  RotateCcw, FileText, AlertTriangle, Edit2, Check, X
} from 'lucide-react';
import {
  getStudentById,
  subscribeToStudentTransactions,
  calculateBalance,
  updateStudent,
  getUserById,
} from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import TransactionModal from '../components/shared/TransactionModal';
import ReversalModal from '../components/shared/ReversalModal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();

  const [student, setStudent] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [teacherNames, setTeacherNames] = useState({});
  const [showTransaction, setShowTransaction] = useState(false);
  const [reversalTx, setReversalTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState('');

  const base = isAdmin ? '/admin' : '/teacher';
  const balance = calculateBalance(transactions);

  useEffect(() => {
    getStudentById(id).then((s) => {
      if (!s) { navigate(-1); return; }
      setStudent(s);
      setNewName(s.fullName);
      setLoading(false);
    });

    const unsub = subscribeToStudentTransactions(id, async (txs) => {
      setTransactions(txs);
      // Fetch teacher names
      const teacherIds = [...new Set(txs.map((t) => t.teacherId))];
      const map = {};
      await Promise.all(
        teacherIds.map(async (tid) => {
          if (!teacherNames[tid]) {
            const u = await getUserById(tid);
            if (u) map[tid] = u.name;
          }
        })
      );
      setTeacherNames((prev) => ({ ...prev, ...map }));
    });

    return unsub;
  }, [id]);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    await updateStudent(id, { fullName: newName.trim() });
    setStudent((s) => ({ ...s, fullName: newName.trim() }));
    setEditName(false);
    toast.success('Name updated');
  };

  const totalDeposits = transactions.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter((t) => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm w-fit transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Student Header */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 text-xl font-bold">{student.fullName.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editName ? (
              <div className="flex items-center gap-2">
                <input
                  className="input text-lg font-bold py-1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
                <button onClick={handleSaveName} className="p-1.5 text-emerald-400 hover:text-emerald-300"><Check size={16} /></button>
                <button onClick={() => setEditName(false)} className="p-1.5 text-slate-400 hover:text-slate-200"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{student.fullName}</h1>
                <button onClick={() => setEditName(true)} className="text-slate-500 hover:text-slate-300 p-1">
                  <Edit2 size={13} />
                </button>
              </div>
            )}
            <p className="text-slate-400 text-sm mt-0.5">
              {student.admissionNumber} · {student.gradeOrForm}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-slate-400 mb-1">Current Balance</p>
            <p className={`text-2xl font-mono font-bold ${balance > 0 ? 'text-emerald-400' : balance < 0 ? 'text-red-400' : 'text-slate-400'}`}>
              KES {balance.toLocaleString()}
            </p>
            {balance < 500 && balance >= 0 && (
              <p className="text-xs text-amber-400 flex items-center justify-end gap-1 mt-1">
                <AlertTriangle size={11} /> Low balance
              </p>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Total In</p>
            <p className="font-mono font-bold text-emerald-400">KES {totalDeposits.toLocaleString()}</p>
          </div>
          <div className="text-center border-x border-slate-800">
            <p className="text-xs text-slate-400 mb-1">Total Out</p>
            <p className="font-mono font-bold text-red-400">KES {totalWithdrawals.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Transactions</p>
            <p className="font-mono font-bold">{transactions.length}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowTransaction('deposit')}
          className="btn-primary flex-1 !py-3"
        >
          <ArrowDownLeft size={16} />
          Deposit Money
        </button>
        <button
          onClick={() => setShowTransaction('withdrawal')}
          disabled={balance <= 0}
          className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowUpRight size={16} />
          Withdraw
        </button>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-semibold text-slate-300 flex items-center gap-2">
            <FileText size={16} className="text-emerald-400" />
            Transaction History
          </h2>
          <span className="text-xs text-slate-500">{transactions.length} records</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No transactions yet</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {transactions.map((tx, idx) => {
              // Calculate running balance (from oldest to newest)
              const orderedTxs = [...transactions].reverse();
              const txIndex = orderedTxs.findIndex((t) => t.id === tx.id);
              const runningBalance = calculateBalance(orderedTxs.slice(0, txIndex + 1));

              return (
                <div key={tx.id} className="flex items-start gap-3 px-5 py-4 hover:bg-slate-800/30 transition-colors group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    tx.isReversal ? 'bg-amber-500/10' :
                    tx.type === 'deposit' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}>
                    {tx.isReversal ? (
                      <RotateCcw size={14} className="text-amber-400" />
                    ) : tx.type === 'deposit' ? (
                      <ArrowDownLeft size={14} className="text-emerald-400" />
                    ) : (
                      <ArrowUpRight size={14} className="text-red-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={tx.isReversal ? 'badge-reversal' : tx.type === 'deposit' ? 'badge-deposit' : 'badge-withdrawal'}>
                        {tx.isReversal ? 'Reversal' : tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </span>
                      <span className="text-xs text-slate-500">
                        by {teacherNames[tx.teacherId] || 'Teacher'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'dd MMM yyyy, HH:mm:ss') : '—'}
                    </p>
                    {tx.note && <p className="text-xs text-slate-400 mt-1 italic">"{tx.note}"</p>}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`font-mono font-bold text-sm ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'deposit' ? '+' : '-'} {tx.amount?.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Bal: {runningBalance.toLocaleString()}
                    </p>
                    {/* Reversal button */}
                    {!tx.isReversal && (
                      <button
                        onClick={() => setReversalTx(tx)}
                        className="text-xs text-slate-600 hover:text-amber-400 flex items-center gap-1 mt-1 ml-auto opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <RotateCcw size={10} /> Reverse
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showTransaction && (
        <TransactionModal
          student={student}
          balance={balance}
          onClose={() => setShowTransaction(false)}
          onSuccess={() => {}}
        />
      )}

      {/* Reversal Modal */}
      {reversalTx && (
        <ReversalModal
          transaction={reversalTx}
          student={student}
          onClose={() => setReversalTx(null)}
          onSuccess={() => setReversalTx(null)}
        />
      )}
    </div>
  );
}
