interface Props {
  isOpen:       boolean;
  title:        string;
  message:      string;
  confirmText?: string;
  cancelText?:  string;
  variant?:     "danger" | "info" | "warning";
  onConfirm:    () => void;
  onCancel:     () => void;
}

export default function ConfirmDialog({
  isOpen, title, message, confirmText = "Confirm",
  cancelText = "Cancel", variant = "danger", onConfirm, onCancel,
}: Props) {
  if (!isOpen) return null;

  const btnColor = variant === "danger"
    ? "bg-red-600 hover:bg-red-500"
    : variant === "warning"
    ? "bg-amber-600 hover:bg-amber-500"
    : "bg-blue-600 hover:bg-blue-500";

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[999]" onClick={onCancel}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-[320px] mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <h3 className="text-white font-bold text-sm mb-2">{title}</h3>
          <p className="text-gray-400 text-xs leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-white/8 text-gray-400 hover:text-white text-xs font-medium transition-all">
            {cancelText}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2 rounded-xl text-white text-xs font-bold transition-all ${btnColor}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}