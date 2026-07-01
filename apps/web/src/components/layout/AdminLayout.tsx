import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AdminLayout = () => (
  <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-6 px-4 py-4 lg:px-6">
    <Navbar />
    <div className="grid flex-1 items-start gap-6 lg:grid-cols-[292px_minmax(0,1fr)]">
      <Sidebar />
      <main className="min-h-0 min-w-0">
        <Outlet />
      </main>
    </div>
  </div>
);
