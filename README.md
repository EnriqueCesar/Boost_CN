# BOOST CN v3 · Slicers + Ticket Promedio

Dashboard estático y PWA listo para GitHub Pages.

## Datos procesados

- `Base_Boost_CN`: 15,427 filas de hoja, incluyendo encabezado; 15,426 registros de datos leídos completos.
- Lectura por nombre de pestaña y encabezado.
- `Condicion`: cruce exacto por `Producto`.
- `Base_AT`: Ticket Real, Ticket Presupuesto, Diferencia, Cumplimiento y Ticket Promedio.
- Gráficas de ticket desde la semana 28.
- JSON dividido en chunks dentro de `data/`.

## Publicación en GitHub Pages

1. Subir el contenido de esta carpeta a la raíz del repositorio.
2. Abrir **Settings → Pages**.
3. Seleccionar **Deploy from a branch**.
4. Elegir la rama principal y la carpeta `/ (root)`.
5. Guardar.

Las rutas son relativas y `.nojekyll` está incluido.

## Actualización de datos

El Excel fuente se conserva en `data/Boost_CN.xlsx`. Al regenerar los JSON deben mantenerse los nombres de pestaña y encabezados; no se usan posiciones fijas de columna.

## Módulos

- Inicio ejecutivo.
- Desempeño por Franja.
- Validaciones de datos conservadas internamente y accesibles mediante **Ver incidencias**.
- Exportación CSV y PDF horizontal mediante impresión del navegador.
