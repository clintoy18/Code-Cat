import { Link } from 'react-router-dom';
import { Role } from '@shared/types';
import { useAuth } from '@/hooks/useAuth';

const linksByRole: Record<Role, Array<{ to: string; label: string }>> = {
  [Role.STUDENT]: [
    { to: '/', label: 'Main Menu' },
    { to: '/levels', label: 'Levels' },
    { to: '/gameplay', label: 'Gameplay' },
    { to: '/achievements', label: 'Achievements' },
  ],
  [Role.TEACHER]: [
    { to: '/teacher', label: 'Teacher Hub' },
    { to: '/teacher/students', label: 'Students' },
    { to: '/teacher/lessons', label: 'Lesson Notes' },
  ],
  [Role.ADMIN]: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/levels', label: 'Levels' },
    { to: '/admin/reports', label: 'Reports' },
  ],
};

export const Sidebar = () => {
  const { role } = useAuth();
  const links = role ? linksByRole[role] : [];

  return (
    <aside className="glass-panel h-fit p-4">
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white/70"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};
