import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout = () => (
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
