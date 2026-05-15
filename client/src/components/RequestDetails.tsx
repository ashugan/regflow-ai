import type { RequestItem, AuditLog, DocumentItem } from "../types";

type RequestDetailsProps = {
    selectedRequest: RequestItem | null;
    requestLogs: AuditLog[];
    documents: DocumentItem[];
    selectedFile: File | null;
    isUploading: boolean;
    isLoadingDocs: boolean;
    isLoadingLogs: boolean;
    setSelectedFile: (file: File | null) => void;
    onClose: () => void;
    onUpdateStatus: (requestId: number, status: string) => void;
    onUploadDocument: () => void;
    onDeleteDocument: (documentId: number) => void;
    uploadError?: string;
    deleteError?: string;
};

function RequestDetails({
    selectedRequest,
    requestLogs,
    documents,
    selectedFile,
    isUploading,
    isLoadingDocs,
    isLoadingLogs,
    setSelectedFile,
    onClose,
    onUpdateStatus,
    onUploadDocument,
    onDeleteDocument,
    uploadError,
    deleteError,
}: RequestDetailsProps) {
    if (!selectedRequest) return null;

    return (
        <section className="bg-slate-900 border border-green-500/40 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6">
                Request Details
            </h2>

            <button
                onClick={onClose}
                className="mb-6 bg-slate-800 hover:bg-slate-700 transition px-4 py-2 rounded-lg"
            >
                Close Details
            </button>

            <div className="space-y-3 text-slate-300">
                <p><strong>ID:</strong> {selectedRequest.id}</p>
                <p><strong>Title:</strong> {selectedRequest.title}</p>
                <p><strong>Status:</strong> {selectedRequest.status}</p>
                <p><strong>Risk:</strong> {selectedRequest.risk}</p>
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    onClick={() =>
                        onUpdateStatus(selectedRequest.id, "In Review")
                    }
                    className="bg-yellow-600 hover:bg-yellow-500 transition px-4 py-2 rounded-lg"
                >
                    Mark In Review
                </button>

                <button
                    onClick={() =>
                        onUpdateStatus(selectedRequest.id, "Approved")
                    }
                    className="bg-green-600 hover:bg-green-500 transition px-4 py-2 rounded-lg"
                >
                    Approve
                </button>

                <button
                    onClick={() =>
                        onUpdateStatus(selectedRequest.id, "Rejected")
                    }
                    className="bg-red-600 hover:bg-red-500 transition px-4 py-2 rounded-lg"
                >
                    Reject
                </button>
            </div>

            <div className="pt-6">
                <h3 className="text-xl font-semibold mb-4">
                    Activity Timeline
                </h3>

                {isLoadingLogs ? (
                    <div className="text-slate-400 text-sm">Loading activity...</div>
                ) : (
                    <div className="space-y-3">
                        {requestLogs.length === 0 ? (
                            <p className="text-slate-400 text-sm">No activity yet</p>
                        ) : (
                            requestLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="bg-slate-800 rounded-lg p-4"
                                >
                                    <p>{log.action}</p>

                                    <p className="text-slate-400 text-sm mt-1">
                                        {log.timestamp}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <div className="pt-6">
                <h3 className="text-xl font-semibold mb-4">
                    Documents
                </h3>

                <div className="flex items-center gap-4 mb-4">
                    <label className="bg-slate-800 hover:bg-slate-700 transition px-4 py-2 rounded-lg cursor-pointer">
                        Select File

                        <input
                            type="file"
                            onChange={(e) =>
                                setSelectedFile(
                                    e.target.files ? e.target.files[0] : null
                                )
                            }
                            className="hidden"
                            disabled={isUploading}
                        />
                    </label>

                    {selectedFile && (
                        <span className="text-slate-300 text-sm">
                            {selectedFile.name}
                        </span>
                    )}

                    <button
                        onClick={onUploadDocument}
                        disabled={!selectedFile || isUploading}
                        className="bg-blue-600 hover:bg-blue-500 transition px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? "Uploading..." : "Upload"}
                    </button>
                </div>

                {uploadError && (
                    <p className="text-red-400 text-sm mb-3">{uploadError}</p>
                )}

                {deleteError && (
                    <p className="text-red-400 text-sm mb-3">{deleteError}</p>
                )}

                {isLoadingDocs ? (
                    <div className="text-slate-400 text-sm">Loading documents...</div>
                ) : (
                    <div className="space-y-3">
                        {documents.length === 0 ? (
                            <p className="text-slate-400 text-sm">No documents</p>
                        ) : (
                            documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="bg-slate-800 rounded-lg p-4"
                                >
                                    <p className="font-medium">
                                        {doc.original_name}
                                    </p>

                                    <p className="text-slate-400 text-sm">
                                        {doc.mime_type}
                                    </p>

                                    <div className="flex gap-3 mt-3">
                                        <a
                                            href={`https://regflow-ai.onrender.com/documents/${doc.id}/download`}
                                            className="bg-slate-700 hover:bg-slate-600 transition px-4 py-2 rounded-lg text-sm"
                                        >
                                            Download
                                        </a>

                                        <button
                                            onClick={() => onDeleteDocument(doc.id)}
                                            className="bg-red-700 hover:bg-red-600 transition px-4 py-2 rounded-lg text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

export default RequestDetails;
