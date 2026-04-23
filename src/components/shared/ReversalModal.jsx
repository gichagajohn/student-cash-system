import { useState } from 'react';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import { recordReversal } from '../../firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ReversalModal({ transaction, student, onClose, onSuccess }) {
  const { userProfile } = useAuth();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleReversal = async () => {
    if (!confirmed) return;
    setLoading(true);
    try {
      await recordReversal({
        originalTxId: transaction.id,
        studentId: transaction.studentId,
        teacherId: userProfile.id,
        amount: transaction.amount,
        originalType: transaction.type,
        note,
      });
      toast.success('Reversal recorded successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Reversal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="modal-content card w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <RotateCcw size={18} className="text-amber-400" />
            Reverse Transaction
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">
                This will create a reversal entry to cancel the original transaction. The original record will remain for audit purposes.
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Student</span>
                <span className="font-medium">{student?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Original type</span>
                <span className={`capitalize font-medium ${transaction.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {transaction.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="font-mono font-bold">KES {transaction.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date</span>
                <span>{transaction.createdAt?.toDate ? format(transaction.createdAt.toDate(), 'dd MMM yyyy HH:mm') : '—'}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Reason for reversal</label>
            <input
              className="input"
              placeholder="e.g., Wrong amount entered"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <span className="text-sm text-slate-300">
              I confirm this reversal is necessary and I understand it cannot be undone.
            </span>
          </label>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleReversal}
              disabled={loading || !confirmed || !note}
              className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <><RotateCcw size={14} /> Confirm Reversal</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
