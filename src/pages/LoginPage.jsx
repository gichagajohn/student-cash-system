import { useState } from 'react';
import { Banknote, Eye, EyeOff, ExternalLink, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import JgMark from '../components/shared/JgMark';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { profile } = await login(email, password);

      if (!profile) {
        toast.error('Account found but no profile set up. Contact administrator.');
        return;
      }

      toast.success('Welcome back!');
      // Redirect handled automatically by App.jsx once userProfile is set

    } catch (err) {
      const msg =
        err.code === 'auth/invalid-credential' ? 'Invalid email or password' :
        err.code === 'auth/user-not-found' ? 'No account found with this email' :
        err.code === 'auth/wrong-password' ? 'Incorrect password' :
        err.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later.' :
        'Login failed. Check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/20">
            <Banknote size={28} className="text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold">SchoolCash</h1>
          <p className="text-slate-400 text-sm mt-1">Student Cash Management System</p>
          <a
            href="https://gichagajohn.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-300"
            aria-label="Visit John Gichaga's portfolio, opens in a new tab"
          >
            <JgMark className="h-5 w-5" />
            <span>By John Gichaga</span>
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-200 mb-5">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input pl-9" type="email" placeholder="your@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input pl-9 pr-10" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3 mt-1 text-base">
              {loading ? <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Contact your administrator if you need access
        </p>
      </div>
    </div>
  );
}