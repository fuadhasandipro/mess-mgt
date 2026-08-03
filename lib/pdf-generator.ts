import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

export function generateMonthlyPDFReport(data: any, month: number, year: number) {
  const doc = new jsPDF()
  const monthName = format(new Date(year, month - 1), "MMMM yyyy")

  // Title
  doc.setFontSize(18)
  doc.text(`Mess Monthly Report - ${monthName}`, 14, 22)
  
  // Section: Summary
  doc.setFontSize(14)
  doc.text("1. Overall Summary", 14, 35)
  
  autoTable(doc, {
    startY: 40,
    head: [["Total Meals", "Total Expenses", "Total Deposits", "Meal Rate"]],
    body: [
      [
        data.summary.totalMeals.toString(),
        `৳${data.summary.totalExpense.toFixed(2)}`,
        `৳${data.summary.totalDeposits.toFixed(2)}`,
        `৳${data.summary.mealRate.toFixed(2)}`
      ]
    ],
    theme: 'grid',
  })

  // Section: Per-Member Summary
  const finalY = (doc as any).lastAutoTable.finalY || 40
  doc.text("2. Member Summary", 14, finalY + 15)

  const memberSummaryBody = data.summary.memberSummaries.map((m: any) => [
    m.name,
    m.meals.toString(),
    `৳${m.cost.toFixed(2)}`,
    `৳${m.paid.toFixed(2)}`,
    m.due > 0 ? `৳${m.due.toFixed(2)} (Due)` : m.due < 0 ? `৳${Math.abs(m.due).toFixed(2)} (Advance)` : "৳0.00"
  ])

  autoTable(doc, {
    startY: finalY + 20,
    head: [["Member Name", "Meals", "Cost", "Paid", "Balance"]],
    body: memberSummaryBody,
    theme: 'striped',
  })

  // Section: Daily Meals Grid
  doc.addPage()
  doc.setFontSize(14)
  doc.text("3. Daily Meals Breakdown", 14, 22)

  // Group meals by user and day
  const daysInMonth = new Date(year, month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  
  const userMap = new Map<string, { name: string, days: Record<number, number> }>()
  
  data.meals.forEach((m: any) => {
    const day = new Date(m.date).getDate()
    const mealCount = (m.breakfast * 0.5) + m.lunch + m.dinner
    if (!userMap.has(m.userId)) {
      userMap.set(m.userId, { name: m.userName, days: {} })
    }
    userMap.get(m.userId)!.days[day] = mealCount
  })

  // We can only fit so many days in one table, so we might need to split the days or use a smaller font.
  // Using landscape could work, but autotable handles overflowing columns by shrinking text.
  // Let's create the grid.
  const head = [["Name", ...days.map(d => d.toString())]]
  const body = Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name)).map(user => {
    const row = [user.name]
    days.forEach(d => {
      row.push(user.days[d] ? user.days[d].toString() : "0")
    })
    return row
  })

  autoTable(doc, {
    startY: 30,
    head: head,
    body: body,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fillColor: [40, 40, 40] }
  })

  // Section: Transactions (Deposits and Expenses)
  doc.addPage()
  doc.setFontSize(14)
  doc.text("4. Transactions", 14, 22)

  doc.setFontSize(12)
  doc.text("Deposits", 14, 32)
  autoTable(doc, {
    startY: 36,
    head: [["Date", "Member", "Amount", "Note", "Added By"]],
    body: data.deposits.map((d: any) => [
      format(new Date(d.date), "dd MMM yyyy"),
      d.userName,
      `৳${d.amount.toFixed(2)}`,
      d.note || "-",
      d.addedByName
    ]),
    theme: 'striped',
  })

  const expensesY = (doc as any).lastAutoTable.finalY + 15
  doc.text("Expenses", 14, expensesY)
  autoTable(doc, {
    startY: expensesY + 6,
    head: [["Date", "Category", "Amount", "Note", "Added By"]],
    body: data.expenses.map((e: any) => [
      format(new Date(e.date), "dd MMM yyyy"),
      e.category,
      `৳${e.amount.toFixed(2)}`,
      e.note || "-",
      e.addedByName
    ]),
    theme: 'striped',
  })

  // Download
  doc.save(`mess-report-${year}-${month.toString().padStart(2, '0')}.pdf`)
}
