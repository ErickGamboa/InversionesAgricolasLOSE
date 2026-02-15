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

// Función para detectar si un campo es de tipo precio/monto
const isPriceField = (key: string): boolean => {
  const priceKeywords = ['precio', 'total', 'monto', 'adelanto', 'ingreso', 'diesel', 'castigo', 'balance']
  // Excluir campos de cantidades físicas (kilos, cajas, pinas)
  const excludeKeywords = ['kilos', 'cajas', 'pinas']
  const lowerKey = key.toLowerCase()
  if (excludeKeywords.some(k => lowerKey.includes(k))) return false
  return priceKeywords.some(keyword => lowerKey.includes(keyword))
}

// Función para formatear números con 3 decimales
const formatNumber3Decimals = (num: number): string => {
  return num?.toLocaleString("es-CR", { 
    minimumFractionDigits: 3, 
    maximumFractionDigits: 3 
  }) || "0.000"
}

// Función para formatear moneda con símbolos compatibles con PDF
const formatCurrencyForExport = (num: number, currency: 'CRC' | 'USD' = 'CRC'): string => {
  const formatted = num?.toLocaleString("es-CR", { 
    minimumFractionDigits: 3, 
    maximumFractionDigits: 3 
  }) || "0.000"
  return currency === 'USD' ? `USD ${formatted}` : `CRC ${formatted}`
}

// Función para cargar imagen y convertir a base64
const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
  const response = await fetch(imagePath)
  const blob = await response.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

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
  footerData,
  currency = 'CRC',
  currencyField
}: { 
  data: any[], 
  columns: { key: string, label: string }[], 
  title: string,
  footerData?: Record<string, any>
  currency?: 'CRC' | 'USD'
  currencyField?: string
}) {
  const exportToExcel = () => {
    const exportRows = data.map(item => {
      const row: any = {}
      // Detectar moneda de la fila (solo para Compras Regulares)
      const isUSD = currencyField ? item[currencyField] === true : false
      const rowCurrency: 'CRC' | 'USD' = isUSD ? 'USD' : 'CRC'
      
      columns.forEach(col => {
        let value: any
        if (col.key.includes('.')) {
          const [parent, child] = col.key.split('.')
          value = item[parent]?.[child]
        } else {
          value = item[col.key]
        }
        
        // Formatear campos de precio
        if (isPriceField(col.key) && typeof value === 'number') {
          // Solo Compras Regulares: formato con moneda según fila
          if (currencyField) {
            row[col.label] = formatCurrencyForExport(value, rowCurrency)
          } else {
            // Otros módulos: solo número con 3 decimales, sin prefijo
            row[col.label] = formatNumber3Decimals(value)
          }
        } else {
          row[col.label] = value || ""
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
          const value = footerData[col.key]
          // Si es un string ya formateado, usarlo tal cual
          if (typeof value === 'string') {
            footerRow[col.label] = value
          } else if (typeof value === 'number' && isPriceField(col.key)) {
            footerRow[col.label] = formatCurrencyForExport(value, currency)
          } else {
            footerRow[col.label] = value
          }
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

  const exportToPDF = async () => {
    const doc = new jsPDF("l", "mm", "a4")
    
    // Cargar logo como base64
    let logoBase64 = ''
    try {
      logoBase64 = await loadImageAsBase64('/logo-empresa.jpeg')
    } catch (error) {
      console.warn('No se pudo cargar el logo:', error)
    }
    
    // 1. Agregar logo (esquina superior izquierda)
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', 10, 5, 25, 25)
    }
    
    // 2. Agregar nombre de empresa (centrado)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const pageWidth = doc.internal.pageSize.getWidth()
    const empresaText = "Inversiones agricolas LOSE de pital"
    const textWidth = doc.getTextWidth(empresaText)
    doc.text(empresaText, (pageWidth - textWidth) / 2, 18)
    
    // 3. Agregar título del reporte (debajo)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(title, 14, 35)
    
    const head = [columns.map(col => col.label)]
    const body = data.map(item => {
      // Detectar moneda de la fila (solo para Compras Regulares)
      const isUSD = currencyField ? item[currencyField] === true : false
      const rowCurrency: 'CRC' | 'USD' = isUSD ? 'USD' : 'CRC'
      
      return columns.map(col => {
        let value: any
        if (col.key.includes('.')) {
          const [parent, child] = col.key.split('.')
          value = item[parent]?.[child]
        } else {
          value = item[col.key]
        }
        
        // Formatear campos de precio
        if (isPriceField(col.key) && typeof value === 'number') {
          // Solo Compras Regulares: formato con moneda según fila
          if (currencyField) {
            return formatCurrencyForExport(value, rowCurrency)
          } else {
            // Otros módulos: solo número con 3 decimales, sin prefijo
            return formatNumber3Decimals(value)
          }
        }
        return value || ""
      })
    })

    let foot: any[][] | undefined = undefined
    if (footerData) {
      foot = [
        columns.map((col, index) => {
          if (index === 0) return "TOTALES"
          const value = footerData[col.key]
          // Si es un string ya formateado, usarlo tal cual
          if (typeof value === 'string') {
            return value
          }
          // Si es un número y es campo de precio, formatear con moneda
          if (typeof value === 'number' && isPriceField(col.key)) {
            return formatCurrencyForExport(value, currency)
          }
          return value || ""
        })
      ]
    }

    autoTable(doc, {
      head: head,
      body: body,
      foot: foot,
      startY: 40,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      showFoot: 'lastPage'
    })
    
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
          <DropdownMenuItem onClick={() => exportToPDF()}>
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
