# ESTÁNDARES DE DISEÑO, RENDIMIENTO Y PEDAGOGÍA - MUSEO MELANY 3D

Este documento establece las reglas y directrices inquebrantables que todo componente, modelo 3D, sistema de interfaz y mecánica educativa debe cumplir para garantizar una experiencia de 60+ FPS en navegadores y una inmersión visual de alta categoría para estudiantes de 11 años.

---

## 1. ESTÁNDARES DE RENDIMIENTO GRÁFICO (PERFORMANCE BUDGET)

### 1.1 Prohibición de Materiales de Transmisión Innecesarios
* **Regla:** Queda **terminantemente prohibido** el uso indiscriminado de `MeshPhysicalMaterial` con `transmission: 0.9+` o `roughness: 0` en objetos masivos o cubiertas volumétricas.
* **Causa:** Three.js genera un pase de renderizado completo (Render Target FBO) por cada objeto de transmisión para computar la refracción de fondo. Colocar cajas de cristal sobre pedestales destruye los FPS en cualquier GPU integrada.
* **Solución:** Las vitrinas o pedestales deben ser abiertos ("Open Air Exhibition"), con acabados sólidos de mármol/acero mate. Si se necesita cristal (como el prisma óptico), se debe aislar y optimizar sin rebotes múltiples.

### 1.2 Tratamiento de Luces y Sombras
* **Presupuesto:** Máximo **1 luz direccional principal con sombras proyectadas** (`castShadow = true`, tamaño de mapa de sombra optimizado 1024x1024, bias ajustado a -0.0005).
* **Iluminación ambiental:** Usar `HemisphereLight` de bajo costo y focos puntuales decorativos suaves con `castShadow = false`.
* **Iluminación decorativa arquitectónica:** Zócalos y tiras LED en las paredes usando materiales emisivos (`MeshBasicMaterial` con `emissive`) o texturas luminosas, cero costo de computación de luz por píxel.

### 1.3 Material del Suelo y Techo
* **Suelo:** Acabado sólido mate con rugosidad controlada (`roughness: 0.7 - 0.85`, `metalness: 0.05`). Eliminar efectos de pseudo-raytracing que causan artefactos especulares y tirones de framerate.
* **Cielo / Galaxia:** El techo físico debe ser removido para exponer un domo cósmico optimizado (BufferGeometry con Points o partículas estelares circulares estables generadas en memoria con textura radial), sin sobrecargar el pipeline con shaders pesados innecesarios.

---

## 2. ESTÁNDARES DE UI / UX Y HUD

### 2.1 Visibilidad y No Oclusión
* **Regla:** Ningún elemento informativo debe tapar el centro de visión del usuario mientras examina un experimento.
* **Tarjeta Holográfica Lateral / Inferior:** Cuando la retícula o proximidad apunte a un experimento o a su atril, debe desplegarse un panel elegante estructurado en **píldoras glassmorphism (`.glass-pill`)** en la parte inferior de la pantalla con tipografía legible, título claro, conceptos clave y la tecla de acción `[E]`.

### 2.2 Gestión Robusta del Puntero (PointerLock & Pausa)
* **Regla:** La pérdida o liberación del mouse (tecla `ESC` o desenfoque) no debe romper la sesión ni ocultar la interfaz de misiones.
* **Modal "Mouse Liberado":** Debe presentarse una ventana modal centrada semi-transparente ("Mouse Liberado - Haz clic para continuar"), preservando íntegros los datos del HUD de fondo (misiones, XP, minimapa).

### 2.3 Minimapa 1:1 Squircle
* **Diseño:** Debe mantenerse el formato squircle en Canvas 2D, con marcadores claros y contrastantes para cada uno de los 3 experimentos:
  - 🟢 **Verde:** Papa Batería (Electroquímica)
  - 🟣 **Púrpura:** Prisma Óptico (Dispersión de Luz)
  - 🟡 **Dorado:** Cuna de Newton (Conservación de Momento)
* Flecha de orientación del jugador con rotación fluida y coordenadas acotadas dentro del perímetro del museo.

---

## 3. ESTÁNDARES PEDAGÓGICOS, GAMIFICACIÓN Y REGLAS ANTI-REGRESIÓN

### 3.1 Misiones Progresivas y Claras
* El HUD debe listar simultáneamente las 3 estaciones de aprendizaje con estado dinámico (`Pendiente`, `En progreso`, `Completado`).
* Cada misión debe incluir una descripción clara del fenómeno físico en lenguaje adaptado para chicos de 11 años: divertido, riguroso y sin tecnicismos impenetrables.

### 3.2 Sistema de Preguntas Post-Interacción (Mini-Quizzes Interactivos)
* Al activar o explorar un experimento por primera vez, se despliega un mini-desafío interactivo de 1 a 2 preguntas tipo multiple-choice.
* Al responder correctamente: Feedback visual inmediato, recompensa de **+100 XP**, sonido sintetizado de éxito y actualización del marcador de nivel.

### 3.3 Regla Anti-Regresión: Prohibición Estricta de Reabrir Quizzes ya Aprobados (Idempotencia)
* **Regla Inquebrantable:** Queda **terminantemente prohibido** que una interacción física con un objeto o su pedestal reabra un modal de quiz cuya estación ya haya sido completada con éxito.
* **Causa de Regresión:** Reabrir un modal aprobado bloquea la cámara, libera el cursor abruptamente e interrumpe la exploración del alumno, generando frustración.
* **Patrón de Implementación Obligatorio:**
  ```typescript
  onInteract: () => {
      // 1. Ejecutar SIEMPRE la física / cambio de modo
      const nextMode = this.exhibit.cycleMode();
      this.hud.setCardModePill(`MODO: ${nextMode.name}`);
      
      // 2. Evaluar quiz ÚNICAMENTE si no fue aprobado previamente
      if (!this.hud.isMissionCompleted(EXHIBIT_ID)) {
          this.hud.openQuiz(quizData, () => {
              this.hud.completeMission(EXHIBIT_ID);
          });
      }
  }
  ```

