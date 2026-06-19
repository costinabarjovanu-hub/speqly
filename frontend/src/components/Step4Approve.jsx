import { useState } from 'react';

function PriorityBadge({ priority }) {
  const cls = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }[priority] || 'badge-low';
  return <span className={cls}>{priority}</span>;
}

export default function Step4Approve({ tickets, onComplete, onBack }) {
  const [selected, setSelected] = useState(new Set(tickets.map(t => t.id)));

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === tickets.length ? new Set() : new Set(tickets.map(t => t.id)));
  };

  const allSelected = selected.size === tickets.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Approve Tickets</h2>
        <p className="text-sm text-gray-500">Select which tickets to push to Jira</p>
      </div>

      <div className="card divide-y divide-gray-100">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-t-xl">
          <input
            type="checkbox"
            id="select-all"
            className="w-4 h-4 text-indigo-600 rounded"
            checked={allSelected}
            ref={el => el && (el.indeterminate = someSelected)}
            onChange={toggleAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
            Select all ({tickets.length} tickets)
          </label>
          <span className="ml-auto text-sm text-gray-500">{selected.size} selected</span>
        </div>

        {tickets.map(ticket => (
          <label
            key={ticket.id}
            className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <input
              type="checkbox"
              className="w-4 h-4 text-indigo-600 rounded mt-0.5 shrink-0"
              checked={selected.has(ticket.id)}
              onChange={() => toggle(ticket.id)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-gray-400">{ticket.id}</span>
                <PriorityBadge priority={ticket.priority} />
                <span className="text-xs text-gray-500">{ticket.storyPoints} pts</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{ticket.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                As a {ticket.userStory?.as}, I want to {ticket.userStory?.iWantTo}
              </p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {(ticket.labels || []).map(l => (
                  <span key={l} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{l}</span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-bold text-indigo-600">{ticket.storyPoints}</div>
              <div className="text-xs text-gray-400">pts</div>
            </div>
          </label>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="card p-4 bg-indigo-50 border-indigo-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-indigo-700 font-medium">{selected.size} ticket{selected.size !== 1 ? 's' : ''} selected</span>
            <span className="text-indigo-600">
              {Array.from(selected).reduce((sum, id) => {
                const t = tickets.find(t => t.id === id);
                return sum + (t?.storyPoints || 0);
              }, 0)} total story points
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button
          onClick={() => onComplete(selected)}
          className="btn-primary"
          disabled={selected.size === 0}
        >
          Preview {selected.size} Ticket{selected.size !== 1 ? 's' : ''}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
