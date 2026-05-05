import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';

/**
 * Recursive collapsible plan tree.
 * - PLAN nodes show an expand/collapse arrow and render children below.
 * - ACTION (leaf) nodes link to /actions/:id.
 * - Clicking any node calls onSelect(node).
 */
function TreeNode({ node, depth = 0, selectedId, onSelect }) {
  const navigate = useNavigate();
  const isComposite = node.type === 'PLAN';
  const hasChildren = isComposite && node.children?.length > 0;
  const [open, setOpen] = useState(depth < 2);

  function handleClick(e) {
    e.stopPropagation();
    onSelect?.(node);
    if (isComposite) setOpen(o => !o);
  }

  function handleActionClick(e) {
    e.stopPropagation();
    onSelect?.(node);
    navigate(`/actions/${node.id}`);
  }

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 16 }}>
      <div
        className={`tree-node-inner${selectedId === node.id ? ' selected' : ''}`}
        onClick={isComposite ? handleClick : handleActionClick}
        style={{ cursor: 'pointer' }}
      >
        {/* Expand arrow — only for composites */}
        <span className="tree-toggle" style={{ opacity: hasChildren ? 1 : 0 }}>
          {open ? '▾' : '▸'}
        </span>

        {/* Node icon */}
        <span style={{ fontSize: 13 }}>{isComposite ? '📁' : '📌'}</span>

        {/* Name — actions shown as blue link */}
        {isComposite ? (
          <span style={{ fontWeight: 600, fontSize: 13 }}>{node.name}</span>
        ) : (
          <span style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 500 }}>{node.name}</span>
        )}

        <StatusBadge status={node.status} />

        {!isComposite && node.dependsOn && (
          <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
            ⤷ {node.dependsOn}
          </span>
        )}

        {!isComposite && (
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>→ detail</span>
        )}
      </div>

      {/* Children */}
      {isComposite && open && node.children?.length > 0 && (
        <div className="tree-children">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      {isComposite && open && node.children?.length === 0 && (
        <div style={{ marginLeft: 32, padding: '4px 0', color: 'var(--muted)', fontSize: 12 }}>
          {node._pruned ? '…' : '(empty plan)'}
        </div>
      )}
    </div>
  );
}

export default function PlanTree({ plan, selectedId, onSelect }) {
  if (!plan) return null;
  return (
    <div>
      <TreeNode node={plan} depth={0} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
}
