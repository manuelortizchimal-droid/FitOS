# FitOS — prueba funcional en GitHub Pages

**URL esperada:** https://manuelortizchimal-droid.github.io/FitOS/app/

- La demo original sigue en `/FitOS/`; el acceso comercial de prueba está en `/FitOS/app/`.
- Solo están expuestos HTML, CSS, JS y la **clave publicable** de Supabase. Datos, cuentas y permisos residen en FitOS-Core y se protegen con RLS.
- No se publica ningún secreto, contraseña, token de administración ni service role.
- Iniciar sesión con el usuario creado en Supabase Auth. El acceso a datos depende del rol del servidor, no del nombre de URL.
- Para invitaciones se deben configurar URL y Redirect URLs de Supabase Auth y la función `fitos-invite` con el origen permitido; las credenciales se configuran en Supabase, nunca en GitHub.
- No usar datos personales reales hasta concluir pruebas de Auth, SMTP, respaldos y restauración, seguridad y flujos funcionales.
