import { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, AlertTriangle, Shield } from 'lucide-react';
import { recordDeposit, recordWithdrawal } from '../../firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function TransactionModal({ student, balance, onClose, onSuccess }) {
  const { userProfile } = useAuth();
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'confirm'
  const [loading, setLoading] = useState(false);

  const WITHDRAWAL_PIN = '1234'; // In production, store this securely per teacher

  const parsedAmount = parseFloat(amount) || 0;
  const isWithdrawal = type === 'withdrawal';
  const insufficientFunds = isWithdrawal && parsedAmount > balance;
  const lowBalance = isWithdrawal && parsedAmount <= balance && balance - parsedAmount < 500;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parsedAmount <= 0) return toast.error('Amount must be greater than 0');
    if (insufficientFunds) return toast.error('Insufficient balance');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (isWithdrawal && pin !== WITHDRAWAL_PIN) {
      return toast.error('Incorrect PIN');
    }

    setLoading(true);
    try {
      if (isWithdrawal) {
        await recordWithdrawal({
          studentId: student.id,
          teacherId: userProfile.id,
          amount: parsedAmount,
          note,
        });
      } else {
        await recordDeposit({
          studentId: student.id,
          teacherId: userProfile.id,
          amount: parsedAmount,
          note,
        });
      }
      toast.success(`${isWithdrawal ? 'Withdrawal' : 'Deposit'} of KES ${parsedAmount.toLocaleString()} recorded`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="modal-content card w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-bold text-lg">
            {step === 'form' ? 'New Transaction' : 'Confirm Transaction'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X size={18} />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {/* Student info */}
            <div className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-200">{student.fullName}</p>
                <p className="text-xs text-slate-400">{student.admissionNumber} · {student.gradeOrForm}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Balance</p>
                <p className="font-mono font-bold text-emerald-400">KES {balance.toLocaleString()}</p>
              </div>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('deposit')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${type === 'deposit'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <ArrowDownLeft size={15} />
                Deposit
              </button>
              <button
                type="button"
                onClick={() => setType('withdrawal')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${type === 'withdrawal'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <ArrowUpRight size={15} />
                Withdraw
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="label">Amount (KES)</label>
              <input
                className={`input font-mono text-lg ${insufficientFunds ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
              {insufficientFunds && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Insufficient balance. Max: KES {balance.toLocaleString()}
                </p>
              )}
              {lowBalance && !insufficientFunds && (
                <p className="text-amber-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Low balance warning: KES {(balance - parsedAmount).toLocaleString()} will remain
                </p>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="label">Note (optional)</label>
              <input
                className="input"
                type="text"
                placeholder="e.g., pocket money for weekend"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
              />
            </div>

            <button
              type="submit"
              disabled={!amount || insufficientFunds || parsedAmount <= 0}
              className={isWithdrawal ? 'btn-danger w-full !py-3' : 'btn-primary w-full !py-3'}
            >
              {isWithdrawal ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
              Continue to Confirm
            </button>
          </form>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            {/* Confirmation summary */}
            <div className={`rounded-xl p-4 border ${isWithdrawal ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
              <p className="text-xs text-slate-400 mb-1">Transaction Summary</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold font-mono ${isWithdrawal ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isWithdrawal ? '-' : '+'} KES {parsedAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">New balance</p>
                  <p className="font-mono font-bold text-slate-200">
                    KES {(isWithdrawal ? balance - parsedAmount : balance + parsedAmount).toLocaleString()}
                  </p>
                </div>
              </div>
              {note && <p className="text-xs text-slate-500 mt-2 border-t border-slate-700 pt-2">{note}</p>}
            </div>

            {/* PIN for withdrawals */}
            {isWithdrawal && (
              <div>
                <label className="label flex items-center gap-1.5">
                  <Shield size={12} />
                  Teacher PIN
                </label>
                <input
                  className="input font-mono tracking-widest text-center text-lg"
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">Default PIN: 1234 (change in settings)</p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep('form')} className="btn-secondary flex-1">
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || (isWithdrawal && pin.length < 4)}
                className={`flex-1 ${isWithdrawal ? 'btn-danger' : 'btn-primary'} !py-3`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isWithdrawal ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                    Confirm {type}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
