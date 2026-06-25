import { NavLink } from 'react-router-dom';
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
    <aside className="glass-panel flex h-full flex-col p-4 lg:sticky lg:top-6 lg:h-[calc(100dvh-7.5rem)] lg:overflow-y-auto">
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-white/80 text-slate-900'
                  : 'text-slate-700 hover:bg-white/70'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
