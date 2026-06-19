import { useState } from 'react';

const AC_FORMATS = [
  {
    value: 'user-should',
    label: 'User should be able to...',
    example: 'User should be able to reset their password via email link',
    description: 'Format simplu și direct, focusat pe acțiunea utilizatorului'
  },
  {
    value: 'given-when-then',
    label: 'Given / When / Then',
    example: 'Given the user is on the login page, When they click "Forgot password", Then they receive a reset email',
    description: 'Format BDD — precondition, acțiune, rezultat așteptat'
  }
];

function FeatureCard({ feature, index }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0 mt-0.5">
        {index + 1}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{feature.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{feature.description}</p>
        {feature.source && (
          <p className="text-xs text-indigo-500 mt-1 italic">↳ {feature.source}</p>
        )}
      </div>
    </div>
  );
}

export default function StepChooseFormat({ features, observations, config, inputType, filePreview, onComplete, onBack }) {
  const [acFormat, setAcFormat] = useState(config.acFormat || 'user-should');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features,
          config: { ...config, acFormat }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      onComplete(data.tickets || [], acFormat);
    } catch (err) {
      setError(err.message);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Observations */}
      {observations && (
        <div className="card p-5 bg-indigo-50 border-indigo-200">
          <h3 className="text-sm font-semibold text-indigo-900 mb-1">
            {inputType === 'document' ? 'Sumar document' : 'Observații UI'}
          </h3>
          <p className="text-sm text-indigo-700">{observations}</p>
        </div>
      )}

      {/* Features identified */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Features identificate</h2>
            <p className="text-sm text-gray-500">
              {features.length} feature{features.length !== 1 ? 's' : ''} extrase din {inputType === 'document' ? 'document' : 'mockup'}
            </p>
          </div>
          {filePreview && (
            <img src={filePreview} alt="Input" className="w-14 h-14 object-cover rounded-lg border border-gray-200 hidden sm:block" />
          )}
        </div>

        <div className="space-y-2">
          {features.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </div>

      {/* AC Format selector */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Alege formatul Acceptance Criteria</h2>
        <p className="text-sm text-gray-500 mb-4">
          Story-urile vor fi generate cu AC-urile în formatul ales
        </p>

        <div className="space-y-3">
          {AC_FORMATS.map(fmt => (
            <label
              key={fmt.value}
              className={`
                flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                ${acFormat === fmt.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="radio"
                name="acFormat"
                value={fmt.value}
                checked={acFormat === fmt.value}
                onChange={() => setAcFormat(fmt.value)}
                className="mt-1 text-indigo-600"
              />
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${acFormat === fmt.value ? 'text-indigo-900' : 'text-gray-800'}`}>
                  {fmt.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{fmt.description}</p>
                <p className={`text-xs mt-2 italic rounded p-2 ${acFormat === fmt.value ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                  Ex: {fmt.example}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} disabled={generating} className="btn-secondary">
          Înapoi
        </button>
        <button onClick={handleGenerate} disabled={generating} className="btn-primary">
          {generating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              Se generează story-urile...
            </>
          ) : (
            <>
              Generează {features.length} Story{features.length !== 1 ? '-uri' : ''}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
