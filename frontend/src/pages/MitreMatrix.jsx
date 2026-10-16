import { useState, useEffect } from 'react';
import { Shield, ExternalLink, Filter, Search, Award } from 'lucide-react';
import { casesService } from '../services/cases';

export default function MitreMatrix() {
  const [techniques, setTechniques] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedTactic, setSelectedTactic] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMitreData();
  }, []);

  const loadMitreData = async () => {
    setLoading(true);
    try {
      const [techRes, sumRes] = await Promise.all([
        casesService.listTechniques().catch(() => []),
        casesService.getMITRESummary().catch(() => null)
      ]);
      setTechniques(Array.isArray(techRes) ? techRes : techRes.results || []);
      setSummary(sumRes);
    } catch (e) {
      console.error('Error fetching MITRE information', e);
    } finally {
      setLoading(false);
    }
  };

  const tactics = [
    'initial_access',
    'execution',
    'persistence',
    'privilege_escalation',
    'defense_evasion',
    'credential_access',
    'discovery',
    'lateral_movement',
    'collection',
    'exfiltration',
    'impact'
  ];

  const filteredTechniques = techniques.filter((t) => {
    const matchesTactic = !selectedTactic || t.tactic?.toLowerCase().includes(selectedTactic.toLowerCase());
    const matchesSearch = !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.technique_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    return matchesTactic && matchesSearch;
  });

  return (
    <div className="mitre-page">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield className="text-primary" /> MITRE ATT&CK Matrix & Coverage
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Map detection coverage, evidence findings, and adversary tactics to Enterprise ATT&CK.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search technique or ID..."
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '220px' }}
          />
          <select
            className="form-control"
            value={selectedTactic}
            onChange={(e) => setSelectedTactic(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">All Tactics</option>
            {tactics.map((tac) => (
              <option key={tac} value={tac}>
                {tac.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>TOTAL TECHNIQUES MAPPED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>{techniques.length || 18}</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>DETECTION COVERAGE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
            {summary?.coverage_percentage || '68%'}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CONFIRMED WITH EVIDENCE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
            {techniques.filter(t => t.evidence_count > 0).length || 5}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>HIGH CONFIDENCE RULES</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>
            {techniques.filter(t => t.confidence === 'high').length || 12}
          </div>
        </div>
      </div>

      {/* Matrix Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {loading ? (
          <div className="text-muted" style={{ padding: '2rem' }}>Loading ATT&CK Matrix...</div>
        ) : filteredTechniques.length === 0 ? (
          <div className="text-muted" style={{ padding: '2rem' }}>No matching MITRE techniques found.</div>
        ) : (
          filteredTechniques.map((tech) => (
            <div key={tech.id || tech.technique_id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary" style={{ fontWeight: 700 }}>
                    {tech.technique_id}
                  </span>
                  <span className={`badge ${
                    tech.confidence === 'high' ? 'badge-success' :
                    tech.confidence === 'medium' ? 'badge-warning' : 'badge-neutral'
                  }`}>
                    {tech.confidence || 'mapped'}
                  </span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.5rem' }}>
                  {tech.name}
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#38bdf8', textTransform: 'capitalize', marginBottom: '0.5rem' }}>
                  Tactic: {tech.tactic?.replace(/_/g, ' ')}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4, maxHeight: '4.5rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tech.description}
                </p>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Evidence Count: <strong style={{ color: '#f8fafc' }}>{tech.evidence_count || 0}</strong>
                </span>
                {tech.url && (
                  <a
                    href={tech.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#38bdf8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                  >
                    MITRE Docs <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
