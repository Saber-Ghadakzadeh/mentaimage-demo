import { Loader2 } from "lucide-react";

interface ProcessingScreenProps {
  onGoHome: () => void;
}

export function ProcessingScreen({
  onGoHome,
}: ProcessingScreenProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0E4562] to-[#38BAB3] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl">
        {/* Main Glass Card Container */}
        <div className="bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl rounded-2xl p-8 sm:p-12 lg:p-16">
          <div className="flex flex-col items-center gap-6 text-center">
            {/* Message */}
            <p className="text-lg sm:text-xl lg:text-2xl text-white leading-relaxed max-w-md mb-4">
              Thanks for sharing. Your insights are being
              processed.
            </p>

            {/* Go to Home Button */}
            <button
              onClick={onGoHome}
              className="px-8 py-3.5 rounded-lg font-semibold text-lg transition-all focus:outline-none focus:ring-4 focus:ring-white/40 bg-white text-[#0E4562] hover:bg-white/90 hover:scale-105 shadow-lg active:scale-95"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}