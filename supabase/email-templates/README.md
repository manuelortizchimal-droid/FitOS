# Plantilla de invitación FitOS
La plantilla oficial se configura en **FitOS-Core → Authentication → Email Templates → Invite user**.
- Asunto sugerido: `FitOS · Activa tu acceso`.
- Copiar el HTML de `supabase/email-templates/invite-user.html` al cuerpo de la plantilla.
- Mantener **exactamente** `{{ .ConfirmationURL }}` como href, porque contiene el token de activación individual.
- No usar como href la URL pública de Athlete: el enlace de activación debe ser el generado por Supabase.
- FitOS usa la URL autorizada `https://manuelortizchimal-droid.github.io/FitOS/app/` para completar la contraseña. Tras activarse, el deportista puede abrir `https://manuelortizchimal-droid.github.io/FitOS/athlete/`.
- Los límites de envío del servicio de correo de Supabase pueden impedir entregas; verificar en Authentication → Logs.
Esta configuración requiere guardar la plantilla en el Dashboard de Supabase: el repositorio no puede cambiar la plantilla de Auth por sí solo.
