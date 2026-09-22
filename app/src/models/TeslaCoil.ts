import * as THREE from 'three';
import { SoundSynthesizer } from '../SoundSynthesizer';

export interface TeslaModeInfo {
    id: number;
    name: string;
    desc: string;
}

export class TeslaCoil {
    private group: THREE.Group;
    private interactableMeshes: THREE.Object3D[] = [];

    // Componentes visuales
    private toroidMesh: THREE.Mesh;
    private isSleeping: boolean = false;
    private arcCurves: THREE.CatmullRomCurve3[] = [];
    private arcGeometries: THREE.TubeGeometry[] = [];
    private arcMeshes: THREE.Mesh[] = [];
    private sparkSprites: THREE.Sprite[] = [];
    private fieldRings: THREE.Mesh[] = [];

    // Tubo fluorescente inalámbrico
    private tubeCore: THREE.Mesh;
    private tubeGlow: THREE.Mesh;
    private tubeLight: THREE.PointLight;
    private sparkLight: THREE.PointLight;

    // Modos de operación
    private currentMode: number = 0;
    private lastZapTime: number = 0;
    private readonly modes: TeslaModeInfo[] = [
        {
            id: 0,
            name: "Transmisión Inalámbrica",
            desc: "El campo electromagnético de alta frecuencia excita el gas del tubo fluorescente sin cables ni baterías."
        },
        {
            id: 1,
            name: "Tormenta de Plasma",
            desc: "Múltiples arcos de alta tensión ionizan el aire a 250.000 voltios formando canales de plasma púrpura y cian."
        },
        {
            id: 2,
            name: "Descarga Focalizada",
            desc: "Un relámpago continuo salta desde el electrodo superior directamente a la barra metálica conectada a tierra."
        }
    ];

