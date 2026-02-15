# Plan de Implementación: Módulo de Recepción de Fruta

## 1. Diseño de Base de Datos (Supabase)

Se crearán dos tablas nuevas para gestionar el flujo de entrada y salida de fruta.

### Tabla `recepciones` (Las Tarjetas)
Representa un camión que ingresó con fruta.
- **id**: Identificador único.
- **cliente_id**: Relación con la tabla `clientes`.
- **chofer_ingreso_id**: Relación con la tabla `choferes` (Nulo si es rechazo).
- **es_rechazo**: Booleano (Indica si es fruta de rechazo).
- **color_etiqueta**: Texto (Código de color hexadecimal o clase de Tailwind, ej. "bg-yellow-500").
- **estado**: Texto ('pendiente', 'finalizado').
- **fecha_creacion**: Fecha y hora de registro.
- **usuario_creacion**: ID del usuario que registró.

### Tabla `recepcion_bines` (Los Pares de Bines)
Detalle de cada par de bines pesado en una recepción.
- **id**: Identificador único.
- **recepcion_id**: Relación con la tabla `recepciones`.
- **numero_par**: Entero secuencial (1, 2, 3...).
- **peso_bruto**: Decimal (Peso en báscula).
- **peso_neto**: Decimal (Calculado: Peso Bruto - 100kg).
- **estado**: Texto ('en_patio', 'despachado').
- **chofer_salida_id**: Relación con la tabla `choferes` (Quién se llevó los bines).
- **fecha_despacho**: Fecha y hora de salida.

---

## 2. Interfaz de Usuario (UI/UX)

El módulo se ubicará en `/dashboard/recepcion` y tendrá un diseño visualmente rico y fácil de usar.

### A. Tablero Principal ("El Patio")
- **Vista**: Grid de tarjetas (Cards).
- **Estados**: Pestañas para "En Patio" (Activas) y "Histórico" (Finalizadas).
- **Diseño de Tarjeta**:
  - **Color**: El borde superior o el fondo de la cabecera tendrá el color seleccionado por el usuario (Rojo, Azul, Verde, Amarillo, etc.).
  - **Información**: Nombre del Cliente, Hora de Ingreso, Total Kilos (Suma actual).
  - **Progreso**: Barra de progreso visual mostrando cuántos bines han sido despachados (ej. "4/10 Despachados").
  - **Acción**: Click en la tarjeta abre el detalle.

### B. Formulario de Ingreso (Nueva Tarjeta)
- **Paso 1: Cabecera**:
  - Selección de **Cliente** (Lista desplegable con búsqueda).
  - Checkbox **"Es Rechazo"**.
  - Selección de **Chofer Ingreso** (Si no es rechazo).
  - Selector de **Color** (Paleta visual de colores).
- **Paso 2: Pesaje**:
  - Input grande para el **Peso Bruto**.
  - Al dar Enter, se agrega a la lista abajo y se calcula automáticamente el **Peso Neto (-100kg)**.
  - Lista visible de los pares ingresados con opción de eliminar/editar si hay error.
  - Muestra el **Total Acumulado** en tiempo real.

### C. Detalle y Despacho
- **Vista**: Modal grande o Pantalla dedicada.
- **Lista de Bines**: Tabla con los pares de bines.
  - **Columnas**: # Par, Peso Neto, Estado, Chofer Salida.
  - **Estilo**:
    - *En Patio*: Texto normal, seleccionable.
    - *Despachado*: Texto gris, fondo tenue, muestra el chofer asignado.
- **Acción de Despacho**:
  - Seleccionar múltiples bines (checkboxes).
  - Botón **"Asignar Chofer / Despachar"**.
  - Modal para seleccionar el **Chofer de Salida**.
  - Al confirmar, los bines cambian de estado visualmente.
- **Cierre**:
  - Botón **"Finalizar Tarjeta"** (Solo activo si todos los bines están despachados).
  - Al finalizar, la tarjeta cambia a estado "Finalizado" (Color Rojo/Gris en el histórico).

---

## 3. Componentes Técnicos
- **Frontend**: Next.js (App Router), Tailwind CSS v4.
- **Componentes UI**: shadcn/ui (Card, Dialog, Form, Select, Badge, Progress, Tabs).
- **Iconos**: Lucide React.
- **Estado**: React Hook Form para formularios, estado local para la interacción inmediata.

## 4. Pasos de Ejecución
1.  Crear tablas en Supabase (`recepciones`, `recepcion_bines`).
2.  Crear tipos de TypeScript para las nuevas tablas.
3.  Implementar la página principal (`/dashboard/recepcion/page.tsx`).
4.  Crear componente de Tarjeta (`ReceptionCard`).
5.  Crear formulario de ingreso (`ReceptionForm`).
6.  Crear vista de detalle y despacho (`ReceptionDetail`).
7.  Integrar lógica de despacho y finalización.
