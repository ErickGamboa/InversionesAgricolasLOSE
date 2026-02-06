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

interface Cliente {
  id: number
  nombre: string
  celular: string
  tipo_cliente: 'especial' | 'regular'
  activo: boolean
}

const fields = [
  { name: "nombre", label: "Nombre", type: "text" as const, required: true },
  { name: "celular", label: "Celular", type: "text" as const },
  { 
    name: "tipo_cliente", 
    label: "Tipo de Cliente", 
    type: "select" as const,
    required: true,
    options: [
      { value: "especial", label: "Especial" },
      { value: "regular", label: "Regular" }
    ]
  },
  { name: "activo", label: "Activo", type: "boolean" as const },
]

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre")

  const clientes = (data || []) as Cliente[]

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
              <BreadcrumbPage>Clientes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="p-6">
        <MaintenanceTable<Cliente>
          tableName="clientes"
          title="Clientes"
          singularTitle="Cliente"
          description="Administre los clientes del sistema"
          fields={fields}
          data={clientes}
        />
      </div>
    </>
  )
}