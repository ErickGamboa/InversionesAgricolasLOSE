import React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Toaster } from "sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <SidebarProvider>
      <DashboardSidebar user={user} />
      <SidebarInset>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
