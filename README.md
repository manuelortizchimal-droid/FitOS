# FitOS — Demo de prueba v1.6

**[Abrir FitOS v1.6](https://manuelortizchimal-droid.github.io/FitOS/?v=1.6)**

## Entrenamientos y experiencia
- **Día 1 a Día 7**: se pueden generar planes de hasta 7 sesiones por semana, sin asignar lunes, martes, etc. La fecha de inicio continúa siendo configurable.
- **Glosario** «Necesito ayuda con una palabra de la rutina :)» con RIR (repeticiones en reserva), drop sets, fatiga, tempo, fases excéntricas y concéntricas, isometrías y otros términos.
- Botón **?** junto a cada ejercicio que abre una búsqueda externa de imágenes para consultar máquina, agarre y ejecución. Los resultados son orientativos y no están validados manualmente.
- **FIN** termina una sesión cuando están registradas todas las series y suma la fecha al contador de días consecutivos.
- **Oops! tuve que irme :(** permite salir anticipadamente. Tras confirmar y guardar, aparece un diálogo con una de siete frases alegres y positivas, informa cuántas series se conservaron y permite volver al inicio. No cuenta como entrenamiento finalizado ni aumenta la racha.
- Peso en kg/lb por ejercicio, cronómetro flotante, sonido de tres tonos o vibración opcional según navegador.

## Importación
- [Importar rutinas](https://manuelortizchimal-droid.github.io/FitOS/import.html): hasta Día 7, texto, tablas, Excel, PDF y OCR con revisión.
- [Importar mediciones](https://manuelortizchimal-droid.github.io/FitOS/measure-import.html): texto, CSV, Excel, PDF, capturas y OCR con revisión.

## Verificaciones
- Sintaxis JavaScript comprobada en `index.html`.
- Se verificó que el registro de salida ocurre antes de mostrar el diálogo y que no crea una sesión completada ni altera la racha.
- Se revisaron las siete frases y su tono no culpabilizante.
- La revisión anterior del generador comprobó 4,116 combinaciones incluyendo planes de siete días, sin fallas de cobertura ni exceso de tiempo estimado.

## Pendientes y seguridad
Solo **demo pública**, no se debe ingresar información personal ni contraseñas habituales. Persistencia en navegador sin autenticación ni roles seguros de servidor. Sin Supabase aún. Pendientes: verificación visual en móviles, pruebas funcionales integrales reales y pruebas de las bibliotecas OCR externas. GitHub Pages puede tardar en reflejar el código confirmado en la rama principal.
