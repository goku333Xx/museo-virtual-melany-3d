import * as THREE from 'three';
import { MuseumRoom, type WallBox } from './models/Environment';
import { OpticsExhibit } from './models/OpticsExhibit';
import { RobotGuide } from './models/RobotGuide';
import { crearSimulacion, type Simulacion } from './models/Simulaciones';
import { SalaVideo } from './SalaVideo';
import { SoundSynthesizer } from './SoundSynthesizer';
import { HUD } from './HUD';
import type { QuizData } from './HUD';
import { SALAS, GALERIA, GALERIA_CENTRO, nombreSala, numeroSala, grupoSala, salaLayout } from './salas.config';

export interface Interactable {
    object: THREE.Object3D;
    id: number;
    title: string;
    tag: string;
    description: string;
    badge: string;
    modeText?: string;
    getModeText?: () => string | undefined;
    quiz?: QuizData;
    /** Textos de acción propios para la tarjeta (si faltan, se usan los de experimento) */
    actionE?: string;
    actionR?: string;
    onInteract?: () => void;
    onChallenge?: () => void;
}

const GALERIA_ID = 50;
const ROBOT_ID = 99;

const esc = (s: string) => s.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);

export class World {
    scene: THREE.Scene;
    interactables: Interactable[] = [];

    private room!: MuseumRoom;
    private simulaciones: Simulacion[] = [];
    private videos: SalaVideo[] = [];
    private optics!: OpticsExhibit;
    private robotGuide!: RobotGuide;

    private hud: HUD;
    private lastPlayerPos = new THREE.Vector3(0, 1.68, 4.5);
    private currentRoomIdx: number | null = null;

    // Centros de sala para iluminación y LOD: 0..9 salas, 10 galería
    private roomCenters: { x: number; z: number }[] = [
        ...SALAS.map((_s, i) => ({ x: salaLayout(i).centerX, z: salaLayout(i).zc })),
        { x: GALERIA_CENTRO.x, z: GALERIA_CENTRO.z }
    ];

    constructor(scene: THREE.Scene, hud: HUD) {
        this.scene = scene;
        this.hud = hud;
        this.init();
    }

    private init() {
        this.room = new MuseumRoom();
        this.scene.add(this.room.getMesh());

        // Simulación central y video de cada sala
        const parts = this.room.getSalaParts();
        SALAS.forEach((sala, i) => {
            const l = salaLayout(i);
            this.simulaciones.push(crearSimulacion(sala.simulacion, this.scene, l.centerX, l.zc, sala.experimento, sala.icono));
            this.videos.push(new SalaVideo(sala.video, parts[i], this.hud, sala.experimento, `${numeroSala(i)} · ${grupoSala(i)} · Video`));
        });

        // Galería especial: prisma óptico
        this.optics = new OpticsExhibit();
        this.optics.getMesh().position.set(GALERIA_CENTRO.x, 1.2, GALERIA_CENTRO.z);
        this.scene.add(this.optics.getMesh());

        // Mel-Bot en el hall
        this.robotGuide = new RobotGuide();
        this.robotGuide.getMesh().position.set(1.5, 1.4, 2.0);
        this.scene.add(this.robotGuide.getMesh());

        this.setupInteractivity();
    }

    /** Marca la sala como visitada (misión cumplida) */
    private visitarSala(i: number): void {
        if (!this.hud.isMissionCompleted(i + 1)) this.hud.completeMission(i + 1);
    }

