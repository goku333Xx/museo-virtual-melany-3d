import * as THREE from 'three';
import { SoundSynthesizer } from '../SoundSynthesizer';
import { HUD } from '../HUD';

export interface OrbDefinition {
    id: number;
    name: string;
    roomName: string;
    pos: THREE.Vector3;
    colorHex: number;
    emissiveHex: number;
    ringHex: number;
    secretTitle: string;
    secretDesc: string;
}

interface OrbItem {
    def: OrbDefinition;
    group: THREE.Group;
    mesh: THREE.Mesh;
    shell: THREE.Mesh;
    ring: THREE.Mesh;
    position: THREE.Vector3;
    collected: boolean;
    scale: number;
}

export class QuantumOrbsManager {
    private group: THREE.Group;
    private orbs: OrbItem[] = [];
    private hud: HUD;
    private totalCollected: number = 0;

    private readonly orbDefinitions: OrbDefinition[] = [
        {
            id: 1,
            name: "Orbe Químico Redox",
            roomName: "Sala 01: Electroquímica",
            pos: new THREE.Vector3(-15, 1.2, -2.6),
            colorHex: 0x4ade80,
            emissiveHex: 0x16a34a,
            ringHex: 0xa7f3d0,
            secretTitle: "🔋 Baterías Orgánicas Secretas",
            secretDesc: "¿Sabías que si conectaras 500 papas en serie podrías alimentar una pequeña consola de videojuegos portátil durante horas?"
        },
        {
            id: 2,
            name: "Orbe de Plasma Resonante",
            roomName: "Sala 02: Alta Tensión y Tesla",
            pos: new THREE.Vector3(16, 1.2, -2.6),
            colorHex: 0xc084fc,
            emissiveHex: 0x9333ea,
            ringHex: 0xf3e8ff,
            secretTitle: "⚡ Calor Cósmico en Miniatura",
            secretDesc: "La chispa de una bobina de Tesla calienta el aire circundante a más de 10.000 °C, ¡dos veces más caliente que la superficie del Sol!"
        },
        {
            id: 3,
            name: "Orbe Eólico Cinético",
            roomName: "Sala 03: Energía Eólica",
            pos: new THREE.Vector3(-2.6, 1.2, -15),
            colorHex: 0x00f0ff,
            emissiveHex: 0x0284c7,
            ringHex: 0xe0f2fe,
            secretTitle: "🌪️ El Gigante de los Vientos",
            secretDesc: "Una sola vuelta de las aspas de un aerogenerador moderno genera suficiente electricidad para abastecer una casa durante todo un día."
        },
        {
            id: 4,
            name: "Orbe Solar Fotónico",
            roomName: "Sala 04: Energía Solar",
            pos: new THREE.Vector3(13.5, 1.2, -10.5),
            colorHex: 0xfde047,
            emissiveHex: 0xd97706,
            ringHex: 0xfef08a,
            secretTitle: "☀️ El Viaje de los Fotones",
            secretDesc: "La luz del Sol tarda exactamente 8 minutos y 20 segundos en viajar 150 millones de kilómetros por el cosmos hasta impactar en un panel solar en la Tierra."
        },
        {
            id: 5,
            name: "Orbe Electrostático de Fricción",
            roomName: "Sala 05: Generador Electrostático",
            pos: new THREE.Vector3(-10.5, 1.2, -13.5),
            colorHex: 0x38bdf8,
            emissiveHex: 0x2563eb,
            ringHex: 0xbae6fd,
            secretTitle: "⚡ El Salto Invisible de Electrones",
            secretDesc: "Al caminar sobre una alfombra en un día seco, tu cuerpo puede acumular hasta 25.000 voltios de electricidad estática sin hacerte daño."
        },
        {
            id: 6,
            name: "Orbe de Momento y Choques",
            roomName: "Sala 06: Energía Mecánica",
            pos: new THREE.Vector3(2.6, 1.2, 14),
            colorHex: 0xf59e0b,
            emissiveHex: 0xb45309,
            ringHex: 0xfde68a,
            secretTitle: "⚖️ La Velocidad del Impacto",
            secretDesc: "En una colisión elástica como la Cuna de Newton, la onda de compresión y energía viaja a más de 18.000 km/h a través del acero de las esferas."
        },
        {
            id: 7,
            name: "Orbe de Inducción Manual",
            roomName: "Sala 07: Dínamo Manual",
            pos: new THREE.Vector3(13.8, 1.2, 11.2),
            colorHex: 0xf97316,
            emissiveHex: 0xc2410c,
            ringHex: 0xffedd5,
            secretTitle: "⚙️ Los Dínamos de Bicicletas",
            secretDesc: "¿Sabías que los faros de las bicicletas clásicas se alimentaban con un pequeño dínamo que rodaba sobre la rueda? Cuanto más rápido pedaleabas, ¡más potente era el haz de luz!"
        }
    ];

