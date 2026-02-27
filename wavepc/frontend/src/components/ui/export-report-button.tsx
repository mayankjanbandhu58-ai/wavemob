"use client"

import { useState } from "react"
import { Button } from "./button"
import { Download, Loader2 } from "lucide-react"

interface ExportReportButtonProps {
    patientName: string
    patientId: string
    date?: string
    findings: string
    aiConfidence?: number
    base64Images?: string[]
}

export function ExportReportButton({
    patientName,
    patientId,
    date,
    findings,
    aiConfidence,
    base64Images,
}: ExportReportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)

            const payload = {
                patientName,
                patientId,
                date: date || new Date().toISOString().split('T')[0],
                findings,
                aiConfidence,
                base64Images: base64Images || [],
            }

            const response = await fetch("http://localhost:8000/api/v1/export/pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error("Failed to generate PDF")
            }

            // Convert the response to a Blob
            const blob = await response.blob()

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob)

            // Create a temporary anchor element to trigger the download
            const a = document.createElement("a")
            a.href = url
            a.download = `Wavelength_Report_${patientId}.pdf`
            document.body.appendChild(a)
            a.click()

            // Cleanup
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error("Export error:", error)
            alert("Failed to export report. Please try again.")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="flex items-center gap-2 border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300"
        >
            {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
            {isExporting ? "Generating PDF..." : "Export Official Report"}
        </Button>
    )
}
