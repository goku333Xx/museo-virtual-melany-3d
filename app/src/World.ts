import * as THREE from 'three';
import { PotatoBattery } from './models/Potato';
import { EnergyCables } from './models/Cables';
import { SwitchExhibit } from './models/SwitchAndLED';
import { MuseumRoom } from './models/Environment';
import { OpticsExhibit } from './models/OpticsExhibit';
import { NewtonsCradle } from './models/NewtonsCradle';
import { TeslaCoil } from './models/TeslaCoil';
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
    
    // Modelos
    private room!: MuseumRoom;
    private potato1!: PotatoBattery;
    private potato2!: PotatoBattery;
    private potato3!: PotatoBattery;
    private potato4!: PotatoBattery;
    private cables!: EnergyCables;
    private switchExhibit!: SwitchExhibit;
    private optics!: OpticsExhibit;
    private cradle!: NewtonsCradle;
    private teslaCoil!: TeslaCoil;
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
        // 1. Habitación Principal Moderna (Pabellón Abierto al Cosmos)
        this.room = new MuseumRoom();
        this.scene.add(this.room.getMesh());

        const pHeight = 1.2;

        // 2. ESTACIÓN 01: CIRCUITO DE 4 PAPAS BATERÍA EN SERIE (~1.96V)
        // Lado Izquierdo: Papa 1 (Atrás) y Papa 2 (Adelante)
        this.potato1 = new PotatoBattery();
        const p1Mesh = this.potato1.getMesh();
        p1Mesh.position.set(-0.82, pHeight + 0.12, -0.20);
        this.scene.add(p1Mesh);

        this.potato2 = new PotatoBattery();
        const p2Mesh = this.potato2.getMesh();
        p2Mesh.position.set(-0.62, pHeight + 0.12, 0.22);
        this.scene.add(p2Mesh);

        // Lado Derecho: Papa 3 (Adelante) y Papa 4 (Atrás)
        this.potato3 = new PotatoBattery();
        const p3Mesh = this.potato3.getMesh();
        p3Mesh.position.set(0.68, pHeight + 0.12, 0.15);
        this.scene.add(p3Mesh);

        this.potato4 = new PotatoBattery();
        const p4Mesh = this.potato4.getMesh();
        p4Mesh.position.set(0.85, pHeight + 0.12, -0.22);
        this.scene.add(p4Mesh);

        // Tablero central con Interruptor, LED aumentado 15% y Multímetro inclinado a la derecha
        this.switchExhibit = new SwitchExhibit();
        const switchMesh = this.switchExhibit.getMesh();
        switchMesh.position.set(-0.05, pHeight, 0.08);
        this.scene.add(switchMesh);

        // Conector de clavija en electrodo de papa 1
        const plugGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.05, 16);
        const plugMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
        this.plugMesh = new THREE.Mesh(plugGeo, plugMat);
        this.plugMesh.position.set(-0.82, pHeight + 0.22, -0.20);
        this.scene.add(this.plugMesh);

        // CABLES CONECTANDO LAS 4 PAPAS EN SERIE COHERENTE (Zinc a Cobre en cadena)
        const cablePoints = [
            new THREE.Vector3(-0.76, pHeight + 0.16, -0.18),    // Papa 1 Zinc
            new THREE.Vector3(-0.72, pHeight + 0.08, 0.02),     // Curva puente izquierda
            new THREE.Vector3(-0.62, pHeight + 0.16, 0.18),     // Papa 2 Cobre
            new THREE.Vector3(-0.56, pHeight + 0.16, 0.24),     // Papa 2 Zinc
            new THREE.Vector3(-0.40, pHeight + 0.06, 0.20),     // Bajada al tablero
            new THREE.Vector3(-0.29, pHeight + 0.05, 0.18),     // Entrada Borne Tablero
            new THREE.Vector3(-0.05, pHeight + 0.05, 0.18),     // Puente Switch -> LED
            new THREE.Vector3(0.19, pHeight + 0.05, 0.18),      // Salida Borne Tablero
            new THREE.Vector3(0.42, pHeight + 0.06, 0.18),      // Hacia papas derechas
            new THREE.Vector3(0.64, pHeight + 0.16, 0.12),      // Papa 3 Cobre
            new THREE.Vector3(0.72, pHeight + 0.16, 0.18),      // Papa 3 Zinc
            new THREE.Vector3(0.78, pHeight + 0.08, -0.04),     // Curva puente derecha
            new THREE.Vector3(0.85, pHeight + 0.16, -0.18),     // Papa 4 Zinc
            new THREE.Vector3(0.0, pHeight + 0.04, -0.42),      // Cable de retorno largo por detrás
            new THREE.Vector3(-0.85, pHeight + 0.16, -0.22)     // Retorno a Papa 1 Cobre
        ];
        this.cables = new EnergyCables(cablePoints);
        this.scene.add(this.cables.getMesh());

        // 3. ESTACIÓN 02: PRISMA ÓPTICO (Fondo: 0, -15)
        this.optics = new OpticsExhibit();
        const opticsMesh = this.optics.getMesh();
        opticsMesh.position.set(0, pHeight, -15);
        opticsMesh.scale.set(1.0, 1.0, 1.0); // Banco óptico real de 1.8m a escala 1:1
        this.scene.add(opticsMesh);

        // 4. ESTACIÓN 03: CUNA DE NEWTON (Entrada: 0, 15)
        this.cradle = new NewtonsCradle();
        const cradleMesh = this.cradle.getMesh();
        cradleMesh.position.set(0, pHeight, 15);
        cradleMesh.scale.set(0.18, 0.18, 0.18);
        this.scene.add(cradleMesh);

        // 5. Configurar interactables, pedagogía adaptada y vinculación con atriles
        this.setupInteractivity();
    }

    private setupInteractivity() {
        const sfx = SoundSynthesizer.getInstance();

        // --- ESTACIÓN 1: PAPA BATERÍA ---
        const quizPapa: QuizData = {
            id: 1,
            title: "Pila de Papa",
            question: "¿Por qué dos simples papas logran encender la lamparita LED?",
            options: [
                "Porque las papas absorben rayos láser de la luz del sol durante el día.",
                "Porque los metales (zinc y cobre) reaccionan con el jugo ácido de la papa y liberan electrones por los cables.",
                "Porque la papa está caliente por dentro y genera vapor con chispas."
            ],
            correctIndex: 1,
            explanation: "¡Exacto! El jugo ácido de la papa ayuda a que los electrones salten del zinc al cobre. ¡Funciona igual que la pila de un juguete!"
        };

        const papaInteractable: Omit<Interactable, 'object'> = {
            id: 1,
            title: "Estación 01: Pila de Papa",
            tag: "⚡ ELECTRICIDAD Y QUÍMICA",
            description: "¡Las papas tienen jugo con energía escondida! Dos metales distintos (cobre y zinc) reaccionan con el jugo de la papa y liberan electrones que viajan por los cables en circuito cerrado hasta encender la lamparita LED sobre la placa.",
            badge: "🏅 +100 XP · Medalla de la Energía",
            getModeText: () => {
                const isOn = this.switchExhibit.getState() && this.isPlugged;
                return isOn ? "ESTADO: CIRCUITO CERRADO (LED VERDE ENCENDIDO)" : "ESTADO: CIRCUITO ABIERTO (APAGADO)";
            },
            quiz: quizPapa,
            // TECLA [E]: Únicamente para probar / encender / manipular el circuito
            onInteract: () => {
                const newState = this.switchExhibit.toggle();
                const isOn = newState && this.isPlugged;
                sfx.playSwitchClick(isOn);
                const modeText = isOn ? "ESTADO: CIRCUITO CERRADO (LED VERDE ENCENDIDO)" : "ESTADO: CIRCUITO ABIERTO (APAGADO)";
                this.hud.setCardModePill(modeText);
            },
            // TECLA [R]: Únicamente para responder el desafío pedagógico
            onChallenge: () => {
                if (!this.hud.isMissionCompleted(1)) {
                    this.hud.openQuiz(quizPapa, (success) => {
                        if (success) {
                            this.hud.completeMission(1);
                        }
                    });
                } else {
                    this.hud.showAchievementToast('Pila de Papa: ¡Completada!', 'Ya obtuviste la medalla de esta estación. Podés seguir interactuando libremente con el circuito.');
                }
            }
        };

        this.switchExhibit.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...papaInteractable });
        });
        this.plugMesh && this.interactables.push({ object: this.plugMesh, ...papaInteractable });
        this.potato1.getMesh().traverse((child) => {
            if (child instanceof THREE.Mesh) this.interactables.push({ object: child, ...papaInteractable });
        });
        this.potato2.getMesh().traverse((child) => {
            if (child instanceof THREE.Mesh) this.interactables.push({ object: child, ...papaInteractable });
        });
        this.potato3.getMesh().traverse((child) => {
            if (child instanceof THREE.Mesh) this.interactables.push({ object: child, ...papaInteractable });
        });
        this.potato4.getMesh().traverse((child) => {
            if (child instanceof THREE.Mesh) this.interactables.push({ object: child, ...papaInteractable });
        });

        // --- ESTACIÓN 2: PRISMA ÓPTICO ---
        const quizOptics: QuizData = {
            id: 2,
            title: "La Magia de la Luz",
            question: "¿Por qué la luz blanca se abre en arcoíris al cruzar el cristal pero el láser no?",
            options: [
                "Porque el cristal tiene acuarelas transparentes escondidas adentro.",
                "Porque el láser se enfría y apaga sus otros colores al tocar el vidrio.",
                "Porque la luz blanca es una mezcla de muchos colores viajando juntos; el láser es de un solo color puro."
            ],
            correctIndex: 2,
            explanation: "¡Brillante! La luz blanca contiene todos los colores juntos. Al entrar al cristal, cada color se frena a distinta velocidad y se abren en abanico."
        };

        const opticsInteractable: Omit<Interactable, 'object'> = {
            id: 2,
            title: "Estación 02: Prisma Óptico",
            tag: "🌈 LA MAGIA DE LA LUZ",
            description: "¿Sabías que la luz blanca del sol esconde todos los colores del arcoíris? Cuando atraviesa este cristal en triángulo, cada color viaja a diferente velocidad y se separan en abanico. ¡Probá la luz blanca y láseres de colores interactuando con el prisma!",
            badge: "🏅 +100 XP · Medalla de la Luz",
            getModeText: () => `MODO: ${this.optics.getCurrentModeInfo().name.toUpperCase()}`,
            quiz: quizOptics,
            // Acción Interactuar: alternar modos de luz física
            onInteract: () => {
                const newMode = this.optics.cycleMode();
                sfx.playLaserCycle(newMode.id);
                this.hud.setCardModePill(`MODO: ${newMode.name.toUpperCase()}`);
            },
            // Acción Desafío: responder el desafío pedagógico
            onChallenge: () => {
                if (!this.hud.isMissionCompleted(2)) {
                    this.hud.openQuiz(quizOptics, (success) => {
                        if (success) {
                            this.hud.completeMission(2);
                        }
                    });
                } else {
                    this.hud.showAchievementToast('Prisma Óptico: ¡Completado!', 'Ya obtuviste la medalla de esta estación. Podés seguir interactuando libremente con los láseres.');
                }
            }
        };

        this.optics.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...opticsInteractable });
        });

        // --- ESTACIÓN 3: CUNA DE NEWTON ---
        const quizNewton: QuizData = {
            id: 3,
            title: "Movimiento y Choques",
            question: "Cuando la primera bola choca a las que están quietas, ¿por qué solo sale disparada la del otro extremo?",
            options: [
                "Porque la energía del golpe viaja a través de las bolas quietas y se transfiere directo a la última.",
                "Porque las bolas del medio tienen imanes que repelen la bola de la punta.",
                "Porque la gravedad solo empuja a los metales que están en el borde exterior."
            ],
            correctIndex: 0,
            explanation: "¡Exacto! Es la conservación de la energía: las esferas del medio reciben el golpe y lo pasan en milésimas de segundo a la última esfera sin moverse ellas."
        };

        const newtonInteractable: Omit<Interactable, 'object'> = {
            id: 3,
            title: "Estación 03: Cuna de Newton",
            tag: "⚖️ MOVIMIENTO Y CHOQUES",
            description: "¿Alguna vez jugaste a los autitos chocadores? Aquí la energía no desaparece: viaja de una bola a otra a través del metal como un pase de fútbol invisible. ¡Interactuá para alternar entre 1 bola, 2 bolas, 3 bolas o choque simétrico!",
            badge: "🏅 +100 XP · Medalla de Newton",
            getModeText: () => `MODO DE CHOQUE: ${this.cradle.getCurrentModeInfo().name.toUpperCase()}`,
            quiz: quizNewton,
            // Acción Interactuar: alternar modos de péndulos
            onInteract: () => {
                const newMode = this.cradle.cycleMode();
                sfx.playNewtonClack(1.0);
                this.hud.setCardModePill(`MODO DE CHOQUE: ${newMode.name.toUpperCase()}`);
            },
            // Acción Desafío: responder el desafío pedagógico
            onChallenge: () => {
                if (!this.hud.isMissionCompleted(3)) {
                    this.hud.openQuiz(quizNewton, (success) => {
                        if (success) {
                            this.hud.completeMission(3);
                        }
                    });
                } else {
                    this.hud.showAchievementToast('Cuna de Newton: ¡Completada!', 'Ya obtuviste la medalla de esta estación. Podés seguir interactuando libremente con las esferas.');
                }
            }
        };

        this.cradle.getInteractables().forEach((mesh: THREE.Object3D) => {
            this.interactables.push({ object: mesh, ...newtonInteractable });
        });

        // 5. ESTACIÓN 04: BOBINA DE TESLA (Ala Este: 16, 1.2, 0)
        this.teslaCoil = new TeslaCoil();
        const teslaMesh = this.teslaCoil.getMesh();
        teslaMesh.position.set(16, 1.2, 0);
        this.scene.add(teslaMesh);

        const quizTesla: QuizData = {
            id: 4,
            title: "Electromagnetismo y Tesla",
            question: "¿Por qué el tubo fluorescente se enciende en el aire cerca de la Bobina sin cables ni pilas?",
            options: [
                "Porque la bobina genera un campo electromagnético de alta frecuencia que viaja por el aire y excita el gas del tubo.",
                "Porque el vidrio del tubo tiene pequeñas baterías invisibles que se calientan con el aire.",
                "Porque el sonido del relámpago empuja la luz hacia adentro del tubo."
            ],
            correctIndex: 0,
            explanation: "¡Fabuloso! Nikola Tesla demostró la transmisión inalámbrica: el campo electromagnético de alta tensión ioniza y excita los átomos de gas dentro del tubo haciéndolos brillar."
        };

        const teslaInteractable: Omit<Interactable, 'object'> = {
            id: 4,
            title: "Estación 04: Bobina de Tesla",
            tag: "⚡ ELECTROMAGNETISMO Y ALTA TENSIÓN",
            description: "Nikola Tesla descubrió que la electricidad puede viajar por el aire sin necesidad de cables. La bobina genera un campo electromagnético de alta frecuencia tan potente que enciende el tubo fluorescente a distancia y desata arcos de plasma.",
            badge: "🏅 +100 XP · Medalla de Tesla",
            getModeText: () => `MODO: ${this.teslaCoil.getCurrentModeInfo().name.toUpperCase()}`,
            quiz: quizTesla,
            onInteract: () => {
                const newMode = this.teslaCoil.cycleMode();
                this.hud.setCardModePill(`MODO: ${newMode.name.toUpperCase()}`);
            },
            onChallenge: () => {
                if (!this.hud.isMissionCompleted(4)) {
                    this.hud.openQuiz(quizTesla, (success) => {
                        if (success) {
                            this.hud.completeMission(4);
                        }
                    });
                } else {
                    this.hud.showAchievementToast('Bobina de Tesla: ¡Completada!', 'Ya obtuviste la medalla de esta estación. Podés seguir probando los modos de plasma.');
                }
            }
        };

        this.teslaCoil.getInteractables().forEach((mesh: THREE.Object3D) => {
            this.interactables.push({ object: mesh, ...teslaInteractable });
        });

        // 6. VINCULAR LOS 4 PEDESTALES / ATRILES DIRECTAMENTE A CADA EXPERIMENTO
        const pedestals = this.room.getPedestalMeshes();
        if (pedestals.length >= 4) {
            this.interactables.push({ object: pedestals[0], ...papaInteractable });
            this.interactables.push({ object: pedestals[1], ...opticsInteractable });
            this.interactables.push({ object: pedestals[2], ...newtonInteractable });
            this.interactables.push({ object: pedestals[3], ...teslaInteractable });
        }

        // 7. COMPAÑERO ROBÓTICO NPC: MEL-BOT
        this.robotGuide = new RobotGuide();
        this.scene.add(this.robotGuide.getMesh());

        const robotInteractable: Omit<Interactable, 'object'> = {
            id: 99,
            title: "Mel-Bot · Dron Robot Guía",
            tag: "🤖 ASISTENTE CIENTÍFICO 3D",
            description: "¡Soy Mel-Bot, tu asistente personal en el museo! Probá e interactuá con los experimentos tantas veces como quieras y respondé los desafíos para ganar XP. ¡Explorá las esquinas para hallar orbes de energía!",
            badge: "💡 Consejos de Física en Vivo",
            modeText: "ESTADO: ACOMPAÑANDO AL CIENTÍFICO",
            quiz: {
                id: 99,
                title: "Trivia de Mel-Bot",
                question: "¿Cuál es la mejor forma de aprender física en este museo?",
                options: [
                    "A) Experimentar primero, observar los efectos e interactuar antes de responder el desafío.",
                    "B) Correr con los ojos cerrados sin mirar las luces.",
                    "C) Salir del museo sin probar los experimentos."
                ],
                correctIndex: 0,
                explanation: "¡Exacto! El método científico se basa en observar, formular hipótesis y experimentar."
            },
            onInteract: () => {
                const tip = this.robotGuide.talk();
                this.hud.showAchievementToast('Consejo de Mel-Bot 🤖', tip);
            },
            onChallenge: () => {
                const tip = this.robotGuide.talk();
                this.hud.showAchievementToast('Consejo de Mel-Bot 🤖', tip);
            }
        };

        this.robotGuide.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...robotInteractable });
        });

        // 8. ORBES CUÁNTICOS COLECCIONABLES SECRETOS
        this.orbsManager = new QuantumOrbsManager(this.scene, this.hud);
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

        // Actualizar óptica
        if (this.optics) this.optics.update(time);

        // Actualizar cuna de newton con audio posicional
        if (this.cradle) {
            const dist = playerPos ? playerPos.distanceTo(new THREE.Vector3(0, 1.2, 15)) : undefined;
            this.cradle.update(time, dist);
        }

        // Actualizar bobina de tesla con audio posicional y arcos de plasma
        if (this.teslaCoil) {
            const distTesla = playerPos ? playerPos.distanceTo(new THREE.Vector3(16, 1.2, 0)) : undefined;
            this.teslaCoil.update(time, distTesla);
        }

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
