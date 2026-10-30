# FitOS — Prueba funcional v1.1

[**Abrir FitOS v1.1**](https://manuelortizchimal-droid.github.io/FitOS/?v=1.1)

## Cambios
- **kg/lb por deportista:** selector en Entrenar y Mi perfil. Los registros se conservan internamente en kg y se convierten a libras según la preferencia (1 kg = 2.2046226218 lb). El historial refleja esa preferencia.
- **RIR:** explicación desplegable en cada ejercicio: repeticiones en reserva. RIR 3 significa que podrías realizar 3 repeticiones adicionales con buena técnica.
- **Cronómetro flotante simplificado:** iniciar/pausar, reiniciar, minimizar, arrastrar y elegir 60, 90, 120 o 180 segundos. Cuenta segundos ascendentes; se pone rojo al superar la duración.
- **Avisos opcionales:** sin aviso (por defecto), sonido de dos tonos o vibración si el teléfono/navegador es compatible. La selección se guarda por usuario en la demo. El aviso ocurre solo una vez al llegar al tiempo seleccionado.
- **Diseño:** controles compactos y textos legibles en móvil.

## Verificaciones ejecutadas
- Sintaxis JavaScript: PASS.
- 14 casos de conversión kg → lb → kg, redondeos incluidos: PASS.
- Reloj simulado: alarma una sola vez al alcanzar 60 s, indicador rojo y reinicio a cero: PASS.
- Lectura del código publicado y conservación de la clave anterior de la demo: PASS.

No se han probado los efectos físicos de sonido/vibración en dispositivos reales ni la regresión visual integral de móviles. La integración con Supabase sigue pendiente.

## Compatibilidad
- El sonido utiliza Web Audio API y puede requerir un toque inicial; puede no reproducirse al bloquear la pantalla o cambiar de aplicación.
- La vibración requiere la API Vibration, no disponible en Safari de iPhone y otros navegadores. La opción se deshabilita cuando no existe soporte.
- No se garantizan alertas con pantalla bloqueada ni fuera de la aplicación.

Fuentes: [Vibration API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) y [Web Audio — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

## Seguridad
**DEMO PÚBLICA — NO USAR DATOS REALES.** Sin Supabase, autenticación segura, autorización de servidor ni facturación verificada. Usar correos y contraseñas ficticios.
