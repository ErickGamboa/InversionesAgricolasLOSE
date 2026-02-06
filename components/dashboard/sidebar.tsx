"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
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
} from "lucide-react"

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
]

const operationsMenuItems = [
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
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
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

        <SidebarGroup>
          <SidebarGroupLabel>Operaciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsMenuItems.map((item) => (
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
