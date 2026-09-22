import * as THREE from 'three';
import { PotatoBattery } from './models/Potato';
import { EnergyCables } from './models/Cables';
import { SwitchExhibit } from './models/SwitchAndLED';
import { MuseumRoom } from './models/Environment';
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
            title: "Energía Química y Redox",
            question: "¿Cómo logran dos simples papas encender la lamparita LED del circuito?",
            options: [
                "Porque las papas absorben calor y generan chispas de vapor caliente.",
                "Porque los metales (zinc y cobre) reaccionan con el jugo ácido liberando electrones que viajan por el cable.",
                "Porque las papas tienen microchips de silicio enterrados adentro."
            ],
            correctIndex: 1,
            explanation: "¡Exacto! El ácido fosfórico de la pulpa actúa como electrolito, provocando una reacción redox que empuja electrones del zinc hacia el cobre."
        };

        const papaInteractable: Omit<Interactable, 'object'> = {
            id: 1,
            title: "Sala 01: Pila de Papa",
            tag: "🔋 ENERGÍA QUÍMICA A ELÉCTRICA",
            description: "¡Dos metales distintos (cobre y zinc) sumergidos en el jugo de la papa reaccionan liberando electrones! Al conectar dos celdas en serie se obtienen ~1.94V, suficiente para encender el diodo LED verde.",
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
            title: "Electromagnetismo y Tesla",
            question: "¿Por qué el tubo fluorescente se enciende en el aire cerca de la Bobina sin cables ni pilas?",
            options: [
                "Porque la bobina genera un campo electromagnético de alta frecuencia que viaja por el aire e ioniza el gas del tubo.",
                "Porque el vidrio del tubo tiene pequeñas baterías invisibles que se calientan con el aire.",
                "Porque el sonido del relámpago empuja la luz hacia adentro del tubo."
            ],
            correctIndex: 0,
            explanation: "¡Fabuloso! Nikola Tesla demostró la transmisión inalámbrica: el campo electromagnético de alta tensión ioniza y excita los átomos de gas dentro del tubo haciéndolos brillar."
        };

        const teslaInteractable: Omit<Interactable, 'object'> = {
            id: 2,
            title: "Sala 02: Bobina de Tesla",
            tag: "⚡ ALTA TENSIÓN Y TRANSMISIÓN INALÁMBRICA",
            description: "Nikola Tesla descubrió que la electricidad puede viajar por el aire sin necesidad de cables. La bobina genera un campo electromagnético de alta frecuencia tan potente que enciende el tubo fluorescente a distancia y desata arcos de plasma.",
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
                    this.hud.showAchievementToast('Bobina de Tesla: ¡Completado!', 'Ya dominás el electromagnetismo resonante.');
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
            title: "Energía Eólica y Dinamo de Faraday",
            question: "¿Cómo transforma el aerogenerador la fuerza del viento en luz para la maqueta de la ciudad?",
            options: [
                "El viento empuja las aspas, las aspas hacen girar imanes dentro de bobinas de cobre y se induce corriente eléctrica.",
                "Las aspas atrapan nubes de tormenta y las exprimen sobre la ciudad.",
                "El viento enfría los cables y el frío se convierte en electricidad líquida."
            ],
            correctIndex: 0,
            explanation: "¡Brillante! Según la Ley de Inducción de Faraday, cuando un imán gira cerca de una bobina de cobre, los electrones se ponen en movimiento generando electricidad limpia."
        };

        const windInteractable: Omit<Interactable, 'object'> = {
            id: 3,
            title: "Sala 03: Aerogenerador & Mini Ciudad",
            tag: "🌪️ ENERGÍA CINÉTICA A ELÉCTRICA (EÓLICA)",
            description: "¡El viento mueve las aspas de perfil aerodinámico! La rotación hace girar imanes de neodimio dentro de bobinas de cobre en el dinamo transparente, generando voltaje que ilumina toda la maqueta de la ciudad.",
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
            title: "Energía Solar y Efecto Fotoeléctrico",
            question: "¿Qué ocurre dentro de las celdas de silicio del panel solar cuando la luz del foco incide sobre ellas?",
            options: [
                "El panel absorbe agua del aire y la evapora a presión.",
                "Los fotones de luz chocan contra los átomos de silicio y desprenden electrones, creando una corriente eléctrica que hace girar la hélice.",
                "El panel se calienta y el calor empuja las palas con vapor."
            ],
            correctIndex: 1,
            explanation: "¡Excelente! Es el Efecto Fotoeléctrico descubierto por Heinrich Hertz y explicado por Albert Einstein: la luz solar (fotones) arranca electrones del silicio generando electricidad directa."
        };

        const solarInteractable: Omit<Interactable, 'object'> = {
            id: 4,
            title: "Sala 04: Panel Solar Fotovoltaico",
            tag: "☀️ ENERGÍA LUMÍNICA A MECÁNICA (SOLAR)",
            description: "¡Los fotones de la luz golpean los átomos de silicio del panel solar desprendiendo electrones! Esta corriente continua alimenta directamente el motor eléctrico que hace girar la hélice de aviación a alta velocidad.",
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
            title: "Electricidad Estática y Fricción",
            question: "¿Por qué las tiras conductoras de la cúpula levitan en el aire cuando el generador está encendido?",
            options: [
                "Porque el generador sopla aire comprimido por pequeños agujeros invisibles.",
                "Porque la cúpula y las tiras se cargan con el mismo signo eléctrico (+), y las cargas iguales se repelen con fuerza desafiando la gravedad.",
                "Porque el aluminio se vuelve magnético y es atraído por el techo del museo."
            ],
            correctIndex: 1,
            explanation: "¡Exacto! Ley de Coulomb: cargas de igual polaridad se repelen mutuamente. Como la cúpula y las tiras comparten la misma carga eléctrica positiva, se rechazan y levitan."
        };

        const vanDeGraaffInteractable: Omit<Interactable, 'object'> = {
            id: 5,
            title: "Sala 05: Generador de Van de Graaff",
            tag: "⚡ ENERGÍA MECÁNICA A ELECTROSTÁTICA",
            description: "Una correa de caucho en movimiento transporta electrones por fricción mecánica hasta acumular más de 150.000 Voltios en la esfera de aluminio. ¡Las cargas del mismo signo se repelen haciendo levitar las cintas en el aire!",
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
            title: "Conservación de la Energía y Momento",
            question: "Al soltar 2 esferas de acero, ¿por qué salen despedidas exactamente 2 esferas del otro lado y no 1 sola a doble velocidad?",
            options: [
                "Porque las esferas centrales tienen resortes que cuentan cuántas bolas cayeron.",
                "Porque deben conservarse al mismo tiempo la energía cinética (½·m·v²) y la cantidad de movimiento (m·v).",
                "Porque el acero solo puede recordar números pares de golpes."
            ],
            correctIndex: 1,
            explanation: "¡Magistral! La física exige que tanto la masa en movimiento como la energía cinética total se conserven exactamente en un choque elástico perfecto."
        };

        const newtonInteractable: Omit<Interactable, 'object'> = {
            id: 6,
            title: "Sala 06: Cuna de Newton",
            tag: "⚖️ ENERGÍA CINÉTICA Y CONSERVACIÓN",
            description: "¡La energía no se crea ni se destruye! En choques perfectamente elásticos entre esferas de acero templado, la velocidad y la energía cinética viajan como ondas invisibles a través de las bolas intermedias sin moverlas.",
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
            title: "Inducción Electromagnética y Efecto Joule",
            question: "Cuando hacés girar la manivela con la fuerza de tus brazos, ¿cómo se convierte tu energía física en luz en la bombilla?",
            options: [
                "Los engranajes frotan cables calientes y el calor sale en forma de chispas por el vidrio.",
                "Tu trabajo muscular hace girar bobinas de cobre entre imanes permanentes, induciendo una corriente de electrones que calienta el filamento de tungsteno hasta encenderlo.",
                "La manivela absorbe aire frío y lo sopla dentro de la bombilla para que brille."
            ],
            correctIndex: 1,
            explanation: "¡Excelente! Ley de Inducción de Faraday y Efecto Joule: la rotación mecánica mueve las bobinas en el campo magnético generando voltaje. La corriente de electrones choca contra los átomos de tungsteno, calentándolo a más de 2000°C hasta emitir luz blanca incandescente."
        };

        const dynamoInteractable: Omit<Interactable, 'object'> = {
            id: 7,
            title: "Sala 07: Dínamo Manual con Manivela",
            tag: "⚙️ TRABAJO MUSCULAR A LUZ INCANDESCENTE",
            description: "¡Convertí tu propia energía en electricidad! Al girar la manivela, los engranajes transparentes multiplican la velocidad a 5x, haciendo girar el rotor de cobre entre imanes permanentes. El voltímetro mide la tensión generada y enciende la lámpara vintage Edison.",
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
            title: "Exhibición de Óptica: Descomposición Espectral",
            question: "¿Por qué el cristal triangular separa la luz blanca en todos los colores del arcoíris?",
            options: [
                "Porque el cristal tiene acuarelas transparentes adentro.",
                "Porque la luz blanca está compuesta por todas las frecuencias visibles y cada una viaja a velocidad diferente dentro del vidrio.",
                "Porque el láser se apaga con el frío del vidrio."
            ],
            correctIndex: 1,
            explanation: "¡Exacto! Refracción y dispersión cromática: el cristal frena más a las frecuencias altas (violeta) que a las bajas (rojo), abriendo el abanico espectral."
        };

        const opticsInteractable: Omit<Interactable, 'object'> = {
            id: 8,
            title: "Galería Especial: Prisma Óptico",
            tag: "🌈 MUESTRA DE CALIBRACIÓN LUMÍNICA",
            description: "Exhibición técnica y de referencia conmemorativa. Isaac Newton demostró en 1666 que la luz blanca contiene todas las longitudes de onda del espectro visible. ¡Probá la luz blanca y los láseres monocromáticos!",
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
        // ROBOT GUÍA MEL-BOT (ATRIO CENTRAL)
        // -------------------------------------------------------------
        const robotInteractable: Omit<Interactable, 'object'> = {
            id: 0,
            title: "Mel-Bot: Asistente Robótico",
            tag: "🤖 GUÍA DEL MUSEO",
            description: "¡Hola Científico! Soy Mel-Bot, tu asistente en el Museo de la Energía. Explorá las 7 salas temáticas, buscá los orbes ocultos y demostrá tu conocimiento respondiendo los desafíos.",
            badge: "ℹ️ Guía Interactiva",
            getModeText: () => "ESTADO: EN LÍNEA",
            quiz: {
                id: 0,
                title: "Guía del Museo",
                question: "¿Estás listo para completar la gran expedición científica?",
                options: ["¡Sí, vamos a explorar las salas!", "Necesito investigar más"],
                correctIndex: 0,
                explanation: "¡Excelente! Caminá por los pasillos hacia cada sala temática."
            },
            onInteract: () => {
                const tip = this.robotGuide.talk();
                this.hud.showAchievementToast('Consejo de Mel-Bot', tip, '🤖');
            },
            onChallenge: () => {
                const tip = this.robotGuide.talk();
                this.hud.showAchievementToast('Consejo de Mel-Bot', tip, '🤖');
            }
        };

        this.robotGuide.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...robotInteractable });
        });
    }

    public update(delta: number, playerPos?: THREE.Vector3) {
        const time = performance.now() * 0.001;

        // Actualizar halos flotantes y atmósfera de la sala
        if (this.room) {
            this.room.update(time);
        }

        // Actualizar circuito de papa
        this.switchExhibit.update(delta, this.isPlugged);
        const circuitActive = this.switchExhibit.getState() && this.isPlugged;
        this.cables.update(time, circuitActive);

        // Actualizar nuevos experimentos
        if (this.windTurbine) this.windTurbine.update(time, delta);
        if (this.solarPanel) this.solarPanel.update(time, delta);
        if (this.vanDeGraaff) this.vanDeGraaff.update(time, delta);
        if (this.dynamoExhibit) this.dynamoExhibit.update(time, delta);

        // Actualizar bobina de tesla con audio posicional
        if (this.teslaCoil) {
            const distTesla = playerPos ? playerPos.distanceTo(new THREE.Vector3(16, 1.2, 0)) : undefined;
            this.teslaCoil.update(time, distTesla);
        }

        // Actualizar cuna de newton con audio posicional
        if (this.cradle) {
            const dist = playerPos ? playerPos.distanceTo(new THREE.Vector3(0, 1.2, 14)) : undefined;
            this.cradle.update(time, dist);
        }

        // Actualizar óptica
        if (this.optics) this.optics.update(time);

        // Actualizar Mel-Bot y Orbes coleccionables con posición del jugador
        if (playerPos) {
            if (this.robotGuide) this.robotGuide.update(time, playerPos);
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
}
