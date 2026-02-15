# Plan de Ajuste de Tamaños y Diseño (Recepción de Fruta)

El objetivo es solucionar el problema de "elementos cortados" mejorando la responsividad y el uso del espacio en pantalla.

## 1. Componente `ReceptionDetailDialog` (Modal de Detalle)
Este es el componente más crítico donde se realiza el trabajo operativo.
- **Ancho del Modal**: Aumentar de `max-w-4xl` a `max-w-[95vw]` (casi todo el ancho de la pantalla) para dar más espacio a la tabla y los controles.
- **Altura del Modal**: Fijar en `h-[90vh]` para aprovechar la altura de la pantalla sin desbordar.
- **Header y Footer**: Añadir `shrink-0` para evitar que se aplasten cuando hay muchos bines en la lista.
- **Panel Lateral (Izquierdo)**: 
  - Cambiar de ancho porcentual (`w-1/3`) a un ancho fijo robusto (`w-80` o `w-96`) para asegurar que los botones e inputs siempre tengan el mismo tamaño legible, dejando el resto del espacio flexible para la tabla.

## 2. Componente `ReceptionCard` (Tarjetas del Patio)
- **Título del Cliente**: Cambiar `line-clamp-1` a `line-clamp-2` y dar una altura mínima para que los nombres largos se vean completos sin romper el diseño.
- **Espaciado**: Aumentar ligeramente el padding interno para que la información no se sienta apretada.

## 3. Página Principal (`RecepcionPage`)
- **Grid Responsivo**: Ajustar los "breakpoints" para que en pantallas medianas no se fuercen demasiadas columnas.
  - *Actual:* `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  - *Propuesta:* Mantener similar pero asegurar que las tarjetas tengan un `min-width` implícito para no colapsar en tamaños intermedios.

## Pasos de Ejecución
1. Modificar `components/dashboard/recepcion/reception-detail-dialog.tsx` con las nuevas clases de tamaño.
2. Modificar `components/dashboard/recepcion/reception-card.tsx` para mejorar la visualización del texto.
3. Verificar visualmente (revisión de código) que los cambios no rompan la estructura flexbox.
