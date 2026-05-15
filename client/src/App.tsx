import SubmitRequestForm from "./components/SubmitRequestForm";
import Dashboard from "./components/Dashboard";
import { useState } from "react";
import RequestModal from "./components/RequestModal";
import AuditLogs from "./components/AuditLogs";
import AdminControls from "./components/AdminControls";
import {
  useRequests,
  useAuditLogs,
  useRequestLogs,
  useCreateRequest,
  useDeleteRequest,
  useClearDatabase,
} from "./api/queries";
import type { RequestItem } from "./types";

function App() {
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null
  );

  const requestsQuery = useRequests();
  const auditLogsQuery = useAuditLogs();
  const requestLogsQuery = useRequestLogs(selectedRequest?.id ?? null);
  const createRequestMutation = useCreateRequest();
  const deleteRequestMutation = useDeleteRequest();
  const clearDatabaseMutation = useClearDatabase();

  function handleSubmit(data: { title: string; risk: string }) {
    createRequestMutation.mutate(data);
  }

  function deleteRequest(requestId: number) {
    deleteRequestMutation.mutate(requestId, {
      onSuccess: () => {
        setSelectedRequest(null);
      },
    });
  }

  function handleClearDatabase() {
    clearDatabaseMutation.mutate(undefined, {
      onSuccess: () => {
        setSelectedRequest(null);
      },
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl p-8">
        <header className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight">
            RegFlow AI
          </h1>

          <p className="mt-3 text-slate-400 text-lg">
            AI-powered regulatory workflow platform
          </p>
        </header>

        <SubmitRequestForm
          onSubmit={handleSubmit}
          isPending={createRequestMutation.isPending}
          error={createRequestMutation.error?.message || ""}
        />

        <Dashboard
          requests={requestsQuery.data || []}
          isLoading={requestsQuery.isLoading}
          error={requestsQuery.error?.message}
          onViewDetails={(request) => {
            setSelectedRequest(request);
          }}
        />

        <RequestModal
          request={selectedRequest}
          auditLogs={requestLogsQuery.data || []}
          onClose={() => {
            setSelectedRequest(null);
          }}
          onDelete={deleteRequest}
          isLoadingLogs={requestLogsQuery.isLoading}
          isDeleting={deleteRequestMutation.isPending}
          deleteError={deleteRequestMutation.error?.message}
        />

        <AuditLogs auditLogs={auditLogsQuery.data || []} />
        <AdminControls
          onClearDatabase={handleClearDatabase}
          isLoading={clearDatabaseMutation.isPending}
        />
      </div>
    </main>
  );
}

export default App;
