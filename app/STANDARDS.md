# ESTÁNDARES DE DISEÑO, RENDIMIENTO Y PEDAGOGÍA - MUSEO VIRTUAL 7MO

Este documento establece las reglas y directrices inquebrantables que todo componente, modelo 3D, sistema de interfaz y mecánica educativa debe cumplir para garantizar una experiencia de 60+ FPS en computadoras y celulares, y una pedagogía 100% intuitiva para chicos de 11 años.

---

## 1. ESTÁNDARES DE RENDIMIENTO GRÁFICO (PERFORMANCE BUDGET RED TEAM)

### 1.1 Gestión Dinámica de Luces por Sala (Room Light Manager)
* **Regla Inquebrantable:** Queda **terminantemente prohibido** tener más de 3 o 4 luces dinámicas activas simultáneamente en la escena.
* **Causa:** El sombreador Three.js evalúa todas las luces concurrentes para cada fragmento de cada objeto visible. Tener más de 16 luces colapsa el uso de GPU al 100% y genera caídas severas de cuadros (lag) en celulares e integradas.
* **Solución:**
  - La iluminación general se sostiene mediante `HemisphereLight` de alta calidad (1.85) y luz solar cenital (`DirectionalLight` 2.4).
  - Cada una de las 7 salas cuenta con su foco cenital y halo focal, pero **únicamente la sala donde se encuentra el jugador (o la más cercana) tiene sus focos activos**.
  - Las 6 salas restantes tienen sus focos apagados (`visible = false`), reduciendo los cálculos de sombreado en un 80%.

### 1.2 Simulación Selectiva de Experimentos (Active Room LOD)
* **Regla Inquebrantable:** Cuando el jugador está dentro de una sala, **los otros 6 experimentos deben pausar sus cálculos internos de física, buffers y partículas (Modo Sleep)**.
* **Causa:** Calcular en segundo plano cintas de Van de Graaff, trenes de engranajes de dinamos, arcos de tesla y aspas eólicas cuando el jugador está detrás de paredes a 25 metros de distancia es un desperdicio absoluto de CPU y GPU.

### 1.3 Prohibición de `backdrop-filter: blur()` sobre el Canvas WebGL
* **Regla:** Queda prohibido aplicar filtros de desenfoque (`backdrop-filter: blur(...)`) a notificaciones Toast o píldoras que se animan con frecuencia.
* **Causa:** En navegadores móviles y de escritorio, un `backdrop-filter` en movimiento fuerza a la GPU a pausar la ejecución de WebGL, volcar el framebuffer a memoria y calcular un costoso filtro gaussiano multipase, congelando el juego (lag al recoger orbes).
* **Solución:** Usar degradados oscuros de alta opacidad (98%), bordes luminosos y sombras proyectadas (`box-shadow`), logrando un acabado idéntico sin ningún costo en el compositor.

### 1.4 Prohibición de Re-creación de Geometrías en Bucle de Render
* **Regla:** Queda prohibido llamar a `setFromPoints(points)` o instanciar nuevas `BufferGeometry` en cada cuadro.
* **Solución:** Pre-alojar arrays tipados (`Float32Array`) y `BufferAttribute`, actualizando los valores directamente en memoria y marcando `attribute.needsUpdate = true`.

### 1.5 Tasa de Píxeles Inteligente (Smart DPR)
* **En celulares y tablets:** Limitar `devicePixelRatio` a `1.0` (las pantallas móviles ya superan los 400 PPI, por lo que 1.0 se ve nítido y ahorra un 55% de fill-rate).
* **En escritorio:** Limitar `devicePixelRatio` a `1.25`.
* **Sombras en móviles:** Deshabilitar sombras dinámicas en celulares para garantizar 60 FPS estables.

---

## 2. ESTÁNDARES PEDAGÓGICOS OBLIGATORIOS PARA CHICOS DE 11 AÑOS (6TO GRADO)

