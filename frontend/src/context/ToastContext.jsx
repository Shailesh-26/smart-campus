import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = "info") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);

// Inline to avoid circular imports
function ToastContainer({ toasts, removeToast }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-3">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

function ToastItem({ toast, onClose }) {
    const styles = {
        success: "bg-green-600 text-white",
        error: "bg-red-600 text-white",
        info: "bg-slate-800 text-white",
    };

    const icons = {
        success: "✅",
        error: "❌",
        info: "ℹ️",
    };

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[280px] max-w-sm
        animate-fade-in ${styles[toast.type] || styles.info}`}
        >
            <span className="text-lg">{icons[toast.type]}</span>
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
                onClick={onClose}
                className="text-white opacity-70 hover:opacity-100 text-lg leading-none"
            >
                ×
            </button>
        </div>
    );
}