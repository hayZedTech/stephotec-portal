import toast from "react-hot-toast";

export const confirmAction = (message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false) => {
    toast((t) => (
        <div className="flex flex-col gap-3 max-w-sm">
            <span className="text-sm font-medium text-gray-800">{message}</span>
            <div className="flex gap-2 justify-end">
                <button
                    onClick={() => {
                        toast.dismiss(t.id);
                        onCancel?.();
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm whitespace-nowrap hover:bg-gray-300"
                >
                    {cancelText}
                </button>
                <button
                    onClick={async () => {
                        toast.dismiss(t.id);
                        await onConfirm();
                    }}
                    className={`px-3 py-1.5 text-white rounded text-sm whitespace-nowrap ${isDangerous ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    ), { duration: 10000, position: "top-center" });
};
