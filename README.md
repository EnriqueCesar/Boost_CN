# BOOST CN v5 · Item/ADT, IPLH, métricas y PDF

Dashboard estático y PWA compatible con GitHub Pages para analizar venta, unidades, Ticket Real contra Ticket Ppto, IPLH, Item/ADT y crecimiento semanal por tienda.

## Fuente procesada

- `data/Boost_CN.xlsx`
- `Base_Boost_CN`: 15,427 filas físicas, incluyendo encabezado; 15,426 registros de datos cargados y válidos.
- `Base_AT`: 289 filas físicas, incluyendo encabezado; 288 registros procesados.
- `Item_ADT`: 217 filas físicas, incluyendo encabezado; 216 registros procesados.
- `Instruccion`: 12 filas físicas, incluyendo encabezado.

La lectura se realiza por nombre de pestaña y encabezado. Los JSON se dividen en cuatro chunks y ningún archivo supera 20 MB.

## Funciones principales

- Filtros dinámicos: Región, DM, Semana, Día, DayPart, Tienda y Item.
- Selector global `$ / Unidades` aplicado a Tendencia semanal, Item, DayPart, DM y Tienda.
- Ticket Real, Ticket Ppto, Cumplimiento y Diferencia sin duplicar métricas al cruzar.
- IPLH e Item/ADT con visualización a un decimal.
- Crecimiento semanal por tienda para Venta, Unidades, IPLH e Item/ADT.
- Rankings Top y Bottom ordenados de mayor a menor.
- Exportación CSV de crecimiento y tabla cruzada.
- Exportación/impresión horizontal con filtros activos, KPIs, gráficas y rankings.
- PWA con manifest y Service Worker.

## Actualizar datos

Reemplaza `data/Boost_CN.xlsx` conservando los encabezados y ejecuta:

```bash
python tools/process_excel.py
```

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a la raíz del repositorio.
2. Abre **Settings → Pages**.
3. Selecciona **Deploy from a branch**.
4. Selecciona la rama principal y la carpeta `/root`.
5. Guarda y espera la publicación.

Todas las rutas son relativas y `.nojekyll` está incluido.
