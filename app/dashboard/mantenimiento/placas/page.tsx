"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { MaintenanceTable } from "@/components/dashboard/maintenance-table"

interface Placa {
  id: number
  codigo: string
  descripcion: string
  activo: boolean
}

const fields = [
  { name: "codigo", label: "Número de Placa", type: "text" as const, required: true },
  { name: "descripcion", label: "Descripción", type: "text" as const },
  { name: "activo", label: "Activo", type: "boolean" as const },
]

export default function PlacasPage() {
  const [data, setData] = useState<Placa[]>([])
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: placas } = await supabase
      .from("placas")
      .select("*")
      .order("codigo")
    setData(placas ?? [])
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Placas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="p-6">
        <MaintenanceTable
          tableName="placas"
          title="Placas"
          description="Administre las placas de vehículos del sistema"
          fields={fields}
          data={data}
          onRefresh={fetchData}
        />
      </div>
    </>
  )
}
