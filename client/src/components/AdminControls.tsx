type AdminControlsProps = {
  onClearDatabase: () => void;
  isLoading: boolean;
};

function AdminControls({ onClearDatabase, isLoading }: AdminControlsProps) {
  return (
    <div className="flex justify-center py-10">
      <button
        onClick={onClearDatabase}
        disabled={isLoading}
        className="bg-red-700 hover:bg-red-600 transition px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Clearing..." : "Clear Database"}
      </button>
    </div>
  );
}

export default AdminControls;
