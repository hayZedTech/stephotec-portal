import toast from "react-hot-toast";

export const confirmAction = (message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false) => {
    toast((t) => (
        <div className="flex gap-2 items-center">
            <span className="flex-1">{message}</span>
            <button
                onClick={async () => {
                    toast.dismiss(t.id);
                    await onConfirm();
                }}
                className={`px-3 py-1 text-white rounded text-sm whitespace-nowrap ${isDangerous ? "bg-red-500" : "bg-blue-500"}`}
            >
                {confirmText}
            </button>
            <button
                onClick={() => {
                    toast.dismiss(t.id);
                    onCancel?.();
                }}
                className="px-3 py-1 bg-gray-300 text-black rounded text-sm whitespace-nowrap"
            >
                {cancelText}
            </button>
        </div>
    ), { duration: 5000 });
};