    constructor() {
        this.group = new THREE.Group();

        // 1. Base octogonal de caoba noble y latón
        const baseGeom = new THREE.CylinderGeometry(0.48, 0.52, 0.12, 8);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x2e180d,
            roughness: 0.35,
            metalness: 0.15
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = 0.06;
        base.castShadow = true;
        base.receiveShadow = true;
        this.group.add(base);
        this.interactableMeshes.push(base);

        // Moldura perimetral dorada de latón
        const rimGeom = new THREE.CylinderGeometry(0.49, 0.53, 0.02, 8);
        const brassMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            roughness: 0.25,
            metalness: 0.9
        });
        const baseRim = new THREE.Mesh(rimGeom, brassMat);
        baseRim.position.y = 0.11;
        this.group.add(baseRim);

        // 2. Bobinado primario helicoidal (Tubos de cobre grueso en espiral cónica)
        const primaryCoilGroup = new THREE.Group();
        primaryCoilGroup.position.y = 0.14;
        const copperMat = new THREE.MeshStandardMaterial({
            color: 0xb87333,
            roughness: 0.2,
            metalness: 0.95
        });

        for (let i = 0; i < 6; i++) {
            const r = 0.24 + i * 0.025;
            const turnGeom = new THREE.TorusGeometry(r, 0.012, 12, 32);
            turnGeom.rotateX(Math.PI / 2);
            const turn = new THREE.Mesh(turnGeom, copperMat);
            turn.position.y = i * 0.022;
            primaryCoilGroup.add(turn);
        }
        this.group.add(primaryCoilGroup);

        // 3. Bobinado secundario vertical (Columna con miles de vueltas de alambre fino)
        const secondaryHeight = 0.58;
        const secondaryGeom = new THREE.CylinderGeometry(0.09, 0.09, secondaryHeight, 32);
        const wireMat = new THREE.MeshStandardMaterial({
            color: 0x92400e,
            roughness: 0.3,
            metalness: 0.85
        });
        const secondaryCoil = new THREE.Mesh(secondaryGeom, wireMat);
        secondaryCoil.position.y = 0.12 + secondaryHeight / 2;
        secondaryCoil.castShadow = true;
        this.group.add(secondaryCoil);
        this.interactableMeshes.push(secondaryCoil);

        // Aislador superior cerámico vitrificado
        const insulatorGeom = new THREE.CylinderGeometry(0.06, 0.09, 0.06, 24);
        const insulatorMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.1,
            metalness: 0.1
        });
        const insulator = new THREE.Mesh(insulatorGeom, insulatorMat);
        insulator.position.y = 0.12 + secondaryHeight + 0.03;
        this.group.add(insulator);

        // 4. Toroide superior de aluminio pulido de alta descarga
        const toroidGeom = new THREE.TorusGeometry(0.24, 0.075, 24, 48);
        toroidGeom.rotateX(Math.PI / 2);
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xf1f5f9,
            roughness: 0.08,
            metalness: 0.98
        });
        this.toroidMesh = new THREE.Mesh(toroidGeom, chromeMat);
        this.toroidMesh.position.y = 0.12 + secondaryHeight + 0.10;
        this.toroidMesh.castShadow = true;
        this.group.add(this.toroidMesh);
        this.interactableMeshes.push(this.toroidMesh);

        // Terminal de descarga con punta esférica
        const terminalGeom = new THREE.SphereGeometry(0.028, 16, 16);
        const terminalMesh = new THREE.Mesh(terminalGeom, chromeMat);
        terminalMesh.position.set(0, 0.12 + secondaryHeight + 0.18, 0);
        this.group.add(terminalMesh);

        const sparkRodGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.09, 12);
        const sparkRod = new THREE.Mesh(sparkRodGeom, chromeMat);
        sparkRod.position.set(0.18, 0.12 + secondaryHeight + 0.10, 0);
        sparkRod.rotation.z = Math.PI / 4;
        this.group.add(sparkRod);

        // Luz estroboscópica de la chispa
        this.sparkLight = new THREE.PointLight(0x38bdf8, 2.5, 5.0, 2.0);
        this.sparkLight.position.set(0, 0.12 + secondaryHeight + 0.16, 0);
        this.group.add(this.sparkLight);

        // 5. Barra de tierra receptora de arcos
        const groundRodHolder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.04, 16),
            baseMat
        );
        groundRodHolder.position.set(-0.35, 0.12, -0.22);
        this.group.add(groundRodHolder);

        const groundRod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.55, 12),
            brassMat
        );
        groundRod.position.set(-0.35, 0.39, -0.22);
        this.group.add(groundRod);

        const groundSphere = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 16), brassMat);
        groundSphere.position.set(-0.35, 0.67, -0.22);
        this.group.add(groundSphere);

        // 6. TUBO FLUORESCENTE INALÁMBRICO (Sostenido en un atril cercano)
        const tubeStand = new THREE.Group();
        tubeStand.position.set(0.38, 0.12, 0.22);

        const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.03, 16), baseMat);
        standBase.position.y = 0.015;
        tubeStand.add(standBase);

        const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.42, 12), brassMat);
        standPole.position.y = 0.22;
        tubeStand.add(standPole);

        // Tubo de vidrio fluorescente vertical
        const tubeGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.44, 16);
        const tubeGlassMat = new THREE.MeshStandardMaterial({
            color: 0xd4f1ff,
            transparent: true,
            opacity: 0.35,
            roughness: 0.1,
            metalness: 0.2
        });
        const tubeShell = new THREE.Mesh(tubeGeom, tubeGlassMat);
        tubeShell.position.set(0, 0.44, 0);
        tubeStand.add(tubeShell);

        // Núcleo luminiscente interior que se excita por el campo electromagnético
        const coreGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.42, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.95
        });
        this.tubeCore = new THREE.Mesh(coreGeom, coreMat);
        this.tubeCore.position.set(0, 0.44, 0);
        tubeStand.add(this.tubeCore);

        // Halo aditivo del tubo
        const glowGeom = new THREE.CylinderGeometry(0.032, 0.032, 0.45, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending
        });
        this.tubeGlow = new THREE.Mesh(glowGeom, glowMat);
        this.tubeGlow.position.set(0, 0.44, 0);
        tubeStand.add(this.tubeGlow);

        this.tubeLight = new THREE.PointLight(0x00f0ff, 2.2, 4.0, 2.0);
        this.tubeLight.position.set(0, 0.44, 0);
        tubeStand.add(this.tubeLight);

        this.group.add(tubeStand);
        this.interactableMeshes.push(tubeShell);

        
        // 7. ARCOS DE RAYOS TUBE GEOMETRY
        const arcMat = new THREE.MeshBasicMaterial({
            color: 0x67e8f9,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending
        });
        
        for (let i = 0; i < 4; i++) {
            const curve = new THREE.CatmullRomCurve3(Array(8).fill(new THREE.Vector3()));
            this.arcCurves.push(curve);
            const geom = new THREE.TubeGeometry(curve, 16, 0.015, 8, false);
            this.arcGeometries.push(geom);
            const mesh = new THREE.Mesh(geom, arcMat);
            this.arcMeshes.push(mesh);
            this.group.add(mesh);
            
            const canvas = document.createElement('canvas');
            canvas.width = 32; canvas.height = 32;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.2, 'rgba(103, 232, 249, 1)');
                grad.addColorStop(1, 'rgba(103, 232, 249, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 32, 32);
            }
            
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
                map: new THREE.CanvasTexture(canvas),
                blending: THREE.AdditiveBlending,
                transparent: true
            }));
            sprite.scale.set(0.15, 0.15, 1);
            this.sparkSprites.push(sprite);
            this.group.add(sprite);
        }

        // 8. ELECTROMAGNETIC FIELD RINGS
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        [0.5, 0.8, 1.1].forEach(r => {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 8, 24), ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.12 + 0.58 + 0.10;
            this.fieldRings.push(ring);
            this.group.add(ring);
        });

    }

    public cycleMode(): TeslaModeInfo {
        this.currentMode = (this.currentMode + 1) % this.modes.length;
        SoundSynthesizer.getInstance().playTeslaZap(1.2);
        return this.modes[this.currentMode];
    }

    public getCurrentModeInfo(): TeslaModeInfo {
        return this.modes[this.currentMode];
    }
    
    public setSleep(sleep: boolean): void {
        this.isSleeping = sleep;
        if (this.sparkLight) this.sparkLight.visible = !sleep;
        if (this.tubeLight) this.tubeLight.visible = !sleep;
    }

    public update(time: number, playerDist?: number): void {
        if (this.isSleeping) return;
        const toroidY = 0.12 + 0.58 + 0.10;
        const startPos = new THREE.Vector3(0, toroidY + 0.02, 0);

        if (time - this.lastZapTime > 0.18 + Math.random() * 0.12) {
            this.lastZapTime = time;
            if (playerDist === undefined || playerDist < 12) {
                const vol = playerDist !== undefined ? Math.max(0.08, 1 - (playerDist / 12)) : 0.4;
                SoundSynthesizer.getInstance().playTeslaZap(vol);
            }
        }

        this.arcMeshes.forEach(m => m.visible = false);
        this.sparkSprites.forEach(s => s.visible = false);
        this.fieldRings.forEach(r => r.visible = false);

        const updateTube = (index: number, pts: THREE.Vector3[]) => {
            this.arcCurves[index].points = pts;
            this.arcMeshes[index].geometry.dispose();
            this.arcMeshes[index].geometry = new THREE.TubeGeometry(this.arcCurves[index], 16, 0.015, 8, false);
            this.arcMeshes[index].visible = true;
        };

        if (this.currentMode === 0) {
            this.fieldRings.forEach((r, i) => {
                r.visible = true;
                const s = 1.0 + Math.sin(time * 3 + i * 2) * 0.5 + 0.5;
                r.scale.set(s, s, s);
                (r.material as THREE.MeshBasicMaterial).opacity = 0.15 * (1 - (s - 1.0));
            });

            const targetPos = new THREE.Vector3(0.38, 0.56, 0.22);
            let pts = [];
            const steps = 7;
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const next = new THREE.Vector3().lerpVectors(startPos, targetPos, t);
                if (s > 0 && s < steps) {
                    next.x += (Math.random() - 0.5) * 0.08;
                    next.y += (Math.random() - 0.5) * 0.08;
                    next.z += (Math.random() - 0.5) * 0.08;
                }
                pts.push(next);
            }
            updateTube(0, pts);
            this.sparkSprites[0].position.copy(targetPos);
            this.sparkSprites[0].visible = true;
            this.sparkSprites[0].scale.setScalar(0.15 + Math.random() * 0.1);

            const coreMat = this.tubeCore.material as THREE.MeshBasicMaterial;
            const glowMat = this.tubeGlow.material as THREE.MeshBasicMaterial;
            const pulse = 0.85 + Math.sin(time * 24) * 0.15;
            coreMat.opacity = pulse;
            glowMat.opacity = 0.45 * pulse;
            this.tubeLight.intensity = 2.2 * pulse;
            this.sparkLight.intensity = 1.8 * pulse;

        } else if (this.currentMode === 1) {
            const arcCount = 4;
            for (let a = 0; a < arcCount; a++) {
                const angle = (a / arcCount) * Math.PI * 2 + Math.sin(time * 6 + a) * 0.5;
                const endRadius = 0.32 + Math.random() * 0.15;
                const endPos = new THREE.Vector3(
                    Math.cos(angle) * endRadius,
                    toroidY + (Math.random() - 0.5) * 0.25,
                    Math.sin(angle) * endRadius
                );

                let pts = [];
                const steps = 7;
                for (let s = 0; s <= steps; s++) {
                    const t = s / steps;
                    const next = new THREE.Vector3().lerpVectors(startPos, endPos, t);
                    if (s > 0 && s < steps) {
                        next.x += (Math.random() - 0.5) * 0.06;
                        next.y += (Math.random() - 0.5) * 0.06;
                        next.z += (Math.random() - 0.5) * 0.06;
                    }
                    pts.push(next);
                }
                updateTube(a, pts);
                this.sparkSprites[a].position.copy(endPos);
                this.sparkSprites[a].visible = true;
                this.sparkSprites[a].scale.setScalar(0.1 + Math.random() * 0.1);
            }

            const coreMat = this.tubeCore.material as THREE.MeshBasicMaterial;
            const glowMat = this.tubeGlow.material as THREE.MeshBasicMaterial;
            const pulse = 0.5 + Math.random() * 0.4;
            coreMat.opacity = pulse;
            glowMat.opacity = 0.25 * pulse;
            this.tubeLight.intensity = 1.2 * pulse;
            this.sparkLight.intensity = 2.8;

        } else {
            const groundPos = new THREE.Vector3(-0.35, 0.67, -0.22);
            let pts = [];
            const steps = 7;
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const next = new THREE.Vector3().lerpVectors(startPos, groundPos, t);
                if (s > 0 && s < steps) {
                    next.x += (Math.random() - 0.5) * 0.09;
                    next.y += (Math.random() - 0.5) * 0.09;
                    next.z += (Math.random() - 0.5) * 0.09;
                }
                pts.push(next);
            }
            updateTube(0, pts);
            this.sparkSprites[0].position.copy(groundPos);
            this.sparkSprites[0].visible = true;
            this.sparkSprites[0].scale.setScalar(0.2 + Math.random() * 0.15);

            const coreMat = this.tubeCore.material as THREE.MeshBasicMaterial;
            const glowMat = this.tubeGlow.material as THREE.MeshBasicMaterial;
            coreMat.opacity = 0.08;
            glowMat.opacity = 0.0;
            this.tubeLight.intensity = 0.0;
            this.sparkLight.intensity = 3.2;
        }
    }


    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }
}
