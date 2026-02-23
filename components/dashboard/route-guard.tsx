"use client"

import { useUserRole, UserRole } from "@/hooks/use-user-role"
import { Loader2 } from "lucide-react"

interface RouteGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { role, loading, isAdmin, isOperario } = useUserRole()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!role) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acceso denegado</h1>
          <p className="text-muted-foreground mt-2">No tienes acceso a esta página.</p>
        </div>
      </div>
    )
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acceso denegado</h1>
          <p className="text-muted-foreground mt-2">
            No tienes permisos para acceder a esta sección.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Tu rol actual: <span className="font-semibold">{role === "admin" ? "Administrador" : "Operario"}</span>
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
