import * as THREE from 'three';
import { SoundSynthesizer } from '../SoundSynthesizer';

export interface CradleModeInfo {
    id: number;
    name: string;
    desc: string;
}

export class NewtonsCradle {
    private group: THREE.Group;
    private spheres: THREE.Mesh[] = [];
    private pendulums: THREE.Group[] = [];
    private interactableMeshes: THREE.Object3D[] = [];

    private prevSineWave: number = 0;
    private prevSymWave: number = 0;

    // Modos de física realista de conservación de momento
    private currentMode: number = 0;
    private readonly modes: CradleModeInfo[] = [
        {
            id: 0,
            name: "1 Bola (Impacto Simple)",
            desc: "1 bola impacta a la velocidad v; la energía viaja por las 3 bolas centrales estáticas y expulsa a 1 sola bola del extremo."
        },
        {
            id: 1,
            name: "2 Bolas (Impacto Doble)",
            desc: "2 bolas chocan juntas; la del centro permanece completamente quieta y 2 bolas salen disparadas al otro extremo."
        },
        {
            id: 2,
            name: "3 Bolas (Transferencia Masiva)",
            desc: "3 bolas oscilan en bloque; la energía desplaza al grupo manteniendo la cantidad de movimiento total."
        },
        {
            id: 3,
            name: "Colisión Simétrica",
            desc: "Las 2 bolas de los extremos se sueltan simultáneamente y rebotan de forma especular contra las 3 del centro."
        }
    ];

    constructor() {
        this.group = new THREE.Group();
        this.createCradle();
    }

