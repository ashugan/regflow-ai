type AdminControlsProps = {
  onClearDatabase: () => void;
};

function AdminControls({ onClearDatabase }: AdminControlsProps) {
  return (
    <div className="flex justify-center py-10">
      <button
        onClick={onClearDatabase}
        className="bg-red-700 hover:bg-red-600 transition px-6 py-3 rounded-xl font-semibold"
      >
        Clear Database
      </button>
    </div>
  );
}

export default AdminControls;