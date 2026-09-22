import * as THREE from 'three';

export class SwitchExhibit {
    private group: THREE.Group;
    private board: THREE.Mesh;
    private button: THREE.Mesh;
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

    // Multímetro Digital ubicado a la derecha, en diagonal, bien visible y sin tapar las papas
    private meterGroup!: THREE.Group;
    private meterCanvas!: HTMLCanvasElement;
    private meterCtx!: CanvasRenderingContext2D;
    private meterTexture!: THREE.CanvasTexture;
    private meterScreenMesh!: THREE.Mesh;
    private currentVoltageDisplay: string = "0.00 V";
    private lastMeterUpdateTime: number = 0;

    // Terminales para conexión de cables
    public readonly terminalInPos = new THREE.Vector3(-0.24, 0.05, 0.10);   // Entrada desde papas izquierdas
    public readonly terminalBridgePos = new THREE.Vector3(0.0, 0.05, 0.10);  // Puente Switch -> LED
    public readonly terminalOutPos = new THREE.Vector3(0.24, 0.05, 0.10);    // Salida hacia papas derechas

    constructor() {
        this.group = new THREE.Group();

        // 1. PLACA BASE DE LABORATORIO CENTRAL (0.68m x 0.42m)
        const boardGeom = new THREE.BoxGeometry(0.68, 0.035, 0.42);
        const boardMat = new THREE.MeshStandardMaterial({
            color: 0x18202f,
            roughness: 0.5,
            metalness: 0.3
        });
        this.board = new THREE.Mesh(boardGeom, boardMat);
        this.board.position.set(0, 0.018, 0.05);
        this.board.castShadow = true;
        this.board.receiveShadow = true;
        this.group.add(this.board);
        this.interactableMeshes.push(this.board);

        // Bisel de latón en la base
        const boardRimGeom = new THREE.BoxGeometry(0.70, 0.015, 0.44);
        const boardRimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });
        const boardRim = new THREE.Mesh(boardRimGeom, boardRimMat);
        boardRim.position.set(0, 0.007, 0.05);
        this.group.add(boardRim);

        // 2. MÓDULO DEL INTERRUPTOR INDUSTRIAL (+15% tamaño: radio 0.069)
        const swBaseGeom = new THREE.BoxGeometry(0.20, 0.04, 0.20);
        const swBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 });
        const swBase = new THREE.Mesh(swBaseGeom, swBaseMat);
        swBase.position.set(0.18, 0.05, 0.05);
        this.group.add(swBase);
        this.interactableMeshes.push(swBase);

        // Botón pulsador rojo aumentado un 15%
        const btnRadius = 0.069; // +15% de 0.06
        const btnGeom = new THREE.CylinderGeometry(btnRadius, btnRadius, 0.045, 24);
        const btnMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.2 });
        this.button = new THREE.Mesh(btnGeom, btnMat);
        this.button.position.set(0.18, 0.08, 0.05);
        this.group.add(this.button);
        this.interactableMeshes.push(this.button);

        // Anillo de latón alrededor del pulsador
        const btnRing = new THREE.Mesh(
            new THREE.TorusGeometry(btnRadius + 0.01, 0.009, 12, 24),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 })
        );
        btnRing.rotation.x = Math.PI / 2;
        btnRing.position.set(0.18, 0.075, 0.05);
        this.group.add(btnRing);

        this.hintRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.075, 0.005, 8, 24),
            new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xfde047, metalness: 0.85, roughness: 0.2 })
        );
        this.hintRing.rotation.x = Math.PI / 2;
        this.hintRing.position.set(0.18, 0.075, 0.05);
        this.group.add(this.hintRing);

        // 3. MÓDULO DEL DIODO LED DE POTENCIA (+15% tamaño: radio 0.055)
        const socketGeom = new THREE.CylinderGeometry(0.08, 0.085, 0.045, 24);
        const socketMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.9 });
        const socket = new THREE.Mesh(socketGeom, socketMat);
        socket.position.set(-0.18, 0.05, 0.05);
        this.group.add(socket);
        this.interactableMeshes.push(socket);

        // Patas metálicas ánodo y cátodo
        const pinGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.09, 12);
        const pinMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });
        const pin1 = new THREE.Mesh(pinGeom, pinMat);
        pin1.position.set(-0.205, 0.085, 0.05);
        const pin2 = new THREE.Mesh(pinGeom, pinMat);
        pin2.position.set(-0.155, 0.085, 0.05);
        this.group.add(pin1, pin2);

        // Cúpula translúcida esmeralda del LED aumentada un 15%
        const domeRadius = 0.055; // +15% de 0.048
        const ledDomeGeom = new THREE.CapsuleGeometry(domeRadius, 0.09, 16, 24);
        const ledDomeMat = new THREE.MeshStandardMaterial({
            color: 0x86efac,
            roughness: 0.08,
            metalness: 0.1,
            transparent: true,
            opacity: 0.88
        });
        this.ledOuterDome = new THREE.Mesh(ledDomeGeom, ledDomeMat);
        this.ledOuterDome.position.set(-0.18, 0.18, 0.05);
        this.group.add(this.ledOuterDome);
        this.interactableMeshes.push(this.ledOuterDome);

        // Chip emisor nuclear interno
        const coreGeom = new THREE.SphereGeometry(0.028, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.ledInnerCore = new THREE.Mesh(coreGeom, coreMat);
        this.ledInnerCore.position.set(-0.18, 0.18, 0.05);
        this.group.add(this.ledInnerCore);

        // Corona / Halo difuso
        const coronaGeom = new THREE.SphereGeometry(0.14, 16, 16);
        const coronaMat = new THREE.MeshBasicMaterial({
            color: 0x22c55e,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.ledCoronaGlow = new THREE.Mesh(coronaGeom, coronaMat);
        this.ledCoronaGlow.position.set(-0.18, 0.18, 0.05);
        this.group.add(this.ledCoronaGlow);

        // Luz suave
        this.ledLight = new THREE.PointLight(0x22c55e, 0, 1.8, 2.0);
        this.ledLight.position.set(-0.18, 0.22, 0.05);
        this.group.add(this.ledLight);

        // 4. MULTÍMETRO DIGITAL UBICADO A LA DERECHA EN FRENTE DE LAS PAPAS (SIN TAPARLAS)
        this.buildDigitalMultimeter();

        // 5. Bornes de tornillo
        const termGeom = new THREE.CylinderGeometry(0.012, 0.014, 0.03, 16);
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

    // MULTÍMETRO DIGITAL ASENTADO EN LA MESA CON ALFOMBRILLA Y CABALLETE TRIPODE REAL
    private buildDigitalMultimeter() {
        this.meterGroup = new THREE.Group();
        // Ubicado firmemente sobre la mesa (Y = 0) al frente derecho del circuito
        this.meterGroup.position.set(0.48, 0.0, 0.30);
        this.meterGroup.rotation.y = -Math.PI / 5.2; // Orientado ergonómicamente hacia el centro de la mirada

        // 1. Alfombrilla antiestática de laboratorio (0.36m x 0.32m) asentada sobre la mesa
        const matGeom = new THREE.BoxGeometry(0.36, 0.006, 0.32);
        const matMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9, metalness: 0.1 });
        const labMat = new THREE.Mesh(matGeom, matMat);
        labMat.position.set(0, 0.003, 0);
        labMat.receiveShadow = true;
        this.meterGroup.add(labMat);

        // Borde cian sutil serigrafiado en la alfombrilla
        const matRimGeom = new THREE.BoxGeometry(0.364, 0.002, 0.324);
        const matRimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 });
        const matRim = new THREE.Mesh(matRimGeom, matRimMat);
        matRim.position.set(0, 0.006, 0);
        this.meterGroup.add(matRim);

        // 2. Patas frontales de goma antideslizante (descansan sobre la alfombrilla en Y = 0.006)
        const footGeom = new THREE.CylinderGeometry(0.014, 0.016, 0.016, 16);
        const footMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95, metalness: 0.05 });
        const leftFrontFoot = new THREE.Mesh(footGeom, footMat);
        leftFrontFoot.position.set(-0.10, 0.014, 0.07);
        const rightFrontFoot = new THREE.Mesh(footGeom, footMat);
        rightFrontFoot.position.set(0.10, 0.014, 0.07);
        this.meterGroup.add(leftFrontFoot, rightFrontFoot);

        // 3. Grupo de inclinación del tester (Pivota desde el eje de las patas frontales)
        const tiltGroup = new THREE.Group();
        tiltGroup.position.set(0, 0.022, 0.07);
        const tiltAngle = -Math.PI / 6.6; // ~27.2° de inclinación hacia atrás (62.8° sobre la mesa)
        tiltGroup.rotation.x = tiltAngle;

        // Carcasa del tester (Amarillo industrial Fluke de alta gama)
        const caseWidth = 0.27;
        const caseHeight = 0.37;
        const caseDepth = 0.065;

        const caseGeom = new THREE.BoxGeometry(caseWidth, caseHeight, caseDepth);
        const caseMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.2 });
        const caseMesh = new THREE.Mesh(caseGeom, caseMat);
        caseMesh.position.set(0, caseHeight / 2, 0);
        caseMesh.castShadow = true;
        tiltGroup.add(caseMesh);

        // Bumper de goma protectora grafito perimetral
        const bumperGeom = new THREE.BoxGeometry(caseWidth + 0.016, caseHeight + 0.016, caseDepth - 0.008);
        const bumperMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85, metalness: 0.1 });
        const bumperMesh = new THREE.Mesh(bumperGeom, bumperMat);
        bumperMesh.position.set(0, caseHeight / 2, 0);
        tiltGroup.add(bumperMesh);

        // Pantalla LCD grande nítida (512x256)
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

        // Perilla selectora central
        const knobGeom = new THREE.CylinderGeometry(0.044, 0.047, 0.024, 24);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.6 });
        const knobMesh = new THREE.Mesh(knobGeom, knobMat);
        knobMesh.rotation.x = Math.PI / 2;
        knobMesh.position.set(0, caseHeight / 2 - 0.05, caseDepth / 2 + 0.013);
        tiltGroup.add(knobMesh);

        // Puntero blanco en la perilla
        const pointerGeom = new THREE.BoxGeometry(0.008, 0.035, 0.004);
        const pointerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pointerMesh = new THREE.Mesh(pointerGeom, pointerMat);
        pointerMesh.position.set(0, 0.015, 0.014);
        knobMesh.add(pointerMesh);

        // Bornes de conexión para sondas
        const jackGeom = new THREE.CylinderGeometry(0.009, 0.009, 0.016, 16);
        jackGeom.rotateX(Math.PI / 2);

        const jackBlack = new THREE.Mesh(jackGeom, new THREE.MeshBasicMaterial({ color: 0x111827 }));
        jackBlack.position.set(-0.045, caseHeight / 2 - 0.135, caseDepth / 2 + 0.008);
        const jackRed = new THREE.Mesh(jackGeom, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        jackRed.position.set(0.045, caseHeight / 2 - 0.135, caseDepth / 2 + 0.008);
        tiltGroup.add(jackBlack, jackRed);

        // 4. Caballete metálico trasero que apoya perfectamente en la alfombrilla (Y = 0.006)
        const standGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.25, 12);
        const standMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });
        
        // Pata trasera izquierda
        const leftLeg = new THREE.Mesh(standGeom, standMat);
        leftLeg.position.set(-0.09, 0.11, -0.08);
        leftLeg.rotation.x = 0.38;
        tiltGroup.add(leftLeg);

        // Pata trasera derecha
        const rightLeg = new THREE.Mesh(standGeom, standMat);
        rightLeg.position.set(0.09, 0.11, -0.08);
        rightLeg.rotation.x = 0.38;
        tiltGroup.add(rightLeg);

        // Barra transversal estabilizadora con topes de goma apoyados en la alfombrilla
        const crossbarGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.19, 12);
        crossbarGeom.rotateZ(Math.PI / 2);
        const crossbar = new THREE.Mesh(crossbarGeom, standMat);
        crossbar.position.set(0, -0.01, -0.155);
        tiltGroup.add(crossbar);

        // Topes de goma traseros que tocan la alfombrilla
        [-0.09, 0.09].forEach(px => {
            const legFoot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), footMat);
            legFoot.position.set(px, -0.01, -0.155);
            tiltGroup.add(legFoot);
        });

        this.meterGroup.add(tiltGroup);
        this.group.add(this.meterGroup);
        this.interactableMeshes.push(caseMesh, this.meterScreenMesh);

        // 5. CABLES DE PRUEBA REALISTAS (SONDAS ROJA Y NEGRA APOYADAS EN LA MESA)
        this.buildProbeCables();
    }

    private buildProbeCables() {
        // Cable Negro (COM): Sale del jack negro, cae suavemente a la mesa y se conecta al borne de entrada (-0.24, 0.05, 0.10)
        const blackCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.44, 0.08, 0.37),
            new THREE.Vector3(0.42, 0.015, 0.35),
            new THREE.Vector3(0.28, 0.015, 0.28),
            new THREE.Vector3(0.05, 0.015, 0.20),
            new THREE.Vector3(-0.20, 0.05, 0.12)
        ]);
        const blackGeom = new THREE.TubeGeometry(blackCurve, 24, 0.007, 8, false);
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.2 });
        const blackProbeWire = new THREE.Mesh(blackGeom, blackMat);
        blackProbeWire.castShadow = true;
        this.group.add(blackProbeWire);

        // Cable Rojo (V): Sale del jack rojo, cae a la mesa y se conecta al borne de salida (0.24, 0.05, 0.10)
        const redCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.52, 0.08, 0.37),
            new THREE.Vector3(0.50, 0.015, 0.33),
            new THREE.Vector3(0.42, 0.015, 0.24),
            new THREE.Vector3(0.30, 0.02, 0.16),
            new THREE.Vector3(0.24, 0.05, 0.12)
        ]);
        const redGeom = new THREE.TubeGeometry(redCurve, 24, 0.007, 8, false);
        const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6, metalness: 0.2 });
        const redProbeWire = new THREE.Mesh(redGeom, redMat);
        redProbeWire.castShadow = true;
        this.group.add(redProbeWire);

        // Pinzas cocodrilo doradas en los bornes
        const clipGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.04, 12);
        clipGeom.rotateX(Math.PI / 2);
        const clipMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 });

        const blackClip = new THREE.Mesh(clipGeom, clipMat);
        blackClip.position.set(-0.21, 0.05, 0.11);
        const redClip = new THREE.Mesh(clipGeom, clipMat);
        redClip.position.set(0.25, 0.05, 0.11);
        this.group.add(blackClip, redClip);
    }

    private renderMeterScreen(isActive: boolean, time: number) {
        const ctx = this.meterCtx;
        const w = this.meterCanvas.width;
        const h = this.meterCanvas.height;

        // Fondo LCD retroiluminado esmeralda / pizarra
        ctx.fillStyle = isActive ? '#064e3b' : '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Marco interior LCD
        ctx.strokeStyle = isActive ? '#22c55e' : '#334155';
        ctx.lineWidth = 6;
        ctx.strokeRect(8, 8, w - 16, h - 16);

        // Texto superior con indicador de función
        ctx.fillStyle = isActive ? '#a7f3d0' : '#64748b';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('DC VOLTAJE [ESCALA 20V]', 24, 46);

        // Valor de voltaje digital grande de alta legibilidad
        if (isActive) {
            // Fluctuación orgánica realista de 4 celdas galvánicas en serie (~1.96V)
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

        // Barra gráfica analógica inferior en la pantalla LCD
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
        this.sparkPoints.position.set(0.18, 0.08, 0.05); // En el interruptor
        this.sparkPoints.visible = false;
        this.group.add(this.sparkPoints);
    }

    private triggerSparks() {
        this.sparksActive = true;
        this.sparkPoints.visible = true;

        for (let i = 0; i < this.sparkCount; i++) {
            const i3 = i * 3;
            this.sparkPositions[i3] = (Math.random() - 0.5) * 0.02;
            this.sparkPositions[i3 + 1] = Math.random() * 0.02;
            this.sparkPositions[i3 + 2] = (Math.random() - 0.5) * 0.02;

            const angle = Math.random() * Math.PI * 2;
            const speed = 0.35 + Math.random() * 0.6;
            this.sparkVelocities[i3] = Math.cos(angle) * speed;
            this.sparkVelocities[i3 + 1] = 0.5 + Math.random() * 0.8;
            this.sparkVelocities[i3 + 2] = Math.sin(angle) * speed;

            this.sparkLifetimes[i] = 0;
            this.sparkMaxLifetimes[i] = 0.15 + Math.random() * 0.2;
        }
        this.sparkGeometry.attributes.position.needsUpdate = true;
    }

    public toggle(): boolean {
        this.isOn = !this.isOn;

        if (this.isOn) {
            this.button.position.y = 0.065;
            this.triggerSparks();
        } else {
            this.button.position.y = 0.08;
        }

        return this.isOn;
    }

    public setSleep(sleep: boolean): void {
        this.isSleeping = sleep;
    }

    public update(delta: number, isPlugged: boolean) {
        if (this.isSleeping) return;
        const time = performance.now() * 0.001;
        (this.hintRing.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.sin(time * 3) * 0.5 + 0.5;
        const active = this.isOn && isPlugged;

        // Detección de flanco ascendente para chispas
        if (active && !this.wasActive) {
            this.triggerSparks();
        }

        // OPTIMIZACIÓN SUPREMA DE RENDIMIENTO:
        // Solo actualizar el canvas del multímetro si cambió de estado O cada 100ms cuando está activo (10 FPS de refresco LCD)
        // Esto elimina el 90% de subidas de texturas GPU por frame
        const stateChanged = (active !== this.wasActive);
        if (stateChanged || (active && (time - this.lastMeterUpdateTime > 0.1))) {
            this.renderMeterScreen(active, time);
            this.lastMeterUpdateTime = time;
        }
        this.wasActive = active;

        // Actualizar estado luminoso del LED sin recompilación de shaders
        const coreMat = this.ledInnerCore.material as THREE.MeshBasicMaterial;
        const coronaMat = this.ledCoronaGlow.material as THREE.MeshBasicMaterial;

        if (active) {
            coreMat.color.setHex(0xa7f3d0);
            coronaMat.opacity = 0.8 + Math.sin(time * 12) * 0.15;
            this.ledLight.intensity = 1.6;
        } else {
            coreMat.color.setHex(0x000000);
            coronaMat.opacity = 0.0;
            this.ledLight.intensity = 0.0;
        }

        // Actualizar partículas de chispas
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
