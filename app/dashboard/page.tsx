import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import {
  ShoppingCart,
  Truck,
  Package,
  Building2,
  TrendingUp,
  Scale,
} from "lucide-react"

async function getStats() {
  const supabase = await createClient()
  
  const today = new Date().toISOString().split('T')[0]
  
  const [
    { count: ventasCount },
    { count: comprasRegCount },
    { count: transporteContCount },
    { count: comprasEspCount },
    { count: transporteIntCount },
    { data: ventasData },
    { data: comprasRegData },
    { data: transporteContData },
    { data: comprasEspData },
    { data: transporteIntData },
  ] = await Promise.all([
    supabase.from('ventas_plantas').select('*', { count: 'exact', head: true }).eq('fecha', today),
    supabase.from('compras_regulares').select('*', { count: 'exact', head: true }).eq('fecha', today),
    supabase.from('transporte_contratado').select('*', { count: 'exact', head: true }).eq('fecha', today),
    supabase.from('compras_especiales').select('*', { count: 'exact', head: true }).eq('fecha', today),
    supabase.from('transporte_interno').select('*', { count: 'exact', head: true }).eq('fecha', today),
    supabase.from('ventas_plantas').select('kilos_neto, monto').eq('fecha', today),
    supabase.from('compras_regulares').select('kilos_neto, monto').eq('fecha', today),
    supabase.from('transporte_contratado').select('kilos_neto, monto').eq('fecha', today),
    supabase.from('compras_especiales').select('kilos_neto, monto').eq('fecha', today),
    supabase.from('transporte_interno').select('kilos_neto, monto').eq('fecha', today),
  ])

  const sumKilos = (data: { kilos_neto: number }[] | null) => 
    data?.reduce((acc, item) => acc + (Number(item.kilos_neto) || 0), 0) ?? 0
  
  const sumMonto = (data: { monto: number }[] | null) => 
    data?.reduce((acc, item) => acc + (Number(item.monto) || 0), 0) ?? 0

  const totalKilos = sumKilos(ventasData) + sumKilos(comprasRegData) + sumKilos(transporteContData) + sumKilos(comprasEspData) + sumKilos(transporteIntData)
  const totalMonto = sumMonto(ventasData) + sumMonto(comprasRegData) + sumMonto(transporteContData) + sumMonto(comprasEspData) + sumMonto(transporteIntData)

  return {
    ventas: { count: ventasCount ?? 0, kilos: sumKilos(ventasData), monto: sumMonto(ventasData) },
    comprasReg: { count: comprasRegCount ?? 0, kilos: sumKilos(comprasRegData), monto: sumMonto(comprasRegData) },
    transporteCont: { count: transporteContCount ?? 0, kilos: sumKilos(transporteContData), monto: sumMonto(transporteContData) },
    comprasEsp: { count: comprasEspCount ?? 0, kilos: sumKilos(comprasEspData), monto: sumMonto(comprasEspData) },
    transporteInt: { count: transporteIntCount ?? 0, kilos: sumKilos(transporteIntData), monto: sumMonto(transporteIntData) },
    totalKilos,
    totalMonto,
  }
}

export default async function DashboardPage() {
  const stats = await getStats()
  const today = new Date().toLocaleDateString('es-CR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const formatNumber = (num: number) => num.toLocaleString('es-CR')
  const formatCurrency = (num: number) => num.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Resumen del Día</h1>
          <p className="text-muted-foreground capitalize">{today}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Kilos Hoy
              </CardTitle>
              <Scale className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatNumber(stats.totalKilos)} kg
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/30 border-accent/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Monto Hoy
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground">
                ₡{formatCurrency(stats.totalMonto)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transacciones Hoy
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.ventas.count + stats.comprasReg.count + stats.transporteCont.count + stats.comprasEsp.count + stats.transporteInt.count}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ventas a Plantas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ventas.count}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(stats.ventas.kilos)} kg | ₡{formatCurrency(stats.ventas.monto)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Compras Regulares</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comprasReg.count}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(stats.comprasReg.kilos)} kg | ₡{formatCurrency(stats.comprasReg.monto)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transporte Contratado</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transporteCont.count}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(stats.transporteCont.kilos)} kg | ₡{formatCurrency(stats.transporteCont.monto)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Compras Especiales</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comprasEsp.count}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(stats.comprasEsp.kilos)} kg | ₡{formatCurrency(stats.comprasEsp.monto)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transporte Interno</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transporteInt.count}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(stats.transporteInt.kilos)} kg | ₡{formatCurrency(stats.transporteInt.monto)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
