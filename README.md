# BOOST CN v7

PWA estática para GitHub Pages. Procesa `data/Boost_CN.xlsx` localmente mediante `tools/process_excel.py` y genera archivos JSON consumidos por el dashboard.

## Actualizar datos

1. Reemplazar `data/Boost_CN.xlsx`.
2. Ejecutar `python tools/process_excel.py`.
3. Validar `data/manifest-data.json` y `AUDITORIA_TECNICA.txt`.
4. Publicar los archivos del repositorio en GitHub Pages.

La lectura se realiza por nombre de pestaña y encabezado. El cruce de productos usa `Condicion[Producto]`, normalizando espacios, mayúsculas y acentos. Base_AT se relaciona por `Ceco + Semana + Año`.
