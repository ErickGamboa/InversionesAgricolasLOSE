"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserRole } from "@/hooks/use-user-role"

interface UseAdminFrontendGuardOptions {
  redirectTo?: string
}

export function useAdminFrontendGuard(options: UseAdminFrontendGuardOptions = {}) {
  const { redirectTo = "/dashboard/recepcion" } = options
  const router = useRouter()
  const { role, loading } = useUserRole()

  const isAdmin = role === "admin"

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace(redirectTo)
    }
  }, [loading, isAdmin, redirectTo, router])

  return {
    isAdmin,
    loading,
  }
}
