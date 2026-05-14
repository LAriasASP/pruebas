# REQUERIMIENTO: BUSSINES CONTROL

Este documento contendrá la información estructurada, lógica y el contexto para el desarrollo del sistema.

## Contexto del Proyecto
Planteamiento del Problema: 
El Motor de Gestión (Agenda Inteligente)
Situación Actual: La operación de campo carece de una columna vertebral digital. La dependencia de procesos manuales, herramientas aisladas (como Jotform) y el reporte verbal genera una asimetría de información crítica. No existe un vínculo real entre lo que el asesor planea, lo que realmente ejecuta en ruta y lo que el CORE reporta como recuperado.
Puntos de Dolor Críticos:
Fragmentación y Re-trabajo: La información se captura varias veces en distintos medios, aumentando el error humano y el tiempo administrativo.


Invisibilidad Supervisora: Los gerentes no pueden validar la calidad de la ruta en tiempo real; la supervisión es reactiva y basada en datos que pueden ser alterados (falta de inmutabilidad).


Vulnerabilidad Operativa: Al no haber una validación de duplicidad ni una trazabilidad total, la base de datos es propensa a "basura" y el riesgo de fraude o simulación de visitas es elevado.


Incapacidad de Escalado: El modelo actual no soporta la integración de nuevos puestos operativos ni la complejidad de una cartera que requiere segmentación específica por niveles de mora (Buckets).
Necesidad: Migrar hacia una herramienta de Agenda Inteligente que funcione como un sistema de registro único, auditable, con lógica de negocio embebida y capacidad de operación offline, garantizando que cada paso en la calle sea un dato útil para la estrategia de la Dirección.


## Lógica de Negocio
Dinámica Detallada de la Agenda (Flujo Diario)
La agenda se concibe como un ciclo cerrado de tres fases, donde la información fluye de forma ascendente y descendente:
Fase A: Planificación y Autorización
Apertura de Jornada: El operativo (Asesor, Gestor, etc.) debe capturar su plan de trabajo en las pestañas correspondientes (Promoción, Evaluación o Seguimiento).


Validación del Jefe Inmediato: Antes de salir a ruta, el superior jerárquico revisa la agenda en su propia vista de mando.


Estatus de Validación: El sistema debe marcar la agenda como Enviada, Aprobada o Modificada. Un operativo no debería iniciar gestiones sin una agenda aprobada.
Fase B: Ejecución y Registro de Evidencias (En Ruta)
El sistema opera bajo tres pilares de captura de datos:
Captura de Actividad: Dependiendo del puesto, se registran visitas de promoción (contactos/prospectos) o gestiones de cobranza (preventiva, correctiva, presencial en domicilio, aval o trabajo).


Geolocalización Incrustada: Cada gestión requiere un check-in de coordenadas GPS, fecha, hora y dirección aproximada, vinculándose al historial del cliente o prospecto.


Lógica de Compromisos: Si se registra una "Promesa de Pago", el sistema exige capturar el Cuánto y el Cuándo. Esta promesa debe aparecer automáticamente en la agenda del operativo el día que venza el plazo.


Fase C: Evaluación y Cierre de Jornada (El Atardecer)
Resumen de Cumplimiento: Una pantalla muestra lo cumplido vs. lo programado, separando los resultados por categoría de gestión.


Dictamen de Productividad: El jefe directo evalúa el cierre con etiquetas de desempeño: Excelente, Satisfactorio, Con oportunidad de mejora o Improductivo.
Sincronización: En caso de haber trabajado en modo offline, el sistema asegura que toda la evidencia (fotos y datos) se suba al servidor al recuperar conexión.


## Requerimientos Funcionales
El proyecto es una aplicación lista para producción conectada a un servidor real. El stack tecnológico se compone de:

1. Frontend (La Interfaz):
Core: React.js usando JavaScript (ES6+) y JSX.
Enrutamiento: React Router Dom.
Estilos: Tailwind CSS.

