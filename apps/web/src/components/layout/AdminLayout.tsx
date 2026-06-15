import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const AdminLayout = () => (
  <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8">
    <Navbar />
    <main className="glass-panel flex-1 p-6">
      <Outlet />
    </main>
  </div>
);
