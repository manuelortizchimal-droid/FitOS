# FitOS — QA pública v0.6

**[Abrir la prueba](https://manuelortizchimal-droid.github.io/FitOS/)**

## Dos recorridos de prueba
1. Crear usuario ficticio y contraseña exclusiva como **Deportista**. Registrar perfil, rutina, series, mediciones y consultar historial.
2. Cerrar sesión y crear otro usuario ficticio como **Dueño**. Consultar las tres sucursales, administrar membresías, cambiar tarifa, generar corte y descargar CSV.

## Auditoría v0.6
- Contraseñas de la demo ya no se guardan directamente en texto claro (resumen SHA-256 únicamente para demostración, **no equivale a autenticación segura**).
- Operaciones de guardado críticas con restauración de estado cuando falla el almacenamiento.
- Corrección del cronómetro al navegar y control de intervalos duplicados.
- Validación reforzada de peso, RIR, medidas, fechas y tarifa.
- Protección de celdas CSV contra inyección de fórmulas.
- Pruebas automatizadas ejecutadas en Chromium con documento local aislado y almacenamiento simulado: recorrido deportista, propietario, persistencia en estado, facturación, cronómetro y CSV. Comprobación de sintaxis JS.

## Límites y seguridad
**Esta es una DEMO PÚBLICA**, no una aplicación comercial. Utiliza almacenamiento exclusivo del navegador, las cuentas no se sincronizan y el rol de propietario se elige libremente para las pruebas. No introducir datos reales de personas, información de membresías reales ni contraseñas personales. El sitio no está conectado a Supabase, no tiene control de acceso de servidor y **no debe usarse para facturación real**.

La v0.6 utiliza un nuevo espacio de datos locales de prueba; cuentas ficticias anteriores de v0.5 no se importan automáticamente.

## Próximos requisitos
Supabase Auth y PostgreSQL, permisos RLS, administrador protegido, respaldos, separación de sucursales, integración real y pruebas de carga.
