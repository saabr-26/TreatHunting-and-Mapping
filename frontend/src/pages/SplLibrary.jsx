import { useState, useEffect } from 'react';
import { BookOpen, Copy, Check, Play, Search, Tag } from 'lucide-react';
import { casesService } from '../services/cases';

export default function SplLibrary() {
  const [queries, setQueries] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const data = await casesService.listHunts();
      setQueries(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = queries.filter(q =>
    q.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.spl_query?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.technique_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="spl-library-page">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen className="text-primary" /> Splunk SPL Hunting Playbook
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Curated detection queries, baseline logic, and threat hunting searches ready to deploy.
          </p>
        </div>
        <input
          type="text"
          className="form-control"
          placeholder="Filter queries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '250px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filtered.length > 0 ? (
          filtered.map((q) => (
            <div key={q.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: '#f8fafc' }}>{q.name}</span>
                  <span className="badge badge-warning">{q.technique_id || 'T1059'}</span>
                  <span className="badge badge-neutral">{q.category || 'Endpoint'}</span>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  onClick={() => copyToClipboard(q.spl_query || 'index=windows', q.id)}
                >
                  {copiedId === q.id ? <><Check size={14} className="text-success" /> Copied</> : <><Copy size={14} /> Copy SPL</>}
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                {q.description}
              </p>

              <pre style={{
                background: '#090d16',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                border: '1px solid #1e293b',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                overflowX: 'auto',
                margin: 0
              }}>
                {q.spl_query || 'index=windows EventCode=4688 | stats count by ProcessName'}
              </pre>
            </div>
          ))
        ) : (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No query templates match your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
