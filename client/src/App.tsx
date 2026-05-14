import SubmitRequestForm from "./components/SubmitRequestForm";
import Dashboard from "./components/Dashboard";
import { useEffect, useState } from "react";
import AIReviewPanel from "./components/AIReviewPanel";
import RequestDetails from "./components/RequestDetails";
import AuditLogs from "./components/AuditLogs";
import AdminControls from "./components/AdminControls";
const API_BASE_URL = "https://regflow-ai.onrender.com";

// Core request entity representing a regulatory workflow item.
// AI reviews are persisted as serialized JSON returned from backend services.
type RequestItem = {
  id: number;
  title: string;
  status: string;
  risk: string;
  ai_review?: string;
};


// Audit trail entries used for compliance visibility and workflow history.
type AuditLog = {
  id: number;
  request_id: number;
  action: string;
  timestamp: string;
};

// Structured AI-generated regulatory review returned from OpenAI services.
type AIReview = {
  executiveSummary: string;
  riskAssessment: string;
  missingInformation: string[];
  recommendedActions: string[];
};

// Metadata for uploaded request documents.
// Physical files are stored server-side while metadata is persisted in SQLite.
type DocumentItem = {
  id: number;
  request_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
};

function App() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [title, setTitle] = useState("");
  const [risk, setRisk] = useState("Low");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [requestLogs, setRequestLogs] = useState<AuditLog[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<RequestItem | null>(null);
  let parsedReview: AIReview | null = null;
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  try {
    if (selectedRequest?.ai_review) {
      const maybeReview = JSON.parse(selectedRequest.ai_review);

      if (
        maybeReview &&
        typeof maybeReview.executiveSummary === "string" &&
        typeof maybeReview.riskAssessment === "string" &&
        Array.isArray(maybeReview.missingInformation) &&
        Array.isArray(maybeReview.recommendedActions)
      ) {
        parsedReview = maybeReview;
      }
    }
  } catch (error) {
    console.error("Could not parse AI review:", error);
    parsedReview = null;
  }

  // Loads all workflow requests for dashboard rendering.
  function fetchRequests() {
    fetch(`${API_BASE_URL}/requests`)
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error(err));
  }

  function fetchAuditLogs() {
    fetch(`${API_BASE_URL}/audit-logs`)
      .then((res) => res.json())
      .then((data) => setAuditLogs(data))
      .catch((err) => console.error(err));
  }

  // Retrieves uploaded documents associated with a specific request.
  function fetchDocuments(requestId: number) {
    fetch(`${API_BASE_URL}/requests/${requestId}/documents`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDocuments(data);
        } else {
          console.error("Documents response was not an array:", data);
          setDocuments([]);
        }
      })
      .catch((err) => console.error(err));
  }

  function clearDatabase() {
    fetch(`${API_BASE_URL}/audit-logs`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        setRequests([]);
        setAuditLogs([]);
        setRequestLogs([]);
        setSelectedRequest(null);
      })
      .catch((err) => console.error(err));
  }

  function fetchRequestLogs(requestId: number) {
    fetch(`${API_BASE_URL}/requests/${requestId}/audit-logs`)
      .then((res) => res.json())
      .then((data) => setRequestLogs(data))
      .catch((err) => console.error(err));
  }

  // Uploads supporting documentation and refreshes related workflow state.
  function uploadDocument() {
    if (!selectedFile || !selectedRequest) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("document", selectedFile);

    fetch(`${API_BASE_URL}/requests/${selectedRequest.id}/documents`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then(() => {
        fetchDocuments(selectedRequest.id);
        fetchRequestLogs(selectedRequest.id);
        fetchAuditLogs();
        setSelectedFile(null);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setIsUploading(false);
      });
  }

  function deleteDocument(documentId: number) {
    fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        if (selectedRequest) {
          fetchDocuments(selectedRequest.id);
          fetchRequestLogs(selectedRequest.id);
          fetchAuditLogs();
        }
      })
      .catch((err) => console.error(err));
  }

  // Updates workflow status and synchronizes audit/activity state.
  function updateStatus(requestId: number, newStatus: string) {
    fetch(`${API_BASE_URL}/requests/${requestId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then(() => {
        fetchRequests();
        fetchAuditLogs();
        fetchRequestLogs(requestId);

        if (selectedRequest?.id === requestId) {
          setSelectedRequest({
            ...selectedRequest,
            status: newStatus,
          });
        }
      })
      .catch((err) => console.error(err));
  }

  useEffect(() => {
    fetchRequests();
    fetchAuditLogs();
  }, []);

  // Creates a new regulatory request and triggers backend AI review generation.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    fetch('${API_BASE_URL}/requests', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, risk }),
    })
      .then((res) => res.json())
      .then(async () => {


        setTitle("");
        setRisk("Low");

        fetchRequests();
        fetchAuditLogs();
      })
      .catch((err) => console.error(err));
  }

  // Main application UI containing:
  // - request dashboard
  // - AI review rendering
  // - workflow management
  // - document handling
  // - audit visibility
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
          title={title}
          risk={risk}
          setTitle={setTitle}
          setRisk={setRisk}
          handleSubmit={handleSubmit}
        />

        <AIReviewPanel
          parsedReview={parsedReview}
          onClose={() => {
            setSelectedRequest(null);
            setRequestLogs([]);
          }}
        />

        <Dashboard
          requests={requests}
          onViewDetails={(request) => {
            setSelectedRequest(request);
            fetchRequestLogs(request.id);
            fetchDocuments(request.id);
          }}
        />

        <RequestDetails
          selectedRequest={selectedRequest}
          requestLogs={requestLogs}
          documents={documents}
          selectedFile={selectedFile}
          isUploading={isUploading}
          setSelectedFile={setSelectedFile}
          onClose={() => {
            setSelectedRequest(null);
            setRequestLogs([]);
          }}
          onUpdateStatus={updateStatus}
          onUploadDocument={uploadDocument}
          onDeleteDocument={deleteDocument}
        />

        <AuditLogs auditLogs={auditLogs} />
        <AdminControls onClearDatabase={clearDatabase} />
      </div>
    </main>
  );
}

export default App;