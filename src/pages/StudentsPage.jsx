import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, GraduationCap, ChevronRight, Filter } from 'lucide-react';
import {
  getAllStudents,
  getStudentsByTeacher,
  getTransactionsByStudent,
  calculateBalance,
} from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import AddStudentModal from '../components/shared/AddStudentModal';

export default function StudentsPage() {
  const { userProfile, isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [balances, setBalances] = useState({});
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const base = isAdmin ? '/admin' : '/teacher';

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = isAdmin
        ? await getAllStudents()
        : await getStudentsByTeacher(userProfile.id);
      setStudents(data);

      // Fetch balances
      const map = {};
      await Promise.all(
        data.map(async (s) => {
          const txs = await getTransactionsByStudent(s.id);
          map[s.id] = calculateBalance(txs);
        })
      );
      setBalances(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [userProfile?.id]);

  const grades = [...new Set(students.map((s) => s.gradeOrForm))].sort();

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.admissionNumber.toLowerCase().includes(q);
    const matchGrade = !gradeFilter || s.gradeOrForm === gradeFilter;
    return matchSearch && matchGrade;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-slate-400 text-sm mt-0.5">{students.length} registered student{students.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={15} />
          Add Student
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search by name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            className="input pl-9 pr-8 appearance-none min-w-[160px]"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="">All Grades</option>
            {grades.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Students List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <GraduationCap size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-400">
            {search || gradeFilter ? 'No students match your search' : 'No students registered yet'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {!search && !gradeFilter && 'Click "Add Student" to get started'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card hidden sm:block">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission No.</th>
                    <th>Grade</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const bal = balances[s.id] ?? 0;
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-slate-400">{s.fullName.charAt(0)}</span>
                            </div>
                            <span className="font-medium text-slate-200">{s.fullName}</span>
                          </div>
                        </td>
                        <td className="font-mono text-xs">{s.admissionNumber}</td>
                        <td>{s.gradeOrForm}</td>
                        <td>
                          <span className={`font-mono font-semibold ${bal > 0 ? 'text-emerald-400' : bal === 0 ? 'text-slate-400' : 'text-red-400'}`}>
                            KES {bal.toLocaleString()}
                          </span>
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
                        <td>
                          <Link
                            to={`${base}/students/${s.id}`}
                            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            View <ChevronRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((s) => {
              const bal = balances[s.id] ?? 0;
              return (
                <Link key={s.id} to={`${base}/students/${s.id}`} className="card-hover p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-slate-400">{s.fullName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{s.fullName}</p>
                    <p className="text-xs text-slate-500">{s.admissionNumber} · {s.gradeOrForm}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-mono font-bold text-sm ${bal > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      KES {bal.toLocaleString()}
                    </p>
                    <ChevronRight size={14} className="text-slate-600 ml-auto mt-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {showAdd && (
        <AddStudentModal
          onClose={() => setShowAdd(false)}
          onSuccess={fetchStudents}
        />
      )}
    </div>
  );
}
