type SubmitRequestFormProps = {
  title: string;
  risk: string;
  setTitle: (title: string) => void;
  setRisk: (risk: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
};

function SubmitRequestForm({
  title,
  risk,
  setTitle,
  setRisk,
  handleSubmit,
}: SubmitRequestFormProps) {
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
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 flex-1 outline-none focus:border-blue-500"
        />

        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 transition rounded-lg px-6 py-3 font-medium"
        >
          Submit
        </button>
      </form>
    </section>
  );
}

export default SubmitRequestForm;