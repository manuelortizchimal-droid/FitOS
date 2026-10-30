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
