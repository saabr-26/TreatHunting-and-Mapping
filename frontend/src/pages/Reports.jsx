import { useState, useEffect } from 'react';
import { FileText, Download, Play, Plus, CheckCircle, Shield } from 'lucide-react';
import { casesService } from '../services/cases';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [reportFormat, setReportFormat] = useState('json');
  const [generating, setGenerating] = useState(false);
  const [latestReport, setLatestReport] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reps, cs] = await Promise.all([
        casesService.listReports().catch(() => []),
        casesService.listCases().catch(() => [])
      ]);
      setReports(Array.isArray(reps) ? reps : reps.results || []);
      const caseList = Array.isArray(cs) ? cs : cs.results || [];
      setCases(caseList);
      if (caseList.length > 0) setSelectedCaseId(caseList[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    setGenerating(true);
    try {
      const rep = await casesService.generateReport(selectedCaseId, reportFormat);
      setLatestReport(rep);
      loadData();
    } catch (err) {
      console.error('Failed to generate report', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText className="text-primary" /> Incident & Executive Reports
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Compile threat timelines, MITRE ATT&CK coverage, and indicator summaries for leadership.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.5rem' }}>
        {/* Report Generator Panel */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            Generate New Report
          </h3>
          <form onSubmit={handleGenerate}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                Select Investigation Case
              </label>
              <select
                className="form-control"
                style={{ width: '100%' }}
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.severity})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                Output Format
              </label>
              <select
                className="form-control"
                style={{ width: '100%' }}
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value)}
              >
                <option value="json">Structured JSON (SOC)</option>
                <option value="markdown">Markdown Report</option>
                <option value="html">Executive HTML Brief</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={generating}>
              <Play size={16} /> {generating ? 'Compiling Report...' : 'Generate Case Report'}
            </button>
          </form>
        </div>

        {/* Generated / Archive Preview */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Report Content & Preview
          </h3>
          {latestReport ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={14} /> Generated Successfully
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Format: {latestReport.format || reportFormat}
                </span>
              </div>
              <pre style={{
                background: '#090d16',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #1e293b',
                maxHeight: '400px',
                overflowY: 'auto',
                color: '#38bdf8',
                fontSize: '0.85rem'
              }}>
                {typeof latestReport.content === 'object'
                  ? JSON.stringify(latestReport.content, null, 2)
                  : latestReport.content || JSON.stringify(latestReport, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-muted" style={{ padding: '3rem', textAlign: 'center' }}>
              Choose an active investigation on the left to compile an executive briefing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
