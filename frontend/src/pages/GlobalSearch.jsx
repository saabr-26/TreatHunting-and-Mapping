import { useState } from 'react';
import { Search, Play, Database, Download } from 'lucide-react';
import { splunkService } from '../services/splunk';

export default function GlobalSearch() {
  const [spl, setSpl] = useState('index=windows earliest=-24h | stats count by EventCode, host');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!spl.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await splunkService.search(spl);
      setResults(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Error executing ad-hoc SPL search.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search className="text-primary" /> Ad-Hoc SPL Telemetry Query
        </h2>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          Execute freeform Splunk Processing Language (SPL) searches against connected indexers.
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleExecute}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Splunk Search Query (SPL)
            </label>
            <textarea
              className="form-control"
              rows={4}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                marginTop: '0.5rem',
                background: '#090d16',
                color: '#38bdf8'
              }}
              value={spl}
              onChange={(e) => setSpl(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setSpl('index=windows EventCode=4688 | head 50')}
              >
                Preset: Sysmon / 4688
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setSpl('index=windows EventCode=4625 | stats count by user, src_ip')}
              >
                Preset: Failed Logons
              </button>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Play size={16} /> {loading ? 'Running Search...' : 'Run SPL Search'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#451a1a', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Query Results */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={18} /> Search Output
        </h4>
        {results?.results ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  {results.results.length > 0 && Object.keys(results.results[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.results.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, colIdx) => (
                      <td key={colIdx}>{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
            Submit an SPL query to view real-time log records.
          </div>
        )}
      </div>
    </div>
  );
}
