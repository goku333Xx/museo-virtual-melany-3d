import * as THREE from 'three';
import { PotatoBattery } from './models/Potato';
import { EnergyCables } from './models/Cables';
import { SwitchExhibit } from './models/SwitchAndLED';
import { MuseumRoom, type WallBox } from './models/Environment';
import { OpticsExhibit } from './models/OpticsExhibit';
import { NewtonsCradle } from './models/NewtonsCradle';
import { TeslaCoil } from './models/TeslaCoil';
import { WindTurbineExhibit } from './models/WindTurbineExhibit';
import { SolarPanelExhibit } from './models/SolarPanelExhibit';
import { VanDeGraaffExhibit } from './models/VanDeGraaffExhibit';
import { DynamoExhibit } from './models/DynamoExhibit';
import { RobotGuide } from './models/RobotGuide';
import { QuantumOrbsManager } from './models/QuantumOrbs';
import { SoundSynthesizer } from './SoundSynthesizer';
import { HUD } from './HUD';
import type { QuizData } from './HUD';

export interface Interactable {
    object: THREE.Object3D;
    id: number;
    title: string;
    tag: string;
    description: string;
    badge: string;
    modeText?: string;
    getModeText?: () => string;
    quiz: QuizData;
    onInteract?: () => void;
    onChallenge?: () => void;
}

export class World {
    scene: THREE.Scene;
    interactables: Interactable[] = [];
    
    // Modelos de las Salas
    private room!: MuseumRoom;
    private potato1!: PotatoBattery;
    private potato2!: PotatoBattery;
    private potato3!: PotatoBattery;
    private potato4!: PotatoBattery;
    private cables!: EnergyCables;
    private switchExhibit!: SwitchExhibit;
    private teslaCoil!: TeslaCoil;
    private windTurbine!: WindTurbineExhibit;
    private solarPanel!: SolarPanelExhibit;
    private vanDeGraaff!: VanDeGraaffExhibit;
    private dynamoExhibit!: DynamoExhibit;
    private cradle!: NewtonsCradle;
    private optics!: OpticsExhibit;
    private robotGuide!: RobotGuide;
    private orbsManager!: QuantumOrbsManager;

    private isPlugged: boolean = true;
    private plugMesh!: THREE.Mesh;
    private hud: HUD;
    private lastPlayerPos = new THREE.Vector3(0, 1.68, 4.5);

    constructor(scene: THREE.Scene, hud: HUD) {
        this.scene = scene;
        this.hud = hud;
        this.init();
    }

    private init() {
        // 1. Habitación Arquitectónica con 6 Salas Temáticas y Atrio Central
        this.room = new MuseumRoom();
        this.scene.add(this.room.getMesh());

        const pHeight = 1.2;

        // =========================================================================
        // SALA 01 (OESTE: X = -15, Z = 0): ENERGÍA QUÍMICA & PILA DE PAPA (~1.94V)
        // =========================================================================
        const s1X = -15;
        this.potato1 = new PotatoBattery();
        const p1Mesh = this.potato1.getMesh();
        p1Mesh.position.set(s1X - 0.82, pHeight + 0.12, -0.20);
        this.scene.add(p1Mesh);

        this.potato2 = new PotatoBattery();
        const p2Mesh = this.potato2.getMesh();
        p2Mesh.position.set(s1X - 0.62, pHeight + 0.12, 0.22);
        this.scene.add(p2Mesh);

        this.potato3 = new PotatoBattery();
        const p3Mesh = this.potato3.getMesh();
        p3Mesh.position.set(s1X + 0.68, pHeight + 0.12, 0.15);
        this.scene.add(p3Mesh);

        this.potato4 = new PotatoBattery();
        const p4Mesh = this.potato4.getMesh();
        p4Mesh.position.set(s1X + 0.85, pHeight + 0.12, -0.22);
        this.scene.add(p4Mesh);

        this.switchExhibit = new SwitchExhibit();
        const switchMesh = this.switchExhibit.getMesh();
        switchMesh.position.set(s1X - 0.05, pHeight, 0.08);
        this.scene.add(switchMesh);

        const plugGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.05, 16);
        const plugMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
        this.plugMesh = new THREE.Mesh(plugGeo, plugMat);
        this.plugMesh.position.set(s1X - 0.82, pHeight + 0.22, -0.20);
        this.scene.add(this.plugMesh);

