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
        const errorMessages = Object.values(errors)
            .flat()
            .filter((msg) => typeof msg === "string");

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
        message = "No data available. This feature may not be set up yet.";
    } else if (status === 403) {
        message = "You don't have permission to access this.";
    } else if (status === 500) {
        message = "Server error. Please try again later.";
    } else if (error?.message === "Network Error") {
        message = "Network error. Please check your connection.";
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