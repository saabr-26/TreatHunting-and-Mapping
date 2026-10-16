/**
 * Sidebar navigation — SOC-style left panel.
 */
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Crosshair, BookOpen, Clock, AlertTriangle,
  FolderSearch, Monitor, Users, Shield, Search, FileText, Network
} from 'lucide-react';

const navItems = [
  { section: 'Overview', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { section: 'Hunting', items: [
    { to: '/hunt', icon: Crosshair, label: 'Threat Hunting' },
    { to: '/spl-library', icon: BookOpen, label: 'SPL Library' },
  ]},
  { section: 'Investigation', items: [
    { to: '/timeline', icon: Clock, label: 'Event Timeline' },
    { to: '/findings', icon: AlertTriangle, label: 'Findings' },
    { to: '/cases', icon: FolderSearch, label: 'Cases' },
  ]},
  { section: 'Analysis', items: [
    { to: '/hosts', icon: Monitor, label: 'Host Investigation' },
    { to: '/users', icon: Users, label: 'User Investigation' },
    { to: '/processes', icon: Network, label: 'Process Tree' },
    { to: '/mitre', icon: Shield, label: 'MITRE ATT&CK' },
  ]},
  { section: 'Tools', items: [
    { to: '/search', icon: Search, label: 'Global Search' },
    { to: '/reports', icon: FileText, label: 'Reports' },
  ]},
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="shield-icon">🛡️</div>
        <h1>
          ThreatHunt
          <span>Security Platform</span>
        </h1>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
