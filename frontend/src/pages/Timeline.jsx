import { useState } from 'react';
import { Clock, Filter, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { splunkService } from '../services/splunk';

export default function Timeline() {
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [events, setEvents] = useState([
    {
      time: '2026-10-12 16:30:12',
      event_id: '4624',
      type: 'Successful Logon',
      host: 'WIN-DC01',
      user: 'Administrator',
      severity: 'medium',
      summary: 'Logon Type 3 (Network) from 192.168.1.105'
    },
    {
      time: '2026-10-12 16:32:45',
      event_id: '4688',
      type: 'Process Creation',
      host: 'WIN-DC01',
      user: 'Administrator',
      severity: 'critical',
      summary: 'cmd.exe spawned powershell.exe -enc SQBFAFgA... (Base64 payload)'
    },
    {
      time: '2026-10-12 16:35:10',
      event_id: '7045',
      type: 'Service Installed',
      host: 'WIN-DC01',
      user: 'SYSTEM',
      severity: 'high',
      summary: 'New service created: UpdateService (Image: C:\\Windows\\Temp\\svc.exe)'
    },
    {
      time: '2026-10-12 16:40:02',
      event_id: 'Sysmon-3',
      type: 'Network Connection',
      host: 'WIN-DC01',
      user: 'SYSTEM',
      severity: 'critical',
      summary: 'Outbound TCP connection to 185.220.101.5:443 (Known C2 domain)'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleCorrelate = async (e) => {
    e.preventDefault();
    if (!host && !username) return;
    setLoading(true);
    try {
      const res = await splunkService.correlateEvents(host, username, new Date().toISOString());
      if (res && res.events) {
        setEvents(res.events);
      }
    } catch (err) {
      console.warn('Backend correlate call failed or returned mock', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="timeline-page">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock className="text-primary" /> Forensic Event Timeline
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Reconstruct attacker intrusion kill chains across correlated security event telemetry.
          </p>
        </div>
      </div>

      {/* Filter / Pivot bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleCorrelate} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Host (e.g. WIN-DC01)"
              className="form-control"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="User (e.g. Administrator)"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Correlating...' : 'Pivot & Correlate'}
          </button>
        </form>
      </div>

      {/* Visual Timeline list */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ position: 'relative', borderLeft: '2px solid #334155', marginLeft: '1.5rem', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {events.map((evt, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              {/* Dot */}
              <div style={{
                position: 'absolute',
                left: '-2.55rem',
                top: '0.2rem',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: evt.severity === 'critical' ? '#ef4444' : evt.severity === 'high' ? '#f59e0b' : '#38bdf8',
                border: '3px solid #0f172a'
              }} />

              <div style={{
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {evt.time}
                    </span>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                      EventID: {evt.event_id}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>
                      {evt.type}
                    </span>
                  </div>
                  <span className={`badge ${
                    evt.severity === 'critical' ? 'badge-danger' :
                    evt.severity === 'high' ? 'badge-warning' : 'badge-neutral'
                  }`}>
                    {evt.severity.toUpperCase()}
                  </span>
                </div>

                <p style={{ margin: '0.5rem 0 0.75rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
                  {evt.summary}
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>Host: <strong style={{ color: '#94a3b8' }}>{evt.host}</strong></span>
                  <span>User: <strong style={{ color: '#94a3b8' }}>{evt.user}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
