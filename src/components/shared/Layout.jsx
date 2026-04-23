import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Users, ArrowLeftRight, BarChart3,
  LogOut, Menu, X, GraduationCap, UserCog, ChevronRight,
  Banknote
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Layout() {
  const { userProfile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const base = isAdmin ? '/admin' : '/teacher';

  const navItems = [
    { to: base, label: 'Dashboard', icon: LayoutDashboard, end: true },
    ...(isAdmin ? [{ to: `${base}/teachers`, label: 'Teachers', icon: UserCog }] : []),
    { to: `${base}/students`, label: 'Students', icon: GraduationCap },
    { to: `${base}/transactions`, label: 'Transactions', icon: ArrowLeftRight },
    { to: `${base}/reports`, label: 'Reports', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
        ${isActive
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`
      }
    >
      <item.icon size={17} />
      <span className="flex-1">{item.label}</span>
      <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
    </NavLink>
  );

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Banknote size={18} className="text-slate-950" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-100 text-sm leading-tight">SchoolCash</p>
            <p className="text-xs text-slate-500 truncate">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50 mb-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 text-xs font-bold">
              {userProfile?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200 truncate">{userProfile?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{userProfile?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-danger w-full">
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-900 border-r border-slate-800 fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Banknote size={13} className="text-slate-950" />
            </div>
            <span className="font-bold text-sm">SchoolCash</span>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
