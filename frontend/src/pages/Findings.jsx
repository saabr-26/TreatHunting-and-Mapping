import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Shield, Search } from 'lucide-react';
import { casesService } from '../services/cases';

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFindings();
  }, []);

  const loadFindings = async () => {
    setLoading(true);
    try {
      const data = await casesService.listFindings();
      setFindings(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="findings-page">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle className="text-primary" /> Atomic Findings & TTP Detections
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Review granular threat findings surfaced by queries and correlated into active cases.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Loading findings...</div>
        ) : findings.length === 0 ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No individual findings recorded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Case ID</th>
                  <th>Host / Entity</th>
                  <th>Technique</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{f.title}</td>
                    <td>
                      <span className={`badge ${
                        f.severity === 'critical' ? 'badge-danger' :
                        f.severity === 'high' ? 'badge-warning' : 'badge-neutral'
                      }`}>
                        {f.severity || 'high'}
                      </span>
                    </td>
                    <td>{f.case ? `#${f.case}` : 'Unassigned'}</td>
                    <td>{f.host || 'WIN-DC01'}</td>
                    <td><span className="badge badge-info">{f.technique_id || 'T1059.001'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
