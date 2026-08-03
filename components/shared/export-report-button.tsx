"use client"

import { useState } from "react"
import { Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getMonthlyReportData } from "@/lib/actions/reports"
import { format } from "date-fns"

export function ExportReportButton({ month, year, variant = "outline" }: { month: number, year: number, variant?: "default" | "outline" | "ghost" }) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    try {
      setLoading(true)
      const data = await getMonthlyReportData(month, year)
      
      const { generateMonthlyPDFReport } = await import("@/lib/pdf-generator")
      generateMonthlyPDFReport(data, month, year)
      
      const monthName = format(new Date(year, month - 1), "MMM yyyy")
      toast.success(`Report for ${monthName} downloaded successfully!`)
    } catch (error: any) {
      toast.error(error.message || "Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      size="sm" 
      onClick={handleExport} 
      disabled={loading}
      className="flex items-center gap-2"
    >
      {loading ? <Download className="h-4 w-4 animate-bounce" /> : <FileText className="h-4 w-4" />}
      <span>{loading ? "Generating..." : "Download Report"}</span>
    </Button>
  )
}
