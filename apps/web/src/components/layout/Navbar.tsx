import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Role } from '@shared/types';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import codeCatLogo from '@/assets/codecat-logo.png';

const roleLabelMap: Record<Role, string> = {
  [Role.STUDENT]: 'Student',
  [Role.TEACHER]: 'Teacher',
  [Role.ADMIN]: 'Admin',
};

export const Navbar = () => {
  const { user, role, logout } = useAuth();

  return (
    <header className="glass-panel flex items-center justify-between px-6 py-4">
      <Link to="/" className="brand-mark">
        <img src={codeCatLogo} alt="Code Cat" className="brand-mark__logo" />
      </Link>
      <div className="flex items-center gap-3">
        {role ? (
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            {roleLabelMap[role]}
          </span>
        ) : null}
        <span className="text-sm text-slate-600">{user?.username ?? 'Guest'}</span>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
};
