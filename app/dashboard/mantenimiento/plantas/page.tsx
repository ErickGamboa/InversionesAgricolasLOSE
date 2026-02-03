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
import { Skeleton } from "@/components/ui/skeleton"

interface Planta {
  id: number
  codigo: string
  nombre: string
  activo: boolean
}

const fields = [
  { name: "codigo", label: "Codigo", type: "text" as const, required: true },
  { name: "nombre", label: "Nombre", type: "text" as const, required: true },
  { name: "activo", label: "Activo", type: "boolean" as const },
]

export default function PlantasPage() {
  const [data, setData] = useState<Planta[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: plantas } = await supabase
      .from("plantas")
      .select("*")
      .order("codigo")
    setData(plantas ?? [])
    setLoading(false)
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
              <BreadcrumbPage>Plantas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <MaintenanceTable
            tableName="plantas"
            title="Plantas"
            description="Administre las plantas procesadoras del sistema"
            fields={fields}
            data={data}
            onRefresh={fetchData}
          />
        )}
      </div>
    </>
  )
}
