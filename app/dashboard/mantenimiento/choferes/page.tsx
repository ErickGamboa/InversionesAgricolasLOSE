import { createClient } from "@/lib/supabase/server"
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
  nombre: string
  activo: boolean
  tipo: 'interno' | 'externo'
}

const fields = [
  { name: "nombre", label: "Nombre", type: "text" as const, required: true },
  { name: "tipo", label: "Tipo", type: "select" as const, options: [
    { value: "interno", label: "Interno" },
    { value: "externo", label: "Externo" }
  ], required: true },
  { name: "activo", label: "Activo", type: "boolean" as const },
]

export default async function ChoferesPage() {
  const supabase = await createClient()
  const { data: choferes } = await supabase
    .from("choferes")
    .select("*")
    .order("nombre")

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
          singularTitle="Chofer"
          description="Administre los choferes del sistema"
          fields={fields}
          data={choferes ?? []}
        />
      </div>
    </>
  )
}