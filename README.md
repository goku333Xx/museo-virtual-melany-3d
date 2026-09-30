# 🏛️ Museo Virtual 7mo — Transformaciones de la Energía

Un museo educativo 3D de exploración en primera persona sobre las transformaciones de la energía, desarrollado íntegramente en el navegador con **Three.js**, **TypeScript** y **Vite**.

El museo tiene **10 salas, una por grupo**: 4 de **7mo A** (ala oeste) y 6 de **7mo B** (salas 5 a 10). La ambientación imita un museo real: hall central con piso de piedra y lucernario, salas cerradas con cielorraso, piso de parquet, paredes pintadas, rieles de iluminación y bancos. Un **robot Mel-Bot guía** acompaña al visitante.

Cada sala tiene:
- **Cartel sobre la puerta** con el nombre del experimento, el curso y el grupo.
- **Placa de bronce al costado de la puerta** con los integrantes.
- **Simulación en el centro** (por ahora, una vitrina "Simulación en preparación"; se arma a partir de fotos del experimento).
- **Cuatro paneles "Cómo investigamos"**: pregunta e hipótesis, materiales, procedimiento, resultados y conclusión. Con [E] se leen completos en pantalla grande.
- **Pantalla de video** en el muro del fondo: [E] reproduce/pausa en la pared y [R] lo abre en grande con volumen y pantalla completa. Los videos de OneDrive se abren en grande con su reproductor. Mientras suena, los efectos del museo se silencian.

---

## 🎨 Cómo personalizar una sala

Todo se edita en [`app/src/salas.config.ts`](app/src/salas.config.ts). Cada grupo toca **solo su bloque**:

| Campo | Qué cambia en el museo |
|---|---|
| `curso` / `grupo` | Cartel de la puerta, placa, mapa y diario |
| `integrantes` | Placa al costado de la puerta |
| `experimento` | Cartel sobre la puerta, título del muro, mapa y misiones |
| `transformacion` | Subtítulo (ej: `Química → Eléctrica`) |
| `icono` | Emoji del experimento |
| `investigacion` | Los 4 paneles y la ventana "Cómo investigamos" |
| `video` | Código «Insertar» o vínculo de OneDrive/SharePoint, o `'videos/sala-01.mp4'` (archivo en `app/public/videos/`) |
| `simulacion` | `'pendiente'` mientras se arma la simulación 3D |
| `colorPared` / `colorAcento` | Pintura de la sala y detalles |

Instrucciones para los videos: [`app/public/videos/LEEME.txt`](app/public/videos/LEEME.txt).

---

## 🚀 Recorrido y controles

- **Moverse**: WASD o flechas (Shift para correr). En celular, joystick y arrastre para mirar.
- **[E]**: interactuar con lo que mirás (simulación, video, paneles, placa, Mel-Bot).
- **[R]**: ver más (investigación completa o video en grande; con Mel-Bot, pedir guía).
- **[J]**: Diario de la visita, con la investigación de las 10 salas.
- **Misiones**: una sala queda "visitada" al ver su video o leer su investigación. Al completar las 10 hay celebración final.
- **Galería especial** al fondo del hall: prisma de Newton.
- Los joysticks y botones táctiles solo aparecen en celulares y tablets.

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
