# FitOS QA v0.7 — Generador de rutinas

[**Abrir prueba en GitHub Pages**](https://manuelortizchimal-droid.github.io/FitOS/?v=0.7)

## Flujo deportista
Crear una cuenta de prueba → **Generar rutina** → elegir de 1 a 3 grupos musculares, objetivo, experiencia, intensidad, minutos disponibles, frecuencia de entrenamiento y duración → previsualizar → guardar 7, 30 o 1–90 días, o utilizar solo hoy. Registrar peso, repeticiones y RIR de cada serie; consultar historial.

## De dónde salen las rutinas
Catálogo **local versionado** de ejercicios por grupo muscular, con indicaciones técnicas y equipamiento. Motor **determinista** de reglas (no una consulta a IA), que distribuye ejercicios según tiempo disponible y limita intensidad/series en principiantes. Reglas basadas en principios generales de entrenamiento de fuerza e hipertrofia de ACSM; la OMS recomienda trabajar los principales grupos musculares al menos dos días por semana. Es un punto de partida general, no prescripción clínica ni sustituto de entrenador. No prescribe pesos numéricos sin conocer desempeño.

- ACSM: https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/
- OMS: https://www.ncbi.nlm.nih.gov/books/NBK566046/

## Diseño
Blanco perla, naranja y gris mate. Diseño responsivo.

## Pruebas de desarrollo
Se ejecutaron pruebas en Chromium sobre documento local aislado para cuenta deportista, falta de rutina, selección de dos grupos musculares, límite para principiantes, guardar plan semanal, registrar series, historial, rutina espontánea, perfil del propietario y corte. Se verificó sintaxis JavaScript con Node. La publicación CDN aún requiere verificación en navegador público.

## Advertencia
**SOLO DEMO PÚBLICA.** No utiliza Supabase; usuarios, roles, rutinas y series quedan en almacenamiento del navegador y pueden manipularse. No introducir datos personales, credenciales habituales, ni información real del gimnasio. No representa autorización ni facturación seguras. Los datos previos de la demo v0.6 se conservan en el mismo navegador, salvo que el usuario los borre.

Pendiente: Supabase Auth, RLS, permisos de propietario del lado del servidor, persistencia y sincronización multi-dispositivo, auditoría de recomendaciones y pruebas de carga.