### 3.4 Regla Anti-Regresión: Modo Sandbox Permanente (Exploración Libre Post-Misión)
* **Regla Inquebrantable:** Completar una misión **NUNCA debe congelar, bloquear o desactivar las mecánicas interactivas del experimento**.
* **Comportamiento Requerido:** Tras la aprobación del quiz, las estaciones deben entrar en modo "Laboratorio Libre / Sandbox":
  - **Prisma:** Seguir alternando indefinidamente entre Luz Blanca, Láser Verde y Láser Rojo con la tecla `[E]`.
  - **Cuna de Newton:** Seguir alternando entre los 4 modos físicos de colisión (1 bola, 2 bolas, 3 bolas, simétrico) con `[E]`.
  - **Papa Batería:** Seguir conmutando el interruptor mecánico de encendido/apagado del LED con `[E]`.
  - El HUD debe actualizar dinámicamente sus píldoras de modo y badges sin volver a interrumpir la vista del usuario.

---

## 4. ESTÁNDARES DE FEEDBACK MULTISENSORIAL Y GAME-FEEL

### 4.1 Principio del Doble Canal Concurrente (Visual + Auditivo)
* **Regla:** Ninguna interacción en el museo puede ser "inerte" o un "clic silencioso" (dead click). Cada activación de tecla `[E]` o pulsación de botón de UI debe disparar **simultáneamente**:
  1. **Confirmación Visual:** Deformación mecánica/rotación 3D, cambio de color/emisión lumínica y actualización en tarjeta HUD.
  2. **Confirmación Acústica:** Respuesta sonora inmediata (<10ms de latencia).

### 4.2 Prohibición de Archivos de Audio Externos (Web Audio API Obligatorio)
* **Regla:** Todo sonido interactivo del museo debe ser **generado proceduralmente en tiempo real mediante la Web Audio API nativa** (AudioContext con Osciladores, Nodos de Ganancia y Filtros).
* **Causa:** Los archivos externos (`.mp3`, `.wav`) introducen latencia de red, fallos por políticas CORS, errores 404 y sobrecarga de memoria en el navegador.
* **Firmas Sonoras Obligatorias:**
  - 🔘 **Interruptor / Switch:** Clic percusivo rápido con oscilador de caída exponencial.
  - 🌈 **Prisma Óptico / Láser:** Barrido de frecuencia descendente electromagnético.
  - ⚖️ **Cuna de Newton:** Impacto metálico modal simétrico.
  - ⭐ **Éxito en Quiz:** Arpegio mayor triunfal de notas armónicas.
  - 🏆 **Fin de Expedición:** Fanfarria cósmica con lluvia de confeti dinámico en pantalla.

---

## 5. ESTÁNDARES DE ACCESIBILIDAD Y CROSS-PLATFORM (MÓVIL / TABLET / ESCRITORIO)

### 5.1 Detección Automática de Dispositivos Táctiles
* Si el cliente ejecuta en un dispositivo táctil (`ontouchstart in window` o `navigator.maxTouchPoints > 0`):
  - Activar el HUD táctil con **Joystick Virtual Analógico** en la esquina inferior izquierda.
  - Activar los botones de acción rápida táctiles en la esquina inferior derecha: **⚡ INTERACTUAR [E]** y **▲ SALTAR**.
  - Permitir rotación de cámara panorámica suave mediante arrastre táctil con el pulgar derecho sin requerir API de PointerLock.

### 5.2 Atajos de Teclado Universales
* `W, A, S, D` / Flechas: Desplazamiento omnidireccional.
* `SHIFT`: Carrera veloz.
* `ESPACIO`: Salto con gravedad suave amortiguada.
* `E`: Interactuar con atriles y experimentos.
* `J`: Abrir / Cerrar el **Diario del Científico** (Libreta de Campo).
* `ESC`: Pausa / Liberar puntero de mouse.

---

## 6. DIARIO DEL CIENTÍFICO Y SISTEMA DE LOGROS TOAST

### 6.1 Libreta de Campo Científica (`#journal-modal`)
* Accesible en todo momento mediante el botón `📖 DIARIO [J]` del HUD superior o la tecla `[J]`.
* 3 pestañas temáticas interactivas con explicación científica detallada y rigurosa:
  1. **Pila de Papa:** Reacción redox Zinc/Cobre, electrolito ácido y configuración en serie (1.94V para encender LED).
  2. **Prisma Óptico:** Dispersión cromática de Newton de 380nm a 750nm y haces monocromáticos puros de 532nm y 650nm.
  3. **Cuna de Newton:** Principio de conservación del momento lineal ($p = m \cdot v$) y energía cinética ($E_k = \frac{1}{2}mv^2$).

### 6.2 Notificaciones Toast Flotantes (`#achievement-toast`)
* Estilo cápsula glassmorphic con brillo dorado, icono de trofeo animado y descarte automático no intrusivo tras 4.5 segundos.
* Notifica de forma no bloqueante cada vez que el estudiante consolida un hito experimental.