    constructor(scene: THREE.Scene, hud: HUD) {
        this.group = new THREE.Group();
        this.hud = hud;
        scene.add(this.group);

        const coreGeo = new THREE.OctahedronGeometry(0.24, 0);
        const shellGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const ringGeo = new THREE.TorusGeometry(0.44, 0.018, 12, 32);

        this.orbDefinitions.forEach((def) => {
            const orbGroup = new THREE.Group();
            orbGroup.position.copy(def.pos);

            // 1. Núcleo cristalino facetado giratorio
            const coreMat = new THREE.MeshStandardMaterial({
                color: def.colorHex,
                roughness: 0.1,
                metalness: 0.9,
                emissive: def.emissiveHex,
                emissiveIntensity: 0.9
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            orbGroup.add(core);

            // 2. Halo aditivo exterior brillante
            const shellMat = new THREE.MeshBasicMaterial({
                color: def.colorHex,
                transparent: true,
                opacity: 0.45,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const shell = new THREE.Mesh(shellGeo, shellMat);
            orbGroup.add(shell);

            // 3. Anillo orbital inclinado
            const ringMat = new THREE.MeshBasicMaterial({
                color: def.ringHex,
                transparent: true,
                opacity: 0.85
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 3;
            orbGroup.add(ring);

            this.group.add(orbGroup);

            this.orbs.push({
                def,
                group: orbGroup,
                mesh: core,
                shell,
                ring,
                position: def.pos.clone(),
                collected: false,
                scale: 1.0
            });
        });
    }

    public update(time: number, playerPos: THREE.Vector3): void {
        for (let i = 0; i < this.orbs.length; i++) {
            const orb = this.orbs[i];

            if (orb.collected) {
                // Animación suave de implosión cuántica al recolectarse
                if (orb.scale > 0.01) {
                    orb.scale = Math.max(0, orb.scale - 0.08);
                    orb.group.scale.setScalar(orb.scale);
                    if (orb.scale <= 0.01) {
                        orb.group.position.set(0, -999, 0); // Ocultar fuera de cámara
                    }
                }
                continue;
            }

            // Rotación y levitación suave
            orb.group.position.y = orb.position.y + Math.sin(time * 3.0 + orb.def.id) * 0.12;
            orb.mesh.rotation.y = time * 2.2;
            orb.mesh.rotation.x = time * 1.6;
            orb.ring.rotation.z = time * 1.4;

            // Detección de proximidad para recolección (1.5 metros)
            const dist = playerPos.distanceTo(orb.group.position);
            if (dist < 1.5) {
                this.collectOrb(orb);
            }
        }
    }

    private collectOrb(orb: OrbItem): void {
        orb.collected = true;
        this.totalCollected++;

        // Sonido celestial de recolección
        SoundSynthesizer.getInstance().playCollectSparkle();

        // Recompensa de XP y Notificación Toast
        this.hud.addXP(25);
        this.hud.showAchievementToast(
            `¡${orb.def.name} Descubierto! (+25 XP)`,
            `Has encontrado el orbe de la ${orb.def.roomName} (${this.totalCollected} de 7 orbes recolectados).`,
            '🔮'
        );

        // Desbloquear dato secreto en el diario de campo del científico
        this.hud.unlockSecretFact(orb.def.id, orb.def.secretTitle, orb.def.secretDesc);
    }

    public getTotalCollected(): number {
        return this.totalCollected;
    }

    public getOrbDefinitions(): OrbDefinition[] {
        return this.orbDefinitions;
    }
}
