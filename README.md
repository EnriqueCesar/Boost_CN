# BOOST CN — Dashboard ejecutivo

Aplicación estática y PWA compatible con GitHub Pages.

## Datos procesados

- `Base_Boost_CN`: 15,427 filas físicas incluyendo encabezado; 15,426 registros de datos.
- `Condicion`: lectura completa por encabezado.
- `Base_AT`: lectura completa por encabezado.
- `Instruccion`: lectura completa.
- Cruce exacto `Producto → Item` y cálculo `Venta = Unidad Vendida × Precio Venta`.
- JSON dividido en chunks dentro de `data/`.

## Publicación en GitHub Pages

1. Subir todo el contenido del proyecto a la raíz del repositorio.
2. Abrir **Settings → Pages**.
3. Seleccionar **Deploy from a branch**.
4. Elegir la rama `main` y la carpeta `/root`.
5. Guardar y abrir la URL publicada.

## Actualización de datos

Regenerar los JSON desde `Boost_CN.xlsx` leyendo las pestañas y encabezados por nombre. No cambiar las rutas relativas de `data/manifest-data.json` ni de sus chunks.
