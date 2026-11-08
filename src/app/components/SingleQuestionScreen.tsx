import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface SingleQuestionScreenProps {
  questionNumber: number;
  totalQuestions: number;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  error: string | null;
  touched: boolean;
  isNextDisabled: boolean;
}

export function SingleQuestionScreen({
  questionNumber,
  totalQuestions,
  label,
  placeholder,
  value,
  onChange,
  onNext,
  error,
  touched,
  isNextDisabled,
}: SingleQuestionScreenProps) {
  const charCount = value.length;
  const isOverLimit = charCount > 200;
  const isUnderLimit = charCount > 0 && charCount < 30;
  const isInvalid = isOverLimit || isUnderLimit;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Block input if over 200 characters
    if (newValue.length <= 200) {
      onChange(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Ctrl/Cmd + Enter to continue if valid
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isNextDisabled) {
      onNext();
    }
  };

  const isLastQuestion = questionNumber === totalQuestions;

  return (
    <div 
      className="min-h-screen w-full bg-gradient-to-b from-[#0E4562] to-[#38BAB3] flex items-center justify-center p-4 sm:p-6 lg:p-8"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-3xl">
        {/* Main Glass Card Container */}
        <div className="bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl rounded-2xl p-6 sm:p-8 lg:p-10">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-white/80">
                Question {questionNumber} of {totalQuestions}
              </p>
              <p className="text-sm font-medium text-white/80">
                {Math.round((questionNumber / totalQuestions) * 100)}%
              </p>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 sm:p-8 mb-8">
            {/* Question Label with Info Icon */}
            <div className="flex items-start gap-3 mb-6">
              <label className="flex-1 text-xl sm:text-2xl font-semibold text-white leading-snug">
                {label}
              </label>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex-shrink-0 text-white/70 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full p-0.5"
                      aria-label="Question help"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-white/95 text-gray-900 border-white/30 max-w-xs">
                    <p className="text-sm">Short, clear sentence helps the model learn.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Text Area */}
            <textarea
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full min-h-[180px] sm:min-h-[200px] p-4 rounded-lg bg-white/90 text-gray-900 placeholder:text-gray-500 text-base sm:text-lg resize-none focus:outline-none focus:ring-2 focus:ring-white/60 focus:bg-white transition-all mb-4"
              aria-invalid={touched && isInvalid}
              aria-describedby={touched && error ? `error-${questionNumber}` : undefined}
              autoFocus
            />

            {/* Helper Text and Counter Row */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <p className="text-sm text-white/70">30–200 characters</p>
              <p
                className={`text-sm font-semibold ${
                  isInvalid && charCount > 0
                    ? 'text-red-300'
                    : charCount > 0
                    ? 'text-emerald-300'
                    : 'text-white/70'
                }`}
                aria-live="polite"
              >
                {charCount}/200
              </p>
            </div>

            {/* Validation Message */}
            {touched && error && (
              <p id={`error-${questionNumber}`} className="text-sm text-red-300 font-medium" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Footer with Privacy Note and Navigation */}
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-white/60 text-center px-4">
              Your answers support your personal insights and are shared with your therapist only with your consent.
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={onNext}
                disabled={isNextDisabled}
                className="w-full sm:w-auto sm:min-w-[240px] px-8 py-3.5 rounded-lg font-semibold text-lg transition-all focus:outline-none focus:ring-4 focus:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-[#0E4562] hover:bg-white/90 hover:scale-105 disabled:hover:scale-100 disabled:hover:bg-white shadow-lg active:scale-95"
              >
                {isLastQuestion ? 'Submit' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