2. Backend & Gestión de Datos (Integración Real):
Arquitectura de Datos: Consumo de APIs RESTful conectadas a un backend en Java (Spring Boot) y base de datos PostgreSQL.
Peticiones de red: Uso de Axios para el manejo de endpoints.
Lógica de Estado: Los estados globales en React se alimentan estrictamente de las respuestas del servidor. No se deben utilizar datos "mockeados" ni simulaciones estáticas en esta fase del desarrollo.

3. Infraestructura y DevOps:

Hosting: Vercel (despliegue del sitio estático/SPA).

Control de Versiones: Git / GitHub.

4. Dependencias Principales:

Visuales y UI: lucide-react (iconografía), animaciones estándar de Tailwind, y librerías de componentes si aplican.


## Estandares visuales 

1. Arquitectura de Color y Superficies
El sistema se basa en una jerarquía de capas por luminosidad inversa al modo oscuro:

Lienzo Principal (Canvas): Gris plateado casi blanco (#F8FAFC / Slate-50).

Contenedores y Tarjetas: Blanco puro (#FFFFFF) para resaltar sobre el fondo, con bordes sutiles en gris suave (Slate-200).

Inmersión: No existe el modo oscuro. El sistema está blindado mediante observadores de clase para mantener siempre la estética clara/plateada.

2. Paleta Cromática Funcional
Primario (Interacción): Azul Marino profundo (Slate-900 o Indigo-950) para botones principales y textos de alta jerarquía.

Acento: Azul acero para estados de foco y elementos activos.

Semántica:

Éxito: Esmeralda suave para confirmaciones.

Alerta: Naranja cálido contenido.

Crítico/Destructivo: Rojo muy suave (tonos pastel o desaturados) para evitar tensión visual excesiva.

Neutros: Escala completa de Slates para tipografía secundaria y bordes.

3. Tipografía y Micro-espaciado
Fuente: System Stack (Antialiased) para máxima legibilidad.

Pesos: Medium (cuerpo), Bold (encabezados), Black (valores numéricos/KPIs).

Tracking: Letter-spacing expandido obligatorio en textos en uppercase (labels, botones, secciones).

Datos Técnicos: Fuente monoespaciada exclusivamente para SKUs, folios, timestamps y precios.

4. Componentes: Tarjetas y Campos (Glassmorphism Claro)
Paneles: Fondo blanco con 95% de opacidad, radio de curvatura de 12px y bordes de 1px.

Elevación: Sombra difusa suave que aumenta al hacer hover, elevando el componente 2px con una transición de 300ms.

Inputs: Efecto "inset" (hundido). El fondo del input es ligeramente más gris que la tarjeta que lo contiene (Slate-100), cambiando a blanco con un borde azul marino al recibir el foco.

5. Jerarquía de Botones y Acciones
Primarios: Fondo Azul Marino sólido con texto blanco y tracking expandido.

Secundarios: Bordes Slate con fondo transparente.

Confirmación: Gradientes suaves de verde a teal.

Destructivos: Texto rojo suave sobre fondo gris muy claro, pasando a rojo sólido solo en hover.

Deshabilitados: Opacidad al 50% con cursor de prohibición.

6. Capas de Interacción (Modales y Overlays)
Backdrop: Oscurecimiento ligero del fondo (20-30%) con un backdrop-blur (desenfoque) pronunciado.

Modales: Panel blanco central con animación de entrada "fade-in + zoom" en 200ms.

Scrollbars: Ultra-finos (6px), con el track invisible (color de fondo) y el thumb en gris medio redondeado.

7. Visualización de Datos (Charts & Tables)
Tablas: Cabeceras en gris claro con texto en mayúsculas. Filas con hover que cambia ligeramente el tono de gris.

Gráficas: Líneas de cuadrícula mínimas. Uso de paleta azul marino y acero para series principales, y rojo suave para alertas de tendencia.

8. Comportamiento React & Responsividad
Mobile-First: El sidebar se convierte en un drawer lateral con overlay. Los layouts colapsan de 2 columnas a 1 automáticamente.

Animaciones: * 200ms: Microinteracciones (hovers, botones).

300-500ms: Cambios de layout (sidebar, expansión de paneles).

Estrategia de Impresión: Inversión total a blanco y negro puro, optimizado para anchos de 80mm (térmico) si es necesario.
