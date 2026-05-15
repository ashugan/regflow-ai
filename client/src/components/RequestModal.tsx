import { useState } from "react";
import type { RequestItem, AIReview, AuditLog } from "../types";
import {
  useRequestDocuments,
  useUploadDocument,
  useDeleteDocument,
} from "../api/queries";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type RequestModalProps = {
  request: RequestItem | null;
  auditLogs: AuditLog[];
  onClose: () => void;
  onDelete: (requestId: number) => void;
  isLoadingLogs: boolean;
  isDeleting: boolean;
  deleteError?: string;
};

function RequestModal({
  request,
  auditLogs,
  onClose,
  onDelete,
  isLoadingLogs,
  isDeleting,
  deleteError,
}: RequestModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const documentsQuery = useRequestDocuments(request?.id ?? null);
  const uploadMutation = useUploadDocument();
  const deleteDocumentMutation = useDeleteDocument();

  function handleUpload() {
    if (!selectedFile || !request) return;
    uploadMutation.mutate(
      { requestId: request.id, file: selectedFile },
      { onSuccess: () => setSelectedFile(null) }
    );
  }

  if (!request) return null;

  let parsedReview: AIReview | null = null;
  try {
    if (request.ai_review) {
      const maybeReview = JSON.parse(request.ai_review);
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
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-800">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">{request.title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Request Meta */}
          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
            <p className="text-slate-300">
              <strong>ID:</strong> {request.id}
            </p>
            <p className="text-slate-300">
              <strong>Status:</strong>{" "}
              <span className="bg-slate-700 px-3 py-1 rounded-full text-sm">
                {request.status}
              </span>
            </p>
            <p className="text-slate-300">
              <strong>Risk:</strong>{" "}
              <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm">
                {request.risk}
              </span>
            </p>
          </div>

          {/* AI Review */}
          {parsedReview && (
            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-lg font-semibold mb-4">AI Review</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-300 mb-2">
                    Executive Summary
                  </h4>
                  <p className="text-slate-400 text-sm">
                    {parsedReview.executiveSummary}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-300 mb-2">
                    Risk Assessment
                  </h4>
                  <p className="text-slate-400 text-sm">
                    {parsedReview.riskAssessment}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-300 mb-2">
                    Missing Information
                  </h4>
                  {parsedReview.missingInformation.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm">
                      {parsedReview.missingInformation.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 text-sm">None identified</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-slate-300 mb-2">
                    Recommended Actions
                  </h4>
                  {parsedReview.recommendedActions.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm">
                      {parsedReview.recommendedActions.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 text-sm">No actions needed</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs */}
          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
            {isLoadingLogs ? (
              <p className="text-slate-400 text-sm">Loading activity...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-slate-400 text-sm">No activity</p>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-slate-800 rounded-lg p-3">
                    <p className="text-slate-300 text-sm">{log.action}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-lg font-semibold mb-4">Documents</h3>

            <div className="flex items-center gap-4 mb-4">
              <label className="bg-slate-800 hover:bg-slate-700 transition px-4 py-2 rounded-lg cursor-pointer text-sm">
                Select File
                <input
                  type="file"
                  onChange={(e) =>
                    setSelectedFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="hidden"
                  disabled={uploadMutation.isPending}
                />
              </label>

              {selectedFile && (
                <span className="text-slate-300 text-sm">{selectedFile.name}</span>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="bg-blue-600 hover:bg-blue-500 transition px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>

            {uploadMutation.error && (
              <p className="text-red-400 text-sm mb-3">
                {uploadMutation.error.message}
              </p>
            )}

            {deleteDocumentMutation.error && (
              <p className="text-red-400 text-sm mb-3">
                {deleteDocumentMutation.error.message}
              </p>
            )}

            {documentsQuery.isLoading ? (
              <p className="text-slate-400 text-sm">Loading documents...</p>
            ) : documentsQuery.data?.length === 0 ? (
              <p className="text-slate-400 text-sm">No documents</p>
            ) : (
              <div className="space-y-3">
                {documentsQuery.data?.map((doc) => (
                  <div key={doc.id} className="bg-slate-800 rounded-lg p-4">
                    <p className="font-medium text-sm">{doc.original_name}</p>
                    <p className="text-slate-400 text-xs mt-1">{doc.mime_type}</p>
                    <div className="flex gap-3 mt-3">
                      <a
                        href={`${API_BASE_URL}/documents/${doc.id}/download`}
                        className="bg-slate-700 hover:bg-slate-600 transition px-4 py-2 rounded-lg text-sm"
                      >
                        Download
                      </a>
                      <button
                        onClick={() =>
                          deleteDocumentMutation.mutate({
                            documentId: doc.id,
                            requestId: request.id,
                          })
                        }
                        className="bg-red-700 hover:bg-red-600 transition px-4 py-2 rounded-lg text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Error */}
          {deleteError && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm">{deleteError}</p>
            </div>
          )}

          {/* Delete Button & Confirmation */}
          {!showDeleteConfirm ? (
            <div className="border-t border-slate-800 pt-6">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-700 hover:bg-red-600 transition px-4 py-3 rounded-lg font-medium text-red-100"
              >
                Delete Request
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-800 pt-6 space-y-3">
              <p className="text-slate-300">
                Are you sure? This will delete the request from the dashboard,
                but audit logs will be preserved.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => onDelete(request.id)}
                  disabled={isDeleting}
                  className="flex-1 bg-red-700 hover:bg-red-600 transition px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 transition px-4 py-3 rounded-lg font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestModal;
