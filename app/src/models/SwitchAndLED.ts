import * as THREE from 'three';

export class SwitchExhibit {
    private group: THREE.Group;
    private board: THREE.Mesh;
    private switchLeverGroup: THREE.Group;
    private ledInnerCore: THREE.Mesh;
    private ledCoronaGlow: THREE.Sprite;
    private ledLight: THREE.PointLight;

    private isOn: boolean = false;
    private interactableMeshes: THREE.Object3D[] = [];

    // Sistema de chispas en el contacto del interruptor
    private sparkCount = 35;
    private sparkGeometry!: THREE.BufferGeometry;
    private sparkPositions!: Float32Array;
    private sparkVelocities!: Float32Array;
    private sparkLifetimes!: Float32Array;
    private sparkMaxLifetimes!: Float32Array;
    private sparkPoints!: THREE.Points;
    private sparksActive: boolean = false;
    private wasActive: boolean = false;
    private isSleeping: boolean = false;
    private hintRing!: THREE.Mesh;

    // Terminales para conexión de cables
    public readonly terminalInPos = new THREE.Vector3(-0.9, 0.05, 0.8);
    public readonly terminalBridgePos = new THREE.Vector3(0.0, 0.05, 0.8);
    public readonly terminalOutPos = new THREE.Vector3(0.9, 0.05, 0.8);

    private switchContainer!: THREE.Group;

