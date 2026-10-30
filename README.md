# FitOS QA v0.8

[**Abrir FitOS v0.8**](https://manuelortizchimal-droid.github.io/FitOS/?v=0.8)

## Generador simplificado
El deportista selecciona grupos musculares, **objetivo**, **intensidad** (suave, moderada o alta), tiempo disponible y periodo: hoy, una semana, dos semanas, un mes o días personalizados. Ya no se pide nivel de experiencia ni intensidad percibida. Incluye opciones de tonificación, desarrollo muscular, reducción de grasa, recomposición corporal, condición general, fuerza y resistencia muscular.

La intensidad modifica series, descansos y repeticiones de reserva; el tiempo es **un máximo disponible**, no una obligación de completar minutos sin beneficio. Las estimaciones incluyen calentamiento, series, descansos y cambios. La pérdida de grasa no puede garantizarse con una rutina por sí sola.

## Verificaciones ejecutadas
- Sintaxis JavaScript verificada en V8: PASS.
- 441 combinaciones de objetivos/intensidad/tiempo/músculos: rutina no vacía y tiempo calculado menor o igual que el seleccionado: PASS.
- Comprobación del HTML publicado mediante lectura de GitHub: PASS.
- Diseño responsive ajustado para controles y textos móviles.
- **Pendiente:** prueba visual real en teléfonos de distintos tamaños, accesibilidad WCAG, integración con Supabase, autenticación real y pruebas de carga.

## Referencias científicas
- [ACSM 2026: entrenamiento de fuerza](https://acsm.org/resistance-training-guidelines-update-2026/)
- [OMS: recomendaciones de actividad física](https://www.ncbi.nlm.nih.gov/books/NBK566046/)
- [CDC: actividad física y control del peso](https://www.cdc.gov/healthy-weight-growth/physical-activity/index.html)

## Advertencia de seguridad
**Solo demo pública.** Los perfiles, roles y registros se guardan en el navegador sin autenticación protegida ni base de datos central. No introducir datos personales reales, contraseñas habituales ni información de clientes. No utilizar para facturación real. Se requiere Supabase Auth, RLS y auditoría antes del despliegue comercial.
