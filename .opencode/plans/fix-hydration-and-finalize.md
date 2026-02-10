# Plan de Corrección y Cierre de Tarjeta

## 1. Solución al Error de Hidratación
El error técnico se debe a que estamos intentando poner "cajas" (`div`) dentro de un texto descriptivo (`p` del `AlertDialogDescription`), lo cual es inválido en HTML y React lo detecta.
- **Acción:** Reemplazar el `AlertDialog` simple por un diálogo personalizado (`Dialog` de UI) que permite formularios y estructuras complejas sin errores.

## 2. Implementación del Cierre de Tarjeta (Financiero)
Para registrar automáticamente en **Compras Regulares**, crearemos un nuevo componente `FinalizeReceptionDialog` que solicitará los datos faltantes al momento de cerrar.

**Datos a Solicitar:**
- **Tipo de Piña:** Selector (IQF / Jugo).
- **Precio por Kilo:** Input numérico (Moneda).
- **Número de Boleta:** Input texto (Referencia del documento físico).

**Lógica de Guardado:**
1. Calcular el **Total de Kilos** final de la recepción.
2. Calcular el **Total a Pagar** (`Kilos * Precio`).
3. Insertar registro en la tabla `compras_regulares` con:
   - Cliente y Chofer de la recepción.
   - Fecha y Semana actual.
   - Procedencia: "Campo" (por defecto).
   - Datos financieros ingresados.
4. Actualizar el estado de la `recepcion` a `finalizado`.

## 3. Archivos a Modificar/Crear
1.  **Crear** `components/dashboard/recepcion/finalize-reception-dialog.tsx`: Formulario de cierre.
2.  **Modificar** `components/dashboard/recepcion/reception-detail-dialog.tsx`:
    - Eliminar el `AlertDialog` que causa el error.
    - Integrar el nuevo `FinalizeReceptionDialog`.
    - Pasar la data necesaria (kilos totales) al diálogo de cierre.

Este cambio soluciona el error técnico y cumple con el requerimiento de negocio en un solo paso.
