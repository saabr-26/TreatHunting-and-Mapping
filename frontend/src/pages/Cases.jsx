import { useState, useEffect } from 'react';
import { FolderSearch, Plus, ShieldAlert, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { casesService } from '../services/cases';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCase, setNewCase] = useState({ title: '', description: '', severity: 'high' });
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await casesService.listCases();
      const list = Array.isArray(data) ? data : data.results || [];
      setCases(list);
      if (list.length > 0 && !selectedCase) {
        setSelectedCase(list[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newCase.title) return;
    try {
      const created = await casesService.createCase(newCase);
      setCases([created, ...cases]);
      setSelectedCase(created);
      setShowNewModal(false);
      setNewCase({ title: '', description: '', severity: 'high' });
    } catch (err) {
      console.error('Failed to create case', err);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedCase) return;
    try {
      await casesService.addNote(selectedCase.id, noteText);
      const updated = await casesService.getCase(selectedCase.id);
      setSelectedCase(updated);
      setNoteText('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="cases-page">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderSearch className="text-primary" /> Incident & Investigation Cases
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Coordinate threat response, manage forensic artifacts, and track findings lifecycle.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> New Investigation Case
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem' }}>
        {/* Cases List */}
        <div className="card" style={{ padding: '1rem', height: 'calc(100vh - 200px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {loading ? (
            <div className="text-muted" style={{ textAlign: 'center', padding: '1rem' }}>Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="text-muted" style={{ textAlign: 'center', padding: '1rem' }}>No open cases.</div>
          ) : (
            cases.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                style={{
                  padding: '1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: selectedCase?.id === c.id ? '#1e293b' : '#0f172a',
                  border: selectedCase?.id === c.id ? '1px solid #3b82f6' : '1px solid #1e293b',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                    {c.title}
                  </span>
                  <span className={`badge ${
                    c.severity === 'critical' ? 'badge-danger' :
                    c.severity === 'high' ? 'badge-warning' : 'badge-neutral'
                  }`}>
                    {c.severity}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>Status: <strong style={{ color: '#94a3b8' }}>{c.status || 'open'}</strong></span>
                  <span>{new Date(c.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Case Detail */}
        <div style={{ height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {selectedCase ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 600 }}>{selectedCase.title}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span className="badge badge-primary">{selectedCase.status || 'OPEN'}</span>
                      <span className="badge badge-danger">Severity: {selectedCase.severity}</span>
                      <span className="badge badge-neutral">Lead: {selectedCase.assigned_to || 'SOC Analyst'}</span>
                    </div>
                  </div>
                </div>
                <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {selectedCase.description || 'No description provided.'}
                </p>
              </div>

              {/* Case Findings & Evidence */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Associated Findings & Indicators</h4>
                {selectedCase.findings && selectedCase.findings.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedCase.findings.map((f) => (
                      <div key={f.id} style={{ padding: '0.75rem', background: '#090d16', border: '1px solid #1e293b', borderRadius: '4px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{f.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>No individual findings attached to this case yet.</p>
                )}
              </div>

              {/* Investigation Notes */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Analyst Journal / Timeline Notes</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Add an investigative note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <button className="btn btn-secondary" onClick={handleAddNote}>Add Note</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedCase.notes && selectedCase.notes.length > 0 ? (
                    selectedCase.notes.map((n, i) => (
                      <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#090d16', borderRadius: '4px', borderLeft: '3px solid #3b82f6', fontSize: '0.85rem' }}>
                        <div style={{ color: '#cbd5e1' }}>{n.content || n}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>{n.created_at || 'Recently added'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>No notes recorded for this case.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Select a case from the left list to review investigation details.
            </div>
          )}
        </div>
      </div>

      {/* New Case Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99
        }}>
          <div className="card" style={{ width: '480px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Create Investigation Case</h3>
            <form onSubmit={handleCreateCase}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Title</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%' }}
                  required
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Severity</label>
                <select
                  className="form-control"
                  style={{ width: '100%' }}
                  value={newCase.severity}
                  onChange={(e) => setNewCase({ ...newCase, severity: e.target.value })}
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  style={{ width: '100%' }}
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Case</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
