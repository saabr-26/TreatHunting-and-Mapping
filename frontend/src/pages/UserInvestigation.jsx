import { useState, useEffect } from 'react';
import { Users, UserCheck, ShieldAlert, Key } from 'lucide-react';
import { splunkService } from '../services/splunk';

export default function UserInvestigation() {
  const [username, setUsername] = useState('Administrator');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [username]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await splunkService.getUserEvents(username);
      setEvents(res?.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="users-page">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users className="text-primary" /> Identity & Account Hunting
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Analyze privilege escalation, unusual logon types (Type 3, Type 10), and brute force patterns.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Account name / sAMAccountName"
            style={{ width: '220px' }}
          />
          <button className="btn btn-primary" onClick={fetchUserData}>Query Identity</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ACTIVE TARGET ACCOUNT</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>{username}</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PRIVILEGE LEVEL</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444' }}>Domain Admin (High)</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>DETECTED ANOMALIES</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f59e0b' }}>Off-hours Logon, Encoded CLI</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Authentication & Privilege Events</h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event ID</th>
                <th>Type</th>
                <th>Source IP / Host</th>
                <th>Logon Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2026-10-12 16:30:12</td>
                <td><span className="badge badge-info">4624</span></td>
                <td>Network Logon (Type 3)</td>
                <td>192.168.1.105</td>
                <td><span className="badge badge-success">Success</span></td>
              </tr>
              <tr>
                <td>2026-10-12 16:29:40</td>
                <td><span className="badge badge-warning">4625</span></td>
                <td>Failed Logon</td>
                <td>192.168.1.105</td>
                <td><span className="badge badge-danger">Bad Password</span></td>
              </tr>
              <tr>
                <td>2026-10-12 16:28:15</td>
                <td><span className="badge badge-primary">4672</span></td>
                <td>Special Privileges Assigned</td>
                <td>WIN-DC01</td>
                <td><span className="badge badge-warning">SeDebugPrivilege</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
