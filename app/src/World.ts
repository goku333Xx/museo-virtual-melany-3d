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
    private teslaCoilPos = new THREE.Vector3(16, 1.2, 0);
    private cradlePos = new THREE.Vector3(0, 1.2, 14);

    private unlockedRooms: Set<number> = new Set([0]); // Room 0 (Sala 01) always unlocked
    private doorBarriers: THREE.Mesh[] = [];
    private lastDoorWarningIdx?: number;
    private currentRoomIdx: number | null = null;

    constructor(scene: THREE.Scene, hud: HUD) {
        this.scene = scene;
        this.hud = hud;
        this.init();
    }

    private initDoorBarriers(): void {
        if (this.room.getDoorBarriers) {
            this.doorBarriers = this.room.getDoorBarriers();
            this.updateDoorStates();
        }
    }

    private updateDoorStates(): void {
        const roomOrder = [0, 1, 2, 3, 4, 5, 6, 7]; // Sequential order
        for (let i = 0; i < this.doorBarriers.length; i++) {
            // Door is visible (blocked) if the room is NOT unlocked
            this.doorBarriers[i].visible = !this.unlockedRooms.has(roomOrder[i]);
        }
    }

    public getDoorBarriers(): THREE.Mesh[] {
        return this.doorBarriers;
    }

    private unlockNextRoom(completedMissionId: number): void {
        const completedIdx = completedMissionId - 1;
        if (completedIdx + 1 < 8) {
            this.unlockedRooms.add(completedIdx + 1);
            this.updateDoorStates();
        }
    }

    private init() {
        // 1. Habitación Arquitectónica con 6 Salas Temáticas y Atrio Central
        this.room = new MuseumRoom();
        this.scene.add(this.room.getMesh());
        this.initDoorBarriers();

        const pHeight = 1.2;

        // =========================================================================
        // SALA 01 (OESTE: X = -15, Z = 10): ENERGÍA QUÍMICA & PILA DE PAPA (~1.94V)
        // =========================================================================
        const s1X = -15;
        const s1Z = 10;
        this.potato1 = new PotatoBattery();
        const p1Mesh = this.potato1.getMesh();
        p1Mesh.position.set(s1X - 0.82, pHeight + 0.12, s1Z - 0.20);
        this.scene.add(p1Mesh);

        this.potato2 = new PotatoBattery();
        const p2Mesh = this.potato2.getMesh();
        p2Mesh.position.set(s1X - 0.62, pHeight + 0.12, s1Z + 0.22);
        this.scene.add(p2Mesh);

        this.potato3 = new PotatoBattery();
        const p3Mesh = this.potato3.getMesh();
        p3Mesh.position.set(s1X + 0.68, pHeight + 0.12, s1Z + 0.15);
        this.scene.add(p3Mesh);

        this.potato4 = new PotatoBattery();
        const p4Mesh = this.potato4.getMesh();
        p4Mesh.position.set(s1X + 0.85, pHeight + 0.12, s1Z - 0.22);
        this.scene.add(p4Mesh);

        this.switchExhibit = new SwitchExhibit();
        const switchMesh = this.switchExhibit.getMesh();
        switchMesh.position.set(s1X - 0.05, pHeight, s1Z + 0.08);
        this.scene.add(switchMesh);

        const plugGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.05, 16);
        const plugMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
        this.plugMesh = new THREE.Mesh(plugGeo, plugMat);
        this.plugMesh.position.set(s1X - 0.82, pHeight + 0.22, s1Z - 0.20);
        this.scene.add(this.plugMesh);

        const cablePoints = [
            new THREE.Vector3(s1X - 0.76, pHeight + 0.16, s1Z - 0.18),
            new THREE.Vector3(s1X - 0.72, pHeight + 0.08, s1Z + 0.02),
            new THREE.Vector3(s1X - 0.62, pHeight + 0.16, s1Z + 0.18),
            new THREE.Vector3(s1X - 0.56, pHeight + 0.16, s1Z + 0.24),
            new THREE.Vector3(s1X - 0.40, pHeight + 0.06, s1Z + 0.20),
            new THREE.Vector3(s1X - 0.29, pHeight + 0.05, s1Z + 0.18),
            new THREE.Vector3(s1X - 0.05, pHeight + 0.05, s1Z + 0.18),
            new THREE.Vector3(s1X + 0.19, pHeight + 0.05, s1Z + 0.18),
            new THREE.Vector3(s1X + 0.42, pHeight + 0.06, s1Z + 0.18),
            new THREE.Vector3(s1X + 0.64, pHeight + 0.16, s1Z + 0.12),
            new THREE.Vector3(s1X + 0.72, pHeight + 0.16, s1Z + 0.18),
            new THREE.Vector3(s1X + 0.78, pHeight + 0.08, s1Z - 0.04),
            new THREE.Vector3(s1X + 0.85, pHeight + 0.16, s1Z - 0.18),
            new THREE.Vector3(s1X + 0.0, pHeight + 0.04, s1Z - 0.42),
            new THREE.Vector3(s1X - 0.85, pHeight + 0.16, s1Z - 0.22)
        ];
        this.cables = new EnergyCables(cablePoints);
        this.scene.add(this.cables.getMesh());

        // =========================================================================
        // SALA 02: ALTA TENSIÓN & BOBINA DE TESLA
        // =========================================================================
        this.teslaCoil = new TeslaCoil();
        const teslaMesh = this.teslaCoil.getMesh();
        teslaMesh.position.set(-15, pHeight, 0);
        this.scene.add(teslaMesh);

        // =========================================================================
        // SALA 03: ENERGÍA EÓLICA & DÍNAMO FARADAY
        // =========================================================================
        this.windTurbine = new WindTurbineExhibit();
        const windMesh = this.windTurbine.getMesh();
        windMesh.position.set(-15, pHeight, -10);
        this.scene.add(windMesh);

        // =========================================================================
        // SALA 04: ENERGÍA SOLAR FOTOVOLTAICA
        // =========================================================================
        this.solarPanel = new SolarPanelExhibit();
        const solarMesh = this.solarPanel.getMesh();
        solarMesh.position.set(-15, pHeight, -20);
        this.scene.add(solarMesh);

        // =========================================================================
        // SALA 05: GENERADOR ELECTROSTÁTICO VAN DE GRAAFF
        // =========================================================================
        this.vanDeGraaff = new VanDeGraaffExhibit();
        const vanDeGraaffMesh = this.vanDeGraaff.getMesh();
        vanDeGraaffMesh.position.set(15, pHeight, 10);
        this.scene.add(vanDeGraaffMesh);

        // =========================================================================
        // SALA 06: ENERGÍA MECÁNICA & CUNA DE NEWTON
        // =========================================================================
        this.cradle = new NewtonsCradle();
        const cradleMesh = this.cradle.getMesh();
        cradleMesh.position.set(15, pHeight, 0);
        cradleMesh.scale.set(0.18, 0.18, 0.18);
        this.scene.add(cradleMesh);

        // =========================================================================
        // SALA 07: DÍNAMO MANUAL CON MANIVELA
        // =========================================================================
        this.dynamoExhibit = new DynamoExhibit();
        const dynamoMesh = this.dynamoExhibit.getMesh();
        dynamoMesh.position.set(15, pHeight, -10);
        this.scene.add(dynamoMesh);

        // =========================================================================
        // GALERÍA HISTÓRICA: PRISMA ÓPTICO
        // =========================================================================
        this.optics = new OpticsExhibit();
        const opticsMesh = this.optics.getMesh();
        opticsMesh.position.set(0, pHeight, -35);
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
            question: "¿Cómo hacen un par de papas comunes para encender la luz?",
            options: [
                "Absorben calor del aire y sacan un humo mágico.",
                "El juguito de la papa empuja a los electrones por el cable, ¡como si corrieran un maratón!",
                "Tienen minipilas escondidas adentro, ¡re obvio!"
            ],
            correctIndex: 1,
            explanation: "¡Zarpado! El jugo ácido de la papa hace de puente para que los electrones corran de un clavo al otro, armando un circuito eléctrico re posta."
        };

        const papaInteractable: Omit<Interactable, 'object'> = {
            id: 1,
            title: "Sala 01: Pila de Papa",
            tag: "🔋 DE QUÍMICA A ELÉCTRICA",
            description: "¡El jugo ácido de las papas es el secreto! Despierta a los electrones y los empuja por el cable como si fuera la presión del agua en una manguera. Así viajan del clavo de zinc al de cobre y prenden la luz.",
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
                        if (success) {
                            this.hud.completeMission(1);
                            this.unlockNextRoom(1);
                        }
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
            question: "¿Por qué el tubo se prende flotando sin estar enchufado a nada?",
            options: [
                "La bobina tira ondas invisibles por el aire que hacen brillar al gas adentro del tubo.",
                "El vidrio tiene minipilas que se calientan y brillan.",
                "El ruido de los rayos asusta a la luz y la hace salir."
            ],
            correctIndex: 0,
            explanation: "¡Tremendo! La bobina dispara ondas invisibles de alta frecuencia que viajan por el aire y 'despiertan' a los electrones del gas adentro del tubo para armar alto show de luces. ¡Pura magia electromagnética!"
        };

        const teslaInteractable: Omit<Interactable, 'object'> = {
            id: 2,
            title: "Sala 02: Bobina de Tesla",
            tag: "⚡ ENERGÍA INALÁMBRICA",
            description: "¡Mirá cómo fluye la energía por el aire! Nikola Tesla inventó esta máquina para mandar electricidad sin cables. La bobina dispara ondas invisibles que hacen brillar al tubo fluorescente a la distancia. ¡Pura magia científica!",
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
                        if (success) {
                            this.hud.completeMission(2);
                            this.unlockNextRoom(2);
                        }
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
            title: "Sala 03: Aerogenerador",
            question: "¿Cómo hace el molino gigante para que las casitas tengan luz?",
            options: [
                "El viento empuja imanes gigantes que mueven electrones hacia la ciudad.",
                "Las aspas exprimen las nubes para sacarles electricidad.",
                "El viento empuja la luz del sol por los cables."
            ],
            correctIndex: 0,
            explanation: "¡Excelente! Al girar por el viento, adentro se mueven unos imanes enormes que empujan a los electrones por los cables, ¡como si fuera una bomba de agua pero llevando electricidad a toda la mini ciudad!"
        };

        const windInteractable: Omit<Interactable, 'object'> = {
            id: 3,
            title: "Sala 03: Aerogenerador & Mini Ciudad",
            tag: "🌪️ VIENTO A ELECTRICIDAD (EÓLICA)",
            description: "¡El viento mueve las aspas gigantes como si fueran un ventilador al revés! Adentro hay imanes enormes bailando cerca de unos cables de cobre. Ese movimiento bombea millones de electrones hacia la ciudad para encender todas las luces.",
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
                        if (success) {
                            this.hud.completeMission(3);
                            this.unlockNextRoom(3);
                        }
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
            question: "¿Qué hace la luz para que gire la hélice del avioncito?",
            options: [
                "Calienta el panel y el humo caliente empuja la hélice.",
                "Unos paquetitos de luz (fotones) chocan contra el panel y ponen a correr a los electrones.",
                "La luz empuja el viento hacia el panel solar."
            ],
            correctIndex: 1,
            explanation: "¡Genial! La luz está hecha de paquetitos de energía llamados fotones. Al chocar contra la placa de silicio, patean a los electrones y los ponen a correr por los cables para hacer girar el motor."
        };

        const solarInteractable: Omit<Interactable, 'object'> = {
            id: 4,
            title: "Sala 04: Panel Solar Fotovoltaico",
            tag: "☀️ LUZ SOLAR A ELECTRICIDAD",
            description: "¡La luz viaja en unos minipaquetitos llamados fotones! Cuando chocan contra la placa azul, empujan a los electrones como si los patearan. ¡Esos electrones corriendo por los cables hacen girar el motor del avión!",
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
                        if (success) {
                            this.hud.completeMission(4);
                            this.unlockNextRoom(4);
                        }
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
            question: "¿Por qué las cintas de colores se paran de punta y flotan en el aire?",
            options: [
                "La bocha de metal sopla viento desde adentro.",
                "Se llenan de la misma carga eléctrica y, como pasa con los imanes iguales, se rechazan.",
                "El aluminio es un material que odia la gravedad."
            ],
            correctIndex: 1,
            explanation: "¡Perfecto! Al juntar tantas cargas eléctricas iguales, las tiritas se repelen (o sea, ¡se rechazan fuerte entre ellas!) y terminan flotando por los aires. ¡Pura estática!"
        };

        const vanDeGraaffInteractable: Omit<Interactable, 'object'> = {
            id: 5,
            title: "Sala 05: Generador de Van de Graaff",
            tag: "⚡ ELECTRICIDAD ESTÁTICA",
            description: "¡Es como cuando frotás un globo en la ropa y se te paran los pelos! La bocha junta tanta carga de electricidad estática que las tiritas se rechazan unas a otras porque tienen la misma carga, ¡y terminan flotando como locas!",
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
                        if (success) {
                            this.hud.completeMission(5);
                            this.unlockNextRoom(5);
                        }
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
            question: "Al soltar 2 bolas de acero, ¿por qué del otro lado salen 2 y no 1 sola rapidísimo?",
            options: [
                "Porque las bolas del medio tienen resortes que cuentan los golpes.",
                "Porque la energía y el movimiento viajan exactos como una ola invisible de punta a punta.",
                "Porque el acero solo rebota en números pares."
            ],
            correctIndex: 1,
            explanation: "¡Muuuy bien! La energía no se pierde, se transforma y se pasa. El golpe viaja como un fantasma por adentro de las bolas del medio y sale justo con la misma fuerza del otro lado."
        };

        const newtonInteractable: Omit<Interactable, 'object'> = {
            id: 6,
            title: "Sala 06: Cuna de Newton",
            tag: "⚖️ ENERGÍA EN MOVIMIENTO",
            description: "¡La energía nunca desaparece, solo se pasa de mano en mano! Si soltás 2 bolas, el golpe viaja como un fantasma a través de las del medio sin moverlas y hace saltar justo a 2 del otro lado. ¡Magia de la física pura!",
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
                        if (success) {
                            this.hud.completeMission(6);
                            this.unlockNextRoom(6);
                        }
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
            question: "¿Cómo es que tu fuerza con la manivela termina siendo luz en el foquito?",
            options: [
                "Los engranajes frotan cables calientes hasta que hacen chispas.",
                "Tu movimiento gira imanes que empujan electrones, armando corriente que pone al foquito al rojo vivo.",
                "La manivela sopla viento adentro del vidrio de la lámpara."
            ],
            correctIndex: 1,
            explanation: "¡Re groso! Cuando girás la manivela, movés unas bobinas de cobre entre imanes gigantes. Ese baile bombea electrones sin parar, que calientan el alambrecito de la bombilla hasta que da luz."
        };

        const dynamoInteractable: Omit<Interactable, 'object'> = {
            id: 7,
            title: "Sala 07: Dínamo Manual con Manivela",
            tag: "⚙️ ENERGÍA MUSCULAR A LUZ",
            description: "¡Usá tus propios músculos para hacer luz! Al girar a toda máquina, unos engranajes hacen dar vueltas a un imán rapidísimo. Esto bombea electrones por el cable que calientan un alambrecito a 2000°C hasta que brilla zarpado.",
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
                        if (success) {
                            this.hud.completeMission(7);
                            this.unlockNextRoom(7);
                        }
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
            question: "¿Por qué un vidrio con forma de triángulo te saca un arcoíris de una luz blanca?",
            options: [
                "El vidrio tiene pintura de colores adentro.",
                "La luz blanca tiene todos los colores escondidos, y el prisma frena a cada uno a distinta velocidad.",
                "El láser cambia de color cuando se enfría en el vidrio."
            ],
            correctIndex: 1,
            explanation: "¡Sos un crack! La luz blanca es como una pizza de todos los colores. El prisma frena a cada color diferente, abriendo el abanico para formar el arcoíris."
        };

        const opticsInteractable: Omit<Interactable, 'object'> = {
            id: 8,
            title: "Galería Especial: Prisma Óptico",
            tag: "🌈 EL SECRETO DE LA LUZ",
            description: "Hace un montón, Isaac Newton descubrió que la luz blanca tiene todos los colores del arcoíris mezclados. ¡Al atravesar este prisma triangular, la luz se frena y cada color sale por su lado como un abanico re flashero!",
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
            { id: 1, name: "Sala 01: Pila de Papa", center: new THREE.Vector3(-15, 0, 10), pedestalPos: new THREE.Vector3(-13.5, 1.75, 10) },
            { id: 2, name: "Sala 02: Bobina de Tesla", center: new THREE.Vector3(-15, 0, 0), pedestalPos: new THREE.Vector3(-13.5, 1.75, 0) },
            { id: 3, name: "Sala 03: Aerogenerador", center: new THREE.Vector3(-15, 0, -10), pedestalPos: new THREE.Vector3(-13.5, 1.75, -10) },
            { id: 4, name: "Sala 04: Panel Solar", center: new THREE.Vector3(-15, 0, -20), pedestalPos: new THREE.Vector3(-13.5, 1.75, -20) },
            { id: 5, name: "Sala 05: Generador Van de Graaff", center: new THREE.Vector3(15, 0, 10), pedestalPos: new THREE.Vector3(13.5, 1.75, 10) },
            { id: 6, name: "Sala 06: Cuna de Newton", center: new THREE.Vector3(15, 0, 0), pedestalPos: new THREE.Vector3(13.5, 1.75, 0) },
            { id: 7, name: "Sala 07: Dínamo Manual", center: new THREE.Vector3(15, 0, -10), pedestalPos: new THREE.Vector3(13.5, 1.75, -10) },
            { id: 8, name: "Galería Óptica (Conmemorativa)", center: new THREE.Vector3(0, 0, -35), pedestalPos: new THREE.Vector3(0, 1.75, -33.0) }
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
            tag: "🤖 TU GUÍA CIENTÍFICA",
            description: "¡Buenas! Soy Mel-Bot, tu compañero robot de aventuras. Estoy acá para acompañarte por todo el museo y tirarte la posta sobre cómo funcionan todos estos inventos increíbles. ¡Vamos a explorar juntos!",
            badge: "ℹ️ Asistente de Expedición",
            getModeText: () => this.robotGuide.isGuiding() ? "ESTADO: GUIANDO A SALA 🚀" : "ESTADO: ESPERANDO ÓRDENES",
            quiz: {
                id: 99,
                title: "Guía del Museo",
                question: "¿Arrancamos a explorar las salas a pura ciencia?",
                options: ["¡De una, vamos!", "Bancá que quiero mirar más"],
                correctIndex: 0,
                explanation: "¡Esa es la actitud! Seguime y te muestro cada rincón del museo."
            },
            onInteract: () => {
                const currentRoom = getCurrentPlayerRoom(this.lastPlayerPos);
                const nextRoom = getNextIncompleteRoom(currentRoom ? currentRoom.id : undefined);
                const isAllCompleted = this.hud.getCompletedCount() >= 7;

                let speech: string;
                let btn1Label = '¡De una, vamos!';
                let btn2Label = 'Ver Mapa';
                let btn1Action = () => {
                    const isNextCompleted = this.hud.isMissionCompleted(nextRoom.id);
                    this.robotGuide.startGuiding(nextRoom.id, nextRoom.name, nextRoom.pedestalPos, isNextCompleted);
                    this.hud.showAchievementToast('¡Mel-Bot te Guía! 🚀', `Seguí a Mel-Bot a toda velocidad hacia la ${nextRoom.name}`, '🤖');
                };

                if (isAllCompleted) {
                    speech = `🎉 ¡FELICITACIONES, <b>${this.hud.getStudentName()}</b>! 🏆<br><br>¡Zarpado! Completaste las 7 salas y ya sos un <b>Gran Maestro de la Energía</b> oficial.<br><br>¿Te copás si vamos volando a la <b>Galería Óptica</b> para ver el prisma de Newton o preferís chusmear tu diploma en el Diario? 🌈`;
                    btn1Label = 'Ir a Óptica';
                } else if (currentRoom && !this.hud.isMissionCompleted(currentRoom.id)) {
                    speech = `¡Ojo al piojo, <b>${this.hud.getStudentName()}</b>! 🔬<br><br>Todavía te falta esta sala. Acordate de interactuar (con la tecla [E]) y después mandale click a 🏆 <b>[DESAFÍO CIENTÍFICO]</b> (tecla [R]) para responder la trivia y ganarte la medalla. ¡Vos podés!`;
                    btn1Label = '¡A seguir investigando!';
                    btn1Action = () => {
                        // solo cierra el diálogo
                    };
                } else if (currentRoom && this.hud.isMissionCompleted(currentRoom.id)) {
                    speech = `¡Esa sala ya la tenés re cocinada! ¡Genial! Vamos para la próxima.`;
                    btn1Label = `Guíame a la ${nextRoom.name}`;
                } else {
                    speech = `¡Holaaa! Soy Mel-BOT, tu compa robot en esta expedición. 🤖<br><br>¿Querés que vayamos volando a la <b>${nextRoom.name}</b> para seguir con la aventura? ¡Seguime el ritmo y no te me pierdas! 🚀`;
                    btn1Label = `Guíame a la ${nextRoom.name}`;
                }

                this.hud.openMelDialog(
                    speech,
                    btn1Action,
                    () => {
                        this.hud.openMapModal();
                    },
                    [btn1Label, btn2Label]
                );
            },
            onChallenge: () => {
                const currentRoom = getCurrentPlayerRoom(this.lastPlayerPos);
                // Si la sala actual no está completada, no permitir usar onChallenge para guiar a la siguiente
                if (currentRoom && !this.hud.isMissionCompleted(currentRoom.id)) {
                    this.hud.showAchievementToast('¡Pará un poco! 🛑', `Primero tenés que resolver la ${currentRoom.name}.`);
                    return;
                }
                const nextRoom = getNextIncompleteRoom(currentRoom ? currentRoom.id : undefined);
                const isNextCompleted = this.hud.isMissionCompleted(nextRoom.id);
                this.robotGuide.startGuiding(nextRoom.id, nextRoom.name, nextRoom.pedestalPos, isNextCompleted);
                this.hud.showAchievementToast('¡SEGUIME! 🚀', `¡Mel-Bot te lleva a la ${nextRoom.name} a toda velocidad!`, '🚀');
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
                { x: -15, z: 10 },   // 0: Papa
                { x: -15, z: 0 },    // 1: Tesla
                { x: -15, z: -10 },   // 2: Eólica
                { x: -15, z: -20 },  // 3: Solar
                { x: 15, z: 10 }, // 4: Van de Graaff
                { x: 15, z: 0 },    // 5: Newton
                { x: 15, z: -10 },   // 6: Dínamo
                { x: 0, z: -35 }     // 7: Óptica
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

            if (activeRoomIdx !== this.currentRoomIdx) {
                this.currentRoomIdx = activeRoomIdx;
            }

            // Check if player is near a locked door
            for (let i = 0; i < this.doorBarriers.length; i++) {
                if (this.doorBarriers[i].visible) { // Door is locked
                    const doorPos = this.doorBarriers[i].position;
                    const distToDoor = playerPos.distanceTo(doorPos);
                    if (distToDoor < 4.0) {
                        // Player is near a locked door! Mel-Bot warns them
                        const roomNames = [
                            'Pila de Papa', 'Bobina de Tesla', 'Aerogenerador',
                            'Panel Solar', 'Van de Graaff', 'Cuna de Newton',
                            'Dínamo Manual', 'Prisma Óptico'
                        ];
                        // Find which room they need to complete first
                        const requiredRoom = i > 0 ? i - 1 : 0;
                        if (!this.lastDoorWarningIdx || this.lastDoorWarningIdx !== i) {
                            this.lastDoorWarningIdx = i;
                            this.robotGuide.showDoorBlockedMessage(
                                roomNames[requiredRoom],
                                roomNames[i]
                            );
                        }
                        break;
                    }
                }
            }
            // Reset warning when player moves away from all doors
            let nearAnyDoor = false;
            for (const barrier of this.doorBarriers) {
                if (barrier.visible && playerPos.distanceTo(barrier.position) < 5.0) {
                    nearAnyDoor = true;
                    break;
                }
            }
            if (!nearAnyDoor) this.lastDoorWarningIdx = undefined;
        }

        // Iluminación inteligente: solo la sala activa tiene focos dinámicos encendidos (ahorro del 80% de GPU)
        if (this.room) {
            this.room.setActiveRoom(activeRoomIdx);
            this.room.update(time);
        }

        // Sala 0: Pila de Papa y Cables
        if (this.switchExhibit) {
            if (this.switchExhibit.setSleep) this.switchExhibit.setSleep(activeRoomIdx !== 0);
            if (this.cables && (this.cables as any).setSleep) (this.cables as any).setSleep(activeRoomIdx !== 0);
            if (this.potato1 && (this.potato1 as any).setSleep) {
                (this.potato1 as any).setSleep(activeRoomIdx !== 0);
                (this.potato2 as any).setSleep(activeRoomIdx !== 0);
                (this.potato3 as any).setSleep(activeRoomIdx !== 0);
                (this.potato4 as any).setSleep(activeRoomIdx !== 0);
            }
            if (activeRoomIdx === 0) {
                this.switchExhibit.update(delta, this.isPlugged);
                const circuitActive = this.switchExhibit.getState() && this.isPlugged;
                this.cables.update(time, circuitActive);
            }
        }

        // Sala 1: Bobina de Tesla
        if (this.teslaCoil) {
            this.teslaCoil.setSleep(activeRoomIdx !== 1);
            if (activeRoomIdx === 1) {
                const distTesla = playerPos ? playerPos.distanceTo(this.teslaCoilPos) : undefined;
                this.teslaCoil.update(time, distTesla);
            }
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
        if (this.vanDeGraaff) {
            this.vanDeGraaff.setSleep(activeRoomIdx !== 4);
            if (activeRoomIdx === 4) {
                this.vanDeGraaff.update(time, delta);
            }
        }

        // Sala 5: Cuna de Newton
        if (this.cradle) {
            this.cradle.setSleep(activeRoomIdx !== 5);
            if (activeRoomIdx === 5) {
                const dist = playerPos ? playerPos.distanceTo(this.cradlePos) : undefined;
                this.cradle.update(time, dist);
            }
        }

        // Sala 6: Dínamo Manual
        if (this.dynamoExhibit) {
            this.dynamoExhibit.setSleep(activeRoomIdx !== 6);
            if (activeRoomIdx === 6) {
                this.dynamoExhibit.update(time, delta);
            }
        }

        // Sala 7: Galería Óptica
        if (this.optics) {
            this.optics.setSleep(activeRoomIdx !== 7);
            if (activeRoomIdx === 7) {
                this.optics.update(time);
            }
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