    /** Modal con la investigación completa del grupo */
    private abrirInvestigacion(i: number): void {
        const sala = SALAS[i];
        const inv = sala.investigacion;
        const body = document.createElement('div');
        body.className = 'sala-investigacion';
        const li = (items: string[]) => items.map(t => `<li>${esc(t)}</li>`).join('');
        body.innerHTML = `
            <p class="sala-inv-meta">${esc(sala.transformacion)}</p>
            <section><h3>La pregunta</h3><p>${esc(inv.pregunta)}</p></section>
            <section><h3>Hipótesis</h3><p>${esc(inv.hipotesis)}</p></section>
            <section><h3>Materiales</h3><ul>${li(inv.materiales)}</ul></section>
            <section><h3>Procedimiento</h3><ol>${li(inv.procedimiento)}</ol></section>
            <section><h3>Resultados</h3><p>${esc(inv.resultados)}</p></section>
            <section><h3>Conclusión</h3><p>${esc(inv.conclusion)}</p></section>
            <section class="sala-inv-integrantes"><h3>Integrantes · ${esc(grupoSala(i))}</h3><p>${sala.integrantes.map(esc).join(' · ')}</p></section>
        `;
        this.hud.openSalaModal(`${numeroSala(i)} · ${grupoSala(i)} · Cómo investigamos`, `${sala.icono} ${sala.experimento}`, body);
        this.visitarSala(i);
    }

