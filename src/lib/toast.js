import toast from "react-hot-toast";

export function successToast(message) {
    toast.success(message);
}

export function errorToast(error, fallback = "Something went wrong.") {
    if (!error) {
        toast.error(fallback);
        return;
    }

    const status = error?.response?.status;
    const errors = error?.response?.data;

    let message = fallback;

    // Handle DRF validation errors FIRST
    if (errors && typeof errors === "object") {
        let errorMessages = Object.values(errors)
            .flat()
            .filter((msg) => typeof msg === "string")
            .map((msg) => {
                if (msg.includes("Invalid pk") || msg.includes("Expected pk value")) {
                    return "Selected option does not exist. Please choose a valid item or create one first.";
                }
                return msg;
            });

        if (errorMessages.length) {
            toast.error(errorMessages.join("\n\n"));
            return;
        }
    }

    if (errors?.detail) {
        message = errors.detail;
    } else if (errors?.message) {
        message = errors.message;
    } else if (status === 404) {
        message = "Requested item not found (404). It may have been deleted or the database was cleared.";
    } else if (status === 403) {
        message = "You don't have permission to perform this action.";
    } else if (status === 500) {
        message = "Server error (500). Please check backend logs or try again.";
    } else if (error?.message === "Network Error") {
        message = "Network error. Please check your internet connection.";
    }

    toast.error(message);
}

export function infoToast(message) {
    toast(message);
}

export function loadingToast(message) {
    return toast.loading(message);
}

export function dismissToast(id) {
    toast.dismiss(id);
}