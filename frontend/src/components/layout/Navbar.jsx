/**
 * Top Navbar — shows page title, user info, and actions.
 */
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import { authService } from '../../services/auth';

export default function Navbar({ user, pageTitle }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const initials = user
    ? (user.first_name?.[0] || user.username[0]).toUpperCase()
    : '?';

  return (
    <nav className="navbar">
      <h2 className="navbar-title">{pageTitle || 'Dashboard'}</h2>

      <div className="navbar-actions">
        <button className="btn-icon" title="Notifications">
          <Bell size={18} />
        </button>

        <div className="navbar-user" onClick={handleLogout} title="Logout">
          <div className="navbar-avatar">{initials}</div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {user?.username || 'Analyst'}
          </span>
          <LogOut size={16} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>
    </nav>
  );
}
