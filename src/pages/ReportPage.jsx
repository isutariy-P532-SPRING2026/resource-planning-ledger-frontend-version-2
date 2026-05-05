import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlanReport } from '../api.js';
import Spinner    from '../components/Spinner.jsx';
import ErrorBox   from '../components/ErrorBox.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [status,  setStatus]  = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPlanReport(id, status || undefined)
      .then(setRows)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id, status]);

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex items-center gap-12" style={{ marginBottom: 18 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/plans/${id}`)}>← Plan</button>
        <h1 style={{ marginBottom: 0 }}>Depth-First Report</h1>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{ marginLeft: 'auto', fontSize: 13 }}
        >
          <option value="">All</option>
          <option value="PROPOSED">PROPOSED</option>
          <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="REOPENED">REOPENED</option>
          <option value="ABANDONED">ABANDONED</option>
        </select>
      </div>

      <ErrorBox error={error} />

      {rows.length === 0
        ? <p className="muted">No nodes in this plan.</p>
        : (
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Node</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Allocations</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    className="report-row"
                    style={{ '--depth': row.depth }}
                    onClick={() => row.type === 'ACTION' && navigate(`/actions/${row.id}`)}
                  >
                    <td style={{ cursor: row.type === 'ACTION' ? 'pointer' : 'default',
                                 color: row.type === 'ACTION' ? 'var(--primary)' : 'inherit',
                                 fontWeight: row.depth === 0 ? 700 : 400 }}>
                      {row.name}
                    </td>
                    <td className="muted">{row.type}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td>
                      {row.allocations && Object.keys(row.allocations).length > 0
                        ? Object.entries(row.allocations).map(([rt, qty]) => (
                          <span key={rt} className="tag">{rt}: {Number(qty).toFixed(2)}</span>
                        ))
                        : <span className="muted">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </>
  );
}
