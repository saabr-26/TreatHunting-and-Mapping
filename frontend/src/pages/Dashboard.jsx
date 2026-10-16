/**
 * SOC Dashboard — KPI cards + charts from real Splunk data.
 */
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Activity, Monitor, Users, AlertTriangle, FolderSearch, Shield
} from 'lucide-react';
import { splunkService } from '../services/splunk';
import { casesService } from '../services/cases';

const SEVERITY_COLORS = ['#38bdf8', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a78bfa'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [caseCount, setCaseCount] = useState(0);
  const [techniqueCount, setTechniqueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('-24h');

  useEffect(() => {
    fetchDashboard();
  }, [timeRange]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, cases, mitre] = await Promise.all([
        splunkService.getDashboard(timeRange).catch(() => null),
        casesService.listCases().catch(() => ({ results: [] })),
        casesService.getMITRESummary().catch(() => ({ total_techniques: 0 })),
      ]);
      setData(dashboard);
      setCaseCount(cases?.results?.length || cases?.count || 0);
      setTechniqueCount(mitre?.total_techniques || 0);
    } catch (err) {
      setError('Failed to load dashboard data. Check Splunk connectivity.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <span>Loading dashboard from Splunk...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const authSummary = data?.auth_summary || {};
  const authData = [
    { name: 'Success', value: authSummary.success || 0 },
    { name: 'Failure', value: authSummary.failure || 0 },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">SOC Dashboard</h1>
          <p className="page-subtitle">Real-time security overview from Splunk</p>
        </div>
        <select
          className="form-select"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{ width: '160px' }}
        >
          <option value="-1h">Last 1 Hour</option>
          <option value="-4h">Last 4 Hours</option>
          <option value="-24h">Last 24 Hours</option>
          <option value="-7d">Last 7 Days</option>
          <option value="-30d">Last 30 Days</option>
          <option value="0">All Time</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card accent">
          <div className="kpi-icon"><Activity size={32} /></div>
          <div className="kpi-label">Total Events</div>
          <div className="kpi-value">{(stats.total_events || 0).toLocaleString()}</div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-icon"><Monitor size={32} /></div>
          <div className="kpi-label">Hosts Monitored</div>
          <div className="kpi-value">{stats.unique_hosts || 0}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Users size={32} /></div>
          <div className="kpi-label">Users Observed</div>
          <div className="kpi-value">{stats.unique_users || 0}</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-icon"><AlertTriangle size={32} /></div>
          <div className="kpi-label">Event Codes</div>
          <div className="kpi-value">{stats.unique_event_codes || 0}</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-icon"><FolderSearch size={32} /></div>
          <div className="kpi-label">Open Cases</div>
          <div className="kpi-value">{caseCount}</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-icon"><Shield size={32} /></div>
          <div className="kpi-label">MITRE Techniques</div>
          <div className="kpi-value">{techniqueCount}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Events Over Time */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Events Over Time</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data?.events_over_time || []}>
              <XAxis
                dataKey="_time"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => v ? new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a2332', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Auth Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Authentication Summary</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={authData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                innerRadius={60} outerRadius={90} paddingAngle={5}>
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #334155', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '8px' }}>
            <span style={{ fontSize: '12px', color: '#22c55e' }}>● Success: {authSummary.success || 0}</span>
            <span style={{ fontSize: '12px', color: '#ef4444' }}>● Failure: {authSummary.failure || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Top Hosts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Hosts</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={(data?.top_hosts || []).slice(0, 8)} layout="vertical">
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis dataKey="host" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Event Codes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Event IDs</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={(data?.top_event_codes || []).slice(0, 10)}>
              <XAxis dataKey="EventCode" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(data?.top_event_codes || []).slice(0, 10).map((_, i) => (
                  <Cell key={i} fill={SEVERITY_COLORS[i % SEVERITY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
