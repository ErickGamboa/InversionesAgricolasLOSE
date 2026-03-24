import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TareasDiariasModule } from "@/components/dashboard/tareas-diarias-module"

export default async function TareasDiariasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single()

  if (perfil?.rol !== "admin") {
    redirect("/dashboard")
  }

  return <TareasDiariasModule />
}
