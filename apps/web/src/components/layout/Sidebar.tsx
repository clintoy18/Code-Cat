import { NavLink } from 'react-router-dom';
import { Role } from '@shared/types';
import { useAuth } from '@/hooks/useAuth';

const linksByRole: Record<Role, Array<{ to: string; label: string }>> = {
  [Role.STUDENT]: [
    { to: '/', label: 'Main Menu' },
    { to: '/levels', label: 'Normal Gameplay' },
    { to: '/classroom-gameplays', label: 'Classroom Gameplay' },
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
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/levels', label: 'Levels' },
    { to: '/admin/announcements', label: 'Announcements' },
    { to: '/admin/reports', label: 'Reports' },
  ],
};

const roleHeadings: Record<Role, { title: string; copy: string }> = {
  [Role.STUDENT]: {
    title: 'Student workspace',
    copy: 'Move between built-in progression, classroom assignments, and rewards.',
  },
  [Role.TEACHER]: {
    title: 'Teacher workspace',
    copy: 'Manage classrooms, build rooms, and review outcomes in one flow.',
  },
  [Role.ADMIN]: {
    title: 'Admin workspace',
    copy: 'Review platform activity, manage official content, and post system notices.',
  },
};

export const Sidebar = () => {
  const { role } = useAuth();
  const links = role ? linksByRole[role] : [];
  const heading = role ? roleHeadings[role] : null;

  return (
    <aside className="glass-panel flex h-full flex-col gap-6 p-4 lg:sticky lg:top-4 lg:h-[calc(100dvh-2rem)] lg:overflow-y-auto">
      {heading ? (
        <div className="rounded-[14px] border border-white/5 bg-black/10 px-4 py-4">
          <p className="text-sm font-semibold text-[var(--text-0)]">{heading.title}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">{heading.copy}</p>
        </div>
      ) : null}
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-[14px] px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-[rgba(108,143,255,0.14)] text-white shadow-[inset_0_0_0_1px_rgba(108,143,255,0.16)]'
                  : 'text-[var(--text-1)] hover:bg-white/6 hover:text-white'
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
