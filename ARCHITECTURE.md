# FitOS Core — Arquitectura comercial (preproducción)

La demo actual en /index.html permanece aislada y operativa en GitHub Pages. El nuevo cliente comercial vive en /commercial y se compila en /dist **solo al configurar Supabase**.

## Arquitectura

- GitHub: código común y QA.
- Cloudflare Pages: despliegue estático de /dist, dominios; no autoriza acceso a datos.
- Supabase: Auth y PostgreSQL/RLS para gimnasios (tenants), sucursales, usuarios/roles, planes, entrenamientos, series y medidas.
- FitOS Admin: cuenta superadministradora (tabla `fitos_platform_admins`) permite altas de gimnasios y cambios de licencias.
- Los datos se separan por `gym_id`, con restricciones FK y RLS. Los entrenadores se limitan a la sucursal asignada.
- Si se suspende un gimnasio, RLS impide que sus usuarios consulten datos operativos; el superadministrador conserva acceso de gestión.

## Pasos de despliegue (requieren conexión/autorización)

1. Crear proyecto propio de Supabase y configurar Auth; restringir registros abiertos e invitaciones a administradores.
2. Aplicar `supabase/migrations/0001_fitos_core.sql` y después `0002_branch_security.sql`, primero en un ambiente de pruebas. Ejecutar SQL usando rol de administración.
3. Crear en Supabase Auth tu usuario principal; ejecutar con rol de administración: `insert into public.fitos_platform_admins(user_id) values ('UUID_REAL');`.
4. Crea cuenta Cloudflare, conecta repo a Pages. Build: `node scripts/build.mjs`. Output: `dist`. Variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (solo clave publicable).
5. Configurar redirects de Auth, HTTPS, acceso restringido a staging, dominio y origen autorizado.
6. Realizar pruebas RLS con dos gimnasios, dos sucursales y cuentas de cada rol. Validar acceso cruzado denegado, suspensión, reactivación, invitaciones, cargas y continuidad.
7. Configurar backup probado + restauración, registro de actividad, alertas, recuperación de cuenta, privacidad y eliminación/exportación antes de cualquier información real.

## Límites de la entrega

No se han conectado cuentas reales. No se aplicaron migraciones en Supabase ni se desplegó Cloudflare. Las pruebas de SQL son estructurales, **no equivalen a pruebas de políticas ejecutadas en PostgreSQL**.

El portal comercial contiene acceso, vista de gimnasios/sucursales, panel maestro de licencias, lectura de rutinas e historial y registro de mediciones. La migración del generador completo de rutinas/ejercicios, cronómetro, cargas, fotos, importación de PDF/OCR, invitaciones y administración completa de usuarios al nuevo cliente requiere integración posterior; la demo antigua conserva esas funciones.

Los backups y la retención de datos deben ser explícitos y acordes a los contratos. No hay compromiso de SLA, seguridad certificada o lanzamiento comercial hasta probar esos requisitos.

## Invitaciones y registro de entrenamiento

- Endpoint previsto: `supabase/functions/fitos-invite/index.ts`, que recibe correo, gimnasio, rol y sucursal desde un administrador autenticado. En Supabase se despliega con JWT verificado y secrets exclusivos del servidor. Variables: `FITOS_ALLOWED_ORIGINS` (lista exacta), `FITOS_INVITE_REDIRECT_URL` (URL permitida), `SUPABASE_SERVICE_ROLE_KEY` (solo servidor).
- Aplicar también la migración `0003_license_visibility.sql` tras 0001 y 0002.
- El frontend comercial incluye registro de series, rutinas básicas de 1 a 7 días y finalización de sesión. Está pendiente trasladar todos los métodos avanzados del motor de la demo y probar integración real.
- El alta de usuario actual envía invitación antes de adjuntar membresía; si falla el segundo paso, requiere revisión administrativa. No enviar invitaciones reales sin ensayo de esta recuperación.

## Seguridad adicional y dominios

- Aplicar migraciones `0004_workout_integrity.sql`, `0005_qualified_rls.sql`, `0006_domains_photos.sql` en ese orden. 0005 corrige explícitamente las referencias de filas en subconsultas RLS: no omitirla.
- Los cambios de estado de una sesión terminada y la asignación de sesiones se validan también en PostgreSQL; el cliente no es una autoridad de seguridad.
- `fitos_domains` asocia hostname con gimnasio. FitOS Admin puede registrar dominios; la verificación DNS/HTTPS en Cloudflare sigue siendo una tarea externa. El dominio nunca reemplaza la sesión ni los permisos RLS.
- `fitos_photo_consents` controla acceso y subida a bucket privado `fitos-photos`, con límite de 5 MiB y tipos JPEG, PNG y WebP. Pendiente implementar UX de consentimiento y fotografías en el cliente comercial.
- `FITOS_ALLOWED_ORIGINS` y `FITOS_INVITE_REDIRECT_URL` se deben configurar antes de activar invitaciones.

- Aplicar también la migración `0007_history_integrity.sql` para impedir entrenamientos duplicados por día y conservar la titularidad/historia de planes, sesiones y mediciones.
- GitHub Actions incluye ahora PostgreSQL 16 temporal con pruebas de aislamiento de gimnasios/sucursales, suspensión, control de finalización y bloqueo de duplicados. Estas pruebas no sustituyen el ensayo en un Supabase auténtico ni en Cloudflare.

## Cambio 0008 (obligatorio)

- Ejecutar `0008_api_privileges.sql` tras 0007 para configurar explícitamente los permisos REST en proyectos con exposición automática deshabilitada.
- Retira la capacidad de invocar la función auxiliar `public.rls_auto_enable()` por los roles web, mitigando la advertencia del asesor de seguridad.
- La integración Supabase fue capaz de leer FitOS-Core, pero la primera escritura de migración fue bloqueada por controles de seguridad; no afirmar instalación real hasta verificar `list_migrations` y las tablas con RLS activo.