### 2.1 Principio de Analogía Cotidiana Directa
* **Regla Inquebrantable:** Todo concepto científico debe ser explicado utilizando analogías cotidianas, visuales y entretenidas. Se prohíbe el uso de fórmulas matemáticas complejas o jerga académica impenetrable.
* **Guía de Analogías Aprobadas:**
  - 🥔 **Pila de Papa:** *"El jugo ácido de la papa actúa como un tobogán donde los electrones saltan del zinc al cobre como chicos en el recreo."*
  - ⚡ **Bobina de Tesla:** *"Emite olas invisibles de energía que viajan por el aire y encienden tubos de luz sin necesidad de cables."*
  - 🌪️ **Aerogenerador:** *"El viento empuja las aspas gigantes para hacer girar imanes de fuerza dentro de rollos de cobre y generar luz para una ciudad."*
  - ☀️ **Panel Solar:** *"La luz del sol está hecha de pelotitas diminutas llamadas fotones que golpean el silicio y hacen correr a los electrones."*
  - ⚡ **Van de Graaff:** *"Una cinta de goma frota y junta un montón de electrones traviesos hasta que saltan chispas, como frotar un globo en el pelo pero a lo gigante."*
  - ⚖️ **Cuna de Newton:** *"La energía del choque viaja invisible a través de las esferas del medio y empuja solo a la última, como en el billar o las filas de dominó."*
  - ⚙️ **Dínamo Manual:** *"Tus músculos transfieren fuerza a los engranajes para hacer girar imanes que empujan la electricidad y calientan el filamento de la bombilla, como los faros de bicicletas."*

### 2.2 Robot Guía Mel-Bot Amigable y Empático
* Mel-Bot es un compañero robótico Chibi Kawaii con cara expresiva y ojos LED animados (ojos felices `^ ^`, guiños, estrellas de celebración).
* Mel debe hablar con calidez, entusiasmo y de forma directa:
  - Si el alumno está en una sala que aún no completó, Mel le recuerda: *"¡Ya estamos acá en la {Sala}! Probá el experimento y tocá el botón [DESAFÍO] para ganar tu medalla."*
  - Al pedir guía, Mel vuela directamente al pedestal de la siguiente sala sin dar rodeos innecesarios.

---

## 3. ESTÁNDARES DE GESTIÓN ROBUSTA DE POINTERLOCK Y TECLA ESC

### 3.1 Recuperación a Prueba de Fallos tras Presionar Esc
* **Problema Histórico:** Al presionar `ESC` en PC, los navegadores (Chrome/Edge/Firefox) imponen un enfriamiento de seguridad (~1.25 segundos). Si el alumno hacía clic en "Continuar" durante ese intervalo, el navegador rechazaba el bloqueo y el juego quedaba trabado con la pantalla de pausa oculta y la cámara inmóvil.
* **Regla Inquebrantable:**
  1. La pantalla de pausa `#pause-modal` **no debe ocultarse** hasta que el evento `controls.addEventListener('lock')` se dispare con éxito.
  2. Si ocurre un error (`pointerlockerror`), se debe mantener o reabrir el modal con aviso claro.
  3. Se debe permitir recuperar el control haciendo clic en **cualquier parte de la pantalla** o en el canvas 3D.
  4. Presionar `Barra Espaciadora` o `Enter` mientras está en pausa debe reanudar el juego inmediatamente.

---

## 4. ESTÁNDARES DE CALIDAD Y REALISMO EN MODELOS 3D

### 4.1 Aerogenerador Eólico ("Posta" / Realista)
* Torre cónica tubular blanca de acero con plataforma y puerta de acceso técnico con señal de advertencia.
* Góndola aerodinámica (Nacelle) con anemómetro giratorio en el techo, baliza de aviación roja parpadeante y ventana de inspección de engranajes.
* Buje y 3 aspas blancas de perfil alar con dobles franjas rojas de advertencia en las puntas (estilo Vestas/Siemens Gamesa).

