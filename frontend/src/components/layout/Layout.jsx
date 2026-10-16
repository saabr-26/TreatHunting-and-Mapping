/**
 * Main app layout — sidebar + navbar + page content.
 */
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ user, pageTitle }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar user={user} pageTitle={pageTitle} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
