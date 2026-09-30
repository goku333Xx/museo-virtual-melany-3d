// =============================================================================
// MUSEO VIRTUAL 7MO — CONFIGURACIÓN DE LAS SALAS POR GRUPO
// =============================================================================
// El museo tiene 10 salas, una por grupo (4 de 7mo A y 6 de 7mo B).
// Para personalizar una sala, editá SOLO el bloque de ese grupo. Todo el museo
// se actualiza solo: cartel sobre la puerta, placa de integrantes, paneles de
// investigación, pantalla de video, pintura de la sala, mapa y misiones.
//
// Campos:
//   curso          → "7mo A" o "7mo B".
//   grupo          → Nombre del grupo (ej: "Grupo 3" o "Los Voltios").
//   integrantes    → Nombres. Aparecen en la placa al costado de la puerta.
//   experimento    → Nombre del experimento. Va en el cartel sobre la puerta.
//   transformacion → La transformación de energía ("Química → Eléctrica").
//   icono          → Un emoji que represente al experimento.
//   investigacion  → Cómo se llevó adelante la investigación (4 paneles):
//        pregunta       ¿Qué quisimos averiguar?
//        hipotesis      ¿Qué pensábamos que iba a pasar?
//        materiales     Lista de materiales.
//        procedimiento  Lista de pasos.
//        resultados     ¿Qué observamos / medimos?
//        conclusion     ¿Qué aprendimos?
//   video          → Video del experimento. Dos opciones:
//        a) Archivo propio: copiarlo a app/public/videos/ y poner
//           'videos/sala-01.mp4'. Formato MP4 (H.264 + AAC), menos de 50 MB.
//        b) Enlace de YouTube: 'https://www.youtube.com/watch?v=XXXXXXXXXXX'
//        Vacío ('') muestra "Video próximamente".
//   simulacion     → Qué se ve en el centro de la sala.
//        'pendiente' muestra una vitrina "Simulación en preparación".
//        (La simulación 3D de cada experimento se arma a partir de fotos.)
//   colorPared     → Color de las paredes de la sala (hex "#rrggbb", tonos de museo).
//   colorAcento    → Color de detalles (subtítulos, líneas).
// =============================================================================

export type TipoSimulacion =
    | 'pendiente'
    | 'papa' | 'tesla' | 'eolico' | 'solar' | 'vandegraaff' | 'newton' | 'dinamo';

export interface Investigacion {
    pregunta: string;
    hipotesis: string;
    materiales: string[];
    procedimiento: string[];
    resultados: string;
    conclusion: string;
}

export interface SalaConfig {
    curso: '7mo A' | '7mo B';
    grupo: string;
    integrantes: string[];
    experimento: string;
    transformacion: string;
    icono: string;
    investigacion: Investigacion;
    video: string;
    simulacion: TipoSimulacion;
    colorPared: string;
    colorAcento: string;
}

export const NOMBRE_MUSEO = 'Museo Virtual 7mo';

// Texto de ejemplo para salas que todavía no cargaron su investigación
const investigacionPendiente = (): Investigacion => ({
    pregunta: '¿Qué quisimos averiguar? (completar)',
    hipotesis: '¿Qué pensábamos que iba a pasar antes de hacer el experimento? (completar)',
    materiales: ['Material 1', 'Material 2', 'Material 3'],
    procedimiento: ['Paso 1', 'Paso 2', 'Paso 3'],
    resultados: '¿Qué observamos o medimos? (completar)',
    conclusion: '¿Qué aprendimos sobre la transformación de la energía? (completar)'
});

