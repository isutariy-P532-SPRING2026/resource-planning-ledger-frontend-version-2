const DISPLAY_NAMES = {
  PENDING_APPROVAL: 'Pending Approval',
  REOPENED:         'Reopened',
};

export default function StatusBadge({ status }) {
  const label = DISPLAY_NAMES[status] ?? status?.replace(/_/g, ' ');
  return <span className={`badge badge-${status}`}>{label}</span>;
}
