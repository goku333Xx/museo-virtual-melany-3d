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

    // Componentes de la Lámpara Edison
    private bulbFilament: THREE.Mesh;
    private bulbPointLight: THREE.PointLight;
    private bulbGlowSprite: THREE.Sprite;

    // Componentes del Voltímetro Analógico
    private voltmeterNeedle: THREE.Mesh;

    // Partículas de electrones y chispas
    private electronParticles: THREE.Mesh[] = [];
    private electronCurve: THREE.CatmullRomCurve3;
    private brushSparks: THREE.Points;
    private sparkPositions: Float32Array;

    // Física de rotación e inercia
    private currentRpm: number = 0;
    private targetRpm: number = 0;
    private crankAngle: number = 0;
    private rotorAngle: number = 0;
    private gearRatio: number = 5.0; // 1 vuelta de manivela = 5 vueltas de rotor
    private currentVoltage: number = 0;
    private needleAngle: number = -Math.PI / 4; // Aguja en 0V

    private currentMode: number = 0;
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
        plaque.position.set(0, tableH + 0.012, 0.48);
        this.group.add(plaque);

        // =========================================================================
        // 2. PEDESTAL DE HIERRO FUNDIDO Y CAJA DE ENGRANAJES TRANSPARENTE
        // =========================================================================
        const dynamoBaseGroup = new THREE.Group();
        dynamoBaseGroup.position.set(-0.25, tableH + 0.02, 0);

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
        const acrylicMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.05,
            roughness: 0.08,
            transmission: 0.92,
            ior: 1.52,
            thickness: 0.15,
            transparent: true,
            opacity: 0.85
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

        // Imán Permanente Polo Norte (Rojo Carmesí 'N')
        const magnetN = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.24, 0.08),
            new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.3 })
        );
        magnetN.position.set(-0.02, 0.16, 0);
        statorGroup.add(magnetN);

        // Etiqueta 'N' blanca
        const nMark = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.04, 0.005),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        nMark.position.set(-0.02, 0.16, 0.042);
        statorGroup.add(nMark);

        // Imán Permanente Polo Sur (Azul Cobalto 'S')
        const magnetS = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.24, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.3 })
        );
        magnetS.position.set(-0.02, -0.16, 0);
        statorGroup.add(magnetS);

        // Etiqueta 'S' blanca
        const sMark = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.04, 0.005),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        sMark.position.set(-0.02, -0.16, 0.042);
        statorGroup.add(sMark);

        // Eje y armadura del rotor de cobre
        this.rotorArmatureGroup = new THREE.Group();
        this.rotorArmatureGroup.position.set(-0.02, 0, 0);

        const copperCoilMat = new THREE.MeshStandardMaterial({
            color: 0xb87333,
            metalness: 0.9,
            roughness: 0.25
        });

        // 4 Polos del inducido envueltos en hilo de cobre esmaltado
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const poleCore = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.045, 0.18), copperCoilMat);
            poleCore.rotation.z = angle;
            this.rotorArmatureGroup.add(poleCore);
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
        lampGroup.position.set(0.48, tableH + 0.02, -0.15);

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

        // Ampolla de vidrio tipo bombilla clásica Edison
        const bulbGlassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.05,
            roughness: 0.05,
            transmission: 0.94,
            ior: 1.5,
            thickness: 0.05,
            transparent: true,
            opacity: 0.75
        });
        const bulbGlass = new THREE.Mesh(new THREE.SphereGeometry(0.10, 24, 24), bulbGlassMat);
        bulbGlass.position.y = 0.22;
        bulbGlass.scale.set(1.0, 1.3, 1.0);
        lampGroup.add(bulbGlass);
        this.interactableMeshes.push(bulbGlass);

        // Filamento de tungsteno en jaula doble espiral
        const filamentGeom = new THREE.TorusGeometry(0.038, 0.005, 12, 24);
        const filamentMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            emissive: 0x000000,
            emissiveIntensity: 0.0,
            roughness: 0.4
        });
        this.bulbFilament = new THREE.Mesh(filamentGeom, filamentMat);
        this.bulbFilament.position.y = 0.22;
        this.bulbFilament.rotation.x = Math.PI / 2;
        lampGroup.add(this.bulbFilament);

        // Luz dinámica emitida por la bombilla
        this.bulbPointLight = new THREE.PointLight(0xffedd5, 0, 4.5, 1.5);
        this.bulbPointLight.position.set(0, 0.22, 0);
        lampGroup.add(this.bulbPointLight);

        // Halo resplandeciente en la bombilla
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
        this.bulbGlowSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
        );
        this.bulbGlowSprite.position.set(0, 0.22, 0);
        this.bulbGlowSprite.scale.set(0.65, 0.65, 0.65);
        lampGroup.add(this.bulbGlowSprite);

        this.group.add(lampGroup);

        // =========================================================================
        // 7. VOLTÍMETRO ANALÓGICO CALIBRADO (0 A 24V)
        // =========================================================================
        const meterGroup = new THREE.Group();
        meterGroup.position.set(0.48, tableH + 0.02, 0.28);
        meterGroup.rotation.y = -Math.PI / 10;

        // Cuerpo cilíndrico de baquelita / bronce
        const meterBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 0.07, 32),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
        );
        meterBody.rotation.x = Math.PI / 6; // Inclinado 30° hacia el jugador
        meterGroup.add(meterBody);
        this.interactableMeshes.push(meterBody);

        // Bisel de latón
        const meterBezel = new THREE.Mesh(
            new THREE.TorusGeometry(0.12, 0.012, 16, 32),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 })
        );
        meterBezel.rotation.x = Math.PI / 6;
        meterBezel.position.y = 0.038;
        meterGroup.add(meterBezel);

        // Cuadrante esmaltado con escala
        const dialCanvas = document.createElement('canvas');
        dialCanvas.width = 256;
        dialCanvas.height = 256;
        const dCtx = dialCanvas.getContext('2d')!;
        dCtx.fillStyle = '#f8fafc';
        dCtx.fillRect(0, 0, 256, 256);
        dCtx.strokeStyle = '#0f172a';
        dCtx.lineWidth = 4;
        dCtx.beginPath();
        dCtx.arc(128, 140, 95, Math.PI * 0.75, Math.PI * 0.25, false);
        dCtx.stroke();

        // Ticks de voltaje
        dCtx.fillStyle = '#0f172a';
        dCtx.font = 'bold 22px sans-serif';
        dCtx.textAlign = 'center';
        dCtx.fillText('VOLTS DC', 128, 90);
        dCtx.font = 'bold 16px sans-serif';
        dCtx.fillText('0V', 60, 165);
        dCtx.fillText('12V', 128, 60);
        dCtx.fillText('24V', 200, 165);

        const dialTex = new THREE.CanvasTexture(dialCanvas);
        const dialPlane = new THREE.Mesh(
            new THREE.CircleGeometry(0.11, 32),
            new THREE.MeshBasicMaterial({ map: dialTex })
        );
        dialPlane.rotation.x = -Math.PI / 3;
        dialPlane.position.set(0, 0.036, 0.02);
        meterGroup.add(dialPlane);

        // Aguja indicadora analógica
        const needleGeom = new THREE.BoxGeometry(0.005, 0.09, 0.003);
        const needleMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.5, roughness: 0.2 });
        this.voltmeterNeedle = new THREE.Mesh(needleGeom, needleMat);
        this.voltmeterNeedle.position.set(0, 0.038, 0.02);
        this.voltmeterNeedle.rotation.x = -Math.PI / 3;
        meterGroup.add(this.voltmeterNeedle);

        this.group.add(meterGroup);

        // =========================================================================
        // 8. CABLES CONDUCTORES CON ELECTRONES ANIMADOS
        // =========================================================================
        const wireMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
        const wireMatBlack = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });

        this.electronCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.06, tableH + 0.25, 0),
            new THREE.Vector3(0.15, tableH + 0.05, 0.15),
            new THREE.Vector3(0.40, tableH + 0.06, 0.25), // Al voltímetro
            new THREE.Vector3(0.44, tableH + 0.05, -0.05), // A la bombilla
            new THREE.Vector3(0.48, tableH + 0.12, -0.15)
        ]);

        const wirePos = new THREE.Mesh(new THREE.TubeGeometry(this.electronCurve, 32, 0.008, 8, false), wireMatRed);
        this.group.add(wirePos);

        const wireNegCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.06, tableH + 0.21, 0),
            new THREE.Vector3(0.15, tableH + 0.04, -0.15),
            new THREE.Vector3(0.48, tableH + 0.10, -0.15)
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
    }

    public update(_time: number, delta: number = 0.016): void {
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
        this.rotorArmatureGroup.rotation.x = this.rotorAngle;

        // Cálculo dinámico de voltaje (Ley de Faraday: proporcional a la velocidad angular)
        const targetVolt = (this.currentRpm / 300) * 24.0;
        this.currentVoltage += (targetVolt - this.currentVoltage) * Math.min(1.0, delta * 4.0);

        // Aguja del voltímetro (de -45° en 0V a +45° en 24V) con ligero temblor analógico
        const needleTarget = -Math.PI / 4 + (this.currentVoltage / 24.0) * (Math.PI / 2);
        const needleJitter = this.currentVoltage > 1.0 ? (Math.random() - 0.5) * 0.04 : 0;
        this.needleAngle += (needleTarget - this.needleAngle) * Math.min(1.0, delta * 8.0);
        this.voltmeterNeedle.rotation.z = -(this.needleAngle + needleJitter);

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
        this.electronParticles.forEach((eMesh, idx) => {
            eMesh.visible = isFlowing;
            if (isFlowing) {
                const u = ((_time * eSpeed + idx / this.electronParticles.length) % 1.0);
                const pos = this.electronCurve.getPointAt(u);
                eMesh.position.copy(pos);
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

    public getMesh(): THREE.Group {
        return this.group;
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }
}
