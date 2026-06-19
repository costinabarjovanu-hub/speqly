import { useState, useCallback } from 'react';
import StepIndicator from './components/StepIndicator';
import Step1Config from './components/Step1Config';
import Step2Analysis from './components/Step2Analysis';
import StepChooseFormat from './components/StepChooseFormat';
import Step3Review from './components/Step3Review';
import Step4Approve from './components/Step4Approve';
import Step5Preview from './components/Step5Preview';
import Step6Push from './components/Step6Push';

const STEPS = [
  'Configure',
  'Analyze',
  'Choose Format',
  'Review',
  'Approve',
  'Preview',
  'Push to Jira'
];

const DEFAULT_CONFIG = {
  anthropicKey: '',
  jiraDomain: '',
  jiraEmail: '',
  jiraToken: '',
  jiraProjectKey: '',
  acFormat: 'user-should',
  maxStoryPoints: 5,
  domainContext: '',
  inputType: 'mockup'
};

function loadConfig() {
  try {
    const saved = localStorage.getItem('speqly_config');
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export default function App() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState(loadConfig);

  // Step 1 outputs
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [inputType, setInputType] = useState('mockup');

  // Step 2 outputs
  const [observations, setObservations] = useState('');
  const [features, setFeatures] = useState([]);

  // Step 3 (ChooseFormat) outputs
  const [tickets, setTickets] = useState([]);

  // Step 4 (Approve) outputs
  const [approvedIds, setApprovedIds] = useState(new Set());

  // Step 6 (Push) outputs
  const [pushResults, setPushResults] = useState([]);

  const saveConfig = useCallback((newConfig) => {
    setConfig(newConfig);
    try { localStorage.setItem('speqly_config', JSON.stringify(newConfig)); } catch {}
  }, []);

  // Step 1 → 2
  const handleStep1Complete = (cfg, uploadedFile, preview, type) => {
    saveConfig(cfg);
    setFile(uploadedFile);
    setFilePreview(preview);
    setInputType(type);
    setStep(1);
  };

  // Step 2 → 3
  const handleAnalysisComplete = (obs, extractedFeatures) => {
    setObservations(obs);
    setFeatures(extractedFeatures);
    setStep(2);
  };

  // Step 3 → 4
  const handleFormatComplete = (generatedTickets, chosenAcFormat) => {
    setTickets(generatedTickets.map(t => ({ ...t, clarificationAnswers: {} })));
    saveConfig({ ...config, acFormat: chosenAcFormat });
    setStep(3);
  };

  // Ticket update in Review
  const handleTicketUpdate = useCallback((updatedTicket) => {
    setTickets(prev => prev.map(t =>
      t.id === updatedTicket.id ? { ...updatedTicket, clarificationAnswers: {} } : t
    ));
  }, []);

  // Step 4 → 5
  const handleStep4Complete = (selectedIds) => {
    setApprovedIds(selectedIds);
    setStep(4);
  };

  const approvedTickets = tickets.filter(t => approvedIds.has(t.id));

  const handleReset = () => {
    setStep(0);
    setFile(null);
    setFilePreview(null);
    setInputType('mockup');
    setObservations('');
    setFeatures([]);
    setTickets([]);
    setApprovedIds(new Set());
    setPushResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-indigo-600">Speqly</span>
            <span className="text-sm text-gray-500 hidden sm:block">Screenshot / Doc → Jira Tickets</span>
          </div>
          {step > 0 && (
            <button onClick={handleReset} className="btn-secondary text-xs py-1.5">
              Început nou
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <StepIndicator steps={STEPS} currentStep={step} />

        <div className="mt-8">
          {step === 0 && (
            <Step1Config config={config} onComplete={handleStep1Complete} />
          )}
          {step === 1 && (
            <Step2Analysis
              file={file}
              inputType={inputType}
              config={config}
              onComplete={handleAnalysisComplete}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <StepChooseFormat
              features={features}
              observations={observations}
              config={config}
              inputType={inputType}
              filePreview={filePreview}
              onComplete={handleFormatComplete}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3Review
              tickets={tickets}
              observations={observations}
              config={config}
              filePreview={filePreview}
              onTicketUpdate={handleTicketUpdate}
              onComplete={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <Step4Approve
              tickets={tickets}
              onComplete={handleStep4Complete}
              onBack={() => setStep(3)}
            />
          )}
          {step === 5 && (
            <Step5Preview
              tickets={approvedTickets}
              onComplete={() => setStep(6)}
              onBack={() => setStep(4)}
            />
          )}
          {step === 6 && (
            <Step6Push
              tickets={approvedTickets}
              config={config}
              pushResults={pushResults}
              onPushComplete={setPushResults}
              onBack={() => setStep(5)}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
    </div>
  );
}
