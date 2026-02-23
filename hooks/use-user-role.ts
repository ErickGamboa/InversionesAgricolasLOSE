"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export type UserRole = "admin" | "operario" | null

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    async function fetchRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          if (isMounted) {
            setRole(null)
            setLoading(false)
          }
          return
        }

        const { data, error } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", user.id)
          .single()

        if (isMounted) {
          if (error || !data) {
            setRole(null)
          } else {
            setRole(data.rol as UserRole)
          }
          setLoading(false)
        }
      } catch {
        if (isMounted) {
          setRole(null)
          setLoading(false)
        }
      }
    }

    fetchRole()

    return () => {
      isMounted = false
    }
  }, [supabase])

  return { role, loading, isAdmin: role === "admin", isOperario: role === "operario" }
}
