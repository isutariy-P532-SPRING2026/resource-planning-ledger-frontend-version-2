import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlan, addChildNode, getPlanReport, getPlanMetrics } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Spinner     from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PlanTree    from '../components/PlanTree.jsx';

function pruneToDepth(node, depth) {
  if (!node) return node;
  const hasChildren = (node.children?.length ?? 0) > 0;
  if (depth <= 1) {
    return { ...node, children: [], _pruned: node.type === 'PLAN' && hasChildren };
  }
  return {
    ...node,
    _pruned: false,
    children: (node.children ?? []).map(child => pruneToDepth(child, depth - 1)),
  };
}

function ReportModal({ planId, onClose }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    getPlanReport(planId)
      .then(setRows)
      .catch(e => toast(e?.response?.data?.message || e.message, 'error'))
      .finally(() => setLoading(false));
  }, [planId]);

  function statusColor(s) {
    if (s === 'COMPLETED')   return '#15803d';
    if (s === 'IN_PROGRESS') return '#1d4ed8';
    if (s === 'SUSPENDED')   return '#92400e';
    if (s === 'ABANDONED')   return '#991b1b';
    return '#374151';
  }

  const lines = rows.map(r => {
    const indent = '  '.repeat(r.depth);
    const type   = r.type === 'PLAN' ? '📁' : '📌';
    const allocs = r.allocations
      ? Object.entries(r.allocations).map(([k, v]) => `${k}: ${v}`).join(', ')
      : '';
    return `${indent}${type} ${r.name}  [${r.status}]${allocs ? `  {${allocs}}` : ''}`;
  }).join('\n');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h2 style={{ marginBottom: 0 }}>Plan Report</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close ×</button>
        </div>
        {loading ? <Spinner /> : (
          rows.length === 0
            ? <p className="muted">No nodes in this plan.</p>
            : <pre className="report-pre">{lines}</pre>
        )}
      </div>
    </div>
  );
}

