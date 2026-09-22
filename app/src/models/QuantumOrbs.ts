import * as THREE from 'three';
import { SoundSynthesizer } from '../SoundSynthesizer';
import { HUD } from '../HUD';

interface OrbItem {
    id: number;
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

    constructor(scene: THREE.Scene, hud: HUD) {
        this.group = new THREE.Group();
        this.hud = hud;
        scene.add(this.group);

        const orbPositions = [
            new THREE.Vector3(18, 1.2, -18),  // Rincón Noreste
            new THREE.Vector3(-18, 1.2, 0),   // Rincón Oeste
            new THREE.Vector3(18, 1.2, 18)    // Rincón Sureste
        ];

        // Materiales compartidos (cero duplicación de memoria GPU)
        const coreGeo = new THREE.OctahedronGeometry(0.24, 0);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0x0284c7,
            emissiveIntensity: 0.8
        });

        const shellGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const shellMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const ringGeo = new THREE.TorusGeometry(0.42, 0.015, 12, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.8 });

        orbPositions.forEach((pos, idx) => {
            const orbGroup = new THREE.Group();
            orbGroup.position.copy(pos);

            // 1. Núcleo cristalino facetado giratorio
            const core = new THREE.Mesh(coreGeo, coreMat);
            orbGroup.add(core);

            // 2. Halo aditivo exterior (NO usa PointLight, 0% recompilación de shaders)
            const shell = new THREE.Mesh(shellGeo, shellMat);
            orbGroup.add(shell);

            // 3. Anillo orbital
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 3;
            orbGroup.add(ring);

            this.group.add(orbGroup);

            this.orbs.push({
                id: idx + 1,
                group: orbGroup,
                mesh: core,
                shell: shell,
                ring: ring,
                position: pos,
                collected: false,
                scale: 1.0
            });
        });
    }

    public update(time: number, playerPos: THREE.Vector3): void {
        for (let i = 0; i < this.orbs.length; i++) {
            const orb = this.orbs[i];

            if (orb.collected) {
                // Animación suave de implosión al recolectarse (60 FPS puros)
                if (orb.scale > 0.01) {
                    orb.scale = Math.max(0, orb.scale - 0.08);
                    orb.group.scale.setScalar(orb.scale);
                    if (orb.scale <= 0.01) {
                        orb.group.position.set(0, -999, 0); // Mover fuera del campo visual sin alterar el grafo de luces
                    }
                }
                continue;
            }

            // Rotación y levitación suave
            orb.group.position.y = orb.position.y + Math.sin(time * 3.0 + orb.id) * 0.12;
            orb.mesh.rotation.y = time * 2.0;
            orb.mesh.rotation.x = time * 1.5;
            orb.ring.rotation.z = time * 1.2;

            // Detección de proximidad para recolección (1.4 metros)
            const dist = playerPos.distanceTo(orb.group.position);
            if (dist < 1.4) {
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
            `¡Orbe Cuántico #${orb.id} Descubierto! (+25 XP)`,
            `Has absorbido energía cósmica oculta (${this.totalCollected} de 3 orbes recolectados).`
        );
    }
}
