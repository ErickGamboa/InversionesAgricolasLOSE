# Plan de Implementación de Filtros y Nuevos Campos

## 1. Base de Datos
- Agregar columnas `tipo_pina` y `procedencia_tipo` a la tabla `recepciones` para permitir su captura y filtrado.

## 2. Actualización de Tipos
- Modificar `types/recepcion.ts` para incluir los nuevos campos opcionales en la interfaz `Recepcion`.

## 3. Formulario de Creación (`CreateReceptionDialog`)
- Agregar un selector para **Tipo de Piña** (IQF / Jugo).
- Agregar un selector para **Procedencia** (Campo / Planta).
- Guardar estos datos al crear la tarjeta.

## 4. Componente de Filtros (`ReceptionFilters`)
- Crear un nuevo componente visual que contenga:
  - **Buscador de Cliente:** `SearchableSelect` (lista de clientes).
  - **Buscador de Chofer:** `SearchableSelect` (lista de choferes).
  - **Rango de Fechas:** Inputs tipo `date`.
  - **Filtros Rápidos:** Selectores para Tipo de Piña y Procedencia.
  - **Botón Limpiar:** Para restablecer la vista.

## 5. Integración en Página Principal (`RecepcionPage`)
- Reemplazar la barra de búsqueda simple por el nuevo componente `ReceptionFilters`.
- Actualizar la lógica de filtrado (`filteredRecepciones`) para considerar todos estos nuevos criterios combinados.

## 6. Visualización en Tarjeta (`ReceptionCard`)
- Mostrar visualmente (badges o texto pequeño) el Tipo de Piña y la Procedencia en la tarjeta para que el usuario pueda identificar rápidamente los resultados del filtro.