    constructor() {
        this.group = new THREE.Group();

        // 1. PLACA BASE DE LABORATORIO CENTRAL
        const boardGeom = new THREE.BoxGeometry(2.2, 0.05, 2.2);
        const boardMat = new THREE.MeshStandardMaterial({
            color: 0x18202f,
            roughness: 0.5,
            metalness: 0.3
        });
        this.board = new THREE.Mesh(boardGeom, boardMat);
        this.board.position.set(0, 0.025, 0);
        this.board.castShadow = true;
        this.board.receiveShadow = true;
        this.group.add(this.board);
        this.interactableMeshes.push(this.board);

        // Bisel de latón en la base
        const boardRimGeom = new THREE.BoxGeometry(2.25, 0.025, 2.25);
        const boardRimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });
        const boardRim = new THREE.Mesh(boardRimGeom, boardRimMat);
        boardRim.position.set(0, 0.0125, 0);
        this.group.add(boardRim);

        // 2. INTERRUPTOR INDUSTRIAL (TIPO PALANCA)
        this.switchContainer = new THREE.Group();
        this.switchContainer.position.set(0.4, 0.05, 0.3);
        this.switchContainer.scale.set(0.75, 0.75, 0.75); // Shrink by 25%
        this.group.add(this.switchContainer);

        const swBaseGeom = new THREE.BoxGeometry(0.4, 0.08, 0.6);
        const swBaseMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.7 });
        const swBase = new THREE.Mesh(swBaseGeom, swBaseMat);
        swBase.position.set(0, 0.04, 0);
        swBase.castShadow = true;
        this.switchContainer.add(swBase);
        this.interactableMeshes.push(swBase);

        // Placa superior del interruptor
        const swTopGeom = new THREE.BoxGeometry(0.35, 0.02, 0.55);
        const swTopMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 });
        const swTop = new THREE.Mesh(swTopGeom, swTopMat);
        swTop.position.set(0, 0.09, 0);
        this.switchContainer.add(swTop);

        // Soporte de la palanca
        const hingeGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16);
        hingeGeom.rotateZ(Math.PI / 2);
        const hinge = new THREE.Mesh(hingeGeom, swTopMat);
        hinge.position.set(0, 0.11, 0);
        this.switchContainer.add(hinge);

        // Grupo de la palanca animada
        this.switchLeverGroup = new THREE.Group();
        this.switchLeverGroup.position.set(0, 0.11, 0);
        this.switchLeverGroup.rotation.x = -Math.PI / 6; // Off state

        const leverGeom = new THREE.CylinderGeometry(0.02, 0.03, 0.25, 16);
        leverGeom.translate(0, 0.125, 0);
        const leverMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.3, metalness: 0.8 });
        const lever = new THREE.Mesh(leverGeom, leverMat);
        this.switchLeverGroup.add(lever);

        const knobGeom = new THREE.SphereGeometry(0.06, 32, 32);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.1 });
        const knob = new THREE.Mesh(knobGeom, knobMat);
        knob.position.set(0, 0.28, 0);
        this.switchLeverGroup.add(knob);

        this.switchContainer.add(this.switchLeverGroup);
        this.interactableMeshes.push(lever, knob);

        // Anillo de pista visual
        this.hintRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.1, 0.005, 16, 32),
            new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xfde047, metalness: 0.85, roughness: 0.2 })
        );
        this.hintRing.rotation.x = Math.PI / 2;
        this.hintRing.position.set(0, 0, 0);
        this.switchLeverGroup.add(this.hintRing);

        // 3. DIODO LED REALISTA
        const ledContainer = new THREE.Group();
        ledContainer.position.set(-0.4, 0.05, -0.2);
        ledContainer.scale.set(0.6, 0.6, 0.6); // Shrink by 40%
        this.group.add(ledContainer);

        const socketGeom = new THREE.CylinderGeometry(0.18, 0.2, 0.12, 32);
        const socketMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 });
        const socket = new THREE.Mesh(socketGeom, socketMat);
        socket.position.set(0, 0.06, 0);
        ledContainer.add(socket);
        this.interactableMeshes.push(socket);

        // Patas metálicas ánodo y cátodo
        const pinGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 16);
        const pinMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });
        const pin1 = new THREE.Mesh(pinGeom, pinMat);
        pin1.position.set(-0.05, 0.13, 0);
        const pin2 = new THREE.Mesh(pinGeom, pinMat);
        pin2.position.set(0.05, 0.13, 0);
        ledContainer.add(pin1, pin2);

        // Bombilla Premium Estandarizada
        const premiumBulb = this.createPremiumBulb();
        premiumBulb.group.position.y = 0.15;
        ledContainer.add(premiumBulb.group);
        this.interactableMeshes.push(premiumBulb.glass);

        this.ledInnerCore = premiumBulb.filament;
        this.ledCoronaGlow = premiumBulb.glowSprite;
        this.ledLight = premiumBulb.pointLight;

        // 5. Bornes de tornillo
        const termGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.1, 16);
        const copperTerm = new THREE.Mesh(termGeom, new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.9 }));
        copperTerm.position.copy(this.terminalInPos);

        const zincTerm = new THREE.Mesh(termGeom, new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
        zincTerm.position.copy(this.terminalOutPos);

        const centerTerm = new THREE.Mesh(termGeom, new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 }));
        centerTerm.position.copy(this.terminalBridgePos);

        this.group.add(copperTerm, zincTerm, centerTerm);

        // Sistema de chispas en el contacto
        this.buildSparkSystem();
    }

    private buildSparkSystem() {
        this.sparkGeometry = new THREE.BufferGeometry();
        this.sparkPositions = new Float32Array(this.sparkCount * 3);
        this.sparkVelocities = new Float32Array(this.sparkCount * 3);
        this.sparkLifetimes = new Float32Array(this.sparkCount);
        this.sparkMaxLifetimes = new Float32Array(this.sparkCount);

        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d')!;
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(255, 230, 80, 0.9)');
        grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        const sparkTex = new THREE.CanvasTexture(canvas);

        this.sparkGeometry.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

        const sparkMaterial = new THREE.PointsMaterial({
            size: 0.045,
            map: sparkTex,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.sparkPoints = new THREE.Points(this.sparkGeometry, sparkMaterial);
        this.sparkPoints.position.set(0, 0.11, 0); // Base del interruptor (relativo a switchContainer)
        this.sparkPoints.visible = false;
        this.switchContainer.add(this.sparkPoints);
    }

    private triggerSparks() {
        this.sparksActive = true;
        this.sparkPoints.visible = true;

        for (let i = 0; i < this.sparkCount; i++) {
            const i3 = i * 3;
            this.sparkPositions[i3] = (Math.random() - 0.5) * 0.04;
            this.sparkPositions[i3 + 1] = Math.random() * 0.04;
            this.sparkPositions[i3 + 2] = (Math.random() - 0.5) * 0.04;

            const angle = Math.random() * Math.PI * 2;
            const speed = 0.4 + Math.random() * 0.8;
            this.sparkVelocities[i3] = Math.cos(angle) * speed;
            this.sparkVelocities[i3 + 1] = 0.6 + Math.random() * 1.0;
            this.sparkVelocities[i3 + 2] = Math.sin(angle) * speed;

            this.sparkLifetimes[i] = 0;
            this.sparkMaxLifetimes[i] = 0.15 + Math.random() * 0.25;
        }
        this.sparkGeometry.attributes.position.needsUpdate = true;
    }

    public toggle(): boolean {
        this.isOn = !this.isOn;

        if (this.isOn) {
            this.switchLeverGroup.rotation.x = Math.PI / 6; // On state
            this.triggerSparks();
        } else {
            this.switchLeverGroup.rotation.x = -Math.PI / 6; // Off state
        }

        return this.isOn;
    }

    public setSleep(sleep: boolean): void {
        this.isSleeping = sleep;
        if (this.isSleeping) {
            this.ledLight.visible = false;
        } else {
            this.ledLight.visible = this.isOn;
        }
    }

    public update(delta: number, isPlugged: boolean) {
        if (this.isSleeping) return;
        const time = performance.now() * 0.001;
        (this.hintRing.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.sin(time * 3) * 0.5 + 0.5;
        const active = this.isOn && isPlugged;

        if (active && !this.wasActive) {
            this.triggerSparks();
        }

        this.wasActive = active;

        const coreMat = this.ledInnerCore.material as THREE.MeshStandardMaterial;
        const coronaMat = this.ledCoronaGlow.material as THREE.SpriteMaterial;

        if (active) {
            coreMat.emissive.setHex(0xffaa00);
            coreMat.emissiveIntensity = 3.0;
            coronaMat.opacity = 0.8 + Math.sin(time * 15) * 0.1;
            this.ledLight.intensity = 1.5;
            this.ledLight.visible = true;
        } else {
            coreMat.emissiveIntensity = 0;
            coronaMat.opacity = 0.0;
            this.ledLight.intensity = 0.0;
            this.ledLight.visible = false;
        }

        if (this.sparksActive) {
            let anyAlive = false;
            for (let i = 0; i < this.sparkCount; i++) {
                this.sparkLifetimes[i] += delta;
                if (this.sparkLifetimes[i] < this.sparkMaxLifetimes[i]) {
                    anyAlive = true;
                    const i3 = i * 3;
                    this.sparkPositions[i3] += this.sparkVelocities[i3] * delta;
                    this.sparkPositions[i3 + 1] += this.sparkVelocities[i3 + 1] * delta;
                    this.sparkPositions[i3 + 2] += this.sparkVelocities[i3 + 2] * delta;
                    this.sparkVelocities[i3 + 1] -= 9.8 * delta;
                }
            }
            this.sparkGeometry.attributes.position.needsUpdate = true;
            if (!anyAlive) {
                this.sparksActive = false;
                this.sparkPoints.visible = false;
            }
        }
    }

    public getState(): boolean {
        return this.isOn;
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    private createPremiumBulb() {
        const group = new THREE.Group();

        // Base metálica con rosca
        const baseGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 32);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.3
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        for (let i = 0; i < 4; i++) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.002, 8, 32), baseMat);
            ring.position.y = -0.02 + i * 0.01;
            ring.rotation.x = Math.PI / 2;
            base.add(ring);
        }
        group.add(base);

        // Ampolla de vidrio
        const glassGeom = new THREE.SphereGeometry(0.1, 32, 32);
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 1.0,
            roughness: 0.1,
            thickness: 0.02,
            transparent: true,
            opacity: 1.0
        });
        const glass = new THREE.Mesh(glassGeom, glassMat);
        glass.position.y = 0.12;
        glass.scale.set(1.0, 1.2, 1.0);
        group.add(glass);

        // Filamento interno incandescente
        const filamentGeom = new THREE.TorusGeometry(0.02, 0.002, 16, 32);
        const filamentMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            emissive: 0x000000,
            emissiveIntensity: 0.0,
            roughness: 0.4
        });
        const filament = new THREE.Mesh(filamentGeom, filamentMat);
        filament.position.y = 0.12;
        filament.rotation.x = Math.PI / 2;
        group.add(filament);

        // Luz dinámica emitida
        const pointLight = new THREE.PointLight(0xffedd5, 0, 4.5, 1.5);
        pointLight.position.y = 0.12;
        group.add(pointLight);

        // Halo resplandeciente
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = 64;
        spriteCanvas.height = 64;
        const ctx = spriteCanvas.getContext('2d')!;
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 230, 150, 1)');
        grad.addColorStop(0.4, 'rgba(255, 160, 50, 0.5)');
        grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        const glowTex = new THREE.CanvasTexture(spriteCanvas);
        const glowSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
        );
        glowSprite.position.y = 0.12;
        glowSprite.scale.set(0.65, 0.65, 0.65);
        group.add(glowSprite);

        return { group, filament, pointLight, glowSprite, glass };
    }
}
