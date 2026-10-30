# FitOS — Prueba UX v0.9

**[Abrir FitOS v0.9](https://manuelortizchimal-droid.github.io/FitOS/?v=0.9)**

## Generador de entrenamientos simplificado

1. Selecciona **Una rutina para hoy** o un **plan para 1 semana, 2 semanas o 1 mes**.
2. Si eliges un plan, indica **cuántas veces entrenarás por semana**. Tres significa tres entrenamientos **en total**, no tres para cada músculo. Puedes elegir libremente los días.
3. Elige **1 a 3 grupos musculares**. En un plan con varias sesiones, FitOS los alterna o reparte, dependiendo de la frecuencia. En una rutina para hoy, los combina.
4. Elige un **objetivo**, la exigencia **suave/moderada/alta** y los **minutos disponibles por entrenamiento**.
5. Revisa la propuesta antes de guardarla. El tiempo mostrado es una **estimación máxima**; no se agregan ejercicios para llenar el tiempo sobrante.

El plan guardado es reutilizable durante el periodo seleccionado. Un entrenamiento espontáneo no sustituye el plan previo. La app no asigna fechas exactas ni comprueba días de recuperación: corresponde al usuario espaciarlos apropiadamente.

## Verificación automatizada
- JavaScript: sintaxis comprobada.
- **2,646 combinaciones** de objetivos, intensidades, duraciones de sesión, número de músculos y frecuencia semanal: tiempo estimado no excedido, sesiones no vacías y al menos un ejercicio de cada grupo seleccionado a lo largo de la semana. **0 fallas**.
- Código confirmado mediante lectura de GitHub tras la actualización.
- Pendiente: pruebas visuales en teléfonos reales, navegación y accesibilidad con usuarios, integración Supabase, seguridad y carga.

## Seguridad
**DEMO PÚBLICA**, sin autenticación real ni servidor. Las cuentas, roles, planes y registros se guardan en el navegador. No uses contraseñas habituales ni datos reales de personas o gimnasios. No se debe usar esta versión para facturación real.