function MetricsModal({ planId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    getPlanMetrics(planId)
      .then(setData)
      .catch(e => toast(e?.response?.data?.message || e.message, 'error'))
      .finally(() => setLoading(false));
  }, [planId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h2 style={{ marginBottom: 0 }}>Plan Metrics</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close ×</button>
        </div>
        {loading ? <Spinner /> : !data ? <p className="muted">No data.</p> : (
          <div>
            <p style={{ marginBottom: 8 }}>
              <strong>Completion:</strong>{' '}
              {data.completion.completedActions} / {data.completion.totalActions} actions completed
              {data.completion.totalActions > 0 && (
                <span className="muted"> ({Math.round(data.completion.completionRatio * 100)}%)</span>
              )}
            </p>
            <div style={{ marginBottom: 8 }}>
              <strong>Resources allocated:</strong>
              {Object.keys(data.resourceCost.totalByResource).length === 0 ? (
                <span className="muted" style={{ marginLeft: 6 }}>none</span>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
                  <tbody>
                    {Object.entries(data.resourceCost.totalByResource).map(([res, qty]) => (
                      <tr key={res}>
                        <td style={{ padding: '3px 8px', color: 'var(--muted)' }}>{res}</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 500 }}>{Number(qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p style={{ margin: 0 }}>
              <strong>Risk:</strong>{' '}
              <span className={`badge badge-risk-${data.risk.riskLevel}`}>{data.risk.riskLevel}</span>
              {' '}score {data.risk.riskScore}
              {(data.risk.suspendedActions > 0 || data.risk.abandonedActions > 0) && (
                <span className="muted"> ({data.risk.suspendedActions} suspended, {data.risk.abandonedActions} abandoned)</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const fullTreeRef = useRef(null);

  const [plan,        setPlan]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [depth,       setDepth]       = useState(10);
  const [selected,    setSelected]    = useState(null);
  const [showReport,  setShowReport]  = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  const [nodeMetrics,        setNodeMetrics]        = useState(null);
  const [nodeMetricsLoading, setNodeMetricsLoading] = useState(false);
  const [nodeMetricsError,   setNodeMetricsError]   = useState('');

  // Add child form
  const [childName, setChildName] = useState('');
  const [childType, setChildType] = useState('ACTION');
  const [adding,    setAdding]    = useState(false);
  const [childErr,  setChildErr]  = useState('');

  function load() {
    setLoading(true);
    getPlan(id)
      .then(data => {
        fullTreeRef.current = data;
        setPlan(pruneToDepth(data, depth));
      })
      .catch(e => toast(e?.response?.data?.message || e.message, 'error'))
      .finally(() => setLoading(false));
  }

  function handleDepthChange(newDepth) {
    setDepth(newDepth);
    if (fullTreeRef.current) setPlan(pruneToDepth(fullTreeRef.current, newDepth));
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    setNodeMetrics(null);
    setNodeMetricsError('');
    if (!selected || selected.type !== 'PLAN') return;
    setNodeMetricsLoading(true);
    getPlanMetrics(selected.id)
      .then(setNodeMetrics)
      .catch(e => setNodeMetricsError(e?.response?.data?.message || e.message))
      .finally(() => setNodeMetricsLoading(false));
  }, [selected?.id]);

  const targetId   = selected?.type === 'PLAN' ? selected.id : (plan?.id ?? null);
  const targetName = selected?.type === 'PLAN' ? selected.name : plan?.name;

  async function handleAddChild(e) {
    e.preventDefault();
    if (!childName.trim()) { setChildErr('Name is required'); return; }
    if (!targetId) return;
    setAdding(true); setChildErr('');
    try {
      await addChildNode(targetId, { name: childName.trim(), type: childType });
      toast(`${childType === 'PLAN' ? 'Sub-plan' : 'Action'} "${childName.trim()}" added`, 'success');
      setChildName('');
      load();
    } catch (err) {
      toast(err?.response?.data?.message || err.message, 'error');
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <Spinner />;
  if (!plan)   return <p className="muted">Plan not found.</p>;

  return (
    <div>
      <div className="flex items-center gap-12" style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/plans')}>← Plans</button>
        <h1 style={{ marginBottom: 0 }}>{plan.name}</h1>
        <StatusBadge status={plan.status} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowMetrics(true)}>
            📊 Metrics
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowReport(true)}>
            📄 View Report
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Tree */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <h2 style={{ marginBottom: 0 }}>Plan Tree</h2>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Depth: {depth}</span>
          </div>
          <p className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
            Click a node to select it. Action nodes open their detail page.
          </p>
          <input
            type="range" min={1} max={10} value={depth}
            onChange={e => handleDepthChange(Number(e.target.value))}
            style={{ width: '100%', marginBottom: 12 }}
          />
          <PlanTree plan={plan} selectedId={selected?.id} onSelect={setSelected} />
        </div>

        {/* Right panel */}
        <div>
          {/* Selected node info */}
          {selected && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <h3 style={{ marginBottom: 0 }}>{selected.name}</h3>
                <StatusBadge status={selected.status} />
              </div>
              <p className="muted" style={{ marginBottom: 8 }}>Type: {selected.type}</p>
              {selected.dependsOn && (
                <p className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
                  Depends on: {selected.dependsOn.split(',').map(d => (
                    <span key={d} className="tag" style={{ margin: '1px 3px' }}>{d.trim()}</span>
                  ))}
                </p>
              )}
              {selected.legalTransitions?.length > 0 && (
                <div>
                  <p className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Legal transitions:</p>
                  <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                    {selected.legalTransitions.map(t => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {selected.type === 'ACTION' && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}
                  onClick={() => navigate(`/actions/${selected.id}`)}>
                  Open Action Detail →
                </button>
              )}
            </div>
          )}

          {/* Node metrics panel */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 8 }}>Node Metrics</h3>
            {!selected ? (
              <p className="muted" style={{ fontSize: 13 }}>Select a node to view metrics.</p>
            ) : selected.type !== 'PLAN' ? (
              <p className="muted" style={{ fontSize: 13 }}>Metrics are computed per plan subtree — select a plan node.</p>
            ) : nodeMetricsLoading ? (
              <Spinner />
            ) : nodeMetricsError ? (
              <p style={{ color: 'var(--danger)', fontSize: 13 }}>{nodeMetricsError}</p>
            ) : nodeMetrics && (
              <div>
                <p style={{ fontSize: 13, marginBottom: 8 }}>
                  <strong>Completion: </strong>
                  {nodeMetrics.completion.completedActions} / {nodeMetrics.completion.totalActions} actions completed
                  {nodeMetrics.completion.totalActions > 0 && (
                    <span className="muted"> ({Math.round(nodeMetrics.completion.completionRatio * 100)}%)</span>
                  )}
                </p>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: 13 }}>Resources: </strong>
                  {Object.keys(nodeMetrics.resourceCost.totalByResource).length === 0 ? (
                    <span className="muted" style={{ fontSize: 13 }}>no allocations</span>
                  ) : (
                    <table style={{ fontSize: 13, width: '100%', marginTop: 4 }}>
                      <tbody>
                        {Object.entries(nodeMetrics.resourceCost.totalByResource).map(([res, qty]) => (
                          <tr key={res}>
                            <td style={{ color: 'var(--muted)', paddingRight: 8 }}>{res}</td>
                            <td style={{ textAlign: 'right', fontWeight: 500 }}>{Number(qty)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <p style={{ fontSize: 13, margin: 0 }}>
                  <strong>Risk: </strong>
                  <span className={`badge badge-risk-${nodeMetrics.risk.riskLevel}`}>{nodeMetrics.risk.riskLevel}</span>
                  {' '}score {nodeMetrics.risk.riskScore}
                  {(nodeMetrics.risk.suspendedActions > 0 || nodeMetrics.risk.abandonedActions > 0) && (
                    <span className="muted"> ({nodeMetrics.risk.suspendedActions} suspended, {nodeMetrics.risk.abandonedActions} abandoned)</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Add child form */}
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Add Node</h3>
            <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Adding to: <strong>{targetName}</strong>
              {selected && selected.type !== 'PLAN' && (
                <span> (select a plan node to nest deeper)</span>
              )}
            </p>
            <form onSubmit={handleAddChild}>
              <div className="form-row">
                <label>Name *</label>
                <input value={childName}
                  onChange={e => { setChildName(e.target.value); setChildErr(''); }}
                  className={childErr ? 'invalid' : ''}
                  placeholder="e.g. Excavation Phase" />
                {childErr && <div className="field-error">{childErr}</div>}
              </div>
              <div className="form-row">
                <label>Type</label>
                <select value={childType} onChange={e => setChildType(e.target.value)}>
                  <option value="ACTION">Action (leaf)</option>
                  <option value="PLAN">Sub-Plan (composite)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-sm"
                disabled={adding || !childName.trim()}>
                {adding ? 'Adding…' : '+ Add Node'}
              </button>
            </form>
          </div>

          {plan.targetStartDate && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Target Start Date</h3>
              <p style={{ marginTop: 4 }}>{plan.targetStartDate}</p>
            </div>
          )}
        </div>
      </div>

      {showReport && (
        <ReportModal planId={id} onClose={() => setShowReport(false)} />
      )}
      {showMetrics && (
        <MetricsModal planId={id} onClose={() => setShowMetrics(false)} />
      )}
    </div>
  );
}
