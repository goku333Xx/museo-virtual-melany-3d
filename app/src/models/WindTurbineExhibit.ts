import * as THREE from 'three';

export interface WindTurbineModeInfo {
    id: number;
    name: string;
    windSpeed: number; // m/s
    voltage: number;   // Volts
    desc: string;
}

export class WindTurbineExhibit {
    private group: THREE.Group;
    private rotorHub: THREE.Group;
    private generatorRotor: THREE.Group;
    private voltmeterNeedle: THREE.Mesh;
    private cityWindows: THREE.MeshStandardMaterial[] = [];
    private streetLights: THREE.MeshBasicMaterial[] = [];
    private interactableMeshes: THREE.Object3D[] = [];

    private currentMode: number = 1;
    private currentRpm: number = 90;
    private targetRpm: number = 90;
    private currentAngle: number = 0;
    private currentVoltage: number = 5.0;
    private targetVoltage: number = 5.0;

    private readonly modes: WindTurbineModeInfo[] = [
        {
            id: 0,
            name: "Brisa Suave (3 m/s · 1.8V · Farolas)",
            windSpeed: 3,
            voltage: 1.8,
            desc: "Una brisa leve hace girar lentamente las aspas. El dinamo Faraday genera poco voltaje, encendiendo únicamente el alumbrado público."
        },
        {
            id: 1,
            name: "Viento Favorable (8 m/s · 5.0V · Ciudad Iluminada)",
            windSpeed: 8,
            voltage: 5.0,
            desc: "Flujo laminar óptico. La velocidad angular corta más líneas de campo magnético por segundo (Ley de Faraday) y enciende casas y edificios."
        },
        {
            id: 2,
            name: "Vendaval de Potencia (15 m/s · 12.0V · Metrópolis Plena)",
            windSpeed: 15,
            voltage: 12.0,
            desc: "Máxima potencia cinética. Las tres aspas giran a alta velocidad alimentando toda la red eléctrica y la torre de telecomunicaciones."
        }
    ];

