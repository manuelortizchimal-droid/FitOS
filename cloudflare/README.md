# Cloudflare Pages — FitOS comercial

Este despliegue es DISTINTO de la demo pública de GitHub Pages.

1. Vincula el repositorio FitOS a un proyecto de Cloudflare Pages.
2. Build command: `node scripts/build.mjs`.
3. Build output directory: `dist`.
4. Variables de build: `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` (públicas; NO service_role).
5. Configura Auth > URL Configuration en Supabase para el dominio publicado y los redirects autorizados.
6. Antes de invitar usuarios: ejecutar migraciones SQL, asignar superadministrador, y ejecutar pruebas reales de RLS con dos gimnasios.
7. Cloudflare no reemplaza permisos de Supabase; los subdominios no autorizan acceso a datos.
8. No activar modo comercial hasta verificar respaldos/restauración, recuperación de cuenta, observabilidad y protección contractual.

El plan gratis de Pages tiene límites de dominios; confirmar requisitos de subdominios antes de ofrecerlos comercialmente.

## Estado de la publicación

Para publicar el Panel Maestro, ejecutar el build con las variables públicas de Supabase configuradas en el proveedor de hosting. No incluir claves secretas en el repositorio.

## Panel Maestro — publicación

- Proyecto: FitOS-Core. Nunca conectar Yamakis.
- Cloudflare Pages: conectar `manuelortizchimal-droid/FitOS`, rama `main`.
- Build command: `node scripts/build.mjs`.
- Output directory: `dist` (directorio raíz sin subcarpeta).
- Variable de compilación `SUPABASE_URL`: `https://sazudzsdsluygcjivcvf.supabase.co`.
- Variable de compilación `SUPABASE_PUBLISHABLE_KEY`: usar la clave `sb_publishable_...` del panel Supabase → API Keys. **Es pública; jamás poner service_role.**
- Tras la primera publicación, incluir el origen HTTPS de Cloudflare Pages en `FITOS_ALLOWED_ORIGINS` y el URL de activación en `FITOS_INVITE_REDIRECT_URL`; desplegar la Edge Function `fitos-invite` con JWT obligatorio.
- En Supabase → Authentication → URL Configuration: incluir la URL base y ruta de redirección del nuevo dominio. Antes de comercializar, deshabilitar libre registro, activar protección contra abuso y revisar SMTP.
- Estado esperado: el panel maestro puede iniciar sesión, crear gimnasios y gestionar licencias; las invitaciones no deben usarse sin el origen/redirect y la Edge Function configurados.
