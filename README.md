# FitOS — Prueba v1.0

**[Abrir FitOS v1.0](https://manuelortizchimal-droid.github.io/FitOS/?v=1.0)**

## Nuevas funciones
- **Cuerpo completo**: opción exclusiva que selecciona las siete zonas del catálogo. La duración e intensidad ajustan automáticamente el número de series. No combina simultáneamente esta opción con músculos individuales.
- **Técnica guiada**: el usuario ve fases excéntrica (negativa), concéntrica, pausas isométricas y tempo en segundos por repetición, ajustados a suave/moderada/alta. No se prescriben pesos ni se exige fallo muscular o técnicas avanzadas.
- **FIN**: únicamente habilitado al registrar todas las series. Guarda fecha y clave de la sesión, no permite finalizar esa misma sesión dos veces. La racha cuenta **fechas únicas consecutivas**, no series ni sesiones repetidas el mismo día.
- **Mensaje al terminar**: frase positiva original y botón para volver al inicio. No pretende sustituir apoyo profesional de salud mental.
- **Cronómetro flotante**: accesible en los módulos, arrastrable, minimizable, cronómetro ascendente desde cero en segundos, iniciar, pausar, detener y poner a cero; valores sugeridos 60, 90, 120 y 180 s; puede iniciarse automáticamente desde cada ejercicio. Usa fecha/hora real tras suspensión de pestañas, no ofrece notificaciones con pantalla bloqueada.

## Verificaciones
- Sintaxis JavaScript: PASS.
- 3,528 combinaciones de objetivo, duración de sesión, intensidad, número de músculos, cuerpo completo y frecuencia semanal: sin rutinas vacías, con cobertura de todas las zonas y dentro del tiempo estimado (0 fallas).
- Racha de 3 días con dos entrenamientos en la misma fecha: sigue contando 3, no 4.
- Código v1.0 comprobado en GitHub después del commit.
- **Pendiente**: pruebas táctiles y visuales reales en navegadores móviles, integración Supabase, validación segura de roles y persistencia, carga y disponibilidad. Las estimaciones de duración son orientativas, no cronometra automáticamente la ejecución real.

## Referencias
- [ACSM 2026: entrenamiento progresivo](https://www.acsm.org/wp-content/uploads/2026/03/Resistance-Training-Position-Stand-infographic.pdf)
- [ACSM: velocidad y tempo de repetición](https://doi.org/10.1249/fit.0000000000000814)
- [OMS: fortalecimiento de principales grupos musculares](https://www.ncbi.nlm.nih.gov/books/NBK566046/)

## Aviso de seguridad
**SOLO DEMO PÚBLICA.** No hay autenticación real ni Supabase. Los datos, sesiones, roles y cuentas de demostración permanecen en localStorage del navegador y no constituyen controles de acceso seguros. Usar únicamente datos inventados y contraseñas exclusivas de prueba. Los registros guardados antes de la versión actual se conservan si el navegador mantiene la clave local previa.
