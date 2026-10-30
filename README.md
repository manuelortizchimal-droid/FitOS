# FitOS — Prueba funcional v1.4

**[Abrir FitOS v1.4](https://manuelortizchimal-droid.github.io/FitOS/?v=1.4)**

## Inicio del deportista: simplificación
- Se retiraron las tarjetas de membresía, series registradas y último peso de la pantalla de inicio.
- Se eliminó el bloque inferior de entrenamiento que repetía los accesos ya presentes.
- El inicio conserva el contador de días consecutivos y **un solo bloque principal**.
  - Sin plan guardado: una opción para crear la primera rutina.
  - Con plan guardado: resumen sencillo de los entrenamientos de la semana. Cada día abre la pantalla Entrenar con esa sesión seleccionada.
- Las funciones siguen disponibles en sus módulos: Entrenar, Generar rutina, Mediciones, Historial y Mi perfil.

## Verificaciones
- Sintaxis JavaScript: PASS.
- Prueba de renderizado lógico del inicio sin plan: 1 CTA, sin indicadores eliminados.
- Prueba de renderizado lógico del inicio con plan: 2 botones para 2 sesiones, sin indicadores eliminados ni CTA duplicados.
- Archivo de GitHub actualizado y leído de nuevo después del commit.
- Pendiente: prueba visual y táctil en teléfono y publicación CDN de GitHub Pages; integración Supabase.

## Aviso
**DEMO PÚBLICA.** Sin autenticación real ni sincronización. No usar datos personales, información clínica ni contraseñas habituales. Las demás funciones y registros previos permanecen en el código y almacenamiento local del navegador.

## Importación
[Importar rutina](https://manuelortizchimal-droid.github.io/FitOS/import.html) · [Importar mediciones](https://manuelortizchimal-droid.github.io/FitOS/measure-import.html)
