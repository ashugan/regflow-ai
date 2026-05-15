import { useState } from "react";

type SubmitRequestFormProps = {
  onSubmit: (data: { title: string; risk: string }) => void;
  isPending: boolean;
  error: string;
};

function SubmitRequestForm({
  onSubmit,
  isPending,
  error,
}: SubmitRequestFormProps) {
  const [title, setTitle] = useState("");
  const [risk, setRisk] = useState("Low");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ title, risk });
    setTitle("");
    setRisk("Low");
  }

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-6">
        Submit Request
      </h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row gap-4"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Request title"
          required
          disabled={isPending}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 flex-1 outline-none focus:border-blue-500 disabled:opacity-50"
        />

        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          disabled={isPending}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 disabled:opacity-50"
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-500 transition rounded-lg px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Submitting..." : "Submit"}
        </button>
      </form>

      {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
    </section>
  );
}

export default SubmitRequestForm;
