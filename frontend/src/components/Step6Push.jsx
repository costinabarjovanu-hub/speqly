import { useState } from 'react';

export default function Step6Push({ tickets, config, pushResults, onPushComplete, onBack, onReset }) {
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(pushResults.length > 0);

  const hasJiraConfig = config.jiraDomain && config.jiraEmail && config.jiraToken && config.jiraProjectKey;

  const handlePush = async () => {
    setPushing(true);
    setError(null);
    try {
      const res = await fetch('/api/jira/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickets,
          jiraConfig: {
            domain: config.jiraDomain,
            email: config.jiraEmail,
            token: config.jiraToken,
            projectKey: config.jiraProjectKey
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Push failed');

      onPushComplete(data.results || []);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setPushing(false);
    }
  };

  const results = pushResults.length > 0 ? pushResults : [];
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  if (done && results.length > 0) {
    return (
      <div className="space-y-6">
        <div className={`card p-6 ${successCount === results.length ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-3">
            {successCount === results.length ? (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            <div>
              <h3 className={`font-semibold ${successCount === results.length ? 'text-green-900' : 'text-yellow-900'}`}>
                {successCount === results.length ? 'All tickets pushed successfully!' : `${successCount} of ${results.length} tickets pushed`}
              </h3>
              <p className={`text-sm ${successCount === results.length ? 'text-green-700' : 'text-yellow-700'}`}>
                {successCount} succeeded{failCount > 0 ? `, ${failCount} failed` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="card divide-y divide-gray-100">
          {results.map(result => {
            const ticket = tickets.find(t => t.id === result.ticketId);
            return (
              <div key={result.ticketId} className="flex items-center gap-3 p-4">
                {result.success ? (
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ticket?.title || result.ticketId}</p>
                  {result.success ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600 font-mono font-semibold">{result.key}</span>
                      {result.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          Open in Jira →
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-red-600">{result.error}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button onClick={onBack} className="btn-secondary">
            Back
          </button>
          <button onClick={onReset} className="btn-primary">
            Start New Analysis
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Push to Jira</h2>
        <p className="text-sm text-gray-500">{tickets.length} approved ticket{tickets.length !== 1 ? 's' : ''} ready to push</p>
      </div>

      {!hasJiraConfig && (
        <div className="card p-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-amber-800">Jira configuration incomplete</h4>
              <p className="text-sm text-amber-700 mt-0.5">
                Go back to Step 1 and fill in Jira Domain, Email, API Token, and Project Key to push tickets.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card divide-y divide-gray-100">
        {tickets.map(ticket => (
          <div key={ticket.id} className="flex items-center gap-3 p-4">
            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
              <p className="text-xs text-gray-500">{ticket.storyPoints} pts · {ticket.priority}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="btn-secondary" disabled={pushing}>
          Back
        </button>
        <button
          onClick={handlePush}
          className="btn-primary"
          disabled={pushing || !hasJiraConfig}
        >
          {pushing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              Pushing tickets...
            </>
          ) : (
            <>
              Push {tickets.length} Ticket{tickets.length !== 1 ? 's' : ''} to Jira
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
