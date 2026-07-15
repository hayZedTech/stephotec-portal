// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
};

// Upload file to Cloudinary
export const uploadToCloudinary = async (file, folder = "stephotec") => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
        formData.append("folder", folder);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error("Upload failed");
        }

        const data = await response.json();
        return {
            url: data.secure_url,
            publicId: data.public_id,
            size: data.bytes,
            type: data.resource_type,
        };
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/resources/image/upload`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    public_ids: [publicId],
                }),
            }
        );

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        return true;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw error;
    }
};

// Get file size in MB
export const getFileSizeInMB = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2);
};

// Validate file
export const validateFile = (file, maxSizeMB = 10, allowedTypes = []) => {
    const errors = [];

    if (!file) {
        errors.push("No file selected");
        return errors;
    }

    // Check file size
    const fileSizeMB = getFileSizeInMB(file.size);
    if (fileSizeMB > maxSizeMB) {
        errors.push(`File size must be less than ${maxSizeMB}MB (current: ${fileSizeMB}MB)`);
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(", ")}`);
    }

    return errors;
};

// Image validation
export const validateImage = (file, maxSizeMB = 5) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    return validateFile(file, maxSizeMB, allowedTypes);
};

// Document validation
export const validateDocument = (file, maxSizeMB = 10) => {
    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
    ];
    return validateFile(file, maxSizeMB, allowedTypes);
};

// Video validation
export const validateVideo = (file, maxSizeMB = 100) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    return validateFile(file, maxSizeMB, allowedTypes);
};
