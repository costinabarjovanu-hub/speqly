export default function StepIndicator({ steps, currentStep }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0
                    ${isCompleted ? 'bg-indigo-600 text-white' : ''}
                    ${isCurrent ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block whitespace-nowrap
                    ${isCurrent ? 'text-indigo-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
                  `}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
