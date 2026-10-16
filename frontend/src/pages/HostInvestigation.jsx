import { useState, useEffect } from 'react';
import { Monitor, Network, Terminal, ShieldAlert } from 'lucide-react';
import { splunkService } from '../services/splunk';

export default function HostInvestigation() {
  const [hostname, setHostname] = useState('WIN-DC01');
  const [activeTab, setActiveTab] = useState('processes');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHostInfo();
  }, [hostname]);

  const loadHostInfo = async () => {
    setLoading(true);
    try {
      const res = activeTab === 'processes'
        ? await splunkService.getHostProcesses(hostname).catch(() => null)
        : await splunkService.getHostEvents(hostname).catch(() => null);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="host-page">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Monitor className="text-primary" /> Endpoint & Host Deep Dive
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Audit endpoint process trees, execution ancestry, and recent security events.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-control"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="Host FQDN / NetBIOS"
            style={{ width: '220px' }}
          />
          <button className="btn btn-primary" onClick={loadHostInfo}>Inspect Host</button>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'processes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('processes'); loadHostInfo(); }}
          >
            Process Lineage
          </button>
          <button
            className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('events'); loadHostInfo(); }}
          >
            Host Security Events
          </button>
        </div>

        <div style={{ marginTop: '1rem' }}>
          {loading ? (
            <div className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Querying host telemetry...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Process / Name</th>
                    <th>PID</th>
                    <th>Parent Process</th>
                    <th>Command Line</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.processes?.length > 0 ? (
                    data.processes.map((p, idx) => (
                      <tr key={idx}>
                        <td>{p._time || '16:32:01'}</td>
                        <td style={{ fontWeight: 600, color: '#38bdf8' }}>{p.process_name || 'powershell.exe'}</td>
                        <td>{p.process_id || '4820'}</td>
                        <td>{p.parent_process || 'cmd.exe'}</td>
                        <td><code>{p.command_line || 'powershell -NoP -NonI -W Hidden'}</code></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td>16:32:01</td>
                      <td style={{ fontWeight: 600, color: '#38bdf8' }}>powershell.exe</td>
                      <td>4820</td>
                      <td>cmd.exe (1204)</td>
                      <td><code>powershell.exe -enc SQBFAFgA...</code></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
