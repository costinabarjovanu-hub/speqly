import { useState } from 'react';

function PriorityBadge({ priority }) {
  const cls = {
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low'
  }[priority] || 'badge-low';
  return <span className={cls}>{priority}</span>;
}

function ACTypeBadge({ type }) {
  const cls = { shall: 'badge-shall', not: 'badge-not', edge: 'badge-edge' }[type] || 'badge-shall';
  return <span className={cls}>{type.toUpperCase()}</span>;
}

function TicketCard({ ticket, config, onUpdate }) {
  const [expanded, setExpanded] = useState(true);
  const [answers, setAnswers] = useState(ticket.clarificationAnswers || {});
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleAnswerChange = (i, value) => {
    const newAnswers = { ...answers, [i]: value };
    setAnswers(newAnswers);
    onUpdate({ ...ticket, clarificationAnswers: newAnswers });
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket,
          answers,
          config
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Regeneration failed');
      onUpdate({ ...data, clarificationAnswers: {} });
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const hasQuestions = ticket.clarificationQuestions && ticket.clarificationQuestions.length > 0;
  const hasAnswers = hasQuestions && Object.values(answers).some(a => a?.trim());

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 text-xs font-mono text-gray-400 shrink-0">{ticket.id}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 leading-snug truncate">{ticket.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <PriorityBadge priority={ticket.priority} />
              <span className="text-xs text-gray-500">{ticket.storyPoints} pts</span>
              {(ticket.labels || []).map(l => (
                <span key={l} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{l}</span>
              ))}
              {hasQuestions && (
                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                  {ticket.clarificationQuestions.length} question{ticket.clarificationQuestions.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 ml-2 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {ticket.description && (
            <p className="text-sm text-gray-600 italic">{ticket.description}</p>
          )}

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">User Story</h4>
            <p className="text-sm text-gray-700">
              As a <strong>{ticket.userStory?.as}</strong>, I want to <strong>{ticket.userStory?.iWantTo}</strong>, so that <strong>{ticket.userStory?.soThat}</strong>.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Acceptance Criteria</h4>
            <ul className="space-y-2">
              {(ticket.acceptanceCriteria || []).map((ac, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ACTypeBadge type={ac.type} />
                  <span className="text-sm text-gray-700">{ac.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {hasQuestions && (
            <div className="bg-purple-50 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Clarification Questions</h4>
              {ticket.clarificationQuestions.map((q, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-sm text-gray-700 font-medium">{q}</p>
                  <textarea
                    className="input resize-none text-sm"
                    rows={2}
                    placeholder="Your answer..."
                    value={answers[i] || ''}
                    onChange={(e) => handleAnswerChange(i, e.target.value)}
                  />
                </div>
              ))}

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating || !hasAnswers}
                className="btn-primary text-xs py-1.5"
              >
                {regenerating ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate Ticket
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Step3Review({ tickets, observations, config, filePreview, onTicketUpdate, onComplete, onBack }) {
  return (
    <div className="space-y-6">
      {observations && (
        <div className="card p-5 bg-indigo-50 border-indigo-200">
          <h3 className="text-sm font-semibold text-indigo-900 mb-1">AI Observations</h3>
          <p className="text-sm text-indigo-700">{observations}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Review Tickets</h2>
          <p className="text-sm text-gray-500">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} generated — answer clarification questions and regenerate if needed</p>
        </div>
        {filePreview && (
          <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200 hidden sm:block" />
        )}
      </div>

      <div className="space-y-3">
        {tickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            config={config}
            onUpdate={onTicketUpdate}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button onClick={onComplete} className="btn-primary" disabled={tickets.length === 0}>
          Approve Tickets
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
