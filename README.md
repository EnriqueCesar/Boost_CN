# BOOST CN · Experiencia 360° Ticket AT

Dashboard ejecutivo estático y PWA compatible con GitHub Pages.

## Fuente procesada

- `Base_Boost_CN`: 15,427 filas incluyendo encabezado; 15,426 registros de datos.
- `Base_AT`: 25 filas incluyendo encabezado; 24 registros de datos.
- `Instruccion`: leída durante la auditoría.
- `Item` y `Precio Venta` se toman directamente de `Base_Boost_CN`.
- `Venta = Unidad Vendida × Precio Venta`.
- Base_AT se relaciona por DM normalizado + Año + Semana, sin multiplicar tickets por filas de venta.

## Funcionalidad

- Filtros: Región, DM, Semana, Día, DayPart, Tienda e Item.
- Inicio ejecutivo 360° con KPIs, Ticket Real vs Ticket Ppto, cumplimiento, venta por Item, DayPart, semana, DM y tienda.
- Rankings Top y Bottom ordenados de mayor a menor dentro de cada bloque.
- Desempeño por Franja y exportación CSV.
- Exportación horizontal mediante impresión del navegador.
- PWA con rutas relativas y Service Worker.

## Publicación en GitHub Pages

1. Subir el contenido de esta carpeta a la raíz del repositorio.
2. En **Settings → Pages**, seleccionar **Deploy from a branch**.
3. Elegir la rama principal y la carpeta `/root`.
4. Abrir la URL publicada y recargar una vez para activar la PWA.

No requiere servidor, compilación ni dependencias externas.
