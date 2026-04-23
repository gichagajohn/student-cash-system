import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { createStudent, getAllUsers } from '../../firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function AddStudentModal({ onClose, onSuccess }) {
  const { userProfile, isAdmin } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({
    fullName: '',
    admissionNumber: '',
    gradeOrForm: '',
    teacherIds: isAdmin ? [] : [userProfile?.id],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      getAllUsers().then((users) => setTeachers(users.filter((u) => u.role === 'teacher')));
    }
  }, [isAdmin]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleTeacherToggle = (id) => {
    setForm((f) => ({
      ...f,
      teacherIds: f.teacherIds.includes(id)
        ? f.teacherIds.filter((t) => t !== id)
        : [...f.teacherIds, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.teacherIds.length === 0) return toast.error('Assign at least one teacher');
    setLoading(true);
    try {
      await createStudent(form);
      toast.success(`Student ${form.fullName} registered`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  const grades = [
    'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8', 'Grade 9','Grade 10','Grade 11','Grade 12',
    'Form 1','Form 2','Form 3','Form 4',
  ];

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="modal-content card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <UserPlus size={18} className="text-emerald-400" />
            Register Student
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              name="fullName"
              placeholder="e.g., John Kamau Njoroge"
              value={form.fullName}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Admission Number</label>
            <input
              className="input font-mono"
              name="admissionNumber"
              placeholder="e.g., ADM-2024-001"
              value={form.admissionNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">Grade / Form</label>
            <select
              className="input"
              name="gradeOrForm"
              value={form.gradeOrForm}
              onChange={handleChange}
              required
            >
              <option value="">Select grade or form...</option>
              {grades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {isAdmin && teachers.length > 0 && (
            <div>
              <label className="label">Assign Teacher(s)</label>
              <div className="flex flex-col gap-2 bg-slate-800/50 rounded-xl p-3">
                {teachers.map((t) => (
                  <label key={t.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-700/30 p-2 rounded-lg">
                    <input
                      type="checkbox"
                      checked={form.teacherIds.includes(t.id)}
                      onChange={() => handleTeacherToggle(t.id)}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-xs text-slate-400">Student will be assigned to your account</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 !py-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <><UserPlus size={15} /> Register Student</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
