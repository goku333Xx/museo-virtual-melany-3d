import * as THREE from 'three';

export class SwitchExhibit {
    private group: THREE.Group;
    private board: THREE.Mesh;
    private switchLeverGroup: THREE.Group;
    private ledOuterDome: THREE.Mesh;
    private ledInnerCore: THREE.Mesh;
    private ledCoronaGlow: THREE.Mesh;
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

    // Multímetro Digital
    private meterGroup!: THREE.Group;
    private meterCanvas!: HTMLCanvasElement;
    private meterCtx!: CanvasRenderingContext2D;
    private meterTexture!: THREE.CanvasTexture;
    private meterScreenMesh!: THREE.Mesh;
    private currentVoltageDisplay: string = "0.00 V";
    private lastMeterUpdateTime: number = 0;

    // Terminales para conexión de cables
    public readonly terminalInPos = new THREE.Vector3(-0.9, 0.05, 0.8);
    public readonly terminalBridgePos = new THREE.Vector3(0.0, 0.05, 0.8);
    public readonly terminalOutPos = new THREE.Vector3(0.9, 0.05, 0.8);

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
        const swBaseGeom = new THREE.BoxGeometry(0.4, 0.08, 0.6);
        const swBaseMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.7 });
        const swBase = new THREE.Mesh(swBaseGeom, swBaseMat);
        swBase.position.set(0.4, 0.09, 0.3);
        swBase.castShadow = true;
        this.group.add(swBase);
        this.interactableMeshes.push(swBase);

        // Placa superior del interruptor
        const swTopGeom = new THREE.BoxGeometry(0.35, 0.02, 0.55);
        const swTopMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 });
        const swTop = new THREE.Mesh(swTopGeom, swTopMat);
        swTop.position.set(0.4, 0.14, 0.3);
        this.group.add(swTop);

        // Soporte de la palanca
        const hingeGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16);
        hingeGeom.rotateZ(Math.PI / 2);
        const hinge = new THREE.Mesh(hingeGeom, swTopMat);
        hinge.position.set(0.4, 0.16, 0.3);
        this.group.add(hinge);

        // Grupo de la palanca animada
        this.switchLeverGroup = new THREE.Group();
        this.switchLeverGroup.position.set(0.4, 0.16, 0.3);
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

        this.group.add(this.switchLeverGroup);
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
        const socketGeom = new THREE.CylinderGeometry(0.18, 0.2, 0.12, 32);
        const socketMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 });
        const socket = new THREE.Mesh(socketGeom, socketMat);
        socket.position.set(-0.4, 0.11, -0.2);
        this.group.add(socket);
        this.interactableMeshes.push(socket);

        // Patas metálicas ánodo y cátodo (más realistas)
        const pinGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 16);
        const pinMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });
        const pin1 = new THREE.Mesh(pinGeom, pinMat);
        pin1.position.set(-0.45, 0.18, -0.2);
        const pin2 = new THREE.Mesh(pinGeom, pinMat);
        pin2.position.set(-0.35, 0.18, -0.2);
        this.group.add(pin1, pin2);

        // Cúpula del LED realista (epoxi transparente)
        const ledDomeGeom = new THREE.CapsuleGeometry(0.12, 0.18, 32, 32);
        const ledDomeMat = new THREE.MeshPhysicalMaterial({
            color: 0x86efac,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.9,
            thickness: 0.1,
            transparent: true,
            opacity: 0.85
        });
        this.ledOuterDome = new THREE.Mesh(ledDomeGeom, ledDomeMat);
        this.ledOuterDome.position.set(-0.4, 0.32, -0.2);
        this.group.add(this.ledOuterDome);
        this.interactableMeshes.push(this.ledOuterDome);

        // Elemento interno (copa reflectora y yunque)
        const coreGeom = new THREE.CylinderGeometry(0.04, 0.08, 0.08, 16);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xa3a3a3, metalness: 0.9, roughness: 0.2 });
        this.ledInnerCore = new THREE.Mesh(coreGeom, coreMat);
        this.ledInnerCore.position.set(-0.4, 0.28, -0.2);
        this.group.add(this.ledInnerCore);

        // Corona luminosa difusa
        const coronaGeom = new THREE.SphereGeometry(0.25, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({
            color: 0x22c55e,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.ledCoronaGlow = new THREE.Mesh(coronaGeom, coronaMat);
        this.ledCoronaGlow.position.set(-0.4, 0.35, -0.2);
        this.group.add(this.ledCoronaGlow);

        // Luz del LED
        this.ledLight = new THREE.PointLight(0x22c55e, 0, 4.0, 2.0);
        this.ledLight.position.set(-0.4, 0.4, -0.2);
        this.group.add(this.ledLight);

        // 4. MULTÍMETRO DIGITAL UBICADO A LA DERECHA
        this.buildDigitalMultimeter();

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

    private buildDigitalMultimeter() {
        this.meterGroup = new THREE.Group();
        this.meterGroup.position.set(0.8, 0.0, 0.5);
        this.meterGroup.rotation.y = -Math.PI / 5.2;

        const matGeom = new THREE.BoxGeometry(0.36, 0.006, 0.32);
        const matMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9, metalness: 0.1 });
        const labMat = new THREE.Mesh(matGeom, matMat);
        labMat.position.set(0, 0.003, 0);
        labMat.receiveShadow = true;
        this.meterGroup.add(labMat);

        const matRimGeom = new THREE.BoxGeometry(0.364, 0.002, 0.324);
        const matRimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 });
        const matRim = new THREE.Mesh(matRimGeom, matRimMat);
        matRim.position.set(0, 0.006, 0);
        this.meterGroup.add(matRim);

        const footGeom = new THREE.CylinderGeometry(0.014, 0.016, 0.016, 16);
        const footMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95, metalness: 0.05 });
        const leftFrontFoot = new THREE.Mesh(footGeom, footMat);
        leftFrontFoot.position.set(-0.10, 0.014, 0.07);
        const rightFrontFoot = new THREE.Mesh(footGeom, footMat);
        rightFrontFoot.position.set(0.10, 0.014, 0.07);
        this.meterGroup.add(leftFrontFoot, rightFrontFoot);

        const tiltGroup = new THREE.Group();
        tiltGroup.position.set(0, 0.022, 0.07);
        const tiltAngle = -Math.PI / 6.6;
        tiltGroup.rotation.x = tiltAngle;

        const caseWidth = 0.27;
        const caseHeight = 0.37;
        const caseDepth = 0.065;

        const caseGeom = new THREE.BoxGeometry(caseWidth, caseHeight, caseDepth);
        const caseMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.2 });
        const caseMesh = new THREE.Mesh(caseGeom, caseMat);
        caseMesh.position.set(0, caseHeight / 2, 0);
        caseMesh.castShadow = true;
        tiltGroup.add(caseMesh);

        const bumperGeom = new THREE.BoxGeometry(caseWidth + 0.016, caseHeight + 0.016, caseDepth - 0.008);
        const bumperMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85, metalness: 0.1 });
        const bumperMesh = new THREE.Mesh(bumperGeom, bumperMat);
        bumperMesh.position.set(0, caseHeight / 2, 0);
        tiltGroup.add(bumperMesh);

        this.meterCanvas = document.createElement('canvas');
        this.meterCanvas.width = 512;
        this.meterCanvas.height = 256;
        this.meterCtx = this.meterCanvas.getContext('2d')!;
        
        this.meterTexture = new THREE.CanvasTexture(this.meterCanvas);
        this.renderMeterScreen(false, 0);

        const screenGeom = new THREE.PlaneGeometry(0.23, 0.13);
        const screenMat = new THREE.MeshBasicMaterial({ map: this.meterTexture });
        this.meterScreenMesh = new THREE.Mesh(screenGeom, screenMat);
        this.meterScreenMesh.position.set(0, caseHeight / 2 + 0.08, caseDepth / 2 + 0.005);
        tiltGroup.add(this.meterScreenMesh);

        const knobGeom = new THREE.CylinderGeometry(0.044, 0.047, 0.024, 24);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.6 });
        const knobMesh = new THREE.Mesh(knobGeom, knobMat);
        knobMesh.rotation.x = Math.PI / 2;
        knobMesh.position.set(0, caseHeight / 2 - 0.05, caseDepth / 2 + 0.013);
        tiltGroup.add(knobMesh);

        const pointerGeom = new THREE.BoxGeometry(0.008, 0.035, 0.004);
        const pointerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pointerMesh = new THREE.Mesh(pointerGeom, pointerMat);
        pointerMesh.position.set(0, 0.015, 0.014);
        knobMesh.add(pointerMesh);

        const jackGeom = new THREE.CylinderGeometry(0.009, 0.009, 0.016, 16);
        jackGeom.rotateX(Math.PI / 2);

        const jackBlack = new THREE.Mesh(jackGeom, new THREE.MeshBasicMaterial({ color: 0x111827 }));
        jackBlack.position.set(-0.045, caseHeight / 2 - 0.135, caseDepth / 2 + 0.008);
        const jackRed = new THREE.Mesh(jackGeom, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        jackRed.position.set(0.045, caseHeight / 2 - 0.135, caseDepth / 2 + 0.008);
        tiltGroup.add(jackBlack, jackRed);

        const standGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.25, 12);
        const standMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });
        
        const leftLeg = new THREE.Mesh(standGeom, standMat);
        leftLeg.position.set(-0.09, 0.11, -0.08);
        leftLeg.rotation.x = 0.38;
        tiltGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(standGeom, standMat);
        rightLeg.position.set(0.09, 0.11, -0.08);
        rightLeg.rotation.x = 0.38;
        tiltGroup.add(rightLeg);

        const crossbarGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.19, 12);
        crossbarGeom.rotateZ(Math.PI / 2);
        const crossbar = new THREE.Mesh(crossbarGeom, standMat);
        crossbar.position.set(0, -0.01, -0.155);
        tiltGroup.add(crossbar);

        [-0.09, 0.09].forEach(px => {
            const legFoot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), footMat);
            legFoot.position.set(px, -0.01, -0.155);
            tiltGroup.add(legFoot);
        });

        this.meterGroup.add(tiltGroup);
        this.group.add(this.meterGroup);
        this.interactableMeshes.push(caseMesh, this.meterScreenMesh);

        this.buildProbeCables();
    }

    private buildProbeCables() {
        const blackCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.76, 0.08, 0.57),
            new THREE.Vector3(0.74, 0.015, 0.55),
            new THREE.Vector3(0.4, 0.015, 0.4),
            new THREE.Vector3(0.0, 0.015, 0.5),
            new THREE.Vector3(-0.85, 0.05, 0.8)
        ]);
        const blackGeom = new THREE.TubeGeometry(blackCurve, 32, 0.015, 8, false);
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.2 });
        const blackProbeWire = new THREE.Mesh(blackGeom, blackMat);
        blackProbeWire.castShadow = true;
        this.group.add(blackProbeWire);

        const redCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.84, 0.08, 0.57),
            new THREE.Vector3(0.82, 0.015, 0.53),
            new THREE.Vector3(0.6, 0.015, 0.6),
            new THREE.Vector3(0.8, 0.02, 0.7),
            new THREE.Vector3(0.95, 0.05, 0.8)
        ]);
        const redGeom = new THREE.TubeGeometry(redCurve, 32, 0.015, 8, false);
        const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6, metalness: 0.2 });
        const redProbeWire = new THREE.Mesh(redGeom, redMat);
        redProbeWire.castShadow = true;
        this.group.add(redProbeWire);

        const clipGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 12);
        clipGeom.rotateX(Math.PI / 2);
        const clipMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 });

        const blackClip = new THREE.Mesh(clipGeom, clipMat);
        blackClip.position.set(-0.87, 0.05, 0.82);
        const redClip = new THREE.Mesh(clipGeom, clipMat);
        redClip.position.set(0.93, 0.05, 0.82);
        this.group.add(blackClip, redClip);
    }

    private renderMeterScreen(isActive: boolean, time: number) {
        const ctx = this.meterCtx;
        const w = this.meterCanvas.width;
        const h = this.meterCanvas.height;

        ctx.fillStyle = isActive ? '#064e3b' : '#0f172a';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = isActive ? '#22c55e' : '#334155';
        ctx.lineWidth = 6;
        ctx.strokeRect(8, 8, w - 16, h - 16);

        ctx.fillStyle = isActive ? '#a7f3d0' : '#64748b';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('DC VOLTAJE [ESCALA 20V]', 24, 46);

        if (isActive) {
            const jitter = (Math.sin(time * 6) * 0.015) + (Math.cos(time * 11) * 0.008);
            const val = (1.96 + jitter).toFixed(2);
            this.currentVoltageDisplay = `${val} V`;
            ctx.fillStyle = '#4ade80';
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 16;
        } else {
            this.currentVoltageDisplay = "0.00 V";
            ctx.fillStyle = '#475569';
            ctx.shadowBlur = 0;
        }

        ctx.font = 'bold 88px monospace';
        ctx.fillText(this.currentVoltageDisplay, 48, 140);
        ctx.shadowBlur = 0;

        ctx.fillStyle = isActive ? 'rgba(74, 222, 128, 0.4)' : 'rgba(71, 85, 105, 0.2)';
        ctx.fillRect(24, 180, w - 48, 22);

        if (isActive) {
            const barW = (w - 48) * 0.68;
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(24, 180, barW, 22);
        }

        ctx.fillStyle = isActive ? '#86efac' : '#64748b';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('0V ----------------------------- 1.96V ----------------------------- 2.5V', 28, 226);

        this.meterTexture.needsUpdate = true;
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
        this.sparkPoints.position.set(0.4, 0.16, 0.3); // Base del interruptor
        this.sparkPoints.visible = false;
        this.group.add(this.sparkPoints);
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

        const stateChanged = (active !== this.wasActive);
        if (stateChanged || (active && (time - this.lastMeterUpdateTime > 0.1))) {
            this.renderMeterScreen(active, time);
            this.lastMeterUpdateTime = time;
        }
        this.wasActive = active;

        const coreMat = this.ledInnerCore.material as THREE.MeshStandardMaterial;
        const coronaMat = this.ledCoronaGlow.material as THREE.MeshBasicMaterial;

        if (active) {
            coreMat.emissive.setHex(0xa7f3d0);
            coreMat.emissiveIntensity = 2.0;
            coronaMat.opacity = 0.6 + Math.sin(time * 15) * 0.1;
            this.ledLight.intensity = 1.2;
            this.ledLight.visible = true;
        } else {
            coreMat.emissive.setHex(0x000000);
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
}
