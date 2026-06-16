import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout = () => {
  const location = useLocation();
  const isGameplayRoute = location.pathname === '/gameplay';

  if (isGameplayRoute) {
    return (
      <main className="min-h-screen">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8">
      <Navbar />
      <div className="grid flex-1 gap-6 lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
