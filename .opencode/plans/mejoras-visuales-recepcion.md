# Plan de Mejoras Visuales y Funcionales (Recepción de Fruta)

## 1. Actualización de Paleta de Colores
Reemplazar las opciones de color actuales por 12 colores distintivos sin variaciones tonales, para facilitar la identificación visual en el patio.

**Nuevos Colores:**
- Rojo (`bg-red-600`)
- Naranja (`bg-orange-500`)
- Amarillo (`bg-yellow-500`)
- Lima (`bg-lime-500`)
- Verde (`bg-green-600`)
- Turquesa (`bg-teal-500`)
- Cian (`bg-cyan-500`)
- Azul (`bg-blue-600`)
- Índigo (`bg-indigo-600`)
- Morado (`bg-purple-600`)
- Rosa (`bg-pink-500`)
- Gris (`bg-slate-600`)

## 2. Gestión de Colores Únicos
Evitar que dos tarjetas activas ("En Patio") tengan el mismo color para prevenir confusiones.
- **Lógica:** Al abrir el diálogo de creación, consultar qué colores están en uso en tarjetas pendientes.
- **UI:** Deshabilitar visualmente (opacidad reducida, sin cursor pointer) los colores ya ocupados para que el usuario no pueda seleccionarlos.

## 3. Reemplazo de Alertas del Navegador
Eliminar el uso de `window.confirm()` y `window.alert()` que interrumpen la experiencia del usuario y reemplazarlos por componentes de interfaz integrados.
- **Componente:** Implementar `AlertDialog` de shadcn/ui.
- **Casos de Uso:**
  - Confirmación al eliminar un bin.
  - Confirmación al finalizar una tarjeta (especialmente si hay bines pendientes).

## Archivos Afectados
1. `types/recepcion.ts`: Definición de la constante de colores.
2. `components/dashboard/recepcion/create-reception-dialog.tsx`: Lógica de colores disponibles.
3. `components/dashboard/recepcion/reception-detail-dialog.tsx`: Implementación de diálogos de confirmación.
