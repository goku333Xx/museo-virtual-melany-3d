// =============================================================================
// MUSEO VIRTUAL 7MO — CONFIGURACIÓN DE LAS SALAS POR GRUPO
// =============================================================================
// Cada grupo tiene UNA sala. Para caracterizarla, editá SOLO el bloque de tu
// grupo en este archivo. Todo el museo (carteles de entrada, cartela de pared,
// placa del pedestal, color de la sala, mapa y pantalla de inicio) se actualiza
// solo a partir de estos datos.
//
// Campos:
//   grupo         → Nombre del grupo (ej: "Grupo 3 · Los Voltios").
//   integrantes   → Lista de nombres. Aparecen en la cartela de la sala.
//   titulo        → Nombre de la sala / del experimento.
//   transformacion→ La transformación de energía ("Química → Eléctrica").
//   icono         → Un emoji que represente a la sala.
//   texto         → Texto de la cartela de pared (2 a 4 oraciones).
//   colorPared    → Color de la pared de fondo de la sala (hex "#rrggbb").
//                   Usá tonos de museo: apagados, no fluorescentes.
//   colorAcento   → Color de detalles (líneas de la cartela, número de sala).
// =============================================================================

export interface SalaConfig {
    grupo: string;
    integrantes: string[];
    titulo: string;
    transformacion: string;
    icono: string;
    texto: string;
    colorPared: string;
    colorAcento: string;
}

export const NOMBRE_MUSEO = 'Museo Virtual 7mo';

export const SALAS: SalaConfig[] = [
    {
        grupo: 'Grupo 1',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3'],
        titulo: 'Pila de Papa',
        transformacion: 'Química → Eléctrica',
        icono: '🥔',
        texto: 'El jugo ácido de la papa hace de puente entre un clavo de zinc y uno de cobre. Los electrones viajan de un metal al otro por el cable y encienden el LED.',
        colorPared: '#3f5e4b',
        colorAcento: '#c9a86a'
    },
    {
        grupo: 'Grupo 2',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3'],
        titulo: 'Bobina de Tesla',
        transformacion: 'Eléctrica → Electromagnética → Lumínica',
        icono: '⚡',
        texto: 'La bobina lanza ondas electromagnéticas invisibles al aire. Cuando llegan al tubo, excitan el gas de adentro y lo hacen brillar sin ningún cable.',
        colorPared: '#2f4a63',
        colorAcento: '#c9a86a'
    },
    {
        grupo: 'Grupo 3',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3'],
        titulo: 'Aerogenerador',
        transformacion: 'Eólica → Mecánica → Eléctrica',
        icono: '🌬️',
        texto: 'El viento empuja las aspas y las hace girar. Adentro de la góndola, imanes que giran junto a bobinas de cobre generan la corriente que ilumina la ciudad.',
        colorPared: '#4c6670',
        colorAcento: '#c9a86a'
    },
    {
        grupo: 'Grupo 4',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3'],
        titulo: 'Panel Solar',
        transformacion: 'Lumínica → Eléctrica → Mecánica',
        icono: '☀️',
        texto: 'La luz está hecha de fotones. Al chocar contra el silicio del panel ponen en movimiento a los electrones, y esa corriente hace girar el motor de la hélice.',
        colorPared: '#8a6a3b',
        colorAcento: '#f1e3c6'
    },
    {
        grupo: 'Grupo 5',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3'],
        titulo: 'Generador Van de Graaff',
        transformacion: 'Mecánica → Electrostática',
        icono: '🎈',
        texto: 'Una cinta de goma frota y transporta cargas hasta la esfera de metal. Cuando se acumulan muchas cargas iguales se rechazan: las tiras se levantan y saltan chispas.',
        colorPared: '#5a4666',
        colorAcento: '#c9a86a'
    },
    {
        grupo: 'Grupo 6',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3'],
        titulo: 'Cuna de Newton',
        transformacion: 'Potencial → Cinética → Sonora',
        icono: '⚖️',
        texto: 'Al soltar una esfera, su energía potencial se vuelve cinética. El golpe viaja a través de las esferas del medio y hace saltar a la última. Una parte se pierde como sonido.',
        colorPared: '#6b4a3a',
        colorAcento: '#e8d3a8'
    },
    {
        grupo: 'Grupo 7',
        integrantes: ['Integrante 1', 'Integrante 2', 'Integrante 3'],
        titulo: 'Dínamo Manual',
        transformacion: 'Muscular → Mecánica → Eléctrica → Lumínica',
        icono: '⚙️',
        texto: 'Al girar la manivela, los engranajes hacen rotar un imán dentro de bobinas de cobre. La corriente que se genera calienta el filamento de la lámpara hasta que brilla.',
        colorPared: '#7a3f35',
        colorAcento: '#e8d3a8'
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

/** "Sala 01: Pila de Papa" */
export function nombreSala(i: number): string {
    return `${numeroSala(i)}: ${SALAS[i].titulo}`;
}
