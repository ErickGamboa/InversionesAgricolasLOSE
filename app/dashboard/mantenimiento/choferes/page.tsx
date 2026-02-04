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

interface Chofer {
  id: number
  codigo: string
  nombre: string
  activo: boolean
}

const fields = [
  { name: "codigo", label: "Código", type: "text" as const, required: true },
  { name: "nombre", label: "Nombre", type: "text" as const, required: true },
  { name: "activo", label: "Activo", type: "boolean" as const },
]

export default function ChoferesPage() {
  const [data, setData] = useState<Chofer[]>([])
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: choferes } = await supabase
      .from("choferes")
      .select("*")
      .order("codigo")
    setData(choferes ?? [])
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
              <BreadcrumbPage>Choferes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="p-6">
        <MaintenanceTable
          tableName="choferes"
          title="Choferes"
          description="Administre los choferes del sistema"
          fields={fields}
          data={data}
          onRefresh={fetchData}
        />
      </div>
    </>
  )
}
