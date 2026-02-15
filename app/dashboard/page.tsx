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
  
  const today = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')
  
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
    supabase.from('ventas_plantas').select('total_kilos, total_pagar_pina').eq('fecha', today),
    supabase.from('compras_regulares').select('numero_kilos, total_a_pagar, pago_dolares').eq('fecha', today),
    supabase.from('transporte_contratado').select('total_kilos, total_a_pagar').eq('fecha', today),
    supabase.from('compras_especiales').select('total_kilos, total_a_pagar').eq('fecha', today),
    supabase.from('transporte_interno').select('ingreso').eq('fecha', today),
  ])

  // Ventas a Plantas - siempre en USD (no hay campo pago_dolares en esta tabla)
  const ventasKilos = ventasData?.reduce((acc, item) => acc + (Number(item.total_kilos) || 0), 0) ?? 0
  const ventasMontoCRC = 0 // Las ventas a plantas son siempre en USD
  const ventasMontoUSD = ventasData?.reduce((acc, item) => acc + (Number(item.total_pagar_pina) || 0), 0) ?? 0
  
  // Compras Regulares - separar por moneda
  const comprasRegKilos = comprasRegData?.reduce((acc, item) => acc + (Number(item.numero_kilos) || 0), 0) ?? 0
  const comprasRegMontoCRC = comprasRegData?.filter(c => !c.pago_dolares).reduce((acc, c) => acc + (Number(c.total_a_pagar) || 0), 0) ?? 0
  const comprasRegMontoUSD = comprasRegData?.filter(c => c.pago_dolares).reduce((acc, c) => acc + (Number(c.total_a_pagar) || 0), 0) ?? 0

  // Transporte Contratado (siempre colones)
  const transporteContKilos = transporteContData?.reduce((acc, item) => acc + (Number(item.total_kilos) || 0), 0) ?? 0
  const transporteContMontoCRC = transporteContData?.reduce((acc, item) => acc + (Number(item.total_a_pagar) || 0), 0) ?? 0

  // Compras Especiales (siempre colones)
  const comprasEspKilos = comprasEspData?.reduce((acc, item) => acc + (Number(item.total_kilos) || 0), 0) ?? 0
  const comprasEspMontoCRC = comprasEspData?.reduce((acc, item) => acc + (Number(item.total_a_pagar) || 0), 0) ?? 0

  // Transporte Interno (siempre colones)
  const transporteIntMontoCRC = transporteIntData?.reduce((acc, item) => acc + (Number(item.ingreso) || 0), 0) ?? 0
  const transporteIntKilos = 0 // No aplica para transporte interno

  // Totales combinados - SOLO COMPRA/VENTA DE PIÑA (sin transportes)
  const kilosComprados = comprasRegKilos + comprasEspKilos
  const montoCompradoCRC = comprasRegMontoCRC + comprasEspMontoCRC // Sin transporte contratado
  const montoCompradoUSD = comprasRegMontoUSD // Solo compras regulares en USD
  
  const kilosVendidos = ventasKilos // Solo ventas a plantas
  const montoVendidoCRC = 0 // Ventas son siempre USD
  const montoVendidoUSD = ventasMontoUSD // Solo ventas a plantas

  return {
    ventas: { count: ventasCount ?? 0, kilos: ventasKilos, montoCRC: ventasMontoCRC, montoUSD: ventasMontoUSD },
    comprasReg: { count: comprasRegCount ?? 0, kilos: comprasRegKilos, montoCRC: comprasRegMontoCRC, montoUSD: comprasRegMontoUSD },
    transporteCont: { count: transporteContCount ?? 0, kilos: transporteContKilos, montoCRC: transporteContMontoCRC },
    comprasEsp: { count: comprasEspCount ?? 0, kilos: comprasEspKilos, montoCRC: comprasEspMontoCRC },
    transporteInt: { count: transporteIntCount ?? 0, kilos: transporteIntKilos, montoCRC: transporteIntMontoCRC },
    kilosComprados,
    montoCompradoCRC,
    montoCompradoUSD,
    kilosVendidos,
    montoVendidoCRC,
    montoVendidoUSD
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
  const formatCurrency = (num: number) => num.toLocaleString('es-CR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kilos Comprados
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(stats.kilosComprados)} kg
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-500/5 border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monto Comprado de Piña
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-orange-600">
                CRC: {formatCurrency(stats.montoCompradoCRC)}
              </div>
              <div className="text-lg font-bold text-orange-500">
                USD: {formatCurrency(stats.montoCompradoUSD)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/5 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kilos Vendidos
              </CardTitle>
              <Scale className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(stats.kilosVendidos)} kg
              </div>

            </CardContent>
          </Card>

          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monto Vendido de Piña
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                USD: {formatCurrency(stats.montoVendidoUSD)}
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
                {formatNumber(stats.ventas.kilos)} kg
              </p>
              <p className="text-xs text-muted-foreground">
                USD: {formatCurrency(stats.ventas.montoUSD)}
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
                {formatNumber(stats.comprasReg.kilos)} kg
              </p>
              <p className="text-xs text-muted-foreground">
                CRC: {formatCurrency(stats.comprasReg.montoCRC)} | USD: {formatCurrency(stats.comprasReg.montoUSD)}
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
                {formatNumber(stats.transporteCont.kilos)} kg
              </p>
              <p className="text-xs text-muted-foreground">
                CRC: {formatCurrency(stats.transporteCont.montoCRC)}
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
                {formatNumber(stats.comprasEsp.kilos)} kg
              </p>
              <p className="text-xs text-muted-foreground">
                CRC: {formatCurrency(stats.comprasEsp.montoCRC)}
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
                {formatNumber(stats.transporteInt.kilos)} kg
              </p>
              <p className="text-xs text-muted-foreground">
                CRC: {formatCurrency(stats.transporteInt.montoCRC)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
