import toast from "react-hot-toast";

export function successToast(message) {
    toast.success(message);
}

export function errorToast(error, fallback = "Something went wrong.") {
    // If error is null or undefined, don't show anything
    if (!error) {
        toast.error(fallback);
        return;
    }

    const status = error?.response?.status;
    const errors = error?.response?.data;

    let message = fallback;

    // Handle 404 errors
    if (status === 404) {
        message = "No data available. This feature may not be set up yet.";
    }
    // Handle 403 errors
    else if (status === 403) {
        message = "You don't have permission to access this.";
    }
    // Handle 500 errors
    else if (status === 500) {
        message = "Server error. Please try again later.";
    }
    // Handle network errors
    else if (error?.message === "Network Error") {
        message = "Network error. Please check your connection.";
    }
    // Handle API response errors
    else if (errors?.detail) {
        message = errors.detail;
    } else if (errors?.message) {
        message = errors.message;
    } else if (typeof errors === "object" && errors !== null) {
        const errorMessages = Object.values(errors)
            .flat()
            .filter(msg => msg && typeof msg === "string");
        if (errorMessages.length > 0) {
            message = errorMessages.join(" ");
        }
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