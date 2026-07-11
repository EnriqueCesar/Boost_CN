# BOOST CN

Dashboard ejecutivo estático y PWA para GitHub Pages, generado exclusivamente desde `Boost_CN.xlsx`.

## Módulos

- Inicio: KPIs, rankings, tendencia semanal y venta por Nombre Dash.
- Desempeño por Franja: filtros múltiples, filtros dependientes, gráfica y tabla cruzada.
- Control de Datos: calidad, excepciones, duplicados, conciliación y exportación CSV.

## Datos procesados

- Registros fuente: 662
- Registros válidos para dashboard: 662
- Registros con error crítico: 0
- Calidad de datos: 100.0%
- Archivos de datos: records-001.json

Los encabezados se leen por nombre. La relación usada es `Base_Boost_CN[Producto] = Condicion[Producto]`. Los duplicados exactos y errores críticos se excluyen del dashboard, pero permanecen visibles en Control de Datos.

## Publicar en GitHub Pages

1. Crear un repositorio y subir todo el contenido de esta carpeta a la rama `main`.
2. En **Settings → Pages**, elegir **Deploy from a branch**.
3. Seleccionar `main` y la carpeta `/ (root)`.
4. Guardar y abrir la URL publicada.

No requiere servidor, compilación ni dependencias externas.