    private setupInteractivity() {
        const parts = this.room.getSalaParts();

        SALAS.forEach((sala, i) => {
            const id = i + 1;
            const sim = this.simulaciones[i];
            const video = this.videos[i];
            const titulo = nombreSala(i);
            const grupo = grupoSala(i);

            // Simulación central
            const simItem: Omit<Interactable, 'object'> = {
                id,
                title: titulo,
                tag: `${sala.icono} ${sala.transformacion.toUpperCase()}`,
                description: `${grupo}. ${sala.investigacion.pregunta}`,
                badge: `🏛️ ${grupo}`,
                getModeText: () => sim.modeText(),
                actionE: '⚡ [E] Interactuar con la simulación',
                actionR: '📋 [R] Ver la investigación',
                onInteract: () => {
                    const t = sim.interact();
                    if (t) this.hud.setCardModePill(t);
                },
                onChallenge: () => this.abrirInvestigacion(i)
            };
            sim.meshes.forEach(m => this.interactables.push({ object: m, ...simItem }));

            // Pantalla de video
            this.interactables.push({
                object: parts[i].screen,
                id,
                title: `Video: ${sala.experimento}`,
                tag: '🎬 VIDEO DEL EXPERIMENTO',
                description: video.kind === 'none'
                    ? 'Este grupo todavía no subió su video.'
                    : 'Mirá cómo el grupo llevó adelante el experimento. Se escucha mejor con auriculares.',
                badge: `🏛️ ${grupo}`,
                getModeText: () => video.statusText(),
                actionE: video.kind === 'archivo' ? '▶ [E] Reproducir / Pausar' : '▶ [E] Ver video en grande',
                actionR: '🔍 [R] Ver en grande',
                onInteract: () => {
                    this.hud.setCardModePill(video.toggle());
                    if (video.kind !== 'none') this.visitarSala(i);
                },
                onChallenge: () => {
                    video.openLarge();
                    if (video.kind !== 'none') this.visitarSala(i);
                }
            });

            // Paneles de investigación
            const panelTitles = ['La pregunta', 'Materiales', 'Procedimiento', 'Resultados y conclusión'];
            parts[i].panels.forEach((panel, k) => {
                this.interactables.push({
                    object: panel,
                    id,
                    title: `Cómo investigamos: ${panelTitles[k]}`,
                    tag: `📋 ${sala.experimento.toUpperCase()}`,
                    description: 'Tocá para leer la investigación completa del grupo en pantalla grande.',
                    badge: `🏛️ ${grupo}`,
                    actionE: '📖 [E] Leer investigación',
                    actionR: '📖 [R] Leer investigación',
                    onInteract: () => this.abrirInvestigacion(i),
                    onChallenge: () => this.abrirInvestigacion(i)
                });
            });

            // Placa de integrantes
            this.interactables.push({
                object: parts[i].plaque,
                id,
                title: `Integrantes · ${grupo}`,
                tag: `🪪 ${numeroSala(i).toUpperCase()}`,
                description: sala.integrantes.join(' · '),
                badge: `${sala.icono} ${sala.experimento}`,
                actionE: '📖 [E] Ver investigación',
                actionR: '📖 [R] Ver investigación',
                onInteract: () => this.abrirInvestigacion(i),
                onChallenge: () => this.abrirInvestigacion(i)
            });
        });

        // Galería especial: prisma óptico (fuera de las misiones)
        const cycleOptics = () => {
            const newMode = this.optics.cycleMode();
            SoundSynthesizer.getInstance().playLaserCycle(newMode.id);
            this.hud.setCardModePill(`LÁSER: ${newMode.name.toUpperCase()}`);
        };
        this.optics.getInteractables().forEach(mesh => {
            this.interactables.push({
                object: mesh,
                id: GALERIA_ID,
                title: `Galería especial: ${GALERIA.titulo}`,
                tag: '🌈 EL SECRETO DE LA LUZ',
                description: 'Isaac Newton descubrió que la luz blanca tiene todos los colores mezclados. Al atravesar el prisma, cada color se desvía distinto y aparece el arcoíris.',
                badge: '✨ Galería especial',
                getModeText: () => `LÁSER: ${this.optics.getCurrentModeInfo().name.toUpperCase()}`,
                actionE: '⚡ [E] Cambiar la luz',
                actionR: '⚡ [R] Cambiar la luz',
                onInteract: cycleOptics,
                onChallenge: cycleOptics
            });
        });

        // Mel-Bot
        const museumRooms = SALAS.map((_s, i) => {
            const l = salaLayout(i);
            return {
                id: i + 1,
                name: nombreSala(i),
                center: new THREE.Vector3(l.centerX, 0, l.zc),
                pedestalPos: new THREE.Vector3(l.side * 11.5, 1.75, l.zc)
            };
        });

        const getCurrentPlayerRoom = (pos: THREE.Vector3) => {
            for (const r of museumRooms) {
                if (Math.abs(pos.x - r.center.x) < 8.5 && Math.abs(pos.z - r.center.z) < 4.85 && Math.abs(pos.x) > 5.15) return r;
            }
            return null;
        };
        const getNextIncompleteRoom = (excludeId?: number) =>
            museumRooms.find(r => r.id !== excludeId && !this.hud.isMissionCompleted(r.id)) ?? museumRooms[0];

        const robotItem: Omit<Interactable, 'object'> = {
            id: ROBOT_ID,
            title: 'Mel-Bot: Guía del Museo',
            tag: '🤖 TU GUÍA',
            description: '¡Buenas! Soy Mel-Bot. Te acompaño por las 10 salas de 7mo A y 7mo B. Pedime que te lleve a la próxima sala que te falta ver.',
            badge: 'ℹ️ Asistente del museo',
            getModeText: () => this.robotGuide.isGuiding() ? 'ESTADO: GUIANDO A SALA 🚀' : 'ESTADO: ESPERANDO ÓRDENES',
            onInteract: () => {
                const currentRoom = getCurrentPlayerRoom(this.lastPlayerPos);
                const nextRoom = getNextIncompleteRoom(currentRoom ? currentRoom.id : undefined);
                const total = SALAS.length;
                const isAllCompleted = this.hud.getCompletedCount() >= total;
                const name = this.hud.getStudentName();

                let speech: string;
                let btn1Label = `Llevame a la ${nextRoom.name}`;
                let btn1Action = () => {
                    this.robotGuide.startGuiding(nextRoom.id, nextRoom.name, nextRoom.pedestalPos, this.hud.isMissionCompleted(nextRoom.id));
                    this.hud.showAchievementToast('¡Mel-Bot te guía! 🚀', `Seguí a Mel-Bot hacia la ${nextRoom.name}`, '🤖');
                };

                if (isAllCompleted) {
                    speech = `🎉 ¡Felicitaciones, <b>${esc(name)}</b>! Recorriste las ${total} salas del museo.<br><br>¿Vamos a la <b>Galería especial</b> a ver el prisma de Newton? 🌈`;
                    btn1Label = 'Ir a la Galería';
                    btn1Action = () => {
                        this.robotGuide.startGuiding(GALERIA_ID, 'Galería especial', new THREE.Vector3(0, 1.75, -32.5), true);
                    };
                } else if (currentRoom && !this.hud.isMissionCompleted(currentRoom.id)) {
                    speech = `¡Estamos en la <b>${esc(currentRoom.name)}</b>, <b>${esc(name)}</b>! 🔬<br><br>Mirá el <b>video</b> en la pantalla del fondo y leé los <b>paneles</b> de las paredes para saber cómo investigó el grupo.`;
                    btn1Label = '¡Dale, a mirar!';
                    btn1Action = () => { /* solo cierra el diálogo */ };
                } else if (currentRoom) {
                    speech = '¡Esta sala ya la viste! Vamos a la próxima.';
                } else {
                    speech = `¡Holaaa! Soy Mel-Bot. 🤖<br><br>El museo tiene <b>${total} salas</b>, una por grupo: 4 de <b>7mo A</b> y 6 de <b>7mo B</b>. ¿Vamos a la <b>${esc(nextRoom.name)}</b>?`;
                }

                this.hud.openMelDialog(speech, btn1Action, () => this.hud.openMapModal(), [btn1Label, 'Ver Mapa']);
            },
            onChallenge: () => {
                const currentRoom = getCurrentPlayerRoom(this.lastPlayerPos);
                const nextRoom = getNextIncompleteRoom(currentRoom ? currentRoom.id : undefined);
                this.robotGuide.startGuiding(nextRoom.id, nextRoom.name, nextRoom.pedestalPos, this.hud.isMissionCompleted(nextRoom.id));
                this.hud.showAchievementToast('¡SEGUIME! 🚀', `¡Mel-Bot te lleva a la ${nextRoom.name}!`, '🚀');
            }
        };
        this.robotGuide.getInteractables().forEach(mesh => {
            this.interactables.push({ object: mesh, ...robotItem });
        });
    }

