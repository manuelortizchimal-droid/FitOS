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
