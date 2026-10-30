# FitOS — Demo de prueba v1.3

- **[Abrir FitOS](https://manuelortizchimal-droid.github.io/FitOS/?v=1.3)**
- **[Importar rutinas](https://manuelortizchimal-droid.github.io/FitOS/import.html)**
- **[Importar mediciones](https://manuelortizchimal-droid.github.io/FitOS/measure-import.html)**

## Entrenamiento
- Botón **FIN** únicamente cuando todas las series de la sesión estén registradas; finaliza y suma una fecha única a la racha.
- Botón **Oops! tuve que irme :(** siempre disponible junto a FIN: guarda una salida anticipada con cuántas series se habían registrado; no cuenta como sesión completada, no incrementa la racha y permite reanudar conservando las series.
- Modificar o eliminar planes guardados, editar ejercicios, establecer fecha de Día 1, navegar por días desde el inicio, ver resumen de semana.
- Unidades kg/lb globales y por ejercicio; cronómetro flotante y aviso de tres tonos, sujeto al soporte del navegador.

## Importar mediciones
- CTA en **Mediciones** para pegar texto, cargar TXT/CSV, XLS/XLSX, PDF (incluido escaneado) o imágenes, y pegar capturas.
- Lectura local con bibliotecas Tesseract.js, PDF.js y SheetJS descargadas cuando se requieren (dependen de red y compatibilidad).
- Extracción de fechas, peso en kg/lb, cintura, grasa, masa muscular y perímetros; revisión y corrección de cada registro previa al guardado.
- La grasa corporal y masa muscular reportadas por una báscula de bioimpedancia se etiquetan como **estimaciones del dispositivo**. Se conservan los registros por fecha, actualizando los existentes del mismo deportista y fecha, sin eliminar el resto del historial.

## Comprobaciones realizadas
- Sintaxis JavaScript válida en index.html, import.html y measure-import.html.
- Generación de rutinas: 3,528 combinaciones de intensidad, objetivo, minutos, músculos y frecuencia; ninguna sesión vacía, tiempo estimado dentro del límite y cobertura de zonas.
- Lectura de mediciones ficticias: etiquetas de báscula, CSV de dos fechas y conversión de 154 lb a kg.
- Verificación de fechas de plan: inicio lunes 2026-11-02; tres entrenamientos distribuidos en lunes, miércoles y viernes.

**Pendiente:** verificación visual y táctil en teléfono, OCR real de documentos e imágenes, lectura de PDF/Excel en diversos equipos, pruebas end-to-end del flujo completo, autenticación y persistencia Supabase. La publicación final de GitHub Pages no pudo comprobarse mediante el navegador disponible.

## Seguridad
**Esta es una DEMOSTRACIÓN PÚBLICA** con almacenamiento local y roles no protegidos. No usar información real de deportistas, mediciones médicas, credenciales habituales ni datos reales de clientes. No válida para operación comercial ni facturación. Los lectores externos solo se cargan al solicitar importación.
