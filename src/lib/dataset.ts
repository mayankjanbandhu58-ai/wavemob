/**
 * Dataset utility — maps uploaded image filenames to their pre-generated PDF reports.
 * Both share the same base filename (e.g., "1 high sus.png" → "1 high sus.pdf").
 */

export function getReportUrl(imageFilename: string): string {
    const baseName = imageFilename.replace(/\.(png|jpg|jpeg|gif|bmp|webp)$/i, "");
    return `/dataset/reports/${encodeURIComponent(baseName)}.pdf`;
}

export function getImageUrl(imageFilename: string): string {
    return `/dataset/images/${encodeURIComponent(imageFilename)}`;
}

/** Extract a clean display name from filenames like "1 high sus.png" */
export function getDisplayName(filename: string): string {
    const baseName = filename.replace(/\.(png|jpg|jpeg|gif|bmp|webp|pdf)$/i, "");
    return `Scan ${baseName}`;
}

/** Simulated terminal log lines for the analysis animation */
export const TERMINAL_LOGS = [
    { time: "00:00", text: "Initializing neural inference pipeline..." },
    { time: "00:00", text: "Loading DenseNet-121 ensemble weights (3 models)..." },
    { time: "00:01", text: "Pre-processing DICOM → 224×224 tensor normalization..." },
    { time: "00:01", text: "Extracting convolutional feature maps (Layer 4)..." },
    { time: "00:01", text: "Running multi-label sigmoid classifier..." },
    { time: "00:02", text: "Computing Grad-CAM attention heatmaps..." },
    { time: "00:02", text: "Calibrating posterior risk probabilities..." },
    { time: "00:02", text: "Performing Monte Carlo dropout uncertainty estimation..." },
    { time: "00:03", text: "Cross-referencing NIH ChestX-ray14 database..." },
    { time: "00:03", text: "Generating structured clinical PDF report... ✓" },
];