        const cablePoints = [
            new THREE.Vector3(s1X - 0.76, pHeight + 0.16, -0.18),
            new THREE.Vector3(s1X - 0.72, pHeight + 0.08, 0.02),
            new THREE.Vector3(s1X - 0.62, pHeight + 0.16, 0.18),
            new THREE.Vector3(s1X - 0.56, pHeight + 0.16, 0.24),
            new THREE.Vector3(s1X - 0.40, pHeight + 0.06, 0.20),
            new THREE.Vector3(s1X - 0.29, pHeight + 0.05, 0.18),
            new THREE.Vector3(s1X - 0.05, pHeight + 0.05, 0.18),
            new THREE.Vector3(s1X + 0.19, pHeight + 0.05, 0.18),
            new THREE.Vector3(s1X + 0.42, pHeight + 0.06, 0.18),
            new THREE.Vector3(s1X + 0.64, pHeight + 0.16, 0.12),
            new THREE.Vector3(s1X + 0.72, pHeight + 0.16, 0.18),
            new THREE.Vector3(s1X + 0.78, pHeight + 0.08, -0.04),
            new THREE.Vector3(s1X + 0.85, pHeight + 0.16, -0.18),
            new THREE.Vector3(s1X + 0.0, pHeight + 0.04, -0.42),
            new THREE.Vector3(s1X - 0.85, pHeight + 0.16, -0.22)
        ];
        this.cables = new EnergyCables(cablePoints);
        this.scene.add(this.cables.getMesh());

        // =========================================================================
        // SALA 02 (ESTE: X = +16, Z = 0): ALTA TENSIÓN & BOBINA DE TESLA
        // =========================================================================
        this.teslaCoil = new TeslaCoil();
        const teslaMesh = this.teslaCoil.getMesh();
        teslaMesh.position.set(16, pHeight, 0);
        this.scene.add(teslaMesh);

        // =========================================================================
        // SALA 03 (NORTE: X = 0, Z = -15): ENERGÍA EÓLICA & DÍNAMO FARADAY
        // =========================================================================
        this.windTurbine = new WindTurbineExhibit();
        const windMesh = this.windTurbine.getMesh();
        windMesh.position.set(0, pHeight, -15);
        this.scene.add(windMesh);

        // =========================================================================
        // SALA 04 (NORESTE: X = 12, Z = -12): ENERGÍA SOLAR FOTOVOLTAICA
        // =========================================================================
        this.solarPanel = new SolarPanelExhibit();
        const solarMesh = this.solarPanel.getMesh();
        solarMesh.position.set(12, pHeight, -12);
        this.scene.add(solarMesh);

        // =========================================================================
        // SALA 05 (NOROESTE: X = -12, Z = -12): GENERADOR ELECTROSTÁTICO VAN DE GRAAFF
        // =========================================================================
        this.vanDeGraaff = new VanDeGraaffExhibit();
        const vanDeGraaffMesh = this.vanDeGraaff.getMesh();
        vanDeGraaffMesh.position.set(-12, pHeight, -12);
        this.scene.add(vanDeGraaffMesh);

        // =========================================================================
        // SALA 06 (SUR: X = 0, Z = 14): ENERGÍA MECÁNICA & CUNA DE NEWTON
        // =========================================================================
        this.cradle = new NewtonsCradle();
        const cradleMesh = this.cradle.getMesh();
        cradleMesh.position.set(0, pHeight, 14);
        cradleMesh.scale.set(0.18, 0.18, 0.18);
        this.scene.add(cradleMesh);

        // =========================================================================
        // SALA 07 (SURESTE: X = 12, Z = 10): DÍNAMO MANUAL CON MANIVELA
        // =========================================================================
        this.dynamoExhibit = new DynamoExhibit();
        const dynamoMesh = this.dynamoExhibit.getMesh();
        dynamoMesh.position.set(12, pHeight, 10);
        this.scene.add(dynamoMesh);

        // =========================================================================
        // GALERÍA HISTÓRICA (SUR PROFUNDO: X = 0, Z = 24): PRISMA ÓPTICO
        // =========================================================================
        this.optics = new OpticsExhibit();
        const opticsMesh = this.optics.getMesh();
        opticsMesh.position.set(0, pHeight, 24);
        opticsMesh.scale.set(1.0, 1.0, 1.0);
        this.scene.add(opticsMesh);

        // 8. Robot Guía Mel-Bot en el Atrio Central
        this.robotGuide = new RobotGuide();
        const robotMesh = this.robotGuide.getMesh();
        robotMesh.position.set(1.5, 1.4, 2.0);
        this.scene.add(robotMesh);

        // 9. Orbes de Energía Temáticos
        this.orbsManager = new QuantumOrbsManager(this.scene, this.hud);

