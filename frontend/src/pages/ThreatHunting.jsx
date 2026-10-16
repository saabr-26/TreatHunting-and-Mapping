import { useState, useEffect } from 'react';
import { Crosshair, Play, AlertCircle, CheckCircle, Clock, Shield, Search } from 'lucide-react';
import { casesService } from '../services/cases';

export default function ThreatHunting() {
  const [hunts, setHunts] = useState([]);
  const [selectedHunt, setSelectedHunt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHunts();
  }, [categoryFilter]);

  const fetchHunts = async () => {
    setLoading(true);
    try {
      const data = await casesService.listHunts(categoryFilter);
      const huntList = data.results || data;
      setHunts(huntList);
      if (huntList.length > 0 && !selectedHunt) {
        setSelectedHunt(huntList[0]);
      }
    } catch (err) {
      setError('Failed to fetch threat hunts. Showing catalog if available.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunHunt = async (hunt) => {
    if (!hunt) return;
    setRunning(true);
    setResults(null);
    setError('');
    try {
      const res = await casesService.runHunt(hunt.id);
      setResults(res);
    } catch (err) {
      setError(err?.response?.data?.message || 'Error executing hunt query against telemetry.');
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const filteredHunts = hunts.filter((h) =>
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.technique_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="hunting-page">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crosshair className="text-primary" /> Threat Hunting Console
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Execute proactive hunts across endpoint telemetry, sysmon logs, and network events.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">All Categories</option>
            <option value="persistence">Persistence</option>
            <option value="execution">Execution</option>
            <option value="lateral_movement">Lateral Movement</option>
            <option value="privilege_escalation">Privilege Escalation</option>
            <option value="defense_evasion">Defense Evasion</option>
            <option value="credential_access">Credential Access</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem' }}>
        {/* Hunt Catalog List */}
        <div className="card" style={{ padding: '1rem', height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search hunts or MITRE ID..."
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2rem', width: '100%' }}
            />
          </div>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {loading ? (
              <div className="text-muted" style={{ padding: '1rem', textAlign: 'center' }}>Loading queries...</div>
            ) : filteredHunts.length === 0 ? (
              <div className="text-muted" style={{ padding: '1rem', textAlign: 'center' }}>No hunts found.</div>
            ) : (
              filteredHunts.map((hunt) => (
                <div
                  key={hunt.id}
                  onClick={() => { setSelectedHunt(hunt); setResults(null); }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: selectedHunt?.id === hunt.id ? '#1e293b' : '#0f172a',
                    border: selectedHunt?.id === hunt.id ? '1px solid #3b82f6' : '1px solid #1e293b',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{hunt.name}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{hunt.technique_id || 'ATT&CK'}</span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {hunt.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Hunt Details & Execution Playground */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {selectedHunt ? (
            <>
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{selectedHunt.name}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span className="badge badge-primary">{selectedHunt.category || 'Threat Hunt'}</span>
                      <span className="badge badge-warning">{selectedHunt.technique_id || 'T1059'}</span>
                      <span className="badge badge-neutral">Severity: {selectedHunt.severity || 'Medium'}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    disabled={running}
                    onClick={() => handleRunHunt(selectedHunt)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Play size={16} /> {running ? 'Running Hunt...' : 'Execute Hunt'}
                  </button>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                  {selectedHunt.description}
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Splunk SPL Search Query
                  </label>
                  <pre style={{
                    background: '#090d16',
                    padding: '1rem',
                    borderRadius: '6px',
                    border: '1px solid #1e293b',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    overflowX: 'auto',
                    marginTop: '0.25rem'
                  }}>
                    {selectedHunt.spl_query || selectedHunt.query || 'index=windows EventCode=4688 | stats count by ProcessName, CommandLine'}
                  </pre>
                </div>
              </div>

              {error && (
                <div style={{ padding: '1rem', background: '#451a1a', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              {/* Execution Results */}
              <div className="card" style={{ padding: '1.5rem', flex: 1 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Hunt Execution Results
                </h4>
                {running ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Executing query against Splunk SIEM clusters...
                  </div>
                ) : results ? (
                  <div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="card" style={{ padding: '0.75rem 1.25rem', background: '#090d16' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hits Detected</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: results.results?.length > 0 ? '#ef4444' : '#10b981' }}>
                          {results.results?.length || 0}
                        </div>
                      </div>
                      <div className="card" style={{ padding: '0.75rem 1.25rem', background: '#090d16' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Status</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>
                          {results.status || 'Success'}
                        </div>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>_time</th>
                            <th>Host</th>
                            <th>User</th>
                            <th>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.results && results.results.length > 0 ? (
                            results.results.map((r, i) => (
                              <tr key={i}>
                                <td>{r._time || 'Just now'}</td>
                                <td>{r.host || 'DESKTOP-WIN10'}</td>
                                <td>{r.user || 'SYSTEM'}</td>
                                <td><code>{JSON.stringify(r)}</code></td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                                No anomalous hits returned for this time window.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Click "Execute Hunt" to query logs and inspect potential threat indicators.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Select a hunt from the catalog on the left to inspect and run.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