export const SALAS: SalaConfig[] = [
    // ------------------------------- 7mo A -------------------------------
    {
        curso: '7mo A',
        grupo: 'Grupo 1',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3', 'Integrante 4'],
        experimento: 'Experimento del Grupo 1',
        transformacion: 'Energía ? → Energía ?',
        icono: '🔬',
        investigacion: investigacionPendiente(),
        video: '',
        simulacion: 'pendiente',
        colorPared: '#3f5e4b',
        colorAcento: '#c9a86a'
    },
    {
        curso: '7mo A',
        grupo: 'Grupo 2',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3', 'Integrante 4'],
        experimento: 'Experimento del Grupo 2',
        transformacion: 'Energía ? → Energía ?',
        icono: '🔬',
        investigacion: investigacionPendiente(),
        video: '',
        simulacion: 'pendiente',
        colorPared: '#2f4a63',
        colorAcento: '#c9a86a'
    },
    {
        curso: '7mo A',
        grupo: 'Grupo 3',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3', 'Integrante 4'],
        experimento: 'Experimento del Grupo 3',
        transformacion: 'Energía ? → Energía ?',
        icono: '🔬',
        investigacion: investigacionPendiente(),
        video: '',
        simulacion: 'pendiente',
        colorPared: '#4c6670',
        colorAcento: '#c9a86a'
    },
    {
        curso: '7mo A',
        grupo: 'Grupo 4',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3', 'Integrante 4'],
        experimento: 'Experimento del Grupo 4',
        transformacion: 'Energía ? → Energía ?',
        icono: '🔬',
        investigacion: investigacionPendiente(),
        video: '',
        simulacion: 'pendiente',
        colorPared: '#8a6a3b',
        colorAcento: '#f1e3c6'
    },
    // ------------------------------- 7mo B -------------------------------
    {
        curso: '7mo B',
        grupo: 'Grupo 1',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3', 'Integrante 4'],
        experimento: 'Experimento del Grupo 1',
        transformacion: 'Energía ? → Energía ?',
        icono: '🔬',
        investigacion: investigacionPendiente(),
        video: '',
        simulacion: 'pendiente',
        colorPared: '#5a4666',
        colorAcento: '#c9a86a'
    },
    {
        curso: '7mo B',
        grupo: 'Grupo 2',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3', 'Integrante 4'],
        experimento: 'Experimento del Grupo 2',
        transformacion: 'Energía ? → Energía ?',
        icono: '🔬',
        investigacion: investigacionPendiente(),
        video: '',
        simulacion: 'pendiente',
        colorPared: '#6b4a3a',
        colorAcento: '#e8d3a8'
    },
    {
        curso: '7mo B',
        grupo: 'Grupo 3',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3', 'Integrante 4'],
        experimento: 'Experimento del Grupo 3',
        transformacion: 'Energía ? → Energía ?',
        icono: '🔬',
        investigacion: investigacionPendiente(),
        video: '',
        simulacion: 'pendiente',
        colorPared: '#7a3f35',
        colorAcento: '#e8d3a8'
    },
    {
        curso: '7mo B',
        grupo: 'Grupo 4',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3', 'Integrante 4'],
        experimento: 'Experimento del Grupo 4',
        transformacion: 'Energía ? → Energía ?',
        icono: '🔬',
        investigacion: investigacionPendiente(),
        video: '',
        simulacion: 'pendiente',
        colorPared: '#35525a',
        colorAcento: '#d8c08c'
    },
    {
        curso: '7mo B',
        grupo: 'Grupo 5',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3', 'Integrante 4'],
        experimento: 'Experimento del Grupo 5',
        transformacion: 'Energía ? → Energía ?',
        icono: '🔬',
        investigacion: investigacionPendiente(),
        video: '',
        simulacion: 'pendiente',
        colorPared: '#4a5a3a',
        colorAcento: '#e8d3a8'
    },
    {
        curso: '7mo B',
        grupo: 'Grupo 6',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3', 'Integrante 4'],
        experimento: 'Experimento del Grupo 6',
        transformacion: 'Energía ? → Energía ?',
        icono: '🔬',
        investigacion: investigacionPendiente(),
        video: '',
        simulacion: 'pendiente',
        colorPared: '#3d3f5c',
        colorAcento: '#d8c08c'
    }
];

// Galería especial del fondo (no pertenece a ningún grupo)
export const GALERIA = {
    titulo: 'Prisma Óptico',
    subtitulo: 'Galería especial · La luz blanca y sus colores',
    icono: '🌈',
    colorPared: '#2e2e38',
    colorAcento: '#c9a86a'
};

/** "Sala 01", "Sala 02", ... */
export function numeroSala(i: number): string {
    return `Sala ${String(i + 1).padStart(2, '0')}`;
}

/** "Sala 01: Experimento del Grupo 1" */
export function nombreSala(i: number): string {
    return `${numeroSala(i)}: ${SALAS[i].experimento}`;
}

/** "7mo A · Grupo 1" */
export function grupoSala(i: number): string {
    return `${SALAS[i].curso} · ${SALAS[i].grupo}`;
}

// -----------------------------------------------------------------------------
// Ubicación de cada sala en el edificio (no hace falta tocar esto)
// Salas 1-5 en el ala oeste, 6-10 en el ala este, de la entrada hacia el fondo.
// -----------------------------------------------------------------------------
export const SALA_PROFUNDIDAD = 22; // x del muro del fondo de las salas (±)
const Z_CENTROS = [20, 10, 0, -10, -20];

export interface SalaLayout {
    side: number;     // -1 oeste, 1 este
    zc: number;       // centro de la sala en z (y de la puerta)
    zMin: number;
    zMax: number;
    centerX: number;  // x del pedestal central
}

export function salaLayout(i: number): SalaLayout {
    const side = i < 5 ? -1 : 1;
    const zc = Z_CENTROS[i % 5];
    return { side, zc, zMin: zc - 4.85, zMax: zc + 4.85, centerX: side * 13.5 };
}

export const GALERIA_CENTRO = { x: 0, z: -35 };
