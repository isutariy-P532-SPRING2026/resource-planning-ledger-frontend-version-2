import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listAccounts, getEntries } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/Spinner.jsx';

function err(e) {
  const d = e?.response?.data;
  if (typeof d === 'string') return d;
  if (d?.message) return d.message;
  if (d?.error)   return d.error;
  return e?.message || 'An unexpected error occurred';
}

function SortArrow({ col, sortCol, sortDir }) {
  if (col !== sortCol) return <span className="sort-arrow">↕</span>;
  return <span className="sort-arrow" style={{ color: 'var(--primary)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export default function Ledger() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initId = searchParams.get('accountId') ? Number(searchParams.get('accountId')) : null;

  const [accounts,   setAccounts]   = useState([]);
  const [selectedId, setSelectedId] = useState(initId);
  const [entries,    setEntries]    = useState([]);
  const [loadingAcc, setLoadingAcc] = useState(true);
  const [loadingEnt, setLoadingEnt] = useState(false);
  const [sortCol,    setSortCol]    = useState('bookedAt');
  const [sortDir,    setSortDir]    = useState('desc');
  const [kindFilter, setKindFilter] = useState('all');
  const toast = useToast();

  useEffect(() => {
    listAccounts()
      .then(setAccounts)
      .catch(e => toast(err(e), 'error'))
      .finally(() => setLoadingAcc(false));
  }, []);

  useEffect(() => {
    if (!selectedId) { setEntries([]); return; }
    setLoadingEnt(true);
    getEntries(selectedId)
      .then(setEntries)
      .catch(e => toast(err(e), 'error'))
      .finally(() => setLoadingEnt(false));
  }, [selectedId]);

  function selectAccount(id) {
    setSelectedId(id);
    setSearchParams({ accountId: id });
  }

  function toggleSort(col) {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [entries, sortCol, sortDir]);

  const selectedAcc = accounts.find(a => a.id === selectedId);
  const visibleAccounts = kindFilter === 'all'
    ? accounts
    : accounts.filter(a => a.resourceKind === kindFilter);
  const poolAccounts  = visibleAccounts.filter(a => a.kind === 'POOL');
  const usageAccounts = visibleAccounts.filter(a => a.kind === 'USAGE');

  if (loadingAcc) return <Spinner />;

  return (
    <div>
      <h1>Ledger</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['all', 'Show all'], ['CONSUMABLE', 'Consumable only'], ['ASSET', 'Asset only']].map(([val, label]) => (
          <button key={val}
            className={`btn btn-sm ${kindFilter === val ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setKindFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid-2">
        {/* Account list */}
        <div>
          {[['Pool Accounts', poolAccounts], ['Usage Accounts', usageAccounts]].map(([label, list]) => (
            <div key={label} className="card" style={{ marginBottom: 12 }}>
              <h2 style={{ marginBottom: 10 }}>{label}</h2>
              {list.length === 0 ? (
                <p className="muted">None yet.</p>
              ) : (
                list.map(a => (
                  <div key={a.id}
                    onClick={() => selectAccount(a.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px', borderRadius: 4, cursor: 'pointer',
                      background: a.id === selectedId ? '#eff6ff' : 'transparent',
                      color:      a.id === selectedId ? 'var(--primary)' : 'var(--primary)',
                      fontWeight: a.id === selectedId ? 700 : 400,
                      textDecoration: 'underline',
                    }}>
                    <span>
                      {(a.overConsumed || a.balance < 0) && (
                        <span className="alert-indicator" style={{ marginRight: 4 }} />
                      )}
                      {a.name}
                    </span>
                    <span className={a.balance < 0 ? 'amount-neg' : 'amount-pos'}
                      style={{ fontSize: 13, textDecoration: 'none', color: a.balance < 0 ? undefined : 'var(--text)', fontWeight: 600 }}>
                      {Number(a.balance).toFixed(4)}
                    </span>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        {/* Entries panel */}
        <div>
          {!selectedId ? (
            <div className="card">
              <p className="muted">Select an account to view its entries.</p>
            </div>
          ) : (
            <div className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                <div>
                  <h2 style={{ marginBottom: 2 }}>{selectedAcc?.name}</h2>
                  <span className="muted" style={{ fontSize: 12 }}>{selectedAcc?.kind}</span>
                </div>
                {selectedAcc?.balance !== undefined && (
                  <div style={{ textAlign: 'right' }}>
                    <div className="muted" style={{ fontSize: 11, marginBottom: 2 }}>Balance</div>
                    <div className={`balance-display ${selectedAcc.balance < 0 ? 'amount-neg' : 'amount-pos'}`}>
                      {Number(selectedAcc.balance).toFixed(4)}
                    </div>
                  </div>
                )}
              </div>

              {loadingEnt ? <Spinner /> : sortedEntries.length === 0 ? (
                <p className="muted">No entries yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th className={`sortable${sortCol === 'bookedAt' ? ' active' : ''}`}
                        onClick={() => toggleSort('bookedAt')}>
                        Booked At <SortArrow col="bookedAt" sortCol={sortCol} sortDir={sortDir} />
                      </th>
                      <th className={`sortable${sortCol === 'chargedAt' ? ' active' : ''}`}
                        onClick={() => toggleSort('chargedAt')}>
                        Charged At <SortArrow col="chargedAt" sortCol={sortCol} sortDir={sortDir} />
                      </th>
                      <th className={`sortable${sortCol === 'amount' ? ' active' : ''}`}
                        onClick={() => toggleSort('amount')} style={{ textAlign: 'right' }}>
                        Amount <SortArrow col="amount" sortCol={sortCol} sortDir={sortDir} />
                      </th>
                      <th>Action ID</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((e, i) => (
                      <tr key={e.id ?? i}>
                        <td className="mono muted" style={{ whiteSpace: 'nowrap' }}>
                          {e.bookedAt  ? new Date(e.bookedAt).toLocaleString()  : '—'}
                        </td>
                        <td className="mono muted" style={{ whiteSpace: 'nowrap' }}>
                          {e.chargedAt ? new Date(e.chargedAt).toLocaleString() : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}
                          className={Number(e.amount) < 0 ? 'amount-neg' : 'amount-pos'}>
                          {Number(e.amount).toFixed(4)}
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {e.originatingActionId ?? '—'}
                        </td>
                        <td style={{ fontSize: 12 }}>{e.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
