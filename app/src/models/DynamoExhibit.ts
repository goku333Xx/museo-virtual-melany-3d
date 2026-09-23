import * as THREE from 'three';

export interface DynamoModeInfo {
    id: number;
    name: string;
    crankRpm: number;
    gearRatio: number;
    rotorRpm: number;
    voltage: number;
    lampWatts: number;
    desc: string;
}

export class DynamoExhibit {
    private group: THREE.Group;
    private interactableMeshes: THREE.Object3D[] = [];

    // Componentes móviles rotacionales
    private crankArmGroup: THREE.Group;
    private mainGearMesh: THREE.Group;
    private pinionGearMesh: THREE.Group;
    private rotorArmatureGroup: THREE.Group;
    private commutatorGroup: THREE.Group;
    private rotorCoils: THREE.Mesh[] = [];

    // Componentes de la Lámpara Edison
    private bulbFilament: THREE.Mesh;
    private bulbPointLight: THREE.PointLight;
    private bulbGlowSprite: THREE.Sprite;

    // Componentes del Voltímetro Digital
    private meterGroup!: THREE.Group;
    private meterCanvas!: HTMLCanvasElement;
    private meterCtx!: CanvasRenderingContext2D;
    private meterTexture!: THREE.CanvasTexture;
    private meterScreenMesh!: THREE.Mesh;
    private lastMeterUpdateTime: number = 0;

    // Partículas de electrones y chispas
    private electronParticles: THREE.Mesh[] = [];
    private electronCurve: THREE.CatmullRomCurve3;
    private electronPathPoints: THREE.Vector3[] = [];
    private brushSparks: THREE.Points;
    private sparkPositions: Float32Array;

    // Física de rotación e inercia
    private currentRpm: number = 0;
    private targetRpm: number = 0;
    private crankAngle: number = 0;
    private rotorAngle: number = 0;
    private gearRatio: number = 5.0; // 1 vuelta de manivela = 5 vueltas de rotor
    private currentVoltage: number = 0;

    private currentMode: number = 0;
    private isSleeping = false;
    private fieldLines: THREE.Mesh[] = [];
    private readonly modes: DynamoModeInfo[] = [
        {
            id: 0,
            name: "En Reposo (0 RPM · 0.0V · Circuito Inactivo)",
            crankRpm: 0,
            gearRatio: 5.0,
            rotorRpm: 0,
            voltage: 0.0,
            lampWatts: 0,
            desc: "El dínamo está detenido. Sin movimiento relativo entre los imanes y el alambre de cobre, la variación del flujo magnético es cero (dΦ/dt = 0) y no se produce voltaje."
        },
        {
            id: 1,
            name: "Manivela Suave (~60 RPM · 4.8V · Filamento Ámbar Tenue)",
            crankRpm: 60,
            gearRatio: 5.0,
            rotorRpm: 300,
            voltage: 4.8,
            lampWatts: 15,
            desc: "Al girar despacio, los engranajes multiplican la velocidad a 300 RPM. Se inducen 4.8V: el filamento de tungsteno comienza a entibiarse emitiendo un fulgor rojo-anaranjado tenue."
        },
        {
            id: 2,
            name: "Manivela Enérgica (~180 RPM · 12.6V · Bombilla Brillante)",
            crankRpm: 180,
            gearRatio: 5.0,
            rotorRpm: 900,
            voltage: 12.6,
            lampWatts: 60,
            desc: "Un pedaleo o giro continuo y vigoroso genera 12.6V y 60W. El filamento alcanza 2200°C por Efecto Joule, iluminando toda la mesa con una cálida luz dorada de museo."
        },
        {
            id: 3,
            name: "¡Manivela Turbo a Plena Potencia! (~300 RPM · 24.0V · Fulgor Máximo)",
            crankRpm: 300,
            gearRatio: 5.0,
            rotorRpm: 1500,
            voltage: 24.0,
            lampWatts: 100,
            desc: "¡Máximo esfuerzo físico! El rotor corta el campo magnético a 1500 RPM generando 24V. La bombilla brilla con luz blanca deslumbrante y las escobillas de grafito despiden micro-chispas de plasma."
        }
    ];

