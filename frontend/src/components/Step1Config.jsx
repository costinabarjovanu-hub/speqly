import { useState, useRef } from 'react';

const INPUT_TYPES = [
  {
    value: 'mockup',
    label: 'Mockup / Screenshot',
    description: 'Analizează o imagine UI și generează tickets din elementele vizuale',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    accept: 'image/*',
    hint: 'PNG, JPG, WEBP până la 10MB'
  },
  {
    value: 'document',
    label: 'Document / Specificație',
    description: 'Extrage requirements dintr-un PDF, spec sau fișier text',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    accept: '.pdf,.txt,.md,.markdown,.spec,.csv,text/plain,application/pdf,text/markdown',
    hint: 'PDF, TXT, MD, SPEC până la 20MB'
  }
];

export default function Step1Config({ config, onComplete }) {
  const [cfg, setCfg] = useState(config);
  const [inputType, setInputType] = useState(config.inputType || 'mockup');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const update = (key, value) => setCfg(prev => ({ ...prev, [key]: value }));

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    if (inputType === 'mockup' && f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleInputTypeChange = (type) => {
    setInputType(type);
    setFile(null);
    setPreview(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const activeType = INPUT_TYPES.find(t => t.value === inputType);
  const canProceed = file && cfg.anthropicKey;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canProceed) return;
    onComplete({ ...cfg, inputType }, file, preview, inputType);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Input type selector */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Tip input</h2>
        <p className="text-sm text-gray-500 mb-4">Ce vrei să analizezi?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INPUT_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleInputTypeChange(type.value)}
              className={`
                flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all
                ${inputType === type.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <span className={inputType === type.value ? 'text-indigo-600' : 'text-gray-400'}>
                {type.icon}
              </span>
              <div>
                <p className={`text-sm font-semibold ${inputType === type.value ? 'text-indigo-900' : 'text-gray-700'}`}>
                  {type.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* File upload */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {inputType === 'mockup' ? 'Upload Screenshot' : 'Upload Document'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{activeType.hint}</p>

        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}
          `}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={activeType.accept}
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {file ? (
            <div className="space-y-3">
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow object-contain" />
              ) : (
                <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto">
                  <span className={`text-indigo-600`}>{activeType.icon}</span>
                </div>
              )}
              <p className="text-sm text-gray-700 font-medium">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Șterge fișierul
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-gray-300 flex justify-center">{activeType.icon}</span>
              <p className="text-sm font-medium text-gray-700">
                {inputType === 'mockup' ? 'Trage un screenshot sau click pentru browse' : 'Trage un document sau click pentru browse'}
              </p>
              <p className="text-xs text-gray-400">{activeType.hint}</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Configuration */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurare AI</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Anthropic API Key <span className="text-red-500">*</span></label>
            <input
              type="password"
              className="input"
              placeholder="sk-ant-..."
              value={cfg.anthropicKey}
              onChange={(e) => update('anthropicKey', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">AC Format <span className="text-gray-400 font-normal text-xs">(default, schimbabil la pasul următor)</span></label>
              <select className="input" value={cfg.acFormat} onChange={(e) => update('acFormat', e.target.value)}>
                <option value="user-should">User should be able to...</option>
                <option value="given-when-then">Given / When / Then</option>
              </select>
            </div>
            <div>
              <label className="label">Max Story Points</label>
              <select className="input" value={cfg.maxStoryPoints} onChange={(e) => update('maxStoryPoints', Number(e.target.value))}>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={8}>8</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Context domeniu <span className="text-gray-400 font-normal">(opțional)</span></label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="ex: Aplicație e-commerce B2B pentru managementul comenzilor"
              value={cfg.domainContext}
              onChange={(e) => update('domainContext', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Jira Configuration */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Configurare Jira <span className="text-sm text-gray-400 font-normal">(opțional — necesar doar pentru push)</span>
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Jira Domain</label>
              <input
                type="text"
                className="input"
                placeholder="yourcompany.atlassian.net"
                value={cfg.jiraDomain}
                onChange={(e) => update('jiraDomain', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Project Key</label>
              <input
                type="text"
                className="input"
                placeholder="PROJ"
                value={cfg.jiraProjectKey}
                onChange={(e) => update('jiraProjectKey', e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Jira Email</label>
              <input
                type="email"
                className="input"
                placeholder="tu@company.com"
                value={cfg.jiraEmail}
                onChange={(e) => update('jiraEmail', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Jira API Token</label>
              <input
                type="password"
                className="input"
                placeholder="Token din id.atlassian.com"
                value={cfg.jiraToken}
                onChange={(e) => update('jiraToken', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={!canProceed}>
          Analizează {inputType === 'mockup' ? 'Mockup-ul' : 'Documentul'}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
