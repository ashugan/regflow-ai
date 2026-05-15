import type { AuditLog } from "../types";

type AuditLogsProps = {
  auditLogs: AuditLog[];
};

function AuditLogs({ auditLogs }: AuditLogsProps) {
  return (
    <section className="pb-10">
      <h2 className="text-3xl font-semibold mb-6">
        Audit Logs
      </h2>

      {auditLogs.length === 0 ? (
        <div className="text-slate-400">No audit logs</div>
      ) : (
        <div className="grid gap-4">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
            >
              <p className="text-slate-200">
                {log.action}
              </p>

              <p className="text-slate-500 text-sm mt-2">
                {log.timestamp}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AuditLogs;
