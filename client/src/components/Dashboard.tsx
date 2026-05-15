import type { RequestItem } from "../types";

type DashboardProps = {
  requests: RequestItem[];
  isLoading: boolean;
  error?: string;
  onViewDetails: (request: RequestItem) => void;
};

function Dashboard({ requests, isLoading, error, onViewDetails }: DashboardProps) {
  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-3xl font-semibold mb-6">
          Dashboard
        </h2>
        <div className="text-slate-400">Loading requests...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8">
        <h2 className="text-3xl font-semibold mb-6">
          Dashboard
        </h2>
        <div className="text-red-400">Error: {error}</div>
      </section>
    );
  }

  if (requests.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-3xl font-semibold mb-6">
          Dashboard
        </h2>
        <div className="text-slate-400">No requests yet</div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-3xl font-semibold mb-6">
        Dashboard
      </h2>

      <div className="grid gap-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {request.title}
                </h3>

                <div className="mt-3 flex gap-3">
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm">
                    {request.status}
                  </span>

                  <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm">
                    {request.risk} Risk
                  </span>
                </div>
              </div>

              <button
                onClick={() => onViewDetails(request)}
                className="bg-slate-800 hover:bg-slate-700 transition px-4 py-2 rounded-lg"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Dashboard;
