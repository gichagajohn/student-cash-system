import { useState, useEffect } from 'react';
import { UserCog, Plus, Trash2, Edit2, X, Check, Mail, User } from 'lucide-react';
import { getAllUsers, createTeacherAccount, updateUser, deleteUser } from '../firebase/firestore';
import toast from 'react-hot-toast';

function AddTeacherModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await createTeacherAccount(form.name, form.email, form.password);
      toast.success(`Teacher account created for ${form.name}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create teacher account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="modal-content card w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Plus size={17} className="text-emerald-400" />
            Add Teacher Account
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input pl-9" placeholder="Teacher full name" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required autoFocus />
            </div>
          </div>
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input pl-9" type="email" placeholder="teacher@school.ac.ke" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min 6 characters" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={6} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 !py-3">
              {loading ? <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <><Plus size={14} /> Create Account</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchTeachers = async () => {
    setLoading(true);
    const users = await getAllUsers();
    setTeachers(users.filter((u) => u.role === 'teacher'));
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleSaveName = async (id) => {
    if (!editName.trim()) return;
    await updateUser(id, { name: editName.trim() });
    toast.success('Name updated');
    setEditId(null);
    fetchTeachers();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher account for "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteUser(id);
      toast.success('Teacher account deleted');
      fetchTeachers();
    } catch {
      toast.error('Failed to delete. Remove from Firebase Auth manually if needed.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teachers</h1>
          <p className="text-slate-400 text-sm mt-0.5">{teachers.length} teacher account{teachers.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={15} />
          Add Teacher
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : teachers.length === 0 ? (
        <div className="card p-12 text-center">
          <UserCog size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-400">No teacher accounts yet</p>
          <p className="text-sm text-slate-500 mt-1">Click "Add Teacher" to create the first one</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {editId === t.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="input py-1 text-sm"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                          />
                          <button onClick={() => handleSaveName(t.id)} className="text-emerald-400 hover:text-emerald-300 p-1">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-200 p-1">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-400 text-xs font-bold">{t.name?.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-slate-200">{t.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="text-slate-400">{t.email}</td>
                    <td>
                      <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 capitalize">
                        {t.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditId(t.id); setEditName(t.name); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Edit name"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          disabled={deleting === t.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete account"
                        >
                          {deleting === t.id
                            ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <Trash2 size={13} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <AddTeacherModal onClose={() => setShowAdd(false)} onSuccess={fetchTeachers} />
      )}
    </div>
  );
}