    public update(delta: number, playerPos?: THREE.Vector3) {
        const time = performance.now() * 0.001;
        if (playerPos) this.lastPlayerPos.copy(playerPos);

        // Sala activa (la más cercana a menos de 18 m) para luces y LOD
        let activeRoomIdx: number | null = null;
        if (playerPos) {
            let minDistanceSq = Infinity;
            let closestIdx = -1;
            for (let i = 0; i < this.roomCenters.length; i++) {
                const dx = playerPos.x - this.roomCenters[i].x;
                const dz = playerPos.z - this.roomCenters[i].z;
                const dSq = dx * dx + dz * dz;
                if (dSq < minDistanceSq) {
                    minDistanceSq = dSq;
                    closestIdx = i;
                }
            }
            if (minDistanceSq < 324) activeRoomIdx = closestIdx;

            if (activeRoomIdx !== this.currentRoomIdx) {
                // Al salir de una sala, su video se pausa
                if (this.currentRoomIdx !== null && this.videos[this.currentRoomIdx] && !this.hud.isModalOpen) {
                    this.videos[this.currentRoomIdx].pause();
                }
                this.currentRoomIdx = activeRoomIdx;
            }
        }

        if (this.room) {
            this.room.setActiveRoom(activeRoomIdx);
            this.room.update(time);
        }

        for (let i = 0; i < this.simulaciones.length; i++) {
            const active = activeRoomIdx === i;
            this.simulaciones[i].setSleep(!active);
            if (active) this.simulaciones[i].update(time, delta, playerPos);
        }

        const galeriaIdx = SALAS.length;
        this.optics.setSleep(activeRoomIdx !== galeriaIdx);
        if (activeRoomIdx === galeriaIdx) this.optics.update(time);

        if (playerPos && this.robotGuide) this.robotGuide.update(time, playerPos, delta);
    }

    public setStudentName(name: string): void {
        this.robotGuide?.setStudentName(name);
    }

    public setIsMobile(isMobile: boolean): void {
        this.robotGuide?.setIsMobile(isMobile);
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

    public getDoorBarriers(): THREE.Mesh[] {
        return [];
    }
}
