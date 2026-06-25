import { NavLink } from 'react-router-dom';
import { Role } from '@shared/types';
import { useAuth } from '@/hooks/useAuth';

const linksByRole: Record<Role, Array<{ to: string; label: string }>> = {
  [Role.STUDENT]: [
    { to: '/', label: 'Main Menu' },
    { to: '/levels', label: 'Normal Gameplay' },
    { to: '/classroom-gameplays', label: 'Classroom Gameplay' },
    { to: '/gameplay', label: 'Gameplay' },
    { to: '/achievements', label: 'Achievements' },
  ],
  [Role.TEACHER]: [
    { to: '/teacher', label: 'Overview' },
    { to: '/teacher/students', label: 'Classrooms' },
    { to: '/teacher/lessons', label: 'Room Builder' },
    { to: '/teacher/progress', label: 'Progress' },
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
                  ? 'bg-white/14 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
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
