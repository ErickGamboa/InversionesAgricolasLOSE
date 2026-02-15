# Plan de Mejora de Responsividad (Tarjeta de Detalle)

El problema identificado es que el diseño de dos columnas (Izquierda: Input, Derecha: Lista) es demasiado rígido para móviles, y el uso de alturas fijas (`max-h-[40vh]`) puede ocultar contenido crítico cuando el teclado virtual aparece o en pantallas pequeñas.

## Objetivos
1.  **Layout Flexible:** Cambiar a un diseño que use todo el alto disponible en móvil (`h-[100dvh]`).
2.  **Scroll Unificado:** En lugar de dividir la pantalla en dos zonas de scroll pequeñas, permitir que en móvil el contenido fluya naturalmente, o usar pestañas si es necesario.
3.  **Visibilidad de Acciones:** Asegurar que los botones de acción siempre sean accesibles.

## Estrategia de Implementación

### 1. Ajuste de Contenedor Principal (`DialogContent`)
- Cambiar `max-h-[90vh]` a `h-[100dvh]` en móviles para ocupar toda la pantalla y evitar problemas con las barras del navegador.
- Añadir `sm:h-auto sm:max-h-[90vh]` para mantener el diseño de ventana flotante en escritorio.

### 2. Reestructuración del Layout Interno
En móvil (`md:hidden`), cambiar el enfoque de "Split View" a uno más vertical y fluido.

- **Panel Superior (Input y Resumen):**
  - Quitar `max-h-[40vh]`.
  - Permitir que se colapse o ocupe su espacio natural.
- **Panel Inferior (Lista de Bines):**
  - Asegurar que tenga un `min-h` decente pero que no empuje el contenido fuera.

### 3. Alternativa de Pestañas (Recomendada para Móvil)
Dado que hay mucha información (Input, Stats, Acciones, Lista), en una pantalla pequeña es mejor dividir por pestañas:
- **Tab 1: Gestión:** Input de peso, Resumen de Kilos y Botones de Acción.
- **Tab 2: Lista:** La tabla con los bines.

Esto evita tener que hacer scroll infinito y mantiene los controles a mano.

### 4. Ejecución
Modificar `components/dashboard/recepcion/reception-detail-dialog.tsx`:
- Detectar si es móvil (media query CSS).
- Implementar un diseño adaptable:
  - **Escritorio:** Mantiene el diseño actual de dos columnas (Side-by-Side).
  - **Móvil:** Un diseño de columna única donde la lista de bines toma prioridad, y el panel de control se mantiene accesible arriba, pero optimizado.

Voy a optar por una **simplificación de estilos CSS** primero antes de meter pestañas complejas, para no cambiar drásticamente la UX si no es necesario. Ajustaré las alturas y los desbordamientos.
