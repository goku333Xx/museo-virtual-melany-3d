# 🌌 Museo Virtual Melany 3D — Edición Científica Interactiva (V3)

Un videojuego educativo 3D de exploración en primera persona para el aprendizaje de física, química y óptica, desarrollado íntegramente en el navegador con **Three.js**, **TypeScript** y **Vite**.

Diseñado especialmente para estudiantes jóvenes (10 a 12 años), con dinámicas pedagógicas gamificadas, explicaciones claras y un apartado audiovisual inmersivo a 60+ FPS sin dependencias externas. Cuenta con un **cielo realista con nubes y sol**, **salas tipo museo real con paredes blancas**, **techo de vidrio con palomas**, un **sistema de progresión por salas**, y un **robot Mel-Bot guía inteligente que apunta a los experimentos**.

---

## 🚀 Características Principales

### 🔬 1. Estaciones Científicas Interactivas con Física y Química Real
- **🥔 Pila Electroquímica de 4 Papas en Serie**:
  - Reacción redox real de zinc (ánodo) y cobre (cátodo).
  - Circuito serie que suma **~1.96V** reales para superar la barrera de conducción del LED.
  - Multímetro digital en diagonal frontal con pantalla LCD retroiluminada y sondas roja/negra con pinzas cocodrilo realistas.
  - Simulación de flujo de electrones a lo largo del cableado.
- **🌈 Banco Óptico y Prisma Flint de Alta Refracción**:
  - Prisma equilátero de cristal óptico de gran escala sobre etapa goniométrica micrométrica.
  - Colimador láser industrial a la izquierda y pantalla esmerilada de laboratorio a la derecha.
  - Descomposición espectral continua con colores vivos y saturados (Rojo, Naranja, Amarillo, Verde, Cian, Azul, Violeta) sin sobreexposición ni blanqueo.
  - Modos alternables con **[E]**: Luz Blanca, Láser Verde (532 nm), Láser Rojo (650 nm) y Láser Apagado.
- **⚖️ Cuna de Newton y Conservación del Momento**:
  - Simulación de choques elásticos y conservación de $p = m \cdot v$ y $E_k = \frac{1}{2} m v^2$.
  - 4 modos mecánicos alternables con **[E]**: 1 Esfera, 2 Esferas simétricas, Péndulo sincrónico y Caos doble.
  - Sonido de impacto cinético espacializado según la cercanía del jugador.

### 🎮 2. Interacción Desacoplada y Ergonomía Libre de Frustración
- **Doble canal de interacción**:
  - ⚡ **[E] Probar Experimento**: Manipular libremente la física, el circuito o la luz sin exámenes ni límites.
  - 📝 **[R] Responder Desafío (+100 XP)**: Activar la trivia pedagógica con diseño neón dorado pulsante cuando el alumno se sienta listo.
- **Atajos ergonómicos**: Opciones [A], [B], [C] o teclas [1], [2], [3] con retroalimentación instantánea, partículas de dopamina y sonido procedural.
- **Liberación automática del mouse**: Al abrir cualquier ventana (Quiz, Diario del Científico, Victoria), el cursor se libera instantáneamente sin requerir pulsar `Escape`.
- **Detección inteligente de controles**: Los joysticks y botones táctiles solo aparecen en dispositivos táctiles móviles; en PC con mouse y teclado la pantalla permanece limpia.

### 🧑‍🔬 3. Personalización y Guía Inteligente
- Registro de nombre del alumno en la pantalla de bienvenida.
- **Mel-Bot**: Asistente robótico que acompaña al estudiante por el museo, saludándolo por su nombre y brindándole datos curiosos sobre cada experimento.
- **Diario de Campo Científico [J]**: Cuaderno de notas con fórmulas, historia científica (Newton 1666, Volta 1800) y explicaciones paso a paso.

---

## 🛠️ Tecnologías Utilizadas

- **Three.js**: Renderizado 3D, sombreado ACES Filmic, materiales PBR (cristal, metales, mármol).
- **TypeScript**: Tipado estricto y arquitectura modular orientada a objetos.
- **Vite**: Entorno de desarrollo ultra rápido y empaquetador de producción optimizado.
- **Web Audio API**: Síntesis de sonido procedural en tiempo real (clics mecánicos, arpegios cósmicos, fanfarria de victoria) con 0 descargas de audio externas.

---

## 💻 Ejecución Local

1. Clonar el repositorio o ingresar a la carpeta:
```bash
cd app
npm install
npm run dev
```

2. Abrir en el navegador la URL indicada (habitualmente `http://localhost:3000` o `http://localhost:5173`).

---

## ☁️ Despliegue en Vercel (1 Clic)

Este proyecto incluye `vercel.json` configurado en la raíz para que Vercel compile automáticamente la carpeta `app`:

1. Conectá tu cuenta de GitHub a [Vercel](https://vercel.com).
2. Seleccioná el repositorio `museo-virtual-melany-3d`.
3. Hacé clic en **Deploy** (los valores predeterminados detectarán la configuración automáticamente).
