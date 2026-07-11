# BOOST CN v6 · Ejecutivo y Productividad

Dashboard estático compatible con GitHub Pages y PWA.

## Fuente

`data/Boost_CN.xlsx`, leída por nombre de pestaña y encabezado mediante `tools/process_excel.py`.

Pestañas procesadas:

- `Base_Boost_CN`: 15,426 registros de datos (15,427 filas incluyendo encabezado).
- `Base_AT`: 288 registros de datos.
- `Item_ADT`: 216 registros de datos.
- `Instruccion`: 11 registros de datos.

## Actualización de datos

1. Sustituir `data/Boost_CN.xlsx`.
2. Ejecutar `python tools/process_excel.py`.
3. Publicar el contenido completo del proyecto.

## Despliegue en GitHub Pages

Publicar desde la raíz de la rama principal. Las rutas son relativas y no requieren compilación.

## Versión

- Cuatro KPIs ejecutivos: Venta total, Unidades vendidas, Item/ADT y Mejor DayPart.
- Selector dinámico IPLH / Item/ADT.
- Venta por DM en columnas verticales.
- Top y Bottom compactos sin DM ni tendencia.
- Validaciones internas y exportación PDF conservadas.
