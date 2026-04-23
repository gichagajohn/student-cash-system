import { useState, useEffect } from 'react';
import { Download, FileText, Users, BarChart3, RefreshCw } from 'lucide-react';
import {
  getAllStudents,
  getStudentsByTeacher,
  getAllTransactions,
  getTransactionsByTeacher,
  getTransactionsByStudent,
  calculateBalance,
  getUserById,
} from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { userProfile, isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [studentBalances, setStudentBalances] = useState({});
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [sts, txs] = await Promise.all([
        isAdmin ? getAllStudents() : getStudentsByTeacher(userProfile.id),
        isAdmin ? getAllTransactions() : getTransactionsByTeacher(userProfile.id),
      ]);
      setStudents(sts);
      setTransactions(txs);

      const map = {};
      await Promise.all(
        sts.map(async (s) => {
          const studentTxs = await getTransactionsByStudent(s.id);
          map[s.id] = calculateBalance(studentTxs);
        })
      );
      setStudentBalances(map);
      setLoading(false);
    }
    load();
  }, [userProfile?.id]);

  // --- CSV Export helpers ---

  const downloadCSV = (filename, data, fields) => {
    const csv = Papa.unparse({ fields, data });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportStudentStatement = async () => {
    if (!selectedStudentId) return toast.error('Select a student first');
    setGenerating(true);
    try {
      const student = students.find((s) => s.id === selectedStudentId);
      const txs = await getTransactionsByStudent(selectedStudentId);
      const sorted = [...txs].reverse();

      let running = 0;
      const rows = sorted.map((tx) => {
        running = tx.type === 'deposit' ? running + tx.amount : running - tx.amount;
        return {
          Date: tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'dd MMM yyyy HH:mm:ss') : '',
          Type: tx.isReversal ? 'REVERSAL' : tx.type.toUpperCase(),
          Amount: tx.amount,
          Balance: running,
          Note: tx.note || '',
          'Transaction ID': tx.id,
        };
      });

      downloadCSV(
        `statement_${student.admissionNumber}_${format(new Date(), 'yyyyMMdd')}.csv`,
        rows,
        ['Date', 'Type', 'Amount', 'Balance', 'Note', 'Transaction ID']
      );
      toast.success('Statement exported');
    } finally {
      setGenerating(false);
    }
  };

  const exportAllStudents = async () => {
    setGenerating(true);
    try {
      const rows = students.map((s) => ({
        'Full Name': s.fullName,
        'Admission No.': s.admissionNumber,
        Grade: s.gradeOrForm,
        Balance: studentBalances[s.id] ?? 0,
      }));
      downloadCSV(
        `all_students_${format(new Date(), 'yyyyMMdd')}.csv`,
        rows,
        ['Full Name', 'Admission No.', 'Grade', 'Balance']
      );
      toast.success('Student report exported');
    } finally {
      setGenerating(false);
    }
  };

  const exportAllTransactions = async () => {
    setGenerating(true);
    try {
      const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));
      const rows = transactions.map((tx) => {
        const student = studentMap[tx.studentId];
        return {
          Date: tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'dd MMM yyyy HH:mm:ss') : '',
          Type: tx.isReversal ? 'REVERSAL' : tx.type.toUpperCase(),
          'Student Name': student?.fullName || tx.studentId,
          'Admission No.': student?.admissionNumber || '',
          Grade: student?.gradeOrForm || '',
          Amount: tx.amount,
          Note: tx.note || '',
          'Transaction ID': tx.id,
        };
      });
      downloadCSV(
        `all_transactions_${format(new Date(), 'yyyyMMdd')}.csv`,
        rows,
        ['Date', 'Type', 'Student Name', 'Admission No.', 'Grade', 'Amount', 'Note', 'Transaction ID']
      );
      toast.success('Transactions exported');
    } finally {
      setGenerating(false);
    }
  };

  const totalFunds = Object.values(studentBalances).reduce((a, b) => a + b, 0);
  const totalDeposits = transactions.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter((t) => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
  const zeroBalance = students.filter((s) => (studentBalances[s.id] ?? 0) === 0).length;
  const lowBalance = students.filter((s) => {
    const b = studentBalances[s.id] ?? 0;
    return b > 0 && b < 500;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-slate-400 text-sm mt-0.5">Export and analyse financial data</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Funds Held', value: `KES ${totalFunds.toLocaleString()}`, color: 'text-emerald-400' },
          { label: 'Total Deposited', value: `KES ${totalDeposits.toLocaleString()}`, color: 'text-blue-400' },
          { label: 'Total Withdrawn', value: `KES ${totalWithdrawals.toLocaleString()}`, color: 'text-red-400' },
          { label: 'Total Students', value: students.length, color: 'text-slate-200' },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{item.label}</p>
            <p className={`font-mono font-bold text-xl ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Balance Distribution */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-emerald-400" />
          Balance Overview
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{students.length - zeroBalance - lowBalance}</p>
            <p className="text-xs text-slate-400 mt-1">Healthy Balance</p>
            <p className="text-xs text-slate-500">(≥ KES 500)</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{lowBalance}</p>
            <p className="text-xs text-slate-400 mt-1">Low Balance</p>
            <p className="text-xs text-slate-500">(&lt; KES 500)</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-400">{zeroBalance}</p>
            <p className="text-xs text-slate-400 mt-1">Zero Balance</p>
            <p className="text-xs text-slate-500">(KES 0)</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Download size={16} className="text-emerald-400" />
          Export Reports (CSV)
        </h2>
        <div className="flex flex-col gap-4">
          {/* Student Statement */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
              <div>
                <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                  <FileText size={15} className="text-blue-400" />
                  Student Statement
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Full transaction history for one student (like a bank statement)</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                <select
                  className="input flex-1 sm:w-48"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">Select student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
                <button
                  onClick={exportStudentStatement}
                  disabled={!selectedStudentId || generating}
                  className="btn-primary flex-shrink-0"
                >
                  {generating ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* All Students */}
          <div className="bg-slate-800/50 rounded-xl p-4 flex items-start justify-between gap-3 flex-col sm:flex-row">
            <div>
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Users size={15} className="text-emerald-400" />
                All Students Summary
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">List of all students with their current balances</p>
            </div>
            <button onClick={exportAllStudents} disabled={generating} className="btn-primary flex-shrink-0">
              {generating ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              Export CSV
            </button>
          </div>

          {/* All Transactions */}
          <div className="bg-slate-800/50 rounded-xl p-4 flex items-start justify-between gap-3 flex-col sm:flex-row">
            <div>
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <BarChart3 size={15} className="text-purple-400" />
                All Transactions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Complete audit trail of every transaction in the system</p>
            </div>
            <button onClick={exportAllTransactions} disabled={generating} className="btn-primary flex-shrink-0">
              {generating ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Student Balance Table */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-semibold text-slate-300">Student Balances</h2>
          <span className="text-xs text-slate-500">{students.length} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Grade</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...students]
                .sort((a, b) => (studentBalances[b.id] ?? 0) - (studentBalances[a.id] ?? 0))
                .map((s) => {
                  const bal = studentBalances[s.id] ?? 0;
                  return (
                    <tr key={s.id}>
                      <td className="font-medium">{s.fullName}</td>
                      <td className="font-mono text-xs">{s.admissionNumber}</td>
                      <td>{s.gradeOrForm}</td>
                      <td className={`font-mono font-bold ${bal > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        KES {bal.toLocaleString()}
                      </td>
                      <td>
                        {bal === 0 ? (
                          <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">Zero</span>
                        ) : bal < 500 ? (
                          <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Low</span>
                        ) : (
                          <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
