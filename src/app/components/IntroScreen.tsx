interface IntroScreenProps {
  onStart: () => void;
  onOpenDashboard: () => void;
}

export function IntroScreen({ onStart, onOpenDashboard }: IntroScreenProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0E4562] to-[#38BAB3] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl">
        <div className="mb-4 flex justify-end">
          <button
            onClick={onOpenDashboard}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur-md transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            Therapist dashboard
          </button>
        </div>
        {/* Main Glass Card Container */}
        <div className="bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl rounded-2xl p-6 sm:p-8 lg:p-12">
          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              PulseKey Text Check-In
            </h1>
            <p className="text-lg sm:text-xl text-white/90 leading-relaxed">
              Take a private moment to reflect on your week
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 sm:p-8 mb-8 space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
              What to expect:
            </h2>
            
            <div className="space-y-4 text-white/90">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-semibold text-white">
                  1
                </span>
                <p className="flex-1 text-base sm:text-lg pt-1">
                  You'll answer <strong className="text-white">4 questions</strong> about your week
                </p>
              </div>
              
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-semibold text-white">
                  2
                </span>
                <p className="flex-1 text-base sm:text-lg pt-1">
                  Each answer should be <strong className="text-white">30–200 characters</strong>
                </p>
              </div>
              
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-semibold text-white">
                  3
                </span>
                <p className="flex-1 text-base sm:text-lg pt-1">
                  This check-in takes about <strong className="text-white">1-2 minutes</strong>
                </p>
              </div>
              
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-semibold text-white">
                  4
                </span>
                <p className="flex-1 text-base sm:text-lg pt-1">
                  You choose what is shared with your therapist, and can change your consent anytime
                </p>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="flex justify-center">
            <button
              onClick={onStart}
              className="w-full sm:w-auto sm:min-w-[240px] px-8 py-3.5 rounded-lg font-semibold text-lg transition-all focus:outline-none focus:ring-4 focus:ring-white/40 bg-white text-[#0E4562] hover:bg-white/90 hover:scale-105 active:scale-95 shadow-lg"
            >
              Start Check-In
            </button>
          </div>
          <p className="mt-5 text-center text-xs leading-relaxed text-white/60">
            Your therapist can only view check-ins you have explicitly consented to share.
          </p>
        </div>
      </div>
    </div>
  );
}