        // 10. Configurar interactables, pedagogía y cuestionarios
        this.setupInteractivity();
    }

    private setupInteractivity() {
        const sfx = SoundSynthesizer.getInstance();

        // -------------------------------------------------------------
        // ESTACIÓN 01: PILA DE PAPA (SALA 1)
        // -------------------------------------------------------------
        const quizPapa: QuizData = {
            id: 1,
            title: "Sala 01: Pila de Papa",
            question: "¿Cómo logran dos simples papas encender la lamparita del circuito?",
            options: [
                "Porque las papas absorben calor del aire y sacan vapor.",
                "Porque el jugo ácido hace correr a los electrones entre el zinc y el cobre por el cable.",
                "Porque las papas tienen pilitas de litio escondidas adentro."
            ],
            correctIndex: 1,
            explanation: "¡Exacto! El jugo natural de la papa ayuda a que los electrones salten de un metal al otro a través del cable, creando una corriente eléctrica de verdad."
        };

        const papaInteractable: Omit<Interactable, 'object'> = {
            id: 1,
            title: "Sala 01: Pila de Papa",
            tag: "🔋 ENERGÍA QUÍMICA A ELÉCTRICA",
            description: "¡El jugo ácido de las papas despierta a los electrones! El jugo hace que viajen del clavo de zinc al clavo de cobre como chicos corriendo al recreo, sumando casi 2 Voltios para encender la luz verde.",
            badge: "🏅 +100 XP · Medalla Química",
            getModeText: () => {
                const isOn = this.switchExhibit.getState() && this.isPlugged;
                return isOn ? "ESTADO: CIRCUITO CERRADO (~1.94V LED ENCENDIDO)" : "ESTADO: CIRCUITO ABIERTO (APAGADO)";
            },
            quiz: quizPapa,
            onInteract: () => {
                const newState = this.switchExhibit.toggle();
                const isOn = newState && this.isPlugged;
                sfx.playSwitchClick(isOn);
                const modeText = isOn ? "ESTADO: CIRCUITO CERRADO (~1.94V LED ENCENDIDO)" : "ESTADO: CIRCUITO ABIERTO (APAGADO)";
                this.hud.setCardModePill(modeText);
            },
            onChallenge: () => {
                if (!this.hud.isMissionCompleted(1)) {
                    this.hud.openQuiz(quizPapa, (success) => {
                        if (success) this.hud.completeMission(1);
                    });
                } else {
                    this.hud.showAchievementToast('Pila de Papa: ¡Completado!', 'Ya obtuviste la medalla de esta sala. Podés seguir probando el circuito.');
                }
            }
        };

        this.switchExhibit.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...papaInteractable });
        });
        [this.potato1, this.potato2, this.potato3, this.potato4].forEach(p => {
            p.getMesh().traverse((child) => {
                if (child instanceof THREE.Mesh) this.interactables.push({ object: child, ...papaInteractable });
            });
        });

        // -------------------------------------------------------------
        // ESTACIÓN 02: BOBINA DE TESLA (SALA 2)
        // -------------------------------------------------------------
        const quizTesla: QuizData = {
            id: 2,
            title: "Sala 02: Bobina de Tesla",
            question: "¿Por qué el tubo fluorescente se enciende flotando en el aire cerca de la Bobina sin cables ni pilas?",
            options: [
                "Porque la bobina envía ondas invisibles de energía que hacen brillar al gas del tubo.",
                "Porque el vidrio tiene pequeñas baterías invisibles que se calientan.",
                "Porque el sonido del trueno empuja luz adentro del tubo."
            ],
            correctIndex: 0,
            explanation: "¡Fabuloso! Nikola Tesla demostró la transmisión inalámbrica: ondas invisibles viajan por el aire y despiertan el gas dentro del tubo para que brille."
        };

        const teslaInteractable: Omit<Interactable, 'object'> = {
            id: 2,
            title: "Sala 02: Bobina de Tesla",
            tag: "⚡ ALTA TENSIÓN Y ENERGÍA SIN CABLES",
            description: "Nikola Tesla descubrió cómo enviar energía sin ningún cable. La bobina crea ondas invisibles en el aire que despiertan el gas dentro del tubo fluorescente haciéndolo brillar flotando en el aire.",
            badge: "🏅 +100 XP · Medalla de Tesla",
            getModeText: () => `MODO: ${this.teslaCoil.getCurrentModeInfo().name.toUpperCase()}`,
            quiz: quizTesla,
            onInteract: () => {
                const newMode = this.teslaCoil.cycleMode();
                sfx.playTeslaZap(newMode.id === 0 ? 0.6 : newMode.id === 1 ? 1.0 : 0.8);
                this.hud.setCardModePill(`MODO: ${newMode.name.toUpperCase()}`);
            },
            onChallenge: () => {
                if (!this.hud.isMissionCompleted(2)) {
                    this.hud.openQuiz(quizTesla, (success) => {
                        if (success) this.hud.completeMission(2);
                    });
                } else {
                    this.hud.showAchievementToast('Bobina de Tesla: ¡Completado!', 'Ya dominás la transmisión de energía inalámbrica.');
                }
            }
        };

        this.teslaCoil.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...teslaInteractable });
        });

        // -------------------------------------------------------------
        // ESTACIÓN 03: AEROGENERADOR FARADAY & MINI CIUDAD (SALA 3)
        // -------------------------------------------------------------
        const quizWind: QuizData = {
            id: 3,
            title: "Sala 03: Aerogenerador Faraday",
            question: "¿Cómo transforma el molino la fuerza del viento en luz para iluminar la ciudad?",
            options: [
                "El viento hace girar imanes dentro de bobinas de cobre, empujando electricidad limpia a las casas.",
                "Las aspas atrapan nubes de tormenta y las exprimen sobre los edificios.",
                "El viento enfría los cables y el frío se convierte en luz líquida."
            ],
            correctIndex: 0,
            explanation: "¡Brillante! El movimiento del viento hace rotar imanes de fuerza, y esos imanes empujan a los electrones por los cables para iluminar las casitas."
        };

        const windInteractable: Omit<Interactable, 'object'> = {
            id: 3,
            title: "Sala 03: Aerogenerador & Mini Ciudad",
            tag: "🌪️ ENERGÍA DEL VIENTO A LUZ (EÓLICA)",
            description: "¡El viento hace girar aspas gigantes y mueve imanes dentro de bobinas de alambre de cobre! Ese baile de imanes empuja a millones de electrones por los cables para iluminar toda la maqueta de la ciudad.",
            badge: "🏅 +100 XP · Medalla Eólica",
            getModeText: () => `POTENCIA: ${this.windTurbine.getCurrentModeInfo().name.toUpperCase()}`,
            quiz: quizWind,
            onInteract: () => {
                const newMode = this.windTurbine.cycleMode();
                sfx.playWindTurbine(newMode.windSpeed / 8.0);
                this.hud.setCardModePill(`POTENCIA: ${newMode.name.toUpperCase()}`);
            },
            onChallenge: () => {
                if (!this.hud.isMissionCompleted(3)) {
                    this.hud.openQuiz(quizWind, (success) => {
                        if (success) this.hud.completeMission(3);
                    });
                } else {
                    this.hud.showAchievementToast('Energía Eólica: ¡Completado!', 'Ya conocés cómo se genera la energía limpia del viento.');
                }
            }
        };

        this.windTurbine.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...windInteractable });
        });

        // -------------------------------------------------------------
        // ESTACIÓN 04: PANEL SOLAR FOTOVOLTAICO & MOTOR (SALA 4)
        // -------------------------------------------------------------
        const quizSolar: QuizData = {
            id: 4,
            title: "Sala 04: Panel Solar Fotovoltaico",
            question: "¿Qué le hace la luz del foco al panel solar para que gire la hélice del avioncito?",
            options: [
                "El panel absorbe agua del aire y la evapora a presión.",
                "Los fotones de luz chocan contra el silicio y empujan a los electrones hacia el motor.",
                "El panel se calienta y el humo caliente empuja la hélice."
            ],
            correctIndex: 1,
            explanation: "¡Excelente! Los paquetitos de luz (fotones) chocan contra el silicio azul y ponen en movimiento a los electrones, generando electricidad directa."
        };

        const solarInteractable: Omit<Interactable, 'object'> = {
            id: 4,
            title: "Sala 04: Panel Solar Fotovoltaico",
            tag: "☀️ DE LUZ SOLAR A MOVIMIENTO (SOLAR)",
            description: "¡La luz del sol viaja en paquetitos diminutos llamados fotones! Cuando chocan contra la placa azul de silicio, golpean a los electrones como pelotitas de pool y los hacen correr hacia el motor para girar la hélice del avión.",
            badge: "🏅 +100 XP · Medalla Solar",
            getModeText: () => `INCIDENCIA: ${this.solarPanel.getCurrentModeInfo().name.toUpperCase()}`,
            quiz: quizSolar,
            onInteract: () => {
                const newMode = this.solarPanel.cycleMode();
                sfx.playSolarPhotons(newMode.efficiency);
                this.hud.setCardModePill(`INCIDENCIA: ${newMode.name.toUpperCase()}`);
            },
            onChallenge: () => {
                if (!this.hud.isMissionCompleted(4)) {
                    this.hud.openQuiz(quizSolar, (success) => {
                        if (success) this.hud.completeMission(4);
                    });
                } else {
                    this.hud.showAchievementToast('Energía Solar: ¡Completado!', 'Ya dominás la conversión de fotones en movimiento.');
                }
            }
        };

        this.solarPanel.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...solarInteractable });
        });

        // -------------------------------------------------------------
        // ESTACIÓN 05: GENERADOR ELECTROSTÁTICO VAN DE GRAAFF (SALA 5)
        // -------------------------------------------------------------
        const quizVanDeGraaff: QuizData = {
            id: 5,
            title: "Sala 05: Generador Van de Graaff",
            question: "¿Por qué las tiras de colores levitan y flotan en el aire en la esfera plateada?",
            options: [
                "Porque la esfera sopla aire comprimido por agujeros invisibles.",
                "Porque todas las tiras se llenan de la misma carga eléctrica (+) y las cargas iguales se repelen con fuerza.",
                "Porque el aluminio se vuelve un imán atraído por el techo del museo."
            ],
            correctIndex: 1,
            explanation: "¡Exacto! Cargas eléctricas iguales se rechazan con fuerza. Como la esfera y las tiras tienen la misma carga, ¡se empujan entre sí y flotan en el aire!"
        };

        const vanDeGraaffInteractable: Omit<Interactable, 'object'> = {
            id: 5,
            title: "Sala 05: Generador de Van de Graaff",
            tag: "⚡ ELECTRICIDAD ESTÁTICA Y FRICCIÓN",
            description: "¡Como cuando frotás un globo en tu buzo de lana y se te paran los pelos! La cinta junta tanta carga igual en la esfera plateada que las tiras se rechazan entre sí y flotan en el aire desafiando la gravedad.",
            badge: "🏅 +100 XP · Medalla Estática",
            getModeText: () => `ESTADO: ${this.vanDeGraaff.getCurrentModeInfo().name.toUpperCase()}`,
            quiz: quizVanDeGraaff,
            onInteract: () => {
                const newMode = this.vanDeGraaff.cycleMode();
                if (newMode.id === 1) {
                    sfx.playElectrostaticSpark();
                } else {
                    sfx.playTeslaZap(0.5);
                }
                this.hud.setCardModePill(`ESTADO: ${newMode.name.toUpperCase()}`);
            },
            onChallenge: () => {
                if (!this.hud.isMissionCompleted(5)) {
                    this.hud.openQuiz(quizVanDeGraaff, (success) => {
                        if (success) this.hud.completeMission(5);
                    });
                } else {
                    this.hud.showAchievementToast('Van de Graaff: ¡Completado!', 'Ya entendés cómo funciona la repulsión electrostática.');
                }
            }
        };

        this.vanDeGraaff.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...vanDeGraaffInteractable });
        });

        // -------------------------------------------------------------
        // ESTACIÓN 06: CUNA DE NEWTON (SALA 6)
        // -------------------------------------------------------------
        const quizNewton: QuizData = {
            id: 6,
            title: "Sala 06: Cuna de Newton",
            question: "Al soltar 2 bolas de acero, ¿por qué salen despedidas 2 bolas del otro lado y no 1 sola a doble velocidad?",
            options: [
                "Porque las bolas del medio tienen resortes que cuentan los golpes.",
                "Porque la energía y la cantidad de movimiento viajan exactas de un extremo al otro sin perderse.",
                "Porque el acero solo entiende números pares de rebote."
            ],
            correctIndex: 1,
            explanation: "¡Magistral! La física demuestra que tanto la masa como la velocidad del golpe deben salir iguales del otro lado en el choque."
        };

        const newtonInteractable: Omit<Interactable, 'object'> = {
            id: 6,
            title: "Sala 06: Cuna de Newton",
            tag: "⚖️ LA ENERGÍA VIAJA COMO UNA OLA",
            description: "¡La energía nunca desaparece, solo viaja! Si levantás y soltás 2 bolas de acero, el golpe viaja como una ola invisible atravesando a las bolas del medio sin moverlas, y hace saltar exactamente a 2 bolas del otro lado.",
            badge: "🏅 +100 XP · Medalla de Choques",
            getModeText: () => `MODO: ${this.cradle.getCurrentModeInfo().name.toUpperCase()}`,
            quiz: quizNewton,
            onInteract: () => {
                const newMode = this.cradle.cycleMode();
                sfx.playNewtonClack(1.0);
                this.hud.setCardModePill(`MODO: ${newMode.name.toUpperCase()}`);
            },
            onChallenge: () => {
                if (!this.hud.isMissionCompleted(6)) {
                    this.hud.openQuiz(quizNewton, (success) => {
                        if (success) this.hud.completeMission(6);
                    });
                } else {
                    this.hud.showAchievementToast('Cuna de Newton: ¡Completado!', 'Ya comprendés el principio de conservación de energía.');
                }
            }
        };

        this.cradle.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...newtonInteractable });
        });

        // -------------------------------------------------------------
        // ESTACIÓN 07: DÍNAMO MANUAL CON MANIVELA (SALA 7)
        // -------------------------------------------------------------
        const quizDynamo: QuizData = {
            id: 7,
            title: "Sala 07: Dínamo Manual con Manivela",
            question: "Cuando girás la manivela con tus brazos, ¿cómo se convierte tu energía física en luz en la bombilla?",
            options: [
                "Los engranajes frotan cables calientes y salen chispas.",
                "Tu movimiento hace girar bobinas entre imanes, generando electricidad que calienta el filamento hasta brillar.",
                "La manivela sopla aire frío dentro del vidrio de la bombilla."
            ],
            correctIndex: 1,
            explanation: "¡Excelente! Tu trabajo muscular hace girar bobinas de cobre entre imanes, creando corriente eléctrica. Esa corriente calienta el filamento a más de 2000°C hasta que resplandece."
        };

        const dynamoInteractable: Omit<Interactable, 'object'> = {
            id: 7,
            title: "Sala 07: Dínamo Manual con Manivela",
            tag: "⚙️ FUERZA MUSCULAR A LUZ EN LA BOMBILLA",
            description: "¡Convertí tu propia fuerza física en luz! Al girar la manivela, los engranajes multiplican 5 veces tu velocidad haciendo girar bobinas entre imanes. ¡Esa corriente calienta el filamento de tungsteno hasta brillar con luz dorada!",
            badge: "🏅 +100 XP · Medalla del Dínamo",
            getModeText: () => `POTENCIA: ${this.dynamoExhibit.getCurrentModeInfo().name.toUpperCase()}`,
            quiz: quizDynamo,
            onInteract: () => {
                const newMode = this.dynamoExhibit.crankKick();
                sfx.playDynamoCrank(newMode.voltage / 24.0);
                this.hud.setCardModePill(`POTENCIA: ${newMode.name.toUpperCase()}`);
            },
            onChallenge: () => {
                if (!this.hud.isMissionCompleted(7)) {
                    this.hud.openQuiz(quizDynamo, (success) => {
                        if (success) this.hud.completeMission(7);
                    });
                } else {
                    this.hud.showAchievementToast('Dínamo Manual: ¡Completado!', 'Ya dominás la conversión de energía humana en luz.', '⚙️');
                }
            }
        };

        this.dynamoExhibit.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...dynamoInteractable });
        });

        // -------------------------------------------------------------
        // EXHIBICIÓN ESPECIAL: PRISMA ÓPTICO (GALERÍA CONMEMORATIVA)
        // -------------------------------------------------------------
        const opticsQuiz: QuizData = {
            id: 8,
            title: "Galería Especial: Prisma Óptico",
            question: "¿Por qué el cristal triangular separa la luz blanca en todos los colores del arcoíris?",
            options: [
                "Porque el cristal tiene tintas de acuarela transparentes adentro.",
                "Porque la luz blanca tiene todos los colores mezclados y cada color viaja a velocidad diferente dentro del vidrio.",
                "Porque el láser se apaga con el frío del vidrio."
            ],
            correctIndex: 1,
            explanation: "¡Exacto! La luz blanca es una mezcla de todos los colores. El vidrio frena a cada color a una velocidad distinta, abriendo el abanico del arcoíris."
        };

        const opticsInteractable: Omit<Interactable, 'object'> = {
            id: 8,
            title: "Galería Especial: Prisma Óptico",
            tag: "🌈 EL SECRETO DEL ARCOÍRIS",
            description: "Isaac Newton descubrió en 1666 que la luz blanca contiene mezclados todos los colores del arcoíris. ¡Al entrar al cristal triangular, cada color se separa y crea el arcoíris en la pantalla!",
            badge: "💎 Exhibición de Muestra e Historia",
            getModeText: () => `LÁSER: ${this.optics.getCurrentModeInfo().name.toUpperCase()}`,
            quiz: opticsQuiz,
            onInteract: () => {
                const newMode = this.optics.cycleMode();
                sfx.playLaserCycle(newMode.id);
                this.hud.setCardModePill(`LÁSER: ${newMode.name.toUpperCase()}`);
            },
            onChallenge: () => {
                this.hud.showAchievementToast('Muestra de Óptica', 'Esta exhibición es un homenaje a la física de la luz y calibración visual.', '🌈');
            }
        };

        this.optics.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...opticsInteractable });
        });

        // -------------------------------------------------------------
        // ROBOT GUÍA MEL-BOT (ATRIO CENTRAL - ID: 99)
        // -------------------------------------------------------------
        const museumRooms = [
            { id: 1, name: "Sala 01: Pila de Papa", center: new THREE.Vector3(-15, 0, 0), pedestalPos: new THREE.Vector3(-13.5, 1.75, 1.2) },
            { id: 2, name: "Sala 02: Bobina de Tesla", center: new THREE.Vector3(16, 0, 0), pedestalPos: new THREE.Vector3(14.2, 1.75, 1.2) },
            { id: 3, name: "Sala 03: Aerogenerador", center: new THREE.Vector3(0, 0, -15), pedestalPos: new THREE.Vector3(-1.2, 1.75, -13.2) },
            { id: 4, name: "Sala 04: Panel Solar", center: new THREE.Vector3(12, 0, -12), pedestalPos: new THREE.Vector3(10.5, 1.75, -10.5) },
            { id: 5, name: "Sala 05: Generador Van de Graaff", center: new THREE.Vector3(-12, 0, -12), pedestalPos: new THREE.Vector3(-10.5, 1.75, -10.5) },
            { id: 6, name: "Sala 06: Cuna de Newton", center: new THREE.Vector3(0, 0, 14), pedestalPos: new THREE.Vector3(1.2, 1.75, 12.5) },
            { id: 7, name: "Sala 07: Dínamo Manual", center: new THREE.Vector3(12, 0, 10), pedestalPos: new THREE.Vector3(10.5, 1.75, 8.5) },
            { id: 8, name: "Galería Óptica (Conmemorativa)", center: new THREE.Vector3(0, 0, 24), pedestalPos: new THREE.Vector3(0, 1.75, 22.0) }
        ];

        const getCurrentPlayerRoom = (pos: THREE.Vector3) => {
            for (let i = 0; i < museumRooms.length; i++) {
                const r = museumRooms[i];
                const dx = pos.x - r.center.x;
                const dz = pos.z - r.center.z;
                if (dx * dx + dz * dz < 60.0) { // Radio de sala cerrada
                    return r;
                }
            }
            return null;
        };

        const getNextIncompleteRoom = (excludeId?: number) => {
            for (let i = 0; i < 7; i++) {
                const r = museumRooms[i];
                if (r.id !== excludeId && !this.hud.isMissionCompleted(r.id)) {
                    return r;
                }
            }
            return museumRooms[7]; // Si todas están hechas, sugerir Galería Óptica
        };

        const robotInteractable: Omit<Interactable, 'object'> = {
            id: 99,
            title: "Mel-Bot: Asistente Robótico",
            tag: "🤖 GUÍA INTERACTIVA DEL MUSEO",
            description: "¡Hola Científico! Soy Mel-Bot, tu asistente de expedición. Te acompaño volando a las 7 salas temáticas y respondo tus dudas sobre los experimentos.",
            badge: "ℹ️ Asistente de Expedición",
            getModeText: () => this.robotGuide.isGuiding() ? "ESTADO: GUIANDO A SALA 🚀" : "ESTADO: LISTO PARA GUIAR",
            quiz: {
                id: 99,
                title: "Guía del Museo",
                question: "¿Estás listo para completar la gran expedición científica?",
                options: ["¡Sí, vamos a explorar las salas!", "Necesito investigar más"],
                correctIndex: 0,
                explanation: "¡Excelente! Seguí a Mel-Bot hacia cada sala temática."
            },
            onInteract: () => {
                const currentRoom = getCurrentPlayerRoom(this.lastPlayerPos);
                const nextRoom = getNextIncompleteRoom(currentRoom ? currentRoom.id : undefined);
                const isAllCompleted = this.hud.getCompletedCount() >= 7;

                let speech: string;

                if (isAllCompleted) {
                    speech = `🎉 ¡FELICITACIONES, <b>${this.hud.getStudentName()}</b>! 🏆<br><br>¡Ya completaste las 7 salas temáticas y sos un <b>Gran Maestro de la Energía Universal</b>!<br><br>¿Querés que volemos juntos a la <b>Galería Óptica</b> a ver el prisma de Newton o preferís ver tu diploma en el Diario? 🌈`;
                } else if (currentRoom && !this.hud.isMissionCompleted(currentRoom.id)) {
                    speech = `¡Ya estamos acá en la <b>${currentRoom.name}</b>, <b>${this.hud.getStudentName()}</b>! 🔬<br><br>Tu misión en esta sala es interactuar con el experimento y luego presionar el botón 🏆 <b>[DESAFÍO CIENTÍFICO]</b> para responder la pregunta y ganar tu medalla.<br><br>¿Querés que te lleve directamente a la siguiente sala (<b>${nextRoom.name}</b>) o preferís resolver esta primero? 🚀`;
                } else if (currentRoom && this.hud.isMissionCompleted(currentRoom.id)) {
                    speech = `¡Genial, <b>${this.hud.getStudentName()}</b>! 🌟 Ya ganaste la medalla de la <b>${currentRoom.name}</b>.<br><br>¿Volamos juntos a tu próxima misión en la <b>${nextRoom.name}</b>? ¡Seguime de cerca mientras te abro paso! 🚀`;
                } else {
                    speech = `¡Hola, <b>${this.hud.getStudentName()}</b>! 🤖 Soy Mel-Bot, tu asistente científico de expedición.<br><br>¿Querés que te guíe volando a la <b>${nextRoom.name}</b> para continuar investigando? ¡Seguime volando! 🚀`;
                }

                this.hud.openMelDialog(
                    speech,
                    () => {
                        this.robotGuide.startGuiding(nextRoom.id, nextRoom.name, nextRoom.pedestalPos, true);
                        this.hud.showAchievementToast('¡Mel-Bot te Guía! 🚀', `Seguí a Mel-Bot volando hacia la ${nextRoom.name}`, '🤖');
                    },
                    () => {
                        this.hud.openJournal();
                    }
                );
            },
            onChallenge: () => {
                const currentRoom = getCurrentPlayerRoom(this.lastPlayerPos);
                const nextRoom = getNextIncompleteRoom(currentRoom ? currentRoom.id : undefined);
                this.robotGuide.startGuiding(nextRoom.id, nextRoom.name, nextRoom.pedestalPos, true);
                this.hud.showAchievementToast('¡SÍGUEME! 🚀', `¡Mel-Bot vuela guiándote a la ${nextRoom.name}!`, '🚀');
            }
        };

        this.robotGuide.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...robotInteractable });
        });
    }

    public update(delta: number, playerPos?: THREE.Vector3) {
        const time = performance.now() * 0.001;

        if (playerPos) {
            this.lastPlayerPos.copy(playerPos);
        }

        // Determinar sala activa más cercana para LOD de física y gestión de iluminación (Cero desperdicio)
        let activeRoomIdx: number | null = null;
        if (playerPos) {
            let minDistanceSq = Infinity;
            let closestIdx = -1;

            const roomCenters = [
                { x: -15, z: 0 },   // 0: Papa
                { x: 16, z: 0 },    // 1: Tesla
                { x: 0, z: -15 },   // 2: Eólica
                { x: 12, z: -12 },  // 3: Solar
                { x: -12, z: -12 }, // 4: Van de Graaff
                { x: 0, z: 14 },    // 5: Newton
                { x: 12, z: 10 },   // 6: Dínamo
                { x: 0, z: 24 }     // 7: Óptica
            ];

            for (let i = 0; i < roomCenters.length; i++) {
                const dx = playerPos.x - roomCenters[i].x;
                const dz = playerPos.z - roomCenters[i].z;
                const dSq = dx * dx + dz * dz;
                if (dSq < minDistanceSq) {
                    minDistanceSq = dSq;
                    closestIdx = i;
                }
            }

            // Si el jugador está a menos de 18 metros de la sala, esa sala está activa
            if (minDistanceSq < 324) { // 18m * 18m
                activeRoomIdx = closestIdx;
            }
        }

        // Iluminación inteligente: solo la sala activa tiene focos dinámicos encendidos (ahorro del 80% de GPU)
        if (this.room) {
            this.room.setActiveRoom(activeRoomIdx);
            this.room.update(time);
        }

        // SIMULACIÓN SELECTIVA (Active Room LOD): Solo 1 experimento se simula a la vez
        // Sala 0: Pila de Papa y Cables
        if (activeRoomIdx === 0) {
            this.switchExhibit.update(delta, this.isPlugged);
            const circuitActive = this.switchExhibit.getState() && this.isPlugged;
            this.cables.update(time, circuitActive);
        }

        // Sala 1: Bobina de Tesla
        if (this.teslaCoil && activeRoomIdx === 1) {
            const distTesla = playerPos ? playerPos.distanceTo(new THREE.Vector3(16, 1.2, 0)) : undefined;
            this.teslaCoil.update(time, distTesla);
        }

        // Sala 2: Aerogenerador Eólico
        if (this.windTurbine) {
            this.windTurbine.setSleep(activeRoomIdx !== 2);
            if (activeRoomIdx === 2) {
                this.windTurbine.update(time, delta);
            }
        }

        // Sala 3: Panel Solar Fotovoltaico
        if (this.solarPanel) {
            this.solarPanel.setSleep(activeRoomIdx !== 3);
            if (activeRoomIdx === 3) {
                this.solarPanel.update(time, delta);
            }
        }

        // Sala 4: Generador de Van de Graaff
        if (this.vanDeGraaff && activeRoomIdx === 4) {
            this.vanDeGraaff.update(time, delta);
        }

        // Sala 5: Cuna de Newton
        if (this.cradle && activeRoomIdx === 5) {
            const dist = playerPos ? playerPos.distanceTo(new THREE.Vector3(0, 1.2, 14)) : undefined;
            this.cradle.update(time, dist);
        }

        // Sala 6: Dínamo Manual
        if (this.dynamoExhibit && activeRoomIdx === 6) {
            this.dynamoExhibit.update(time, delta);
        }

        // Sala 7: Galería Óptica
        if (this.optics && activeRoomIdx === 7) {
            this.optics.update(time);
        }

        // Mel-Bot y Orbes Coleccionables
        if (playerPos) {
            if (this.robotGuide) this.robotGuide.update(time, playerPos, delta);
            if (this.orbsManager) this.orbsManager.update(time, playerPos);
        }
    }

    public setStudentName(name: string): void {
        if (this.robotGuide) {
            this.robotGuide.setStudentName(name);
        }
    }

    public setIsMobile(isMobile: boolean): void {
        if (this.robotGuide) {
            this.robotGuide.setIsMobile(isMobile);
        }
    }

    public getInteractables(): Interactable[] {
        return this.interactables;
    }

    public getCollidables(): THREE.Mesh[] {
        return this.room ? this.room.getCollidables() : [];
    }

    public getWallBoxes(): WallBox[] {
        return this.room ? this.room.getInternalWallBoxes() : [];
    }
}