### 4.2 Panel Solar Fotovoltaico
* Bastidor de aluminio anodizado con esquinas protegidas y vidrio templado antirreflejo.
* Celdas de silicio monocristalino (azul oscuro iridiscente) con cuadrícula de contactos de plata (busbars).
* Brazo de sol artificial articulado que se mueve suavemente con interpolación cinemática continua (cenital 90°, inclinado 45°, sombra).
* Motor DC con hélice de aviación aerodinámica de 3 palas y aro protector.
* Pantalla LCD digital interactiva que muestra en tiempo real la radiación (W/m²), tensión (V) y RPM.

## 5. ESTÁNDARES DE CIELO Y ATMÓSFERA

### 5.1 Cielo Realista Obligatorio
* **Regla:** Queda prohibido el cielo cósmico/galaxia. El museo debe tener cielo diurno celeste de mediodía.
* **Implementación:** Sky dome con gradiente celeste, sol grande con corona, 14 nubes procedurales móviles.
* **Palomas:** 6 sprites de palomas argentinas (3 posadas en el techo de vidrio, 3 volando en círculos).

### 5.2 Materiales de Museo Real
* **Hall central:** piso de losas de piedra caliza, paredes blanco cálido, abierto al lucernario (se ve el cielo).
* **Salas y galería:** cielorraso a 6 m, piso de parquet, plintos blancos mates, riel de iluminación con proyectores y un banco.
* **Pintura por grupo:** las paredes de cada sala usan el `colorPared` de `src/salas.config.ts`. Usar tonos de museo (apagados), nunca fluorescentes.
* **Señalética:** rótulos en vinilo sobre las puertas, cartela de sala junto a la entrada y etiqueta en el frente del plinto. Todos se generan desde `salas.config.ts`; no escribir nombres de sala a mano en el código.

## 6. ESTÁNDARES DE SEÑALIZACIÓN Y DIRECCIÓN

### 6.1 Indicador de Dirección por Sala
* **Regla:** Toda sala DEBE tener flecha en el piso ("OBSERVÁ DESDE ACÁ") + placa de bronce en el frente del pedestal.

### 6.2 Sistema de Puertas Progresivas
* **Regla:** Las salas se desbloquean secuencialmente. Las puertas cerradas muestran cartel "🔒 SALA BLOQUEADA - Completá la sala anterior".
* **Mel-Bot contextual:** Si el jugador se acerca a una puerta bloqueada, Mel-Bot le avisa cuál sala debe completar primero.

## 7. ESTÁNDARES DE MODELOS 3D

### 7.1 setSleep() Obligatorio
* **Regla:** Todo modelo 3D DEBE implementar `setSleep(sleep: boolean)`. Cuando `sleep=true`, el método `update()` debe retornar inmediatamente sin cálculos.
* **PointLights:** Los modelos con PointLight dinámicas deben ponerlas en `visible=false` al dormir.

### 7.2 Polígonos Máximos
* **Regla:** Ningún modelo individual debe superar 20,000 triángulos. Usar subdivisiones razonables (16-24, no 64).

### 7.3 Prohibición de MeshPhysicalMaterial con Transmisión
* **Regla:** Queda prohibido `MeshPhysicalMaterial` con `transmission` en objetos visibles. Usar `MeshStandardMaterial` con `transparent: true` y `opacity` baja.
* **Causa:** Cada objeto con `transmission` genera un render pass adicional completo (copia del framebuffer).

### 7.4 Hacer Visible lo Invisible
* **Regla:** Todo fenómeno físico invisible (campo magnético, viento, fotones, ondas, corriente eléctrica) DEBE tener representación visual para chicos de 11 años.
* **Ejemplos:** Líneas de campo magnético en dínamo, estelas de viento en aerogenerador, lluvia de fotones en panel solar, onda de choque en Cuna de Newton, polaridad +/- en cables.
