"use client";

export default function Modal({ open, onClose, children }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg rounded-xl p-6">
                <button
                    onClick={onClose}
                    className="text-sm text-red-500 mb-4"
                >
                    Close
                </button>

                {children}
            </div>
        </div>
    );
}