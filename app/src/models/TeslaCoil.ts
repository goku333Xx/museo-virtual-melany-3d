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
    private haloMesh!: THREE.Mesh;
    private isSleeping: boolean = false;
    private arcLines: THREE.Line[] = [];
    private arcPositions: Float32Array[] = [];
    private arcTargets: THREE.Vector3[] = [];
    private sparkSprites: THREE.Sprite[] = [];

    // Tubo fluorescente inalámbrico
    private tubeCore: THREE.Mesh;
    private tubeGlow: THREE.Mesh;
    private tubeLight: THREE.PointLight;
    private sparkLight: THREE.PointLight;

    // Modos de operación
    private currentMode: number = 0;
    private lastZapTime: number = 0;
    private lastArcUpdate: number = 0;
    
    // Performance: Variables pre-alocadas para evitar Garbage Collection
    private startPos = new THREE.Vector3();
    private targetPos = new THREE.Vector3(0.6, 0.4, 0.4);
    private groundPos = new THREE.Vector3(-0.6, 0.8, -0.4);

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
        const aluminumMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.15,
            metalness: 1.0
        });
        this.toroidMesh = new THREE.Mesh(toroidGeom, aluminumMat);
        this.toroidMesh.position.y = 0.12 + secondaryHeight + 0.1;
        this.toroidMesh.castShadow = true;
        this.group.add(this.toroidMesh);
        this.interactableMeshes.push(this.toroidMesh);

        // Halo / Glow sphere around toroid
        const haloGeom = new THREE.SphereGeometry(0.42, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.0, // Pulsed in update()
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.haloMesh = new THREE.Mesh(haloGeom, haloMat);
        this.haloMesh.position.y = this.toroidMesh.position.y;
        this.group.add(this.haloMesh);

        const terminalGeom = new THREE.SphereGeometry(0.03, 16, 16);
        const terminalMesh = new THREE.Mesh(terminalGeom, aluminumMat);
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
        const groundSphere = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), aluminumMat);
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
        
        // 7. ARCOS DE RAYOS (THREE.Line)
        const arcMat = new THREE.LineBasicMaterial({
            color: 0xccffff,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending
        });
        
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
        
        const sparkMat = new THREE.SpriteMaterial({ 
            map: new THREE.CanvasTexture(spriteCanvas),
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        const MAX_POINTS = 16;
        for (let i = 0; i < 5; i++) {
            const geom = new THREE.BufferGeometry();
            const positions = new Float32Array(MAX_POINTS * 3);
            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const line = new THREE.Line(geom, arcMat);
            this.arcLines.push(line);
            this.arcPositions.push(positions);
            this.arcTargets.push(new THREE.Vector3());
            this.group.add(line);
            
            const sprite = new THREE.Sprite(sparkMat);
            sprite.scale.set(0.2, 0.2, 1);
            this.sparkSprites.push(sprite);
            this.group.add(sprite);
        }

        // Eliminados los anillos de campo a favor de rayos más realistas
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
        this.startPos.set(0, toroidY + 0.05, 0);

        if (time - this.lastZapTime > 0.12 + Math.random() * 0.1) {
            this.lastZapTime = time;
            if (playerDist === undefined || playerDist < 12) {
                const vol = playerDist !== undefined ? Math.max(0.08, 1 - (playerDist / 12)) : 0.4;
                SoundSynthesizer.getInstance().playTeslaZap(vol);
            }
        }

        const updateArcs = (time - this.lastArcUpdate > 0.05); // Actualizar rayos cada 50ms (0.05s)
        if (updateArcs) {
            this.lastArcUpdate = time;
        }

        this.arcLines.forEach(l => l.visible = false);
        this.sparkSprites.forEach(s => s.visible = false);

        const updateLine = (index: number, start: THREE.Vector3, end: THREE.Vector3, jitter: number) => {
            if (updateArcs) {
                const positions = this.arcPositions[index];
                const steps = 15; // 16 puntos
                for (let s = 0; s <= steps; s++) {
                    const t = s / steps;
                    let x = start.x + (end.x - start.x) * t;
                    let y = start.y + (end.y - start.y) * t;
                    let z = start.z + (end.z - start.z) * t;
                    
                    if (s > 0 && s < steps) {
                        const env = Math.sin(t * Math.PI);
                        x += (Math.random() - 0.5) * jitter * env;
                        y += (Math.random() - 0.5) * jitter * env;
                        z += (Math.random() - 0.5) * jitter * env;
                    }
                    
                    positions[s * 3] = x;
                    positions[s * 3 + 1] = y;
                    positions[s * 3 + 2] = z;
                }
                const attr = this.arcLines[index].geometry.getAttribute('position') as THREE.BufferAttribute;
                attr.needsUpdate = true;
            }
            this.arcLines[index].visible = true;
        };

        let haloBaseOpacity = 0;

        if (this.currentMode === 0) { // Transmisión Inalámbrica
            this.targetPos.set(0.6, 0.4, 0.4);
            updateLine(0, this.startPos, this.targetPos, 0.2);
            this.sparkSprites[0].position.copy(this.targetPos);
            this.sparkSprites[0].visible = true;

            const coreMat = this.tubeCore.material as THREE.MeshBasicMaterial;
            const glowMat = this.tubeGlow.material as THREE.MeshBasicMaterial;
            const pulse = 0.85 + Math.sin(time * 24) * 0.15;
            coreMat.opacity = pulse;
            glowMat.opacity = 0.45 * pulse;
            this.tubeLight.intensity = 2.2 * pulse;
            this.sparkLight.intensity = 1.8 * pulse;
            haloBaseOpacity = 0.08 * pulse;

        } else if (this.currentMode === 1) { // Tormenta de Plasma
            const arcCount = 5;
            for (let a = 0; a < arcCount; a++) {
                if (updateArcs) {
                    const angle = (a / arcCount) * Math.PI * 2 + Math.sin(time * 10 + a) * 0.5;
                    const endRadius = 0.4 + Math.random() * 0.3;
                    this.arcTargets[a].set(
                        Math.cos(angle) * endRadius,
                        toroidY + (Math.random() - 0.5) * 0.5,
                        Math.sin(angle) * endRadius
                    );
                }

                updateLine(a, this.startPos, this.arcTargets[a], 0.3);
                this.sparkSprites[a].position.copy(this.arcTargets[a]);
                this.sparkSprites[a].visible = true;
            }

            const coreMat = this.tubeCore.material as THREE.MeshBasicMaterial;
            const glowMat = this.tubeGlow.material as THREE.MeshBasicMaterial;
            const pulse = 0.3 + Math.random() * 0.4;
            coreMat.opacity = pulse;
            glowMat.opacity = 0.15 * pulse;
            this.tubeLight.intensity = 1.0 * pulse;
            this.sparkLight.intensity = 3.5;
            haloBaseOpacity = 0.15 + Math.random() * 0.05;

        } else { // Descarga Focalizada
            this.groundPos.set(-0.6, 0.8, -0.4);
            updateLine(0, this.startPos, this.groundPos, 0.25);
            this.sparkSprites[0].position.copy(this.groundPos);
            this.sparkSprites[0].visible = true;

            const coreMat = this.tubeCore.material as THREE.MeshBasicMaterial;
            const glowMat = this.tubeGlow.material as THREE.MeshBasicMaterial;
            coreMat.opacity = 0.05;
            glowMat.opacity = 0.0;
            this.tubeLight.intensity = 0.0;
            this.sparkLight.intensity = 4.0;
            haloBaseOpacity = 0.12 + Math.random() * 0.08;
        }

        if (this.haloMesh) {
            const haloMat = this.haloMesh.material as THREE.MeshBasicMaterial;
            haloMat.opacity = haloBaseOpacity;
        }
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }
}
