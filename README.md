# FitOS — Auditoría técnica v2.0 (demo)

**Prueba actual:** https://manuelortizchimal-droid.github.io/FitOS/?v=2.0

## Arquitectura actual
- Demo HTML/CSS/JavaScript con archivos `index.html`, `import.html`, `measure-import.html`.
- Datos de demostración en `localStorage`; sin backend, sincronización, aislamiento entre gimnasios ni autenticación/roles seguros.
- No utilizar datos personales reales, fotografías, expedientes corporales ni contraseñas habituales.

## Módulos y funciones
- Inicio con racha de constancia, 10 niveles y escala de emoji cada tres días consecutivos registrados.
- Planes de 1 a 7 entrenamientos por semana, vista Hoy/Semanal y acceso a las sesiones.
- Registro individual de series (peso, repeticiones, RIR) y finalización o interrupción de la sesión.
- Cronómetro flotante con controles de descanso, unidades kg/lb.
- Medidas corporales e historial de entrenamiento dentro de Medidas.
- Importación revisable de rutinas y medidas desde texto, archivo o captura con dependencias externas cargadas bajo demanda.
- Panel demostrativo para propietario (sin autorización de servidor).

## Auditoría y correcciones v2.0
1. Corregido el mapa fecha→rutina para respetar la distribución semanal del generador, incluidos los descansos.
2. Bloqueado el acceso a la selección semanal cuando el plan no está vigente.
3. Mejorado el tratamiento de planes sin sesiones y de índices fuera de rango.
4. Eliminados manejadores de interfaz heredados que ya no tenían controles activos.
5. Codificada la salida HTML de equipamiento, repeticiones y campos del historial; reforzada validación de fechas futuras en mediciones.
6. Conservada la prioridad de rutinas rápidas de hoy para no impedir un entrenamiento puntual con un plan guardado.
7. Añadida la suite `tests/audit.cjs` y workflow `FitOS QA — regresion` en GitHub Actions.

## Estado de pruebas
- Sintaxis: HTML/JS y scripts integrados comprobados en GitHub Actions.
- Lógica: recurrencia de 1 a 7 sesiones, descansos, vigencia, niveles de constancia, aislamiento lógico de la racha y elementos clave de navegación.
- La suite automatizada se ejecutó con resultado exitoso el 30 de octubre de 2026.
- Pendiente: pruebas de interacción real en navegador móvil y escritorio, carga efectiva de OCR/PDF/Excel externos, persistencia multi-dispositivo, rendimiento y auditoría de seguridad de backend.

**La versión 2.0 es una demo funcional de evaluación, NO una versión comercial ni producción.**
