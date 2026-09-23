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

        // 1. Base (Madera oscura y latón)
        const baseGeom = new THREE.CylinderGeometry(0.5, 0.55, 0.1, 16);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x3e2723,
            roughness: 0.7,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = 0.05;
        base.castShadow = true;
        base.receiveShadow = true;
        this.group.add(base);
        this.interactableMeshes.push(base);

        const rimGeom = new THREE.CylinderGeometry(0.51, 0.56, 0.02, 16);
        const brassMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            roughness: 0.3,
            metalness: 0.8
        });
        const baseRim = new THREE.Mesh(rimGeom, brassMat);
        baseRim.position.y = 0.09;
        this.group.add(baseRim);

        // 2. Bobina Primaria (Cobre grueso y ancho en la base)
        const primaryCoilGroup = new THREE.Group();
        primaryCoilGroup.position.y = 0.12;
        const copperMat = new THREE.MeshStandardMaterial({
            color: 0xb87333,
            roughness: 0.2,
            metalness: 0.95
        });

        for (let i = 0; i < 5; i++) {
            const r = 0.35 - i * 0.04;
            const turnGeom = new THREE.TorusGeometry(r, 0.015, 16, 32);
            turnGeom.rotateX(Math.PI / 2);
            const turn = new THREE.Mesh(turnGeom, copperMat);
            turn.position.y = i * 0.03;
            primaryCoilGroup.add(turn);
        }
        this.group.add(primaryCoilGroup);

        // 3. Bobina Secundaria (Alta, cilíndrica, con textura de alambre)
        const secondaryHeight = 0.8;
        const secondaryGeom = new THREE.CylinderGeometry(0.08, 0.08, secondaryHeight, 32);
        
        // Crear textura de alambre
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#7a3b10'; // Fondo oscuro
            ctx.fillRect(0, 0, 256, 512);
            ctx.fillStyle = '#a6541f'; // Alambre claro
            for (let y = 0; y < 512; y += 4) {
                ctx.fillRect(0, y, 256, 2);
            }
        }
        const wireTex = new THREE.CanvasTexture(canvas);
        wireTex.wrapS = THREE.RepeatWrapping;
        wireTex.wrapT = THREE.RepeatWrapping;
        wireTex.repeat.set(1, 4);

        const wireMat = new THREE.MeshStandardMaterial({
            map: wireTex,
            roughness: 0.4,
            metalness: 0.6
        });
        const secondaryCoil = new THREE.Mesh(secondaryGeom, wireMat);
        secondaryCoil.position.y = 0.12 + secondaryHeight / 2;
        secondaryCoil.castShadow = true;
        this.group.add(secondaryCoil);
        this.interactableMeshes.push(secondaryCoil);

        // 4. Toroide Superior (Elegante y muy metálico)
        const toroidGeom = new THREE.TorusGeometry(0.28, 0.1, 32, 64);
        toroidGeom.rotateX(Math.PI / 2);
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.1,
            metalness: 1.0
        });
        this.toroidMesh = new THREE.Mesh(toroidGeom, chromeMat);
        this.toroidMesh.position.y = 0.12 + secondaryHeight + 0.1;
        this.toroidMesh.castShadow = true;
        this.group.add(this.toroidMesh);
        this.interactableMeshes.push(this.toroidMesh);

        const terminalGeom = new THREE.SphereGeometry(0.03, 16, 16);
        const terminalMesh = new THREE.Mesh(terminalGeom, chromeMat);
        terminalMesh.position.set(0, 0.12 + secondaryHeight + 0.2, 0);
        this.group.add(terminalMesh);

        // Luz estroboscópica
        this.sparkLight = new THREE.PointLight(0x38bdf8, 2.5, 6.0, 2.0);
        this.sparkLight.position.set(0, 0.12 + secondaryHeight + 0.2, 0);
        this.group.add(this.sparkLight);

        // 5. Barra de tierra
        const groundRod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.8, 16),
            brassMat
        );
        groundRod.position.set(-0.6, 0.4, -0.4);
        this.group.add(groundRod);
        const groundSphere = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), chromeMat);
        groundSphere.position.set(-0.6, 0.8, -0.4);
        this.group.add(groundSphere);

        // 6. TUBO FLUORESCENTE
        const tubeStand = new THREE.Group();
        tubeStand.position.set(0.6, 0.05, 0.4);
        const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.04, 16), baseMat);
        tubeStand.add(standBase);

        const tubeGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 16);
        const tubeGlassMat = new THREE.MeshStandardMaterial({
            color: 0xd4f1ff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.2
        });
        const tubeShell = new THREE.Mesh(tubeGeom, tubeGlassMat);
        tubeShell.position.set(0, 0.34, 0);
        tubeStand.add(tubeShell);

        const coreGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.58, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.95
        });
        this.tubeCore = new THREE.Mesh(coreGeom, coreMat);
        this.tubeCore.position.set(0, 0.34, 0);
        tubeStand.add(this.tubeCore);

        const glowGeom = new THREE.CylinderGeometry(0.032, 0.032, 0.62, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending
        });
        this.tubeGlow = new THREE.Mesh(glowGeom, glowMat);
        this.tubeGlow.position.set(0, 0.34, 0);
        tubeStand.add(this.tubeGlow);

        this.tubeLight = new THREE.PointLight(0x00f0ff, 2.2, 4.0, 2.0);
        this.tubeLight.position.set(0, 0.34, 0);
        tubeStand.add(this.tubeLight);

        this.group.add(tubeStand);
        this.interactableMeshes.push(tubeShell);
        
        // 7. ARCOS DE RAYOS (CatmullRomCurve3)
        const arcMat = new THREE.MeshBasicMaterial({
            color: 0x67e8f9,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending
        });
        
        for (let i = 0; i < 5; i++) {
            const curve = new THREE.CatmullRomCurve3(Array(10).fill(new THREE.Vector3()));
            this.arcCurves.push(curve);
            const geom = new THREE.TubeGeometry(curve, 32, 0.01, 8, false);
            this.arcGeometries.push(geom);
            const mesh = new THREE.Mesh(geom, arcMat);
            this.arcMeshes.push(mesh);
            this.group.add(mesh);
            
            const spriteCanvas = document.createElement('canvas');
            spriteCanvas.width = 32; spriteCanvas.height = 32;
            const spriteCtx = spriteCanvas.getContext('2d');
            if (spriteCtx) {
                const grad = spriteCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.2, 'rgba(103, 232, 249, 1)');
                grad.addColorStop(1, 'rgba(103, 232, 249, 0)');
                spriteCtx.fillStyle = grad;
                spriteCtx.fillRect(0, 0, 32, 32);
            }
            
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
                map: new THREE.CanvasTexture(spriteCanvas),
                blending: THREE.AdditiveBlending,
                transparent: true
            }));
            sprite.scale.set(0.2, 0.2, 1);
            this.sparkSprites.push(sprite);
            this.group.add(sprite);
        }

        // 8. ANILLOS DE CAMPO
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        [0.6, 0.9, 1.2].forEach(r => {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 8, 32), ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.12 + 0.8 + 0.1;
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
        const toroidY = 0.12 + 0.8 + 0.1;
        const startPos = new THREE.Vector3(0, toroidY + 0.05, 0);

        if (time - this.lastZapTime > 0.12 + Math.random() * 0.1) {
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
            this.arcMeshes[index].geometry = new THREE.TubeGeometry(this.arcCurves[index], 32, 0.01 + Math.random()*0.005, 8, false);
            this.arcMeshes[index].visible = true;
        };

        if (this.currentMode === 0) { // Transmisión Inalámbrica
            this.fieldRings.forEach((r, i) => {
                r.visible = true;
                const s = 1.0 + Math.sin(time * 3 + i * 2) * 0.5 + 0.5;
                r.scale.set(s, s, s);
                (r.material as THREE.MeshBasicMaterial).opacity = 0.15 * (1 - (s - 1.0));
            });

            const targetPos = new THREE.Vector3(0.6, 0.4, 0.4);
            let pts = [];
            const steps = 9;
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const next = new THREE.Vector3().lerpVectors(startPos, targetPos, t);
                if (s > 0 && s < steps) {
                    next.x += (Math.random() - 0.5) * 0.15;
                    next.y += (Math.random() - 0.5) * 0.15;
                    next.z += (Math.random() - 0.5) * 0.15;
                }
                pts.push(next);
            }
            updateTube(0, pts);
            this.sparkSprites[0].position.copy(targetPos);
            this.sparkSprites[0].visible = true;

            const coreMat = this.tubeCore.material as THREE.MeshBasicMaterial;
            const glowMat = this.tubeGlow.material as THREE.MeshBasicMaterial;
            const pulse = 0.85 + Math.sin(time * 24) * 0.15;
            coreMat.opacity = pulse;
            glowMat.opacity = 0.45 * pulse;
            this.tubeLight.intensity = 2.2 * pulse;
            this.sparkLight.intensity = 1.8 * pulse;

        } else if (this.currentMode === 1) { // Tormenta de Plasma
            const arcCount = 5;
            for (let a = 0; a < arcCount; a++) {
                const angle = (a / arcCount) * Math.PI * 2 + Math.sin(time * 10 + a) * 0.5;
                const endRadius = 0.4 + Math.random() * 0.3;
                const endPos = new THREE.Vector3(
                    Math.cos(angle) * endRadius,
                    toroidY + (Math.random() - 0.5) * 0.5,
                    Math.sin(angle) * endRadius
                );

                let pts = [];
                const steps = 9;
                for (let s = 0; s <= steps; s++) {
                    const t = s / steps;
                    const next = new THREE.Vector3().lerpVectors(startPos, endPos, t);
                    if (s > 0 && s < steps) {
                        next.x += (Math.random() - 0.5) * 0.25;
                        next.y += (Math.random() - 0.5) * 0.25;
                        next.z += (Math.random() - 0.5) * 0.25;
                    }
                    pts.push(next);
                }
                updateTube(a, pts);
                this.sparkSprites[a].position.copy(endPos);
                this.sparkSprites[a].visible = true;
            }

            const coreMat = this.tubeCore.material as THREE.MeshBasicMaterial;
            const glowMat = this.tubeGlow.material as THREE.MeshBasicMaterial;
            const pulse = 0.3 + Math.random() * 0.4;
            coreMat.opacity = pulse;
            glowMat.opacity = 0.15 * pulse;
            this.tubeLight.intensity = 1.0 * pulse;
            this.sparkLight.intensity = 3.5;

        } else { // Descarga Focalizada
            const groundPos = new THREE.Vector3(-0.6, 0.8, -0.4);
            let pts = [];
            const steps = 12; // Más detalle en el arco
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const next = new THREE.Vector3().lerpVectors(startPos, groundPos, t);
                if (s > 0 && s < steps) {
                    next.x += (Math.random() - 0.5) * 0.2;
                    next.y += (Math.random() - 0.5) * 0.2;
                    next.z += (Math.random() - 0.5) * 0.2;
                }
                pts.push(next);
            }
            updateTube(0, pts);
            this.sparkSprites[0].position.copy(groundPos);
            this.sparkSprites[0].visible = true;

            const coreMat = this.tubeCore.material as THREE.MeshBasicMaterial;
            const glowMat = this.tubeGlow.material as THREE.MeshBasicMaterial;
            coreMat.opacity = 0.05;
            glowMat.opacity = 0.0;
            this.tubeLight.intensity = 0.0;
            this.sparkLight.intensity = 4.0;
        }
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }
}
