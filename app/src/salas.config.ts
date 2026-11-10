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
//        a) OneDrive / SharePoint de la escuela: en OneDrive, sobre el video,
//           "Insertar" (Embed) → copiar el código completo <iframe ...> y pegarlo
//           entre comillas. También sirve el enlace de "Compartir" configurado
//           como "Cualquier persona con el vínculo".
//        b) Archivo propio: copiarlo a app/public/videos/ y poner
//           'videos/sala-01.mp4'. Formato MP4 (H.264 + AAC), menos de 50 MB.
//           Es la única opción que se reproduce directamente en la pared.
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

/** Sección libre de la investigación (por ejemplo, del marco teórico) */
export interface Seccion {
    titulo: string;
    texto?: string;         // Párrafos separados por saltos de línea (\n)
    lista?: string[];
    numerada?: boolean;
    imagen?: string;        // Archivo dentro de app/public/ (ej: 'salas/sala-01/foto.jpg')
}

export interface Investigacion {
    /** Opcional: lo que el grupo investigó antes del experimento */
    marcoTeorico?: Seccion[];
    // Los campos vacíos ('' o []) no se muestran en el museo
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
        integrantes: ['Catalina Romano Palmero', 'Agostina Leo', 'Renzo Luciano Monti', 'Santiago Rafael Rago'],
        experimento: 'Electroimán',
        transformacion: 'Eléctrica → Magnética → Mecánica',
        icono: '🧲',
        // Fuente: electroiman.docx (investigación del grupo)
        investigacion: {
            marcoTeorico: [
                {
                    titulo: '¿Qué es un electroimán?',
                    imagen: 'salas/sala-01/electroiman.jpg',
                    texto: 'Un electroimán es un aparato/dispositivo que se comporta como un imán artificial y funciona gracias a la electricidad. Para eso, crea un campo magnético cuando circula una corriente eléctrica por un conductor. Por lo tanto, cuando la corriente eléctrica deja de circular, el campo magnético se elimina y el electroimán deja de actuar. Son muy útiles en máquinas, aparatos electrónicos y equipos industriales.\n' +
                        'A diferencia de un imán convencional (común), este puede prenderse y apagarse, y su fuerza puede cambiar.'
                },
                {
                    titulo: '¿Qué relación hay entre la electricidad y el magnetismo?',
                    texto: 'La electricidad y el magnetismo son fenómenos separados pero interconectados asociados con la fuerza electromagnética. La relación es que la circulación de corrientes eléctricas puede originar efectos magnéticos. La electricidad puede producir magnetismo y el magnetismo puede producir electricidad. Ambos están relacionados con las cargas eléctricas. Las cargas eléctricas pueden producir campos eléctricos y cuando se mueven, también pueden producir campos magnéticos.\n' +
                        'En 1820, el físico y médico Danes Hans y Christian Oersted observó que si se produce una corriente en un circuito eléctrico, se mueve el imán de una brújula que está en su proximidad. Gracias a ese hallazgo, se estableció una primera relación entre el magnetismo y la electricidad, que daría lugar más adelante a la rama de la física denominada electromagnetismo.\n' +
                        'Excepto por el comportamiento debido a la fuerza de la gravedad, casi todos los acontecimientos en la vida diaria se derivan de la fuerza electromagnética. Es responsable de las interacciones entre los átomos y el flujo entre la materia y la energía.\n' +
                        'La conclusión fundamental: la electricidad y el magnetismo no son fuerzas separadas, si no una única fuerza unificada llamada electromagnetismo.'
                },
                {
                    titulo: '¿De qué depende la fuerza de un electroimán?',
                    texto: 'La fuerza de los electroimanes dependen de la intensidad de la corriente eléctrica, el material del núcleo, el tamaño y la forma de la bobina, la distancia al objeto, la temperatura del cable y las vueltas del alambre, mientras más juntas y más vueltas mejor.'
                },
                {
                    titulo: '¿Dónde se usan electroimanes en la vida cotidiana?',
                    texto: 'Los electroimanes son fundamentales para la tecnología moderna. Si bien la mayoría de las personas nunca ven estos componentes directamente, los electroimanes operan en segundo plano para hacer posibles los dispositivos y la infraestructura de los que dependemos a diario. Algunos de estos ejemplos son:',
                    lista: [
                        'Grúas de chatarras: levantan piezas de acero o hierro y las sueltan al apagar la corriente.',
                        'Timbres y cerraduras eléctricas: la corriente produce una fuerza que mueve una pieza.',
                        'Motores eléctricos: los campos magnéticos ayudan a producir movimiento.',
                        'Trenes de levitación magnética: usan fuerzas magnéticas para ayudar a sostener y mover el tren.',
                        'Parlantes y auriculares: una bobina por la que circula corriente, interactúa con un campo magnético y hace vibrar una membrana que produce sonido.',
                        'Equipos médicos: los equipos de resonancia magnética utilizan campos magnéticos muy intensos para obtener imágenes del interior del cuerpo.'
                    ]
                }
            ],
            pregunta: '¿Levanta más clips el electroimán si tiene más vueltas de cable?',
            hipotesis: 'Si tiene más vueltas de cable, el electroimán va a levantar más clips porque retiene más energía que luego, al apagarse, tendrá una mayor cantidad de energía y tiempo que uno con menos vueltas de cables, para, levantar o hacer saltar más clips. Además, crea un campo magnético mucho más grande que uno con menor cantidad de vueltas de cable completadas',
            materiales: [
                '1 clavo grande de hierro (10 cm)',
                '2 m de cable fino esmaltado o cable de teléfono pelado en las puntas',
                '1 pila de 4,5 V (o 2 pilas AA con portapilas)',
                'Cinta aisladora',
                '1 caja de clips'
            ],
            procedimiento: [
                'Enrollar el cable alrededor del clavo, dejando libres las dos puntas.',
                'Conectar las puntas a la pila y acercar el clavo a los clips.',
                'Probar con 10, 20 y 40 vueltas de cable y contar cuántos clips levanta en cada caso.',
                'Desconectar la pila y observar qué pasa con los clips.',
                'Seguridad: desconectar la pila entre prueba y prueba, porque el cable se calienta.'
            ],
            // Todavía no los entregó el grupo (tabla de resultados y cadena de energía)
            resultados: '',
            conclusion: ''
        },
        video: '',
        simulacion: 'pendiente',
        colorPared: '#3f5e4b',
        colorAcento: '#c9a86a'
    },
    {
        curso: '7mo A',
        grupo: 'Grupo 2',
        integrantes: ['Josefina Dolber', 'Joaquina Montalti', 'Santino Pitteri', 'Henry Leandro Mamani Castanón'],
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
        integrantes: ['Catalina García López', 'Enzo Santino Polisicchio', 'Thiago Valiante'],
        experimento: 'Auto a globo',
        transformacion: 'Potencial elástica → Cinética',
        icono: '🎈',
        // Fuente: "Documento.docx" + consigna "Grupo 5: Auto a globo" (en el museo es 7mo A · Grupo 3)
        investigacion: {
            marcoTeorico: [
                {
                    titulo: '¿Qué es la energía potencial elástica?',
                    texto: 'La energía potencial elástica es energía almacenada que busca aplicar una fuerza para cambiar la forma de el objeto elástico ,tal como el estiramiento de un resorte.'
                },
                {
                    titulo: '¿Qué dice el principio de acción y reacción?',
                    texto: 'La tercera ley de Newton establece que para cada acción ,hay una reacción igual y opuesta ,por ejemplo los propulsores del cohete se disparan hacia abajo pero el cohete se dispara hacia abajo .'
                },
                {
                    titulo: '¿Cómo se mueve un cohete?',
                    texto: 'Los cohetes se mueven expulsando gases hacia abajo (acción),experimenta una fuerza en la dirección opuesta, es decir, hacia arriba (reacción),lo que propulsa al cohete hacia adelante.'
                },
                {
                    titulo: '¿Qué es el rozamiento y por qué frena a los objetos?',
                    texto: 'El rozamiento es lo mismo que la fricción. Esta es una fuerza que surge cuando entra en contacto dos cuerpos y se deslizan e intentan deslizarse una sobre la otra.\n' +
                        'La fricción frena objetos porque siempre actúa de forma contraria al movimiento del centro.'
                }
            ],
            pregunta: '¿Recorre más distancia el auto si el globo está más inflado?',
            hipotesis: '', // Todavía no está en el documento del grupo
            materiales: [
                '1 botella plástica chica o caja de cartón',
                '4 tapitas de gaseosa',
                '2 palitos de brochette',
                '2 sorbetes',
                '3 globos',
                'Cinta adhesiva',
                'Cinta métrica',
                'Cronómetro'
            ],
            procedimiento: [
                'Armar el auto: los sorbetes pegados debajo de la botella sirven de ejes, los palitos pasan por adentro y las tapitas son las ruedas.',
                'Pegar un sorbete al globo y fijarlo arriba del auto.',
                'Inflar el globo con 2, 4 y 6 soplidos, soltar el auto y medir la distancia recorrida.',
                'Seguridad: cada alumno usa su propio sorbete para inflar.'
            ],
            // Todavía no los entregó el grupo (tabla de resultados y cadena de energía)
            resultados: '',
            conclusion: ''
        },
        video: '',
        simulacion: 'pendiente',
        colorPared: '#4c6670',
        colorAcento: '#c9a86a'
    },
    {
        curso: '7mo A',
        grupo: 'Grupo 4',
        integrantes: ["Agostina Bianca D'Amico Snaiderman", 'Martina Urrutia Vela', 'Santiago Ángel Antelo'],
        experimento: 'Pila de limón',
        transformacion: 'Química → Eléctrica',
        icono: '🍋',
        // Fuente: "Grupo 1.docx" (número de la consigna; en el museo es 7mo A · Grupo 4)
        investigacion: {
            marcoTeorico: [
                {
                    titulo: '¿Qué es una pila y cómo produce electricidad?',
                    texto: 'Una pila es una unidad mas chica de una batería que almacena energía y la convierte en electricidad. Tiene dos extremos, llamados electrodos y un medio intermedio llamado electrolito. Produce electricidad mediante una reacción química que oxida el ánodo el cual libera electrones que fluyen a través de un circuito externo.'
                },
                {
                    titulo: '¿Qué tiene el jugo de limón que permite que circule la corriente eléctrica?',
                    texto: 'El jugo de limón conduce electricidad porque contiene ácido cítrico, un compuesto que, al disolverse en agua, se disocia en iones libres capaces de transportar carga eléctrica'
                },
                {
                    titulo: '¿Para qué se usan dos metales distintos, como el zinc y el cobre?',
                    texto: 'Se usan dos metales distintos para generar electricidad mediante una reacción electroquímica. El zinc actúa como ánodo (el electrodo donde ocurre la oxidación, es decir, donde una sustancia pierde electrones.) liberando electrones al ser oxidado mientras que el cobre actúa como cátodo, aceptando a los electrones y reduciéndose.'
                },
                {
                    titulo: '¿Qué pasa con el voltaje cuando se conectan varias pilas en serie?',
                    texto: 'La combinación de la conexión en paralelo con la conexión en serie, será una duplicación de la tensión y de la capacidad. Lo que resulta en un mejor rendimiento y mayor flexibilidad para adaptarse a las necesidades específicas de cada circuito.'
                }
            ],
            pregunta: '¿Cuántos limones hacen falta para encender un LED?',
            hipotesis: '', // Todavía no está en el documento del grupo
            materiales: [
                '4 limones',
                '4 clavos galvanizados (o tornillos de zinc)',
                '4 monedas de cobre o trozos de alambre de cobre',
                '5 cables con pinzas cocodrilo',
                '1 LED rojo',
                '1 multímetro (si hay)',
                'Cuchillo plástico'
            ],
            procedimiento: [
                'Clavar en cada limón un clavo y una moneda, separados unos 2 cm.',
                'Conectar los limones en serie (la moneda de uno con el clavo del siguiente) y probar encender el LED.',
                'Repetir con 1, 2, 3 y 4 limones y registrar qué pasa.',
                'Seguridad: no comer los limones usados.'
            ],
            // Todavía no los entregó el grupo (tabla de resultados y cadena de energía)
            resultados: '',
            conclusion: ''
        },
        video: '',
        simulacion: 'pendiente',
        colorPared: '#8a6a3b',
        colorAcento: '#f1e3c6'
    },
    // ------------------------------- 7mo B -------------------------------
    {
        curso: '7mo B',
        grupo: 'Grupo 1',
        integrantes: ['Catalina Ciccolo', 'Agustina Jazmín Piris', 'Viviana Hu', 'Cloe Alvarez'],
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
        integrantes: ['Tomás Mombelli de la Fuente', 'Benicio Rodríguez', 'Santino Nicolás Jauregui', 'Joaquín Arpe'],
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
        integrantes: ['Agustina Soto Balzaretti', 'Ana Schoijet', 'Kristina Elizabeth Mendoza Añez', 'Sabrina Azul Sariaga'],
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
        integrantes: ['Joaquín Pugliese', 'Platón Iakovlev', 'Bautista González Bileni', 'Julián Agustín Witowski'],
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
        integrantes: ['Sebastián Ignacio Pou', 'Jerónimo Iennaccaro', 'Nicolás Scublinsky Castelli', 'Felipe Zurano'],
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
        integrantes: ['Helena Arriola Cornejo', 'Renata Lizarraga', 'Aurelia Farkas'],
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
