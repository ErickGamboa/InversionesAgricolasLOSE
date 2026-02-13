"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { COLOR_OPTIONS } from "@/types/recepcion"
import { Loader2, Lock, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  cliente_id: z.string().min(1, "Seleccione un cliente"),
  chofer_ingreso_id: z.string().optional(),
  es_rechazo: z.boolean().default(false),
  color_etiqueta: z.string().min(1, "Seleccione un color"),
  tipo_pina: z.enum(["IQF", "Jugo"], { required_error: "Seleccione el tipo de piña" }).optional(),
  procedencia_tipo: z.enum(["campo", "planta"], { required_error: "Seleccione la procedencia" }).optional(),
})

interface CreateReceptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (id: number) => void
}

export function CreateReceptionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateReceptionDialogProps) {
  const [clientes, setClientes] = useState<any[]>([])
  const [choferes, setChoferes] = useState<any[]>([])
  const [usedColors, setUsedColors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [checkingColors, setCheckingColors] = useState(false)
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      es_rechazo: false,
      color_etiqueta: "", // Se establecerá dinámicamente
      tipo_pina: "IQF",
      procedencia_tipo: "campo",
    },
  })

  // Fetch initial data (clientes, choferes)
  useEffect(() => {
    const fetchData = async () => {
      const { data: clientesData } = await supabase
        .from("clientes")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre")
      
      const { data: choferesData } = await supabase
        .from("choferes")
        .select("id, nombre")
        .eq("activo", true)
        .eq("tipo", "interno")
        .order("nombre")

      if (clientesData) setClientes(clientesData)
      if (choferesData) setChoferes(choferesData)
    }

    if (open) fetchData()
  }, [open, supabase])

  // Fetch used colors specifically when dialog opens
  useEffect(() => {
    const checkColors = async () => {
      if (!open) return
      setCheckingColors(true)
      
      const { data } = await supabase
        .from("recepciones")
        .select("color_etiqueta")
        .eq("estado", "pendiente")
      
      const used = data?.map(r => r.color_etiqueta) || []
      setUsedColors(used)
      
      // Auto-select first available color
      const currentSelected = form.getValues("color_etiqueta")
      const firstAvailable = COLOR_OPTIONS.find(c => !used.includes(c.value))
      
      // Si no hay color seleccionado O el seleccionado está usado, cambiar al primero libre
      if ((!currentSelected || used.includes(currentSelected)) && firstAvailable) {
        form.setValue("color_etiqueta", firstAvailable.value)
      } else if (!firstAvailable) {
        // Caso extremo: todos los colores usados
        toast.error("¡Todos los colores están en uso! Finalice alguna tarjeta.")
      }
      
      setCheckingColors(false)
    }

    checkColors()
  }, [open, supabase, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Doble verificación antes de enviar
    if (usedColors.includes(values.color_etiqueta)) {
      toast.error("Este color ya fue tomado por otra tarjeta. Seleccione otro.")
      // Refrescar colores por si acaso
      const { data } = await supabase.from("recepciones").select("color_etiqueta").eq("estado", "pendiente")
      setUsedColors(data?.map(r => r.color_etiqueta) || [])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("recepciones")
        .insert({
          cliente_id: parseInt(values.cliente_id),
          chofer_ingreso_id: values.es_rechazo ? null : (values.chofer_ingreso_id ? parseInt(values.chofer_ingreso_id) : null),
          es_rechazo: values.es_rechazo,
          color_etiqueta: values.color_etiqueta,
          tipo_pina: values.tipo_pina,
          procedencia_tipo: values.procedencia_tipo,
          estado: 'pendiente'
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Recepción creada")
      onSuccess(data.id)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error(error)
      toast.error("Error al crear la recepción")
    } finally {
      setLoading(false)
    }
  }

  const esRechazo = form.watch("es_rechazo")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Nueva Recepción de Piña</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={clientes.map((c) => ({ value: c.id.toString(), label: c.nombre }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Buscar cliente..."
                        emptyText="No encontrado"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!esRechazo && (
                <FormField
                  control={form.control}
                  name="chofer_ingreso_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chofer de Ingreso</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={choferes.map((c) => ({ value: c.id.toString(), label: c.nombre }))}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Buscar chofer..."
                          emptyText="No encontrado"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_pina"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Piña</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IQF">IQF</SelectItem>
                        <SelectItem value="Jugo">Jugo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="procedencia_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedencia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione procedencia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="campo">Campo</SelectItem>
                        <SelectItem value="planta">Planta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="es_rechazo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Es Fruta de Rechazo
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color_etiqueta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex justify-between">
                    Color de Tarjeta (Único)
                    {checkingColors && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </FormLabel>
                  <div className="grid grid-cols-6 gap-3 mt-2 p-2 bg-muted/20 rounded-lg">
                    {COLOR_OPTIONS.map((color) => {
                      const isUsed = usedColors.includes(color.value)
                      const isSelected = field.value === color.value
                      
                      return (
                        <button
                          key={color.value}
                          type="button"
                          disabled={isUsed}
                          className={cn(
                            "group relative h-10 w-10 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black",
                            color.value,
                            isSelected && "ring-2 ring-offset-2 ring-black scale-110",
                            isUsed && "opacity-20 cursor-not-allowed grayscale",
                            !isUsed && !isSelected && "hover:scale-110 hover:shadow-md"
                          )}
                          onClick={() => field.onChange(color.value)}
                          title={isUsed ? `${color.label} (En uso)` : color.label}
                        >
                          {isUsed && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="h-4 w-4 text-white/80" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading || checkingColors}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Tarjeta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