    constructor() {
        this.group = new THREE.Group();

        // =========================================================================
        // 1. BANCO DE PRUEBAS DE LABORATORIO MECÁNICO (1.8m x 1.3m x 0.10m)
        // =========================================================================
        const tableW = 1.8;
        const tableD = 1.3;
        const tableH = 0.10;

        const tableMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            metalness: 0.8,
            roughness: 0.3
        });
        const table = new THREE.Mesh(new THREE.BoxGeometry(tableW, tableH, tableD), tableMat);
        table.position.set(0, tableH / 2, 0);
        table.receiveShadow = true;
        this.group.add(table);
        this.interactableMeshes.push(table);

        // Reborde de latón pulido perimetral
        const rim = new THREE.Mesh(
            new THREE.BoxGeometry(tableW + 0.03, 0.02, tableD + 0.03),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 })
        );
        rim.position.set(0, tableH + 0.01, 0);
        this.group.add(rim);

        // Placa grabada explicativa en la mesa
        const plaque = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.005, 0.22),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
        );
        plaque.position.set(0, tableH + 0.0025, 0.48);
        this.group.add(plaque);

        // =========================================================================
        // 2. PEDESTAL DE HIERRO FUNDIDO Y CAJA DE ENGRANAJES TRANSPARENTE
        // =========================================================================
        const dynamoBaseGroup = new THREE.Group();
        dynamoBaseGroup.position.set(-0.25, tableH, 0);

        // Base de soporte de hierro fundido
        const ironBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.05, 0.55),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.4 })
        );
        ironBase.position.y = 0.025;
        dynamoBaseGroup.add(ironBase);
        this.interactableMeshes.push(ironBase);

        // Columnas de soporte de cojinetes para ejes
        const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
        const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.08), postMat);
        post1.position.set(-0.28, 0.20, 0.18);
        const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.08), postMat);
        post2.position.set(-0.28, 0.20, -0.18);
        const post3 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.08), postMat);
        post3.position.set(0.05, 0.20, 0.18);
        const post4 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.08), postMat);
        post4.position.set(0.05, 0.20, -0.18);
        dynamoBaseGroup.add(post1, post2, post3, post4);

        // Carcasa acrílica transparente para ver los engranajes
        const acrylicMat = new THREE.MeshStandardMaterial({
            color: 0xe8f4f8,
            transparent: true,
            opacity: 0.2,
            roughness: 0.05,
            metalness: 0.15
        });
        const acrylicCover = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.40), acrylicMat);
        acrylicCover.position.set(-0.12, 0.24, 0);
        dynamoBaseGroup.add(acrylicCover);
        this.interactableMeshes.push(acrylicCover);

        // =========================================================================
        // 3. TREN DE ENGRANAJES DE LATÓN (RELACIÓN 5:1)
        // =========================================================================
        // Eje principal de la manivela (X = -0.28, Y = 0.25)
        const crankAxle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.016, 0.016, 0.48, 16),
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 })
        );
        crankAxle.rotation.x = Math.PI / 2;
        crankAxle.position.set(-0.28, 0.25, 0);
        dynamoBaseGroup.add(crankAxle);

        // Engranaje maestro grande de latón (Radio 0.15m, 60 dientes)
        this.mainGearMesh = new THREE.Group();
        this.mainGearMesh.position.set(-0.28, 0.25, 0);

        const brassGearMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.92,
            roughness: 0.2
        });
        const gearDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.024, 32), brassGearMat);
        gearDisc.rotation.x = Math.PI / 2;
        this.mainGearMesh.add(gearDisc);

        // Dientes del engranaje maestro
        const toothGeom = new THREE.BoxGeometry(0.012, 0.028, 0.024);
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const tooth = new THREE.Mesh(toothGeom, brassGearMat);
            tooth.position.set(Math.cos(angle) * 0.15, Math.sin(angle) * 0.15, 0);
            tooth.rotation.z = angle;
            this.mainGearMesh.add(tooth);
        }
        dynamoBaseGroup.add(this.mainGearMesh);

        // Piñón multiplicador de acero (Radio 0.035m, 12 dientes) acoplado al rotor
        // Posicionado en contacto con el engranaje maestro (X = -0.10, Y = 0.25)
        this.pinionGearMesh = new THREE.Group();
        this.pinionGearMesh.position.set(-0.10, 0.25, 0);

        const pinionDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.026, 24), postMat);
        pinionDisc.rotation.x = Math.PI / 2;
        this.pinionGearMesh.add(pinionDisc);

        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.014, 0.026), postMat);
            tooth.position.set(Math.cos(angle) * 0.04, Math.sin(angle) * 0.04, 0);
            tooth.rotation.z = angle;
            this.pinionGearMesh.add(tooth);
        }
        dynamoBaseGroup.add(this.pinionGearMesh);

        // =========================================================================
        // 4. MANIVELA MECÁNICA INTERACTIVA CON MANGO ERGONÓMICO
        // =========================================================================
        this.crankArmGroup = new THREE.Group();
        this.crankArmGroup.position.set(-0.28, 0.25, 0.25); // Sobresale al frente hacia el jugador

        // Buje central de la manivela
        const crankHub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 0.04, 24),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 })
        );
        crankHub.rotation.x = Math.PI / 2;
        this.crankArmGroup.add(crankHub);

        // Brazo de acero cromado
        const armLength = 0.22;
        const armGeom = new THREE.BoxGeometry(0.025, armLength, 0.018);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.1 });
        const arm = new THREE.Mesh(armGeom, armMat);
        arm.position.set(0, armLength / 2, 0);
        this.crankArmGroup.add(arm);

        // Mango giratorio ergonómico (Madera noble con anillas de bronce)
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6, metalness: 0.1 });
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.11, 16), handleMat);
        handle.rotation.x = Math.PI / 2;
        handle.position.set(0, armLength, 0.06);
        this.crankArmGroup.add(handle);

        // Perno de fijación del mango
        const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), armMat);
        bolt.position.set(0, armLength, 0.12);
        this.crankArmGroup.add(bolt);

        this.interactableMeshes.push(handle, arm, crankHub);
        dynamoBaseGroup.add(this.crankArmGroup);

        // =========================================================================
        // 5. GENERADOR ELECTROMAGNÉTICO (ESTATOR CON IMANES N/S Y ROTOR)
        // =========================================================================
        const statorGroup = new THREE.Group();
        statorGroup.position.set(0.20, 0.25, 0);

        // Carcasa de acero del estator
        const casingGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.22, 32, 1, true, 0, Math.PI * 2);
        const casingMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.4, side: THREE.DoubleSide });
        const casing = new THREE.Mesh(casingGeom, casingMat);
        casing.rotation.x = Math.PI / 2;
        casing.position.set(-0.02, 0, 0);
        statorGroup.add(casing);

        // Imán Permanente Polo Norte (Rojo Carmesí 'N') - interior superior
        const magnetN = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.04, 0.2),
            new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.3 })
        );
        magnetN.position.set(-0.02, 0.14, 0);
        statorGroup.add(magnetN);

        // Imán Permanente Polo Sur (Azul Cobalto 'S') - interior inferior
        const magnetS = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.04, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.3 })
        );
        magnetS.position.set(-0.02, -0.14, 0);
        statorGroup.add(magnetS);

        // Etiquetas
        const nMark = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.005), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        nMark.position.set(-0.02, 0.14, 0.101);
        statorGroup.add(nMark);
        const sMark = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.005), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        sMark.position.set(-0.02, -0.14, 0.101);
        statorGroup.add(sMark);

        // Eje y armadura del rotor de cobre
        this.rotorArmatureGroup = new THREE.Group();
        this.rotorArmatureGroup.position.set(-0.02, 0, 0);

        const ironCoreMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.5 });
        
        // Custom coil texture for visual perfection
        const coilCanvas = document.createElement('canvas');
        coilCanvas.width = 128;
        coilCanvas.height = 128;
        const cCtx = coilCanvas.getContext('2d')!;
        cCtx.fillStyle = '#b87333';
        cCtx.fillRect(0, 0, 128, 128);
        cCtx.strokeStyle = '#8b4513';
        cCtx.lineWidth = 4;
        for (let y = 0; y < 128; y += 8) {
            cCtx.beginPath();
            cCtx.moveTo(0, y);
            cCtx.lineTo(128, y);
            cCtx.stroke();
        }
        const coilTex = new THREE.CanvasTexture(coilCanvas);
        coilTex.wrapS = THREE.RepeatWrapping;
        coilTex.wrapT = THREE.RepeatWrapping;
        coilTex.repeat.set(1, 4);

        const copperCoilMat = new THREE.MeshStandardMaterial({
            map: coilTex,
            color: 0xb87333,
            metalness: 0.9,
            roughness: 0.35
        });

        // Eje central de acero
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 16), ironCoreMat);
        shaft.rotation.x = Math.PI / 2;
        this.rotorArmatureGroup.add(shaft);

        // Manivela en el eje del rotor principal
        const rotorCrankGroup = new THREE.Group();
        rotorCrankGroup.position.set(0, 0, 0.15); // End of shaft
        
        const rotorCrankArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, 0.12, 0.01),
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
        );
        rotorCrankArm.position.set(0, 0.06, 0);
        rotorCrankGroup.add(rotorCrankArm);

        const rotorCrankHandle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.015, 0.06, 16),
            new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
        );
        rotorCrankHandle.rotation.x = Math.PI / 2;
        rotorCrankHandle.position.set(0, 0.12, 0.03);
        rotorCrankGroup.add(rotorCrankHandle);
        this.interactableMeshes.push(rotorCrankHandle);

        this.rotorArmatureGroup.add(rotorCrankGroup);

        // 5 Polos del inducido (diseño realista de motor DC)
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const poleGroup = new THREE.Group();
            poleGroup.rotation.z = angle;

            // Núcleo de hierro laminado
            const core = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.1, 0.18), ironCoreMat);
            core.position.y = 0.05;

            // Bobinado de hilo de cobre esmaltado
            const coilMat = copperCoilMat.clone();
            const coil = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, 0.17), coilMat);
            coil.position.y = 0.05;
            this.rotorCoils.push(coil);

            // Expansión polar (cabeza del polo)
            const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.015, 0.18), ironCoreMat);
            shoe.position.y = 0.105;

            poleGroup.add(core, coil, shoe);
            this.rotorArmatureGroup.add(poleGroup);
        }

        // Colector de delgas y escobillas de grafito
        this.commutatorGroup = new THREE.Group();
        const commutatorDisc = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.04, 16),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 })
        );
        commutatorDisc.rotation.x = Math.PI / 2;
        this.commutatorGroup.add(commutatorDisc);
        this.rotorArmatureGroup.add(this.commutatorGroup);

        statorGroup.add(this.rotorArmatureGroup);

        // Field lines
        const fieldMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
        for(let i=0; i<6; i++) {
            const angle = (i/6) * Math.PI * 2;
            const r1 = 0.14 + Math.random()*0.02;
            const r2 = 0.2;
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.02, 0.16, 0), // N
                new THREE.Vector3(-0.02 + Math.cos(angle)*r1, Math.sin(angle)*r1, Math.sin(angle)*r1),
                new THREE.Vector3(-0.02 + Math.cos(angle)*r2, -Math.sin(angle)*r2, 0),
                new THREE.Vector3(-0.02, -0.16, 0) // S
            ]);
            const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.006, 6), fieldMat);
            
            const arrowhead = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 6), fieldMat);
            const pt1 = curve.getPointAt(0.5);
            const pt2 = curve.getPointAt(0.51);
            arrowhead.position.copy(pt1);
            arrowhead.lookAt(pt2);
            arrowhead.rotateX(Math.PI/2);
            tube.add(arrowhead);
            
            statorGroup.add(tube);
            this.fieldLines.push(tube);
        }

        dynamoBaseGroup.add(statorGroup);

        // Escobillas de carbón fijas rozando el colector
        const brushMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
        const brush1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.04), brushMat);
        brush1.position.set(0.18, 0.29, 0);
        const brush2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.04), brushMat);
        brush2.position.set(0.18, 0.21, 0);
        dynamoBaseGroup.add(brush1, brush2);

        // Chispas del colector de delgas
        const sparkGeom = new THREE.BufferGeometry();
        this.sparkPositions = new Float32Array(30 * 3);
        sparkGeom.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
        const sparkMat = new THREE.PointsMaterial({
            color: 0x67e8f9,
            size: 0.025,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        this.brushSparks = new THREE.Points(sparkGeom, sparkMat);
        this.brushSparks.position.set(0.18, 0.25, 0);
        dynamoBaseGroup.add(this.brushSparks);

        this.group.add(dynamoBaseGroup);

        // =========================================================================
        // 6. LÁMPARA INCANDESCENTE VINTAGE EDISON (DERECHA: X = +0.45)
        // =========================================================================
        const lampGroup = new THREE.Group();
        lampGroup.position.set(0.48, tableH, -0.15);

        // Base de madera torneada oscura
        const lampBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.16, 0.06, 24),
            new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 })
        );
        lampBase.position.y = 0.03;
        lampGroup.add(lampBase);
        this.interactableMeshes.push(lampBase);

        // Portalámparas de bronce roscado
        const socket = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.055, 0.08, 20),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 })
        );
        socket.position.y = 0.09;
        lampGroup.add(socket);

        // Bombilla Premium Estandarizada
        const premiumBulb = this.createPremiumBulb();
        premiumBulb.group.position.y = 0.16;
        lampGroup.add(premiumBulb.group);
        this.interactableMeshes.push(premiumBulb.glass);

        this.bulbFilament = premiumBulb.filament;
        this.bulbPointLight = premiumBulb.pointLight;
        this.bulbGlowSprite = premiumBulb.glowSprite;

        this.group.add(lampGroup);

        // =========================================================================
        // 7. MULTÍMETRO DIGITAL UBICADO A LA DERECHA EN FRENTE DE LA BOMBILLA
        // =========================================================================
        this.buildDigitalMultimeter(tableH);

        // =========================================================================
        // 8. CABLES CONDUCTORES CON ELECTRONES ANIMADOS
        // =========================================================================
        const wireMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
        const wireMatBlack = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });

        // Ruta del cable rojo (V): desde escobilla positiva (-0.07, tableH + 0.29, 0) a la bombilla
        this.electronCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.07, tableH + 0.29, 0),
            new THREE.Vector3(0.25, tableH + 0.05, 0.1),
            new THREE.Vector3(0.40, tableH + 0.05, 0.05), // rodeo por detrás
            new THREE.Vector3(0.48, tableH + 0.10, -0.15) // A la bombilla
        ]);

        const wirePos = new THREE.Mesh(new THREE.TubeGeometry(this.electronCurve, 32, 0.008, 8, false), wireMatRed);
        this.group.add(wirePos);

        // Ruta del cable negro (COM): desde escobilla negativa (-0.07, tableH + 0.21, 0) a la bombilla
        const wireNegCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.07, tableH + 0.21, 0),
            new THREE.Vector3(0.28, tableH + 0.05, -0.2),
            new THREE.Vector3(0.45, tableH + 0.05, -0.25),
            new THREE.Vector3(0.48, tableH + 0.08, -0.15)
        ]);
        const wireNeg = new THREE.Mesh(new THREE.TubeGeometry(wireNegCurve, 24, 0.008, 8, false), wireMatBlack);
        this.group.add(wireNeg);

        // Pequeñas esferas emisivas que representan electrones fluyendo
        const electronGeom = new THREE.SphereGeometry(0.012, 8, 8);
        const electronMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        for (let i = 0; i < 8; i++) {
            const eMesh = new THREE.Mesh(electronGeom, electronMat);
            eMesh.visible = false;
            this.electronParticles.push(eMesh);
            this.group.add(eMesh);
        }

        // Performance: Precalcular puntos de la curva para no evaluar CatmullRom en el render loop
        this.electronPathPoints = this.electronCurve.getSpacedPoints(100);
    }

    private buildDigitalMultimeter(tableH: number) {
        this.meterGroup = new THREE.Group();
        this.meterGroup.position.set(0.48, tableH, 0.25);
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
        this.renderMeterScreen(0, 0);

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

        // Sondas al multímetro
        const blackCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.44, tableH + 0.08, 0.32),
            new THREE.Vector3(0.42, tableH + 0.03, 0.30),
            new THREE.Vector3(0.35, tableH + 0.03, -0.1),
            new THREE.Vector3(0.25, tableH + 0.05, -0.15),
            new THREE.Vector3(-0.07, tableH + 0.21, 0)
        ]);
        const blackGeom = new THREE.TubeGeometry(blackCurve, 32, 0.006, 8, false);
        const blackProbeWire = new THREE.Mesh(blackGeom, new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 }));
        this.group.add(blackProbeWire);

        const redCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.52, tableH + 0.08, 0.32),
            new THREE.Vector3(0.50, tableH + 0.03, 0.28),
            new THREE.Vector3(0.45, tableH + 0.03, 0.1),
            new THREE.Vector3(0.3, tableH + 0.05, 0.1),
            new THREE.Vector3(-0.07, tableH + 0.29, 0)
        ]);
        const redGeom = new THREE.TubeGeometry(redCurve, 32, 0.006, 8, false);
        const redProbeWire = new THREE.Mesh(redGeom, new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 }));
        this.group.add(redProbeWire);
    }

    private renderMeterScreen(voltage: number, time: number) {
        if (!this.meterCtx) return;
        const ctx = this.meterCtx;
        const w = this.meterCanvas.width;
        const h = this.meterCanvas.height;
        const isActive = voltage > 0.5;

        ctx.fillStyle = isActive ? '#064e3b' : '#0f172a';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = isActive ? '#22c55e' : '#334155';
        ctx.lineWidth = 6;
        ctx.strokeRect(8, 8, w - 16, h - 16);

        ctx.fillStyle = isActive ? '#a7f3d0' : '#64748b';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('DC VOLTAJE [ESCALA 24V]', 24, 46);

        if (isActive) {
            const jitter = (Math.sin(time * 6) * 0.015) + (Math.cos(time * 11) * 0.008);
            const val = (voltage + jitter).toFixed(2);
            ctx.fillStyle = '#4ade80';
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 16;
            ctx.font = 'bold 88px monospace';
            ctx.fillText(`${val} V`, 48, 140);
        } else {
            ctx.fillStyle = '#475569';
            ctx.shadowBlur = 0;
            ctx.font = 'bold 88px monospace';
            ctx.fillText(`0.00 V`, 48, 140);
        }

        ctx.shadowBlur = 0;
        ctx.fillStyle = isActive ? 'rgba(74, 222, 128, 0.4)' : 'rgba(71, 85, 105, 0.2)';
        ctx.fillRect(24, 180, w - 48, 22);

        if (isActive) {
            const barW = (w - 48) * (Math.min(voltage, 24) / 24);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(24, 180, barW, 22);
        }

        ctx.fillStyle = isActive ? '#86efac' : '#64748b';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('0V -------------------------------------------------------- 24V', 28, 226);

        this.meterTexture.needsUpdate = true;
    }

    public update(_time: number, delta: number = 0.016): void {
        if (this.isSleeping) return;
        // Suave aceleración e inercia física de rotación
        this.currentRpm += (this.targetRpm - this.currentRpm) * Math.min(1.0, delta * 3.5);

        // Giro de manivela y tren de engranajes
        const crankRps = this.currentRpm / 60;
        const deltaCrankAngle = crankRps * Math.PI * 2 * delta;
        this.crankAngle += deltaCrankAngle;
        this.crankArmGroup.rotation.z = -this.crankAngle;
        this.mainGearMesh.rotation.z = -this.crankAngle;

        // El piñón y el rotor giran a 5x en sentido contrario
        const deltaRotorAngle = deltaCrankAngle * this.gearRatio;
        this.rotorAngle += deltaRotorAngle;
        this.pinionGearMesh.rotation.z = this.rotorAngle;
        this.rotorArmatureGroup.rotation.z = this.rotorAngle;
        
        // Sincronización de bobinas (Glow al pasar por imanes N/S)
        const voltageNorm = Math.min(1.0, this.currentVoltage / 24.0);
        this.rotorCoils.forEach((coil, i) => {
            const angle = (i / 5) * Math.PI * 2 + this.rotorAngle;
            // Potencia de glow proporcional al cuadrado del voltaje inducido (V ~ cos(angle), P ~ cos²(angle))
            const alignment = Math.cos(angle) * Math.cos(angle);
            const mat = coil.material as THREE.MeshStandardMaterial;
            mat.emissive.setHex(0xffaa00);
            mat.emissiveIntensity = alignment * voltageNorm * 2.5;
        });

        // Pulse field lines
        const pulse = 0.4 + Math.sin(_time * 10.0 + this.currentRpm) * 0.2 * (this.currentRpm / 300);
        this.fieldLines.forEach(line => {
            (line.material as THREE.Material).opacity = pulse;
        });

        // Cálculo dinámico de voltaje (Ley de Faraday: proporcional a la velocidad angular)
        const targetVolt = (this.currentRpm / 300) * 24.0;
        this.currentVoltage += (targetVolt - this.currentVoltage) * Math.min(1.0, delta * 4.0);

        if (_time - this.lastMeterUpdateTime > 0.1) {
            this.renderMeterScreen(this.currentVoltage, _time);
            this.lastMeterUpdateTime = _time;
        }



        // Actualización lumínica de la Lámpara Edison (Efecto Joule)
        const filamentMat = this.bulbFilament.material as THREE.MeshStandardMaterial;

        if (this.currentVoltage < 0.5) {
            // Apagada
            filamentMat.color.setHex(0x334155);
            filamentMat.emissive.setHex(0x000000);
            filamentMat.emissiveIntensity = 0;
            this.bulbPointLight.intensity = 0;
            this.bulbGlowSprite.material.opacity = 0;
        } else if (this.currentVoltage < 6.0) {
            // Tenue incandescencia roja/ámbar
            const t = this.currentVoltage / 6.0;
            filamentMat.color.setHex(0xef4444);
            filamentMat.emissive.setHex(0xf97316);
            filamentMat.emissiveIntensity = 0.5 * t;
            this.bulbPointLight.color.setHex(0xf97316);
            this.bulbPointLight.intensity = 0.4 * t;
            this.bulbGlowSprite.material.opacity = 0.25 * t;
        } else if (this.currentVoltage < 15.0) {
            // Amarillo cálido brillante
            const t = (this.currentVoltage - 6.0) / 9.0;
            filamentMat.color.setHex(0xfde047);
            filamentMat.emissive.setHex(0xfacc15);
            filamentMat.emissiveIntensity = 1.0 + t;
            this.bulbPointLight.color.setHex(0xfef08a);
            this.bulbPointLight.intensity = 0.4 + t * 1.4;
            this.bulbGlowSprite.material.opacity = 0.25 + t * 0.4;
        } else {
            // Blanco incandescente a plena potencia
            const t = (this.currentVoltage - 15.0) / 9.0;
            filamentMat.color.setHex(0xffffff);
            filamentMat.emissive.setHex(0xffffff);
            filamentMat.emissiveIntensity = 2.0 + t * 1.5;
            this.bulbPointLight.color.setHex(0xffffff);
            this.bulbPointLight.intensity = 1.8 + t * 1.6;
            this.bulbGlowSprite.material.opacity = 0.65 + t * 0.35;
        }

        // Flujo de electrones animados a lo largo de los cables
        const isFlowing = this.currentVoltage > 1.0;
        const eSpeed = (this.currentVoltage / 24.0) * 1.2;
        const maxIdx = this.electronPathPoints.length - 1;
        this.electronParticles.forEach((eMesh, idx) => {
            eMesh.visible = isFlowing;
            if (isFlowing) {
                const u = ((_time * eSpeed + idx / this.electronParticles.length) % 1.0);
                const fIdx = u * maxIdx;
                const iIdx = Math.floor(fIdx);
                const t = fIdx - iIdx;
                const p1 = this.electronPathPoints[iIdx];
                const p2 = this.electronPathPoints[Math.min(iIdx + 1, maxIdx)];
                eMesh.position.lerpVectors(p1, p2, t);
            }
        });

        // Chispas aleatorias en las escobillas cuando el voltaje es alto
        if (this.currentVoltage > 14.0) {
            for (let i = 0; i < 30; i++) {
                this.sparkPositions[i * 3 + 0] = (Math.random() - 0.5) * 0.035;
                this.sparkPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.035;
                this.sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.035;
            }
            this.brushSparks.geometry.attributes.position.needsUpdate = true;
            this.brushSparks.visible = true;
        } else {
            this.brushSparks.visible = false;
        }
    }

    public cycleMode(): DynamoModeInfo {
        this.currentMode = (this.currentMode + 1) % this.modes.length;
        const info = this.modes[this.currentMode];
        this.targetRpm = info.crankRpm;
        return info;
    }

    // Método para permitir "dar una vuelta de manivela" interactiva acumulativa
    public crankKick(): DynamoModeInfo {
        // Si estaba detenido, pasa al modo suave
        if (this.currentMode === 0) {
            this.currentMode = 1;
        } else if (this.currentMode === 1) {
            this.currentMode = 2;
        } else if (this.currentMode === 2) {
            this.currentMode = 3;
        } else {
            this.currentMode = 0;
        }
        const info = this.modes[this.currentMode];
        this.targetRpm = info.crankRpm;
        return info;
    }

    public getCurrentModeInfo(): DynamoModeInfo {
        return this.modes[this.currentMode];
    }

    public setSleep(sleep: boolean): void {
        this.isSleeping = sleep;
        if (this.bulbPointLight) this.bulbPointLight.visible = !sleep;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
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
