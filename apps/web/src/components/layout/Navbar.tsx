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
  const roleLabel = role ? roleLabelMap[role] : 'Guest';

  return (
    <header className="glass-panel flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <Link to="/" className="brand-mark gap-3">
        <img src={codeCatLogo} alt="Code Cat" className="brand-mark__logo" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-0)]">Code Cat</p>
          <p className="text-sm text-[var(--text-2)]">
            {role === Role.TEACHER
              ? 'Classroom builder'
              : role === Role.ADMIN
                ? 'System oversight'
                : 'Playable coding rooms'}
          </p>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        {role ? (
          <span className="teacher-tag">
            {roleLabel}
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-0)]">
            {user?.username ?? 'Guest'}
          </p>
          <p className="text-xs text-[var(--text-2)]">
            Signed in as {roleLabel.toLowerCase()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="teacher-button-secondary min-h-[2.75rem] px-4"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
};
