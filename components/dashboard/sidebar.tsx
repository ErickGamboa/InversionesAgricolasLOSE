"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useUserRole } from "@/hooks/use-user-role"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Users,
  Car,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  ChevronUp,
  ClipboardList,
  Pencil,
  Check,
  X,
  Receipt,
} from "lucide-react"

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
]

const adminOperationsMenuItems = [
  {
    title: "Ventas a Plantas",
    url: "/dashboard/ventas-plantas",
    icon: Building2,
  },
  {
    title: "Compras Regulares",
    url: "/dashboard/compras-regulares",
    icon: ShoppingCart,
  },
  {
    title: "Transporte Contratado",
    url: "/dashboard/transporte-contratado",
    icon: Truck,
  },
  {
    title: "Compras Especiales",
    url: "/dashboard/compras-especiales",
    icon: Package,
  },
  {
    title: "Transporte Interno",
    url: "/dashboard/transporte-interno",
    icon: ClipboardList,
  },
]

const plantOperationsMenuItems = [
  {
    title: "Recepción de Fruta",
    url: "/dashboard/recepcion",
    icon: Truck,
  },
  {
    title: "Boletas de Recepción",
    url: "/dashboard/boletas-recepcion",
    icon: Receipt,
  },
]

const maintenanceMenuItems = [
  {
    title: "Clientes",
    url: "/dashboard/mantenimiento/clientes",
    icon: Users,
  },
  {
    title: "Choferes",
    url: "/dashboard/mantenimiento/choferes",
    icon: Car,
  },
  {
    title: "Plantas",
    url: "/dashboard/mantenimiento/plantas",
    icon: Building2,
  },
  {
    title: "Placas",
    url: "/dashboard/mantenimiento/placas",
    icon: CreditCard,
  },
  {
    title: "Tipos de Pago",
    url: "/dashboard/mantenimiento/tipos-pago",
    icon: Settings,
  },
]

export function DashboardSidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { role } = useUserRole()

  const [titulo, setTitulo] = useState("Recepción Piña")
  const [isEditing, setIsEditing] = useState(false)
  const [tempTitulo, setTempTitulo] = useState("")

  useEffect(() => {
    const fetchTitulo = async () => {
      const { data, error } = await supabase
        .from("configuracion")
        .select("valor")
        .eq("clave", "titulo_sistema")
        .single()
      
      if (data && !error) {
        setTitulo(data.valor)
      }
    }
    fetchTitulo()
  }, [supabase])

  const handleStartEdit = () => {
    setTempTitulo(titulo)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!tempTitulo.trim()) {
      setIsEditing(false)
      return
    }

    const { error } = await supabase
      .from("configuracion")
      .update({ valor: tempTitulo.trim() })
      .eq("clave", "titulo_sistema")

    if (error) {
      toast.error("Error al guardar el título")
    } else {
      setTitulo(tempTitulo.trim())
      setIsEditing(false)
      toast.success("Título actualizado")
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Hojas de la piña */}
              <path d="M12 2c0 2-1 3.5-3 4.5M12 2c0 2 1 3.5 3 4.5M12 2v5" />
              {/* Cuerpo de la piña */}
              <path d="M12 22c-3.3 0-6-2.5-6-6s2.7-8 6-8 6 4.5 6 8-2.7 6-6 6z" />
              {/* Patrón de la piña */}
              <path d="M8 12l8 8M16 12l-8 8" />
            </svg>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            {isEditing ? (
              <div className="flex items-center gap-1 pr-1">
                <Input
                  value={tempTitulo}
                  onChange={(e) => setTempTitulo(e.target.value)}
                  className="h-7 py-0 px-2 text-sm font-semibold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit()
                    if (e.key === "Escape") handleCancelEdit()
                  }}
                />
                <button
                  onClick={handleSaveEdit}
                  className="rounded-md p-1 hover:bg-sidebar-accent hover:text-green-600"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-md p-1 hover:bg-sidebar-accent hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="group flex items-center justify-between">
                <span className="font-semibold text-sidebar-foreground truncate pr-1">
                  {titulo}
                </span>
                <button
                  onClick={handleStartEdit}
                  className="opacity-0 group-hover:opacity-100 rounded-md p-1 hover:bg-sidebar-accent transition-opacity"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            )}
            <span className="text-xs text-sidebar-foreground/70">Costa Rica</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Dashboard - solo admin */}
        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Operaciones administrativas - solo admin */}
        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Operaciones administrativas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminOperationsMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Operaciones en planta - admin + operario */}
        <SidebarGroup>
          <SidebarGroupLabel>Operaciones en planta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {plantOperationsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Mantenimiento - admin + operario */}
        <SidebarGroup>
          <SidebarGroupLabel>Mantenimiento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {maintenanceMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full" suppressHydrationWarning>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 text-left truncate">{user.email}</span>
                  <ChevronUp className="h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-(--radix-popper-anchor-width)">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
