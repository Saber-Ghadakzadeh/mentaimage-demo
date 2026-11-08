import { useState } from 'react';
import { Edit2, Check, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface SummaryScreenProps {
  questions: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  onAnswerChange: (id: string, value: string) => void;
  onSubmit: () => void;
}

export function SummaryScreen({
  questions,
  onAnswerChange,
  onSubmit,
}: SummaryScreenProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEditStart = (questionId: string, currentValue: string) => {
    setEditingId(questionId);
    setEditValue(currentValue);
    setError(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
    setError(null);
  };

  const handleEditSave = () => {
    if (!editingId) return;

    const length = editValue.length;
    if (length < 30) {
      setError('Please add a bit more detail.');
      return;
    }
    if (length > 200) {
      setError('Please shorten to 200 characters.');
      return;
    }

    onAnswerChange(editingId, editValue);
    setEditingId(null);
    setEditValue('');
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= 200) {
      setEditValue(newValue);
      setError(null);
    }
  };

  const allAnswersValid = questions.every(
    (q) => q.value.length >= 30 && q.value.length <= 200
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0E4562] to-[#38BAB3] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        {/* Main Glass Card Container */}
        <div className="bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl rounded-2xl p-6 sm:p-8 lg:p-10">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              Review Your Answers
            </h1>
            <p className="text-base sm:text-lg text-white/80">
              Take a moment to review and edit your responses before submitting
            </p>
          </div>

          {/* Questions Summary */}
          <div className="space-y-4 mb-8">
            {questions.map((question, index) => {
              const isEditing = editingId === question.id;

              return (
                <div
                  key={question.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 sm:p-6 hover:bg-white/15 transition-colors"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                          Question {index + 1}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-medium text-white/90 leading-snug">
                        {question.label}
                      </h3>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => handleEditStart(question.id, question.value)}
                        className="flex-shrink-0 p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label="Edit answer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Answer Display or Edit Mode */}
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Edit Textarea */}
                      <div className="relative">
                        <textarea
                          value={editValue}
                          onChange={handleChange}
                          className="w-full min-h-[120px] p-3 rounded-lg bg-white/90 text-gray-900 text-sm sm:text-base resize-none focus:outline-none focus:ring-2 focus:ring-white/60 focus:bg-white transition-all"
                          autoFocus
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-white/70">30–200 characters</span>
                          <span
                            className={`text-xs font-semibold ${
                              editValue.length < 30 || editValue.length > 200
                                ? 'text-red-300'
                                : 'text-emerald-300'
                            }`}
                          >
                            {editValue.length}/200
                          </span>
                        </div>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <p className="text-sm text-red-300 font-medium" role="alert">
                          {error}
                        </p>
                      )}

                      {/* Edit Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleEditSave}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#0E4562] hover:bg-white/90 font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/90 rounded-lg p-4">
                      <p className="text-gray-900 text-sm sm:text-base leading-relaxed">
                        {question.value}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        {question.value.length} characters
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer and Submit */}
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-white/60 text-center px-4">
              By submitting, your answers support your personal insights. Sharing with your therapist follows your consent settings.
            </p>

            <div className="flex justify-center">
              <button
                onClick={onSubmit}
                disabled={!allAnswersValid || editingId !== null}
                className="w-full sm:w-auto sm:min-w-[240px] px-8 py-3.5 rounded-lg font-semibold text-lg transition-all focus:outline-none focus:ring-4 focus:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-[#0E4562] hover:bg-white/90 hover:scale-105 disabled:hover:scale-100 disabled:hover:bg-white shadow-lg active:scale-95"
              >
                Submit Check-In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
