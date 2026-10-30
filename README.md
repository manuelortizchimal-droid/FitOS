# FitOS — QA pública (v0.5)

Prueba de interfaz para el primer gimnasio con **tres sucursales**.

## Abrir
https://manuelortizchimal-droid.github.io/FitOS/

## Recorridos
- **Deportista:** crear cuenta ficticia, configurar perfil, registrar y editar series, guardar medidas y ver historial.
- **Propietario:** crear una cuenta de demostración con rol propietario, visualizar sucursales, cambiar estados de membresía, configurar tarifa y exportar corte CSV.

## Seguridad y limitaciones
**Solo demostración.** Esta versión es HTML estático, sin backend ni Supabase conectado. Los datos se guardan únicamente en el navegador y se pueden manipular desde el cliente. Los roles son seleccionables para pruebas y **no son permisos seguros**. Los valores y cierres de facturación son ficticios.

No utilices datos reales de deportistas, información de clientes ni contraseñas habituales. Para la demostración las contraseñas se almacenan como resúmenes SHA-256, lo cual **no representa un sistema de autenticación seguro**, ni reemplaza Supabase Auth. Las cuentas no se sincronizan entre dispositivos.

El sitio está publicado desde un repositorio público. No alojar información corporal real ni credenciales privilegiadas aquí.

## Próxima integración
Supabase Auth, Postgres, políticas RLS y roles de servidor, migraciones versionadas, pruebas de regresión e integración, y validación de la facturación contra membresías verificadas.
