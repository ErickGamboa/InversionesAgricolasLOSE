"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface Field {
  name: string
  label: string
  type: "text" | "boolean" | "select"
  required?: boolean
  options?: { value: string; label: string }[]
}

interface MaintenanceTableProps<T> {
  tableName: string
  title: string
  singularTitle?: string
  description: string
  fields: Field[]
  data: T[]
}

export function MaintenanceTable<T extends { id: number; activo: boolean }>({
  tableName,
  title,
  singularTitle,
  description,
  fields,
  data: initialData,
}: MaintenanceTableProps<T>) {
  const router = useRouter()
  const [data, setData] = useState<T[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [deletingItem, setDeletingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Record<string, string | boolean>>({})
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    setData(initialData)
    setInitialLoading(false)
  }, [initialData])

  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    return fields.some((field) => {
      const value = (item as Record<string, unknown>)[field.name]
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchLower)
      }
      return false
    })
  })

  const openCreateDialog = () => {
    setEditingItem(null)
    const initialForm: Record<string, string | boolean> = {}
    for (const field of fields) {
      initialForm[field.name] = field.type === "boolean" ? true : ""
    }
    setFormData(initialForm)
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: T) => {
    setEditingItem(item)
    const initialForm: Record<string, string | boolean> = {}
    for (const field of fields) {
      initialForm[field.name] = (item as Record<string, unknown>)[field.name] as string | boolean
    }
    setFormData(initialForm)
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (item: T) => {
    setDeletingItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (editingItem) {
        const { error } = await supabase
          .from(tableName)
          .update(formData)
          .eq("id", editingItem.id)

        if (error) throw error
        toast.success("Registro actualizado exitosamente")
      } else {
        const { error } = await supabase.from(tableName).insert(formData)
        if (error) throw error
        toast.success("Registro creado exitosamente")
      }
      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", deletingItem.id)

      if (error) throw error
      toast.success("Registro eliminado exitosamente")
      setIsDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (item: T) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ activo: !item.activo })
        .eq("id", item.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error: ${message}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {fields
                .filter((f) => f.type !== "boolean" || f.name !== "activo")
                .map((field) => (
                  <TableHead key={field.name}>{field.label}</TableHead>
                ))}
              <TableHead>Activo</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={fields.filter((f) => f.type !== "boolean" || f.name !== "activo").length + 2}
                  className="text-center text-muted-foreground py-8"
                >
                  No hay registros
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  {fields
                    .filter((f) => f.type !== "boolean" || f.name !== "activo")
                    .map((field) => (
                      <TableCell key={field.name}>
                        {String((item as Record<string, unknown>)[field.name] ?? "")}
                      </TableCell>
                    ))}
                  <TableCell>
                    <Switch
                      checked={item.activo}
                      onCheckedChange={() => handleToggleActive(item)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar" : "Agregar"} {singularTitle || title}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Modifique los campos necesarios"
                : "Complete los campos para crear un nuevo registro"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 min-w-0">
            {fields.map((field) => (
              <div key={field.name} className="grid gap-2 min-w-0">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === "boolean" ? (
                  <Switch
                    id={field.name}
                    checked={formData[field.name] as boolean}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, [field.name]: checked }))
                    }
                  />
                ) : field.type === "select" ? (
                  <Select
                    value={formData[field.name] as string}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, [field.name]: value }))
                    }
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    value={formData[field.name] as string}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    required={field.required}
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Spinner size="sm" showText={false} />}
              {editingItem ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading && <Spinner size="sm" showText={false} />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
