import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAction, completeAction,
  suspendAction, resumeAction, abandonAction,
  submitForApproval, approveAction, rejectAction, reopenAction,
  addAllocation, listResourceTypes,
} from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Spinner     from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

function err(e) {
  const d = e?.response?.data;
  if (typeof d === 'string') return d;
  if (d?.message) return d.message;
  if (d?.error)   return d.error;
  return e?.message || 'An unexpected error occurred';
}

/* ── Suspend modal ──────────────────────────────────────────────────────────── */
function SuspendModal({ actionId, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function submit(e) {
    e.preventDefault();
    if (!reason.trim()) { setErrors({ reason: 'Reason is required' }); return; }
    setSaving(true);
    try {
      const a = await suspendAction(actionId, { reason });
      toast('Action suspended', 'success');
      onDone(a);
    } catch (ex) { toast(err(ex), 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Suspend Action</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Reason *</label>
            <textarea value={reason}
              onChange={e => { setReason(e.target.value); setErrors({}); }}
              className={errors.reason ? 'invalid' : ''}
              placeholder="Why is this action being suspended?" />
            {errors.reason && <div className="field-error">{errors.reason}</div>}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-suspend" disabled={saving}>
              {saving ? 'Suspending…' : 'Suspend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Add Allocation modal ────────────────────────────────────────────────────── */
function AddAllocationModal({ actionId, onClose, onAdded }) {
  const [resourceTypes, setResourceTypes] = useState([]);
  const [rtId,       setRtId]       = useState('');
  const [quantity,   setQuantity]   = useState('');
  const [kind,       setKind]       = useState('GENERAL');
  const [assetId,    setAssetId]    = useState('');
  const [timePeriod, setTimePeriod] = useState('');
  const [saving,     setSaving]     = useState(false);
  const [errors,     setErrors]     = useState({});
  const toast = useToast();

  useEffect(() => {
    listResourceTypes().then(setResourceTypes).catch(() => {});
  }, []);

  function validate() {
    const e = {};
    if (!rtId)                       e.rtId    = 'Resource type is required';
    if (!quantity)                   e.qty     = 'Quantity is required';
    else if (Number(quantity) <= 0)  e.qty     = 'Quantity must be > 0';
    if (kind === 'SPECIFIC' && !assetId.trim()) e.assetId = 'Asset ID is required for SPECIFIC allocations';
    return e;
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const alloc = await addAllocation(actionId, {
        resourceTypeId: Number(rtId),
        quantity:       parseFloat(quantity),
        kind,
        assetId:    assetId    || null,
        timePeriod: timePeriod || null,
      });
      toast('Allocation added', 'success');
      onAdded(alloc);
    } catch (ex) { toast(err(ex), 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add Resource Allocation</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Resource Type *</label>
            <select value={rtId}
              onChange={e => { setRtId(e.target.value); setErrors(x => ({ ...x, rtId: '' })); }}
              className={errors.rtId ? 'invalid' : ''}>
              <option value="">Select resource type…</option>
              {resourceTypes.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name} ({rt.unitOfMeasure})</option>
              ))}
            </select>
            {errors.rtId && <div className="field-error">{errors.rtId}</div>}
          </div>
          <div className="form-row">
            <label>Quantity *</label>
            <input type="number" step="any" value={quantity}
              onChange={e => { setQuantity(e.target.value); setErrors(x => ({ ...x, qty: '' })); }}
              className={errors.qty ? 'invalid' : ''}
              placeholder="e.g. 10.5" />
            {errors.qty && <div className="field-error">{errors.qty}</div>}
          </div>
          <div className="form-row">
            <label>Kind</label>
            <select value={kind} onChange={e => { setKind(e.target.value); setErrors(x => ({ ...x, assetId: '' })); }}>
              <option value="GENERAL">GENERAL</option>
              <option value="SPECIFIC">SPECIFIC (named asset)</option>
            </select>
          </div>
          {kind === 'SPECIFIC' && (
            <div className="form-row">
              <label>Asset ID *</label>
              <input value={assetId}
                onChange={e => { setAssetId(e.target.value); setErrors(x => ({ ...x, assetId: '' })); }}
                className={errors.assetId ? 'invalid' : ''}
                placeholder="e.g. excavator-001" />
              {errors.assetId && <div className="field-error">{errors.assetId}</div>}
            </div>
          )}
          <div className="form-row">
            <label>Time Period (optional)</label>
            <input value={timePeriod} onChange={e => setTimePeriod(e.target.value)}
              placeholder="e.g. 2026-01-01/2026-12-31" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding…' : 'Add Allocation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Button style map ────────────────────────────────────────────────────────── */
const BTN_CLS = {
  submitForApproval: 'btn-submit-approval',
  approve:  'btn-approve',
  reject:   'btn-reject',
  reopen:   'btn-reopen',
  complete: 'btn-complete',
  suspend:  'btn-suspend',
  resume:   'btn-resume',
  abandon:  'btn-abandon',
};
const BTN_LABEL = {
  submitForApproval: '→ Submit for Approval',
  approve:  '✓ Approve',
  reject:   '✕ Reject',
  reopen:   '↩ Reopen',
  complete: '✓ Complete',
  suspend:  '⏸ Suspend',
  resume:   '▶ Resume',
  abandon:  '✕ Abandon',
};

/* ── Main page ───────────────────────────────────────────────────────────────── */
export default function ActionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const [action,  setAction]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // 'suspend'|'alloc'|'abandon'|null

  function reload() {
    setLoading(true);
    getAction(id)
      .then(setAction)
      .catch(e => toast(err(e), 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, [id]);

  async function fireSimple(callFn, successMsg) {
    try {
      const a = await callFn();
      toast(successMsg, 'success');
      setAction(a);
    } catch (e) { toast(err(e), 'error'); }
  }

  // Approval endpoints return a minimal {id,name,status} map, not a full action.
  // Reload the full action after success so legalTransitions and allocations stay intact.
  async function fireAndReload(callFn, successMsg) {
    try {
      await callFn();
      toast(successMsg, 'success');
      reload();
    } catch (e) { toast(err(e), 'error'); }
  }

  function handleTransition(event) {
    if (event === 'suspend')           return setModal('suspend');
    if (event === 'abandon')           return setModal('abandon');
    if (event === 'complete')          return fireSimple(() => completeAction(id),    'Action completed');
    if (event === 'resume')            return fireSimple(() => resumeAction(id),      'Action resumed');
    if (event === 'submitForApproval') return fireAndReload(() => submitForApproval(id), 'Submitted for approval');
    if (event === 'approve')           return fireAndReload(() => approveAction(id),     'Action approved');
    if (event === 'reject')            return fireAndReload(() => rejectAction(id),      'Action rejected');
    if (event === 'reopen')            return fireAndReload(() => reopenAction(id),      'Action reopened');
  }

  if (loading) return <Spinner />;
  if (!action) return <p className="muted">Action not found.</p>;

  const impl = action.implemented;
  const deps = action.dependsOn ? action.dependsOn.split(',').map(d => d.trim()).filter(Boolean) : [];

  return (
    <div>
      <div className="flex items-center gap-12" style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <h1 style={{ marginBottom: 0 }}>{action.name}</h1>
        <StatusBadge status={action.status} />
      </div>

      {/* Dependency notice */}
      {deps.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#92400e' }}>
            ⚠ Dependencies
          </div>
          <p style={{ fontSize: 13, margin: 0, color: '#78350f' }}>
            This action depends on:{' '}
            {deps.map(d => <span key={d} className="tag" style={{ margin: '1px 3px' }}>{d}</span>)}
          </p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Ensure all listed actions are completed before completing this one.
          </p>
        </div>
      )}

      {/* Transition buttons */}
      {action.legalTransitions?.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-header">Available Transitions</div>
          <div className="transition-btns">
            {action.legalTransitions.map(t => (
              <button key={t}
                className={`btn ${BTN_CLS[t] || 'btn-ghost'}`}
                onClick={() => handleTransition(t)}>
                {BTN_LABEL[t] || t}
              </button>
            ))}
          </div>
        </div>
      )}

      {action.legalTransitions?.length === 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="muted">No further transitions available — action is {action.status.toLowerCase()}.</p>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Core details */}
        <div className="card">
          <h2>Proposed Details</h2>
          <table>
            <tbody>
              {[['Party', action.party], ['Time Ref', action.timeRef], ['Location', action.location]].map(([lbl, val]) => (
                <tr key={lbl}>
                  <td style={{ color: 'var(--muted)', width: 110, fontWeight: 600 }}>{lbl}</td>
                  <td>{val || <span className="muted">—</span>}</td>
                </tr>
              ))}
              {deps.length > 0 && (
                <tr>
                  <td style={{ color: 'var(--muted)', width: 110, fontWeight: 600 }}>Depends On</td>
                  <td>{deps.map(d => <span key={d} className="tag" style={{ margin: '1px 3px' }}>{d}</span>)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Execution diff */}
        <div className="card">
          <h2>
            Execution Record
            {!impl && <span className="muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 8 }}>(not started)</span>}
          </h2>
          {impl ? (
            <table className="diff-table">
              <thead>
                <tr><th>Field</th><th>Proposed</th><th>Actual</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Party</td>
                  <td>{action.party || <span className="muted">—</span>}</td>
                  <td className={impl.actualParty !== action.party ? 'changed' : ''}>{impl.actualParty || '—'}</td>
                </tr>
                <tr>
                  <td>Location</td>
                  <td>{action.location || <span className="muted">—</span>}</td>
                  <td className={impl.actualLocation !== action.location ? 'changed' : ''}>{impl.actualLocation || '—'}</td>
                </tr>
                <tr>
                  <td>Start</td>
                  <td className="muted">—</td>
                  <td>{impl.actualStart ? new Date(impl.actualStart).toLocaleString() : '—'}</td>
                </tr>
                <tr>
                  <td>Status</td>
                  <td>—</td>
                  <td><StatusBadge status={impl.status} /></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="muted">Action has not been implemented yet.</p>
          )}
        </div>
      </div>

      {/* Allocations */}
      <div className="card">
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h2 style={{ marginBottom: 0 }}>Resource Allocations</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('alloc')}>+ Add Allocation</button>
        </div>
        {!action.allocations?.length ? (
          <p className="muted">No allocations yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Resource Type</th>
                <th>Quantity</th>
                <th>Kind</th>
                <th>Asset ID</th>
                <th>Time Period</th>
              </tr>
            </thead>
            <tbody>
              {action.allocations.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.resourceTypeName}</td>
                  <td>{a.quantity}</td>
                  <td><span className="tag">{a.kind}</span></td>
                  <td className="mono">{a.assetId || '—'}</td>
                  <td className="mono">{a.timePeriod || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {modal === 'suspend' && (
        <SuspendModal actionId={id} onClose={() => setModal(null)}
          onDone={a => { setAction(a); setModal(null); }} />
      )}
      {modal === 'alloc' && (
        <AddAllocationModal actionId={id} onClose={() => setModal(null)}
          onAdded={() => { setModal(null); reload(); }} />
      )}
      {modal === 'abandon' && (
        <ConfirmModal
          title="Abandon Action"
          message={`Are you sure you want to abandon "${action.name}"? This cannot be undone.`}
          confirmLabel="Abandon"
          danger
          onCancel={() => setModal(null)}
          onConfirm={async () => {
            try {
              const a = await abandonAction(id);
              toast('Action abandoned', 'success');
              setAction(a); setModal(null);
            } catch (e) { toast(err(e), 'error'); setModal(null); }
          }}
        />
      )}
    </div>
  );
}
