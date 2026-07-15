"use client";

import { useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Paper,
    IconButton,
    LinearProgress,
} from "@mui/material";
import { CloudUpload, Close, CheckCircle } from "@mui/icons-material";
import { uploadToCloudinary, validateImage, validateDocument, validateVideo } from "@/lib/cloudinary";
import { successToast, errorToast } from "@/lib/toast";

export default function FileUploadField({
    label = "Upload File",
    onUploadComplete,
    fileType = "image",
    maxSizeMB = 5,
    accept = "image/*",
    folder = "stephotec",
    disabled = false,
}) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const getValidator = () => {
        switch (fileType) {
            case "image":
                return validateImage;
            case "document":
                return validateDocument;
            case "video":
                return validateVideo;
            default:
                return validateImage;
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validator = getValidator();
        const errors = validator(file, maxSizeMB);

        if (errors.length > 0) {
            errorToast(null, errors.join(". "));
            return;
        }

        if (fileType === "image") {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreview(event.target?.result);
            };
            reader.readAsDataURL(file);
        }

        try {
            setUploading(true);
            setUploadProgress(0);

            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + Math.random() * 30;
                });
            }, 200);

            const result = await uploadToCloudinary(file, folder);

            clearInterval(progressInterval);
            setUploadProgress(100);

            setUploadedFile({
                name: file.name,
                url: result.url,
                publicId: result.publicId,
                size: result.size,
            });

            successToast("File uploaded successfully");

            if (onUploadComplete) {
                onUploadComplete({
                    url: result.url,
                    publicId: result.publicId,
                    name: file.name,
                    size: result.size,
                });
            }
        } catch (error) {
            errorToast(error, "Failed to upload file");
            setPreview(null);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleRemove = () => {
        setUploadedFile(null);
        setPreview(null);
        setUploadProgress(0);
    };

    return (
        <Box>
            {!uploadedFile ? (
                <Paper
                    elevation={0}
                    sx={{
                        border: "2px dashed",
                        borderColor: disabled ? "grey.300" : "primary.main",
                        borderRadius: 2,
                        p: 3,
                        textAlign: "center",
                        cursor: disabled ? "not-allowed" : "pointer",
                        transition: "all 0.3s ease",
                        backgroundColor: disabled ? "grey.50" : "transparent",
                        "&:hover": !disabled && {
                            backgroundColor: "primary.50",
                            borderColor: "primary.dark",
                        },
                    }}
                >
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleFileSelect}
                        disabled={uploading || disabled}
                        style={{ display: "none" }}
                        id={`file-input-${label}`}
                    />

                    <label
                        htmlFor={`file-input-${label}`}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "12px",
                            cursor: disabled ? "not-allowed" : "pointer",
                        }}
                    >
                        {uploading ? (
                            <>
                                <CircularProgress size={40} />
                                <Typography variant="body2" color="text.secondary">
                                    Uploading... {Math.round(uploadProgress)}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={uploadProgress}
                                    sx={{ width: "100%", mt: 1 }}
                                />
                            </>
                        ) : (
                            <>
                                <CloudUpload
                                    sx={{
                                        fontSize: 40,
                                        color: disabled ? "grey.400" : "primary.main",
                                    }}
                                />
                                <Box>
                                    <Typography
                                        variant="body1"
                                        fontWeight={600}
                                        color={disabled ? "text.disabled" : "text.primary"}
                                    >
                                        {label}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 0.5 }}
                                    >
                                        Drag and drop or click to select
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ mt: 1, display: "block" }}
                                    >
                                        Max size: {maxSizeMB}MB
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </label>
                </Paper>
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        border: "1px solid",
                        borderColor: "success.main",
                        borderRadius: 2,
                        p: 2,
                        backgroundColor: "success.50",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {preview && (
                            <Box
                                component="img"
                                src={preview}
                                sx={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 1,
                                    objectFit: "cover",
                                }}
                            />
                        )}

                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CheckCircle sx={{ color: "success.main", fontSize: 20 }} />
                                <Typography variant="body2" fontWeight={600}>
                                    {uploadedFile.name}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                {(uploadedFile.size / 1024 / 1024).toFixed(2)}MB
                            </Typography>
                        </Box>

                        <IconButton
                            size="small"
                            onClick={handleRemove}
                            disabled={uploading}
                            sx={{ color: "error.main" }}
                        >
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>
                </Paper>
            )}
        </Box>
    );
}
