"use client"

import * as React from "react"
import { Settings2, Download, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Componente para inputs con debounce (evita lentitud al escribir)
export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 300,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<React.ComponentProps<typeof Input>, "onChange">) {
  const [value, setValue] = React.useState(initialValue)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (value !== initialValue) {
        onChange(value)
      }
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange, initialValue])

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

// Componente para ocultar/mostrar columnas
export function ColumnToggle({ 
  columns, 
  visibleColumns, 
  onToggle 
}: { 
  columns: { key: string, label: string }[], 
  visibleColumns: string[], 
  onToggle: (key: string) => void 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto h-8 flex">
          <Settings2 className="mr-2 h-4 w-4" />
          Columnas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Alternar columnas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.key}
            className="capitalize"
            checked={visibleColumns.includes(column.key)}
            onCheckedChange={() => onToggle(column.key)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Componente para acciones de exportación
export function ExportActions({ 
  data, 
  columns, 
  title,
  footerData
}: { 
  data: any[], 
  columns: { key: string, label: string }[], 
  title: string,
  footerData?: Record<string, any>
}) {
  const exportToExcel = () => {
    const exportRows = data.map(item => {
      const row: any = {}
      columns.forEach(col => {
        if (col.key.includes('.')) {
          const [parent, child] = col.key.split('.')
          row[col.label] = item[parent]?.[child] || ""
        } else {
          row[col.label] = item[col.key] || ""
        }
      })
      return row
    })

    // Añadir fila de totales si existe
    if (footerData) {
      const footerRow: any = {}
      columns.forEach((col, index) => {
        if (index === 0) {
          footerRow[col.label] = "TOTALES"
        } else if (footerData[col.key] !== undefined) {
          footerRow[col.label] = footerData[col.key]
        } else {
          footerRow[col.label] = ""
        }
      })
      exportRows.push(footerRow)
    }

    const ws = XLSX.utils.json_to_sheet(exportRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Datos")
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF("l", "mm", "a4")
    const head = [columns.map(col => col.label)]
    const body = data.map(item => 
      columns.map(col => {
        if (col.key.includes('.')) {
          const [parent, child] = col.key.split('.')
          return item[parent]?.[child] || ""
        }
        return item[col.key] || ""
      })
    )

    let foot: any[][] | undefined = undefined
    if (footerData) {
      foot = [
        columns.map((col, index) => {
          if (index === 0) return "TOTALES"
          return footerData[col.key] || ""
        })
      ]
    }

    autoTable(doc, {
      head: head,
      body: body,
      foot: foot,
      startY: 20,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    })
    
    doc.text(title, 14, 15)
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportToExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Item de menú personalizado para evitar que el dropdown se cierre
function DropdownMenuItem({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
  return (
    <div 
      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
      onClick={onClick}
    >
      {children}
    </div>
  )
}
