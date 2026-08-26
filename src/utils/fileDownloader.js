/**
 * Utility to download files with their exact original name.
 * 
 * Solves the browser cross-origin restriction where <a href="..." download="...">
 * ignores custom filenames when downloading from external CDNs (like Cloudinary).
 * 
 * 1. Primary Method: Fetches the file into a local blob and triggers a same-origin download with the real filename.
 * 2. Fallback Method: Injects Cloudinary's `fl_attachment:<filename>` header flag into the URL so the server delivers `Content-Disposition: attachment; filename="real_name"`.
 */

export function getCloudinaryAttachmentUrl(url, customName) {
    if (!url || typeof url !== "string") return url;
    if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;

    // Remove extension from customName for fl_attachment if present
    const baseName = customName ? customName.replace(/\.[^/.]+$/, "") : "";
    const safeName = encodeURIComponent(baseName.trim() || "download");

    // Don't duplicate fl_attachment if already present
    if (url.includes("fl_attachment")) return url;

    return url.replace("/upload/", `/upload/fl_attachment:${safeName}/`);
}

export async function downloadFileWithRealName(fileUrl, fileName = "download") {
    if (!fileUrl) return;

    // Clean up filename
    const cleanFileName = fileName.trim() || "download";

    try {
        // Fetch as blob for exact same-origin filename enforcement
        const response = await fetch(fileUrl, {
            method: "GET",
            headers: { "Cache-Control": "no-cache" },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = cleanFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup blob URL after a short delay
        setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
        }, 2000);
    } catch (err) {
        console.warn("Direct blob download failed (likely CORS or network), using Cloudinary attachment fallback:", err);

        // Fallback: Use Cloudinary fl_attachment transformation URL
        const fallbackUrl = getCloudinaryAttachmentUrl(fileUrl, cleanFileName);
        const link = document.createElement("a");
        link.href = fallbackUrl;
        link.download = cleanFileName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
