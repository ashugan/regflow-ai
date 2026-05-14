type AIReview = {
  executiveSummary: string;
  riskAssessment: string;
  missingInformation: string[];
  recommendedActions: string[];
};

type AIReviewPanelProps = {
  parsedReview: AIReview | null;
  onClose: () => void;
};

function AIReviewPanel({ parsedReview, onClose }: AIReviewPanelProps) {
  if (!parsedReview) return null;

  return (
    <section className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">AI Review</h2>

        <button
          onClick={onClose}
          className="bg-slate-800 hover:bg-slate-700 transition px-4 py-2 rounded-lg text-sm"
        >
          Close
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-slate-300 mb-2">
            Executive Summary
          </h3>
          <p className="text-slate-400">{parsedReview.executiveSummary}</p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-300 mb-2">
            Risk Assessment
          </h3>
          <p className="text-slate-400">{parsedReview.riskAssessment}</p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-300 mb-2">
            Missing Information
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            {parsedReview.missingInformation.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-slate-300 mb-2">
            Recommended Actions
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            {parsedReview.recommendedActions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default AIReviewPanel;