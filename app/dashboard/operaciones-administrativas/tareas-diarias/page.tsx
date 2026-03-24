"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { TareasDiariasModule } from "@/components/dashboard/tareas-diarias-module"
import { useUserRole } from "@/hooks/use-user-role"

export default function TareasDiariasPage() {
  const router = useRouter()
  const { role, loading } = useUserRole()

  useEffect(() => {
    if (!loading && role !== "admin") {
      router.replace("/dashboard/recepcion")
    }
  }, [loading, role, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-sm text-muted-foreground">
        Validando permisos...
      </div>
    )
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-sm text-muted-foreground">
        Redirigiendo a Recepción de Fruta...
      </div>
    )
  }

  return <TareasDiariasModule />
}
