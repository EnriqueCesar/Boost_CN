# BOOST CN v9.0

PWA estática para GitHub Pages. Procesa `data/Boost_CN.xlsx` localmente mediante `tools/process_excel.py` y genera archivos JSON consumidos por el dashboard.

La interfaz concentra el resumen ejecutivo y el detalle operativo por franja en una sola vista Inicio. La navegación mínima está integrada al encabezado y no utiliza panel lateral.

## Actualizar datos

1. Reemplazar `data/Boost_CN.xlsx`.
2. Ejecutar `python tools/process_excel.py`.
3. Validar `data/manifest-data.json` y `AUDITORIA_TECNICA.txt`.
4. Publicar los archivos modificados en GitHub Pages.

El Service Worker obtiene la lista de chunks desde `data/manifest-data.json`, por lo que no requiere ajustes manuales cuando aumenta el número de archivos `records-*.json`.

La lectura se realiza por nombre de pestaña y encabezado. El cruce de productos usa `Condicion[Producto]`, normalizando espacios, mayúsculas y acentos. Base_AT se relaciona por `Ceco + Semana + Año`.