    constructor() {
        this.group = new THREE.Group();

        // 1. MESA DIORAMA DE LA CIUDAD Y TURBINA (2.4m x 1.4m x 0.12m)
        const tableW = 2.4;
        const tableD = 1.4;
        const tableH = 0.10;

        const tableGeom = new THREE.BoxGeometry(tableW, tableH, tableD);
        const tableMat = new THREE.MeshStandardMaterial({
            color: 0x121722,
            metalness: 0.8,
            roughness: 0.25
        });
        const table = new THREE.Mesh(tableGeom, tableMat);
        table.position.set(0, tableH / 2, 0);
        table.receiveShadow = true;
        this.group.add(table);
        this.interactableMeshes.push(table);

        // Bisel de latón pulido alrededor de la mesa
        const rimGeom = new THREE.BoxGeometry(tableW + 0.04, 0.02, tableD + 0.04);
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
        const rim = new THREE.Mesh(rimGeom, brassMat);
        rim.position.set(0, tableH + 0.01, 0);
        this.group.add(rim);

        // 2. MÁSTIL AEROGENERADOR (Lado Izquierdo: X = -0.65)
        const turbineBaseX = -0.65;
        const towerH = 1.65;
        const towerGeom = new THREE.CylinderGeometry(0.045, 0.085, towerH, 32);
        const towerMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            metalness: 0.3,
            roughness: 0.25
        });
        const tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(turbineBaseX, tableH + towerH / 2, 0);
        tower.castShadow = true;
        this.group.add(tower);
        this.interactableMeshes.push(tower);

        // Base cónica de anclaje con tornillos perimetrales
        const baseCone = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.06, 24), brassMat);
        baseCone.position.set(turbineBaseX, tableH + 0.03, 0);
        this.group.add(baseCone);

        // 3. GÓNDOLA Y DÍNAMO TRANSPARENTE
        const nacelleY = tableH + towerH + 0.06;
        const nacelleGeom = new THREE.CylinderGeometry(0.09, 0.08, 0.38, 24);
        nacelleGeom.rotateZ(Math.PI / 2);
        const nacelleMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.85,
            roughness: 0.2
        });
        const nacelle = new THREE.Mesh(nacelleGeom, nacelleMat);
        nacelle.position.set(turbineBaseX + 0.05, nacelleY, 0);
        this.group.add(nacelle);

        // Ventana de inspección de policarbonato para ver el dinamo
        const glassCanopy = new THREE.Mesh(
            new THREE.CylinderGeometry(0.092, 0.082, 0.22, 16, 1, false, 0, Math.PI),
            new THREE.MeshPhysicalMaterial({
                color: 0x93c5fd,
                transmission: 0.85,
                opacity: 0.9,
                transparent: true,
                roughness: 0.05,
                ior: 1.5
            })
        );
        glassCanopy.position.set(turbineBaseX + 0.05, nacelleY, 0);
        glassCanopy.rotation.x = -Math.PI / 2;
        this.group.add(glassCanopy);

        // Núcleo del dinamo interior: Bobinas de cobre fijas (estator)
        const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.15 });
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const coil = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.015, 12, 24), coilMat);
            coil.position.set(turbineBaseX + 0.05, nacelleY, 0);
            coil.rotation.x = angle;
            this.group.add(coil);
        }

        // Rotor de imanes de neodimio (gira con las aspas)
        this.generatorRotor = new THREE.Group();
        this.generatorRotor.position.set(turbineBaseX + 0.05, nacelleY, 0);
        const magnetMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.95, roughness: 0.1 });
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2 + Math.PI / 4;
            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.015), magnetMat);
            mag.position.set(0, Math.cos(angle) * 0.035, Math.sin(angle) * 0.035);
            this.generatorRotor.add(mag);
        }
        this.group.add(this.generatorRotor);

        // 4. BUJE Y 3 ASPAS AERODINÁMICAS ROTATIVAS
        this.rotorHub = new THREE.Group();
        this.rotorHub.position.set(turbineBaseX + 0.24, nacelleY, 0);

        // Cono de morro estilizado
        const noseCone = new THREE.Mesh(
            new THREE.ConeGeometry(0.08, 0.14, 24),
            new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.7, roughness: 0.2 })
        );
        noseCone.rotation.z = -Math.PI / 2;
        this.rotorHub.add(noseCone);

        // Creación de 3 aspas de 0.65m con perfil alar
        const bladeLen = 0.65;
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0, 0);
        bladeShape.lineTo(bladeLen * 0.2, 0.045);
        bladeShape.lineTo(bladeLen * 0.75, 0.035);
        bladeShape.lineTo(bladeLen, 0.008);
        bladeShape.lineTo(bladeLen, -0.008);
        bladeShape.lineTo(bladeLen * 0.2, -0.025);
        bladeShape.closePath();

        const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
            depth: 0.006,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.002,
            bevelThickness: 0.002
        });
        bladeGeom.center();

        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xf1f5f9,
            metalness: 0.2,
            roughness: 0.3
        });

        for (let i = 0; i < 3; i++) {
            const bladePivot = new THREE.Group();
            bladePivot.rotation.x = (i * Math.PI * 2) / 3;

            const blade = new THREE.Mesh(bladeGeom, bladeMat);
            blade.position.set(0, bladeLen / 2 + 0.05, 0);
            blade.rotation.y = 0.15; // Ángulo de ataque de 8.5 grados
            blade.castShadow = true;
            bladePivot.add(blade);

            // Borde de ataque con franja de alta visibilidad cian
            const tip = new THREE.Mesh(
                new THREE.BoxGeometry(0.008, 0.10, 0.012),
                new THREE.MeshBasicMaterial({ color: 0x00f0ff })
            );
            tip.position.set(0, bladeLen + 0.02, 0);
            bladePivot.add(tip);

            this.rotorHub.add(bladePivot);
        }

        this.group.add(this.rotorHub);
        this.interactableMeshes.push(this.rotorHub);

        // 5. MAQUETA DE MINI CIUDAD Y RED ELÉCTRICA (Lado Derecho: X = 0.35)
        const cityGroup = new THREE.Group();
        cityGroup.position.set(0.35, tableH, 0);

        // Pavimento asfaltado y cuadrícula de calles
        const asphalt = new THREE.Mesh(
            new THREE.PlaneGeometry(1.2, 1.1),
            new THREE.MeshStandardMaterial({ color: 0x181e28, roughness: 0.85 })
        );
        asphalt.rotation.x = -Math.PI / 2;
        asphalt.position.y = 0.002;
        cityGroup.add(asphalt);

        // Franjas de calles peatonales en miniatura
        const laneMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
        for (let lx = -0.4; lx <= 0.4; lx += 0.4) {
            const lane = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 1.0), laneMat);
            lane.rotation.x = -Math.PI / 2;
            lane.position.set(lx, 0.003, 0);
            cityGroup.add(lane);
        }

        // 8 Edificios con ventanas iluminables
        const buildingConfigs = [
            { x: -0.32, z: -0.32, w: 0.18, d: 0.18, h: 0.45 },
            { x: 0.0,   z: -0.35, w: 0.22, d: 0.16, h: 0.65 }, // Torre central
            { x: 0.32,  z: -0.30, w: 0.18, d: 0.18, h: 0.38 },
            { x: -0.30, z: 0.05,  w: 0.16, d: 0.20, h: 0.32 },
            { x: 0.32,  z: 0.05,  w: 0.16, d: 0.22, h: 0.50 },
            { x: -0.32, z: 0.35,  w: 0.20, d: 0.16, h: 0.28 },
            { x: 0.0,   z: 0.38,  w: 0.20, d: 0.16, h: 0.35 },
            { x: 0.32,  z: 0.35,  w: 0.18, d: 0.16, h: 0.25 }
        ];

        buildingConfigs.forEach((cfg) => {
            const bMat = new THREE.MeshStandardMaterial({
                color: 0x222a38,
                metalness: 0.6,
                roughness: 0.4
            });
            const bMesh = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d), bMat);
            bMesh.position.set(cfg.x, cfg.h / 2, cfg.z);
            bMesh.castShadow = true;
            cityGroup.add(bMesh);

            // Ventanas luminosas reactivas al voltaje
            const winMat = new THREE.MeshStandardMaterial({
                color: 0xfef08a,
                emissive: 0xfde047,
                emissiveIntensity: 0.8,
                roughness: 0.2
            });
            this.cityWindows.push(winMat);

            const winRows = Math.floor(cfg.h / 0.08);
            for (let r = 1; r < winRows; r++) {
                const winFront = new THREE.Mesh(
                    new THREE.PlaneGeometry(cfg.w * 0.75, 0.035),
                    winMat
                );
                winFront.position.set(cfg.x, r * 0.08, cfg.z + cfg.d / 2 + 0.001);
                cityGroup.add(winFront);
            }
        });

        // 6 Farolas de calle con focos cálidos
        const postMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
        const lampPositions = [
            [-0.15, -0.2], [-0.15, 0.2], [0.15, -0.2], [0.15, 0.2], [-0.48, 0], [0.48, 0]
        ];

        lampPositions.forEach(([lx, lz]) => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.18, 12), postMat);
            post.position.set(lx, 0.09, lz);
            cityGroup.add(post);

            const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
            lampHead.position.set(lx, 0.18, lz);
            cityGroup.add(lampHead);

            const lMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
            this.streetLights.push(lMat);
            lampHead.material = lMat;
        });

        this.group.add(cityGroup);

        // 6. VOLTÍMETRO ANALÓGICO CON AGUJA FÍSICA Y DIAL ILUMINADO
        const meterGroup = new THREE.Group();
        meterGroup.position.set(0.35, tableH + 0.04, 0.60);
        meterGroup.rotation.x = -Math.PI / 4; // Inclinado hacia el observador

        const meterBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.18, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
        );
        meterGroup.add(meterBox);

        // Dial con escala 0V - 12V
        const dialGeom = new THREE.PlaneGeometry(0.28, 0.14);
        const dialMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
        const dial = new THREE.Mesh(dialGeom, dialMat);
        dial.position.z = 0.031;
        meterGroup.add(dial);

        // Aguja indicadora roja
        const needleGeom = new THREE.BoxGeometry(0.006, 0.09, 0.005);
        needleGeom.translate(0, 0.045, 0); // Pivote en la base
        const needleMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        this.voltmeterNeedle = new THREE.Mesh(needleGeom, needleMat);
        this.voltmeterNeedle.position.set(0, -0.04, 0.033);
        meterGroup.add(this.voltmeterNeedle);

        this.group.add(meterGroup);
        this.interactableMeshes.push(meterBox);

        // Cables de conexión entre el aerogenerador y la ciudad
        const wireMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 });
        const wireCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(turbineBaseX + 0.05, tableH + 0.03, 0.05),
            new THREE.Vector3(-0.2, tableH + 0.08, 0.2),
            new THREE.Vector3(0.1, tableH + 0.02, 0.4),
            new THREE.Vector3(0.35, tableH + 0.03, 0.55)
        ]);
        const wire = new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 32, 0.012, 8, false), wireMat);
        this.group.add(wire);
    }

    public update(_time: number, delta: number = 0.016): void {
        // Interpolación inercial suave de RPM y Voltaje
        this.currentRpm += (this.targetRpm - this.currentRpm) * Math.min(1.0, delta * 3.5);
        this.currentVoltage += (this.targetVoltage - this.currentVoltage) * Math.min(1.0, delta * 3.5);

        // Rotación de las aspas
        const rps = this.currentRpm / 60;
        this.currentAngle += rps * Math.PI * 2 * delta;
        this.rotorHub.rotation.x = this.currentAngle;
        this.generatorRotor.rotation.x = this.currentAngle;

        // Movimiento de la aguja del voltímetro (-45° a +45°)
        const normV = Math.max(0, Math.min(1, this.currentVoltage / 12.0));
        const needleAngle = (1 - normV) * (Math.PI / 3) - (Math.PI / 3);
        this.voltmeterNeedle.rotation.z = -needleAngle;

        // Brillo reactivo de ventanas y farolas
        const emissiveLevel = 0.15 + normV * 1.25;
        this.cityWindows.forEach(wMat => {
            wMat.emissiveIntensity = emissiveLevel;
        });
        this.streetLights.forEach(lMat => {
            lMat.color.setScalar(normV > 0.1 ? 1.0 : 0.2);
        });
    }

    public cycleMode(): WindTurbineModeInfo {
        this.currentMode = (this.currentMode + 1) % this.modes.length;
        const info = this.modes[this.currentMode];

        const rpmMap = [35, 110, 220];
        this.targetRpm = rpmMap[this.currentMode];
        this.targetVoltage = info.voltage;

        return info;
    }

    public getCurrentModeInfo(): WindTurbineModeInfo {
        return this.modes[this.currentMode];
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }
}
