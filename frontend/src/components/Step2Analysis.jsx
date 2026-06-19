import { useEffect, useRef, useState } from 'react';

const STAGES_MOCKUP = [
  'Se încarcă screenshot-ul...',
  'Se analizează componentele UI...',
  'Se identifică fluxurile utilizatorului...',
  'Se extrag features...',
  'Se finalizează...'
];

const STAGES_DOCUMENT = [
  'Se încarcă documentul...',
  'Se citesc requirements-urile...',
  'Se identifică funcționalitățile...',
  'Se grupează features...',
  'Se finalizează...'
];

export default function Step2Analysis({ file, inputType, config, onComplete, onBack }) {
  const [status, setStatus] = useState('analyzing');
  const [error, setError] = useState(null);
  const [stageIndex, setStageIndex] = useState(0);
  const calledRef = useRef(false);

  const stages = inputType === 'document' ? STAGES_DOCUMENT : STAGES_MOCKUP;

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const stageInterval = setInterval(() => {
      setStageIndex(prev => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 3500);

    const analyze = async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('config', JSON.stringify({ ...config, inputType }));

        const res = await fetch('/api/analyze', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Analysis failed');

        clearInterval(stageInterval);
        setStatus('done');
        onComplete(data.observations || '', data.features || []);
      } catch (err) {
        clearInterval(stageInterval);
        setStatus('error');
        setError(err.message);
      }
    };

    analyze();
    return () => clearInterval(stageInterval);
  }, []);

  if (status === 'error') {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Analiză eșuată</h3>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
        <button onClick={onBack} className="btn-secondary">Înapoi la Configurare</button>
      </div>
    );
  }

  return (
    <div className="card p-12 text-center space-y-6">
      <div className="relative w-20 h-20 mx-auto">
        <svg className="w-20 h-20 text-indigo-200" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        </svg>
        <svg className="w-20 h-20 animate-spin text-indigo-600 absolute inset-0" viewBox="0 0 24 24" fill="none" style={{ animationDuration: '1.5s' }}>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {inputType === 'document' ? '📄' : '⚡'}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {inputType === 'document' ? 'Se analizează documentul' : 'Se analizează mockup-ul'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Claude identifică features și requirements din {inputType === 'document' ? 'document' : 'interfața vizuală'}
        </p>
      </div>

      <div className="space-y-2">
        {stages.map((stage, i) => (
          <div
            key={stage}
            className={`flex items-center justify-center gap-2 text-sm transition-all duration-500 ${
              i === stageIndex ? 'text-indigo-600 font-medium' : i < stageIndex ? 'text-gray-400' : 'text-gray-300'
            }`}
          >
            {i < stageIndex && (
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {i === stageIndex && (
              <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              </span>
            )}
            {i > stageIndex && <span className="w-4 h-4 shrink-0" />}
            {stage}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">Poate dura 30–60 secunde pentru inputuri complexe</p>
    </div>
  );
}
