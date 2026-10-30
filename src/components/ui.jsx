import React, { useEffect, useRef } from 'react';
import { X, ArrowUpRight, Route, Check } from 'lucide-react';
import { compactCurrency } from '../lib/workspace';

export function Badge({ status }) {
  const type =
    {
      Approved: 'green',
      'Under Review': 'blue',
      'Field Verification Required': 'amber',
      Rejected: 'red',
      Completed: 'green',
      'In Progress': 'blue',
      Assigned: 'amber',
    }[status] || 'gray';
  return (
    <span className={`badge ${type}`}>
      <i />
      {status === 'Field Verification Required' ? 'Needs survey' : status}
    </span>
  );
}
export function EmptyState({
  title = 'No routes found',
  text = 'Try another search or create a new route.',
  action,
}) {
  return (
    <div className="empty-state">
      <Route size={28} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Modal({ title, subtitle, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    const dialog = ref.current;
    const close = (e) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', close);
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.removeEventListener('cancel', close);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-heading">
        <div>
          <p className="eyebrow">FIBERROUTE WORKSPACE</p>
          <h2 id="modal-title">{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="icon-button" aria-label="Close dialog">
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function PlansTable({ plans, onOpen, compact = false }) {
  if (!plans.length) return <EmptyState />;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Route / village</th>
            <th>District</th>
            <th>Fiber length</th>
            <th>Est. budget</th>
            <th>Status</th>
            {!compact && <th>Feasibility</th>}
            <th>
              <span className="sr-only">Open route</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.routeId}>
              <td>
                <button className="route-link" onClick={() => onOpen(p)}>
                  <span className="table-route-icon">
                    <Route size={16} />
                  </span>
                  <span>
                    <b>{p.village}</b>
                    <small>
                      {p.routeId.replace('FRAI-', '')}
                      {p.isDemo && ' · Sample'}
                    </small>
                  </span>
                </button>
              </td>
              <td>{p.district}</td>
              <td>
                {p.fiberLength.toFixed(1)} <span className="muted">km</span>
              </td>
              <td className="money">{compactCurrency(p.estimatedCost)}</td>
              <td>
                <Badge status={p.status} />
              </td>
              {!compact && (
                <td>
                  <span className="mini-progress">
                    <i style={{ width: `${p.feasibilityScore || 0}%` }} />
                  </span>{' '}
                  {p.feasibilityScore ?? '—'}%
                </td>
              )}
              <td>
                <button
                  className="icon-button"
                  aria-label={`View ${p.village} route`}
                  onClick={() => onOpen(p)}
                >
                  <ArrowUpRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Toast({ message, onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 5500);
    return () => clearTimeout(id);
  }, [message, onClose]);
  return (
    <div className="toast" role="status">
      <Check size={18} />
      <span>{message}</span>
      <button aria-label="Dismiss notification" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}