    private createCradle() {
        // Base de madera noble pulida
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x3b2413,
            roughness: 0.4,
            metalness: 0.1
        });
        
        // Acero cromado brillante para capturar la luz del halo flotante
        const chromeMaterial = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.08,
            metalness: 0.98
        });

        // Base geometry
        const baseGeometry = new THREE.BoxGeometry(10, 0.6, 6);
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.3;
        base.castShadow = true;
        base.receiveShadow = true;
        this.group.add(base);
        this.interactableMeshes.push(base);

        // Estructura tubular de soporte
        const frameRadius = 0.22;
        const frameHeight = 7.5;
        const frameGeometry = new THREE.CylinderGeometry(frameRadius, frameRadius, frameHeight, 20);
        
        const pillar1 = new THREE.Mesh(frameGeometry, chromeMaterial);
        pillar1.position.set(-4, frameHeight / 2 + 0.3, -2.2);
        
        const pillar2 = new THREE.Mesh(frameGeometry, chromeMaterial);
        pillar2.position.set(4, frameHeight / 2 + 0.3, -2.2);
        
        const pillar3 = new THREE.Mesh(frameGeometry, chromeMaterial);
        pillar3.position.set(-4, frameHeight / 2 + 0.3, 2.2);
        
        const pillar4 = new THREE.Mesh(frameGeometry, chromeMaterial);
        pillar4.position.set(4, frameHeight / 2 + 0.3, 2.2);
        
        const topBar1 = new THREE.Mesh(new THREE.CylinderGeometry(frameRadius, frameRadius, 8.4, 20), chromeMaterial);
        topBar1.rotation.z = Math.PI / 2;
        topBar1.position.set(0, frameHeight + 0.3, -2.2);
        
        const topBar2 = new THREE.Mesh(new THREE.CylinderGeometry(frameRadius, frameRadius, 8.4, 20), chromeMaterial);
        topBar2.rotation.z = Math.PI / 2;
        topBar2.position.set(0, frameHeight + 0.3, 2.2);
        
        this.group.add(pillar1, pillar2, pillar3, pillar4, topBar1, topBar2);
        this.interactableMeshes.push(pillar1, pillar2, pillar3, pillar4, topBar1, topBar2);

        // 5 Esferas cromadas perfectamente alineadas
        const numSpheres = 5;
        const sphereRadius = 0.8;
        const spacing = sphereRadius * 2;
        const stringLength = 5.5;
        
        const stringMaterial = new THREE.LineBasicMaterial({ color: 0x94a3b8 });
        
        for (let i = 0; i < numSpheres; i++) {
            const pendulumGroup = new THREE.Group();
            const xPos = (i - (numSpheres - 1) / 2) * spacing;
            
            // Esfera cromada de alta calidad
            const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
            const sphere = new THREE.Mesh(sphereGeometry, chromeMaterial);
            sphere.position.y = -stringLength;
            sphere.castShadow = true;
            this.spheres.push(sphere);
            this.interactableMeshes.push(sphere);
            
            // Hilos en V dobles
            const stringGeometry1 = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, -2.2),
                new THREE.Vector3(0, -stringLength, 0)
            ]);
            const string1 = new THREE.Line(stringGeometry1, stringMaterial);
            
            const stringGeometry2 = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 2.2),
                new THREE.Vector3(0, -stringLength, 0)
            ]);
            const string2 = new THREE.Line(stringGeometry2, stringMaterial);
            
            pendulumGroup.add(sphere);
            pendulumGroup.add(string1);
            pendulumGroup.add(string2);
            
            pendulumGroup.position.set(xPos, frameHeight + 0.3, 0);
            
            this.pendulums.push(pendulumGroup);
            this.group.add(pendulumGroup);
        }
    }

    // Cicla entre los 4 modos de física
    public cycleMode(): CradleModeInfo {
        this.currentMode = (this.currentMode + 1) % this.modes.length;
        // Resetear rotaciones en cambio de modo
        for (let i = 0; i < this.pendulums.length; i++) {
            this.pendulums[i].rotation.z = 0;
        }
        return this.modes[this.currentMode];
    }

    public getCurrentModeInfo(): CradleModeInfo {
        return this.modes[this.currentMode];
    }

    public update(time: number, playerDist?: number) {
        const swingMaxAngle = Math.PI / 4.2;
        const speed = 3.4;
        const t = time * speed;
        const sineWave = Math.sin(t);

        // Limpiar todas las rotaciones primero
        for (let i = 0; i < this.pendulums.length; i++) {
            this.pendulums[i].rotation.z = 0;
        }

        // Detección física del instante de colisión (cruce por cero del péndulo)
        if (this.currentMode !== 3) {
            if ((this.prevSineWave < 0 && sineWave >= 0) || (this.prevSineWave > 0 && sineWave <= 0)) {
                if (playerDist === undefined || playerDist < 14) {
                    const volumeFactor = playerDist !== undefined ? Math.max(0.08, 1 - (playerDist / 14)) : 0.45;
                    SoundSynthesizer.getInstance().playNewtonClack(volumeFactor);
                }
            }
            this.prevSineWave = sineWave;
        }

        switch (this.currentMode) {
            case 0:
                // Modo 1 Bola: Péndulo 0 oscila en semiciclo negativo, Péndulo 4 en positivo
                if (sineWave > 0) {
                    this.pendulums[4].rotation.z = Math.sin(sineWave * Math.PI / 2) * swingMaxAngle;
                } else {
                    this.pendulums[0].rotation.z = Math.sin(sineWave * Math.PI / 2) * swingMaxAngle;
                }
                break;

            case 1:
                // Modo 2 y 2: Las bolas 0 y 1 oscilan juntas, la 2 (centro) QUIETA, las bolas 3 y 4 oscilan juntas
                if (sineWave > 0) {
                    const angle = Math.sin(sineWave * Math.PI / 2) * swingMaxAngle;
                    this.pendulums[3].rotation.z = angle;
                    this.pendulums[4].rotation.z = angle;
                } else {
                    const angle = Math.sin(sineWave * Math.PI / 2) * swingMaxAngle;
                    this.pendulums[0].rotation.z = angle;
                    this.pendulums[1].rotation.z = angle;
                }
                break;

            case 2:
                // Modo 3 Bolas: Bolas 0, 1, 2 en un lado vs 2, 3, 4 en el otro
                if (sineWave > 0) {
                    const angle = Math.sin(sineWave * Math.PI / 2) * swingMaxAngle;
                    this.pendulums[2].rotation.z = angle;
                    this.pendulums[3].rotation.z = angle;
                    this.pendulums[4].rotation.z = angle;
                } else {
                    const angle = Math.sin(sineWave * Math.PI / 2) * swingMaxAngle;
                    this.pendulums[0].rotation.z = angle;
                    this.pendulums[1].rotation.z = angle;
                    this.pendulums[2].rotation.z = angle;
                }
                break;

            case 3:
                // Modo Colisión Simétrica: Bolas 0 y 4 oscilan hacia afuera y rebotan a la vez
                const symRaw = Math.sin(t * 1.2);
                if ((this.prevSymWave < 0 && symRaw >= 0) || (this.prevSymWave > 0 && symRaw <= 0)) {
                    if (playerDist === undefined || playerDist < 14) {
                        const volumeFactor = playerDist !== undefined ? Math.max(0.08, 1 - (playerDist / 14)) : 0.45;
                        SoundSynthesizer.getInstance().playNewtonClack(volumeFactor);
                    }
                }
                this.prevSymWave = symRaw;

                const symAngle = Math.abs(symRaw) * swingMaxAngle;
                this.pendulums[0].rotation.z = -symAngle;
                this.pendulums[4].rotation.z = symAngle;
                break;
        }
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }
}
