function ACTypeBadge({ type }) {
  const cls = { shall: 'badge-shall', not: 'badge-not', edge: 'badge-edge' }[type] || 'badge-shall';
  return <span className={cls}>{type.toUpperCase()}</span>;
}

function PriorityBadge({ priority }) {
  const cls = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }[priority] || 'badge-low';
  return <span className={cls}>{priority}</span>;
}

function JiraTicketPreview({ ticket }) {
  const userStoryText = `As a ${ticket.userStory?.as}, I want to ${ticket.userStory?.iWantTo}, so that ${ticket.userStory?.soThat}.`;

  return (
    <div className="card overflow-hidden">
      <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-indigo-200 bg-indigo-700 px-2 py-0.5 rounded">{ticket.id}</span>
          <span className="text-xs text-indigo-200">Story</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-200">
            {ticket.storyPoints} {ticket.storyPoints === 1 ? 'pt' : 'pts'}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{ticket.title}</h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <PriorityBadge priority={ticket.priority} />
            {(ticket.labels || []).map(l => (
              <span key={l} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border">{l}</span>
            ))}
          </div>
        </div>

        {ticket.description && (
          <p className="text-sm text-gray-600">{ticket.description}</p>
        )}

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">User Story</h4>
          <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{userStoryText}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Acceptance Criteria</h4>
          <ul className="space-y-2">
            {(ticket.acceptanceCriteria || []).map((ac, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ACTypeBadge type={ac.type} />
                <span className="text-gray-700 leading-relaxed">{ac.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
          <span>Story Points: <strong className="text-gray-600">{ticket.storyPoints}</strong></span>
          <span>Priority: <strong className="text-gray-600">{ticket.priority}</strong></span>
          <span>{(ticket.acceptanceCriteria || []).length} AC items</span>
        </div>
      </div>
    </div>
  );
}

export default function Step5Preview({ tickets, onComplete, onBack }) {
  const totalPoints = tickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Jira Preview</h2>
          <p className="text-sm text-gray-500">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} · {totalPoints} story points total
          </p>
        </div>
        <div className="card px-4 py-2 text-center">
          <div className="text-2xl font-bold text-indigo-600">{totalPoints}</div>
          <div className="text-xs text-gray-500">total pts</div>
        </div>
      </div>

      <div className="space-y-4">
        {tickets.map(ticket => (
          <JiraTicketPreview key={ticket.id} ticket={ticket} />
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button onClick={onComplete} className="btn-primary">
          Push to Jira
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
