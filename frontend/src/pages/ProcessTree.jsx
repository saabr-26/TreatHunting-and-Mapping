import { useState } from 'react';
import { Network, Terminal, ChevronRight, AlertTriangle } from 'lucide-react';

export default function ProcessTree() {
  const [selectedNode, setSelectedNode] = useState(null);

  const sampleTree = {
    name: 'explorer.exe (PID: 2840)',
    user: 'CORP\\jsmith',
    path: 'C:\\Windows\\explorer.exe',
    severity: 'low',
    children: [
      {
        name: 'cmd.exe (PID: 3912)',
        user: 'CORP\\jsmith',
        path: 'C:\\Windows\\System32\\cmd.exe',
        severity: 'medium',
        children: [
          {
            name: 'powershell.exe (PID: 5104)',
            user: 'CORP\\jsmith',
            path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
            cmdline: 'powershell.exe -NoP -NonI -W Hidden -enc SQBFAFgA...',
            severity: 'critical',
            children: [
              {
                name: 'whoami.exe (PID: 6220)',
                user: 'CORP\\jsmith',
                path: 'C:\\Windows\\System32\\whoami.exe',
                cmdline: 'whoami /all',
                severity: 'low'
              },
              {
                name: 'net.exe (PID: 7114)',
                user: 'CORP\\jsmith',
                path: 'C:\\Windows\\System32\\net.exe',
                cmdline: 'net group "Domain Admins" /domain',
                severity: 'high'
              }
            ]
          }
        ]
      }
    ]
  };

  const renderNode = (node, depth = 0) => (
    <div key={node.name} style={{ marginLeft: `${depth * 24}px`, marginTop: '0.75rem' }}>
      <div
        onClick={() => setSelectedNode(node)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          background: selectedNode?.name === node.name ? '#1e293b' : '#090d16',
          border: `1px solid ${
            node.severity === 'critical' ? '#ef4444' :
            node.severity === 'high' ? '#f59e0b' : '#334155'
          }`,
          cursor: 'pointer'
        }}
      >
        <Terminal size={14} className={node.severity === 'critical' ? 'text-danger' : 'text-primary'} />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>{node.name}</span>
        {node.severity === 'critical' && <span className="badge badge-danger">ANOMALOUS</span>}
        {node.severity === 'high' && <span className="badge badge-warning">SUSPICIOUS</span>}
      </div>

      {node.children && node.children.map((child) => renderNode(child, depth + 1))}
    </div>
  );

  return (
    <div className="process-tree-page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Network className="text-primary" /> Process Ancestry & Tree Analysis
        </h2>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          Inspect parent-child execution lineage to detect unauthorized shell spawns and LOLBins.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Execution Hierarchy (Endpoint: WIN-DC01)</h4>
          <div>{renderNode(sampleTree)}</div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Process Node Inspector</h4>
          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span className="text-muted">Process Name:</span>
                <div style={{ fontWeight: 600, color: '#f8fafc' }}>{selectedNode.name}</div>
              </div>
              <div>
                <span className="text-muted">User Context:</span>
                <div style={{ color: '#cbd5e1' }}>{selectedNode.user}</div>
              </div>
              <div>
                <span className="text-muted">Binary Image Path:</span>
                <div style={{ color: '#cbd5e1', wordBreak: 'break-all' }}>{selectedNode.path}</div>
              </div>
              {selectedNode.cmdline && (
                <div>
                  <span className="text-muted">Executed Command Line:</span>
                  <pre style={{ background: '#090d16', padding: '0.5rem', borderRadius: '4px', border: '1px solid #1e293b', color: '#38bdf8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {selectedNode.cmdline}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
              Click any process node in the tree to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
