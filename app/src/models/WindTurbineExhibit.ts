import * as THREE from 'three';

export interface WindTurbineModeInfo {
    id: number;
    name: string;
    windSpeed: number; // m/s
    voltage: number;   // Volts
    power: string;
    desc: string;
}

export class WindTurbineExhibit {
    private group: THREE.Group;
    private yawGroup: THREE.Group;
    private rotorHub: THREE.Group;
    private generatorRotor: THREE.Group;
    private anemometerHub: THREE.Group;
    private beaconLight: THREE.Mesh;
    private voltmeterNeedle: THREE.Mesh;
    private cityWindows: THREE.MeshStandardMaterial[] = [];
    private streetLights: THREE.MeshBasicMaterial[] = [];
    private interactableMeshes: THREE.Object3D[] = [];

    private currentMode: number = 1;
    private currentRpm: number = 85;
    private targetRpm: number = 85;
    private currentAngle: number = 0;
    private anemometerAngle: number = 0;
    private currentVoltage: number = 5.0;
    private targetVoltage: number = 5.0;
    private isSleeping: boolean = false;

    private readonly modes: WindTurbineModeInfo[] = [
        {
            id: 0,
            name: "Brisa Suave (3.5 m/s · 2.1 V · 35 RPM)",
            windSpeed: 3.5,
            voltage: 2.1,
            power: "250 W",
            desc: "Una brisa leve hace girar las aspas lentamente. El generador electromagnético produce poca corriente, encendiendo únicamente el alumbrado de las calles."
        },
        {
            id: 1,
            name: "Viento Favorable (8.5 m/s · 6.0 V · 90 RPM)",
            windSpeed: 8.5,
            voltage: 6.0,
            power: "1.2 kW",
            desc: "Viento ideal. Las aspas aerodinámicas cortan el aire con eficiencia y hacen girar los imanes dentro de bobinas de cobre, iluminando las casas de la maqueta."
        },
        {
            id: 2,
            name: "Vendaval de Potencia (16.0 m/s · 12.0 V · 180 RPM)",
            windSpeed: 16.0,
            voltage: 12.0,
            power: "3.5 kW",
            desc: "Viento huracanado de alta energía. El rotor gira a máxima potencia y enciende todos los rascacielos y oficinas del centro urbano."
        }
    ];

    constructor() {
        this.group = new THREE.Group();

        // 1. MESA DIORAMA DEL PARQUE EÓLICO Y CIUDAD (2.4m x 1.4m x 0.10m)
        const tableW = 2.4;
        const tableD = 1.4;
        const tableH = 0.10;

        const tableMat = new THREE.MeshStandardMaterial({
            color: 0x121722,
            metalness: 0.85,
            roughness: 0.25
        });
        const table = new THREE.Mesh(new THREE.BoxGeometry(tableW, tableH, tableD), tableMat);
        table.position.set(0, tableH / 2, 0);
        table.receiveShadow = true;
        this.group.add(table);
        this.interactableMeshes.push(table);

        // Moldura en latón dorado
        const rim = new THREE.Mesh(
            new THREE.BoxGeometry(tableW + 0.04, 0.02, tableD + 0.04),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
        );
        rim.position.set(0, tableH + 0.01, 0);
        this.group.add(rim);

        // =========================================================================
        // 2. AEROGENERADOR REALISTA (ESTILO VESTAS / SIEMENS INDUSTRIAL)
        // =========================================================================
        const turbineBaseX = -0.68;
        const towerH = 1.70;

        // Torre tubular cónica de acero blanco con pintura anticorrosiva
        const towerGeom = new THREE.CylinderGeometry(0.042, 0.088, towerH, 32);
        const towerMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            metalness: 0.25,
            roughness: 0.35
        });
        const tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(turbineBaseX, tableH + towerH / 2, 0);
        this.group.add(tower);
        this.interactableMeshes.push(tower);

        // Base de anclaje de hormigón armado con corona de pernos
        const foundation = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.17, 0.05, 24),
            new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 })
        );
        foundation.position.set(turbineBaseX, tableH + 0.025, 0);
        this.group.add(foundation);

        // Puerta de servicio para técnicos en la base de la torre
        const doorGeom = new THREE.BoxGeometry(0.025, 0.12, 0.045);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
        const door = new THREE.Mesh(doorGeom, doorMat);
        door.position.set(turbineBaseX + 0.075, tableH + 0.09, 0);
        this.group.add(door);

        // Señal de peligro alta tensión (amarillo) en la puerta
        const hazardPlate = new THREE.Mesh(
            new THREE.PlaneGeometry(0.015, 0.015),
            new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
        );
        hazardPlate.position.set(turbineBaseX + 0.088, tableH + 0.11, 0);
        hazardPlate.rotation.y = Math.PI / 2;
        this.group.add(hazardPlate);

        // Plataforma superior de guiñada (Yaw deck)
        const yawDeck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.052, 0.045, 0.03, 24),
            new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 })
        );
        yawDeck.position.set(turbineBaseX, tableH + towerH + 0.015, 0);
        this.group.add(yawDeck);

        // =========================================================================
        // 3. GÓNDOLA AERODINÁMICA (NACELLE) Y GENERADOR
        // =========================================================================
        const nacelleY = tableH + towerH + 0.07;

        // Cuerpo estilizado y curvado de la góndola (fibra de vidrio blanca)
        this.yawGroup = new THREE.Group();
        this.yawGroup.position.set(turbineBaseX, nacelleY, 0);
        this.group.add(this.yawGroup);

        const nacelleGroup = new THREE.Group();
        this.yawGroup.add(nacelleGroup);

        const nacelleBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.12, 0.13),
            towerMat
        );
        nacelleBody.position.set(0.04, 0, 0);
        nacelleGroup.add(nacelleBody);
        this.interactableMeshes.push(nacelleBody);

        // Cola aerodinámica biselada de la góndola
        const nacelleTail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.065, 0.12, 16),
            towerMat
        );
        nacelleTail.rotation.z = Math.PI / 2;
        nacelleTail.position.set(-0.21, 0, 0);
        nacelleGroup.add(nacelleTail);

        // Rejillas de ventilación y radiador de la góndola
        const grillMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
        const grill = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.134), grillMat);
        grill.position.set(-0.06, 0.02, 0);
        nacelleGroup.add(grill);

        // Ventana de acrílico transparente para inspección técnica
        const windowCanopy = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.06, 0.136),
            new THREE.MeshPhysicalMaterial({
                color: 0x93c5fd,
                transmission: 0.85,
                transparent: true,
                opacity: 0.9,
                roughness: 0.1
            })
        );
        windowCanopy.position.set(0.10, 0.02, 0);
        nacelleGroup.add(windowCanopy);

        // Bobinas de cobre fijas del generador electromagnético (estator)
        const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.95, roughness: 0.1 });
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const coil = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.010, 12, 20), copperMat);
            coil.position.set(0.10, 0, 0);
            coil.rotation.x = angle;
            nacelleGroup.add(coil);
        }

        // Rotor con imanes de neodimio que giran solidarios al eje
        this.generatorRotor = new THREE.Group();
        this.generatorRotor.position.set(0.10, 0, 0);
        const magnetMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.95, roughness: 0.1 });
        for (let m = 0; m < 4; m++) {
            const ang = (m * Math.PI) / 2 + Math.PI / 4;
            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.028, 0.012), magnetMat);
            mag.position.set(0, Math.cos(ang) * 0.024, Math.sin(ang) * 0.024);
            this.generatorRotor.add(mag);
        }
        nacelleGroup.add(this.generatorRotor);

        // Anemómetro en el techo de la góndola con cazoletas giratorias
        const anemometerPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.004, 0.004, 0.06, 8),
            new THREE.MeshStandardMaterial({ color: 0x0f172a })
        );
        anemometerPole.position.set(-0.14, 0.09, 0);
        nacelleGroup.add(anemometerPole);

        this.anemometerHub = new THREE.Group();
        this.anemometerHub.position.set(-0.14, 0.12, 0);
        for (let a = 0; a < 3; a++) {
            const aAngle = (a * Math.PI * 2) / 3;
            const cupArm = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.025, 8), grillMat);
            cupArm.rotation.z = Math.PI / 2;
            cupArm.rotation.y = aAngle;
            cupArm.position.set(Math.cos(aAngle) * 0.012, 0, Math.sin(aAngle) * 0.012);
            this.anemometerHub.add(cupArm);

            const cup = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8, 0, Math.PI), grillMat);
            cup.rotation.y = aAngle + Math.PI / 2;
            cup.position.set(Math.cos(aAngle) * 0.026, 0, Math.sin(aAngle) * 0.026);
            this.anemometerHub.add(cup);
        }
        nacelleGroup.add(this.anemometerHub);

        // Luz roja de baliza de aviación (anti-colisión) que parpadea lentamente
        this.beaconLight = new THREE.Mesh(
            new THREE.SphereGeometry(0.012, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        this.beaconLight.position.set(-0.21, 0.08, 0);
        nacelleGroup.add(this.beaconLight);

        // Ya añadido a yawGroup

        // =========================================================================
        // 4. BUJE Y 3 ASPAS AERODINÁMICAS BLANCAS CON PUNTA ROJA ("POSTA")
        // =========================================================================
        this.rotorHub = new THREE.Group();
        this.rotorHub.position.set(0.25, 0, 0);

        // Nariz cónica aerodinámica (Nosecone) en blanco industrial
        const noseCone = new THREE.Mesh(
            new THREE.ConeGeometry(0.075, 0.13, 24),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.3, roughness: 0.25 })
        );
        noseCone.rotation.z = -Math.PI / 2;
        this.rotorHub.add(noseCone);

        // Tapa frontal del buje
        const hubCap = new THREE.Mesh(
            new THREE.SphereGeometry(0.065, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2),
            towerMat
        );
        hubCap.rotation.z = -Math.PI / 2;
        this.rotorHub.add(hubCap);

        // 3 aspas aerodinámicas de perfil alar (blancas con dobles franjas rojas en la punta)
        const bladeLen = 0.68;
        const bladeShape = new THREE.Shape();
        // Extruimos en el eje Z, lo dibujamos en X-Y. 
        // Para que se extienda a lo largo del radio (eje Y al rotarlo), lo dibujamos a lo largo del eje Y.
        bladeShape.moveTo(0, 0);
        bladeShape.lineTo(0.040, bladeLen * 0.18);
        bladeShape.lineTo(0.024, bladeLen * 0.78);
        bladeShape.lineTo(0.005, bladeLen);
        bladeShape.lineTo(-0.005, bladeLen);
        bladeShape.lineTo(-0.016, bladeLen * 0.78);
        bladeShape.lineTo(-0.020, bladeLen * 0.18);
        bladeShape.closePath();

        const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
            depth: 0.006,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.001,
            bevelThickness: 0.001
        });
        // Desplazamos levemente para que nazcan justo del borde del buje
        bladeGeom.translate(0, 0.06, -0.003);

        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            metalness: 0.2,
            roughness: 0.35
        });

        const redTipMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });

        for (let i = 0; i < 3; i++) {
            const bladePivot = new THREE.Group();
            bladePivot.rotation.x = (i * Math.PI * 2) / 3;

            const blade = new THREE.Mesh(bladeGeom, bladeMat);
            blade.rotation.y = 0.14; // Ángulo de ataque aerodinámico (pitch)
            bladePivot.add(blade);

            // Franja de advertencia aeronáutica roja 1
            const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.024, 0.014), redTipMat);
            stripe1.position.set(0, bladeLen * 0.88 + 0.06, 0);
            stripe1.rotation.y = 0.14;
            bladePivot.add(stripe1);

            // Franja de advertencia aeronáutica roja 2 (punta extrema)
            const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.016, 0.010), redTipMat);
            stripe2.position.set(0, bladeLen + 0.05, 0);
            stripe2.rotation.y = 0.14;
            bladePivot.add(stripe2);

            this.rotorHub.add(bladePivot);
        }

        this.yawGroup.add(this.rotorHub);
        this.interactableMeshes.push(this.rotorHub);

        // =========================================================================
        // 5. MAQUETA DE MINI CIUDAD Y RED ELÉCTRICA (X = +0.35)
        // =========================================================================
        const cityGroup = new THREE.Group();
        cityGroup.position.set(0.38, tableH, 0);

        // Césped y parque alrededor del pueblo
        const parkMat = new THREE.MeshStandardMaterial({ color: 0x1e3a2b, roughness: 0.9 });
        const park = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.15), parkMat);
        park.rotation.x = -Math.PI / 2;
        park.position.y = 0.001;
        cityGroup.add(park);

        // Calles empedradas / caminos
        const streetMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 });
        const street = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.24), streetMat);
        street.rotation.x = -Math.PI / 2;
        street.position.set(0, 0.002, 0.12);
        cityGroup.add(street);

        // Pequeño pueblo de estilo low-poly con casitas
        const houseGeom = new THREE.BoxGeometry(0.12, 0.10, 0.14);
        const roofGeom = new THREE.ConeGeometry(0.11, 0.08, 4);
        roofGeom.rotateY(Math.PI / 4);
        const chimneyGeom = new THREE.BoxGeometry(0.02, 0.06, 0.02);

        const townData = [
            { x: -0.35, z: -0.30, rot: 0.2, color: 0xf1f5f9, roof: 0xef4444 }, // Blanco, techo rojo
            { x: -0.15, z: -0.40, rot: -0.1, color: 0xbfdbfe, roof: 0x3b82f6 }, // Celestito
            { x: 0.10,  z: -0.32, rot: 0.5, color: 0xfef08a, roof: 0xd97706 }, // Amarillito
            { x: 0.35,  z: -0.35, rot: -0.3, color: 0xf1f5f9, roof: 0xef4444 },
            { x: -0.30, z: 0.35, rot: 3.1, color: 0xa7f3d0, roof: 0x059669 }, // Verdecito
            { x: -0.10, z: 0.42, rot: 2.8, color: 0xf1f5f9, roof: 0x64748b },
            { x: 0.15,  z: 0.38, rot: 3.4, color: 0xfde047, roof: 0xd97706 },
            { x: 0.35,  z: 0.30, rot: 2.9, color: 0xbfdbfe, roof: 0x3b82f6 }
        ];

        townData.forEach((b) => {
            const houseGroup = new THREE.Group();
            houseGroup.position.set(b.x, 0.05, b.z);
            houseGroup.rotation.y = b.rot;
            
            // Paredes
            const wallMat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.8 });
            const walls = new THREE.Mesh(houseGeom, wallMat);
            houseGroup.add(walls);

            // Techo a dos aguas (simulado con cono de 4 lados)
            const roofMat = new THREE.MeshStandardMaterial({ color: b.roof, roughness: 0.7 });
            const roof = new THREE.Mesh(roofGeom, roofMat);
            roof.position.y = 0.05 + 0.04;
            houseGroup.add(roof);

            // Chimenea
            const chimney = new THREE.Mesh(chimneyGeom, new THREE.MeshStandardMaterial({ color: 0x78716c }));
            chimney.position.set(0.04, 0.09, -0.03);
            houseGroup.add(chimney);

            // Ventanas brillantes (emissive)
            const winMat = new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: 0xfef08a,
                emissiveIntensity: 0.4
            });
            this.cityWindows.push(winMat);

            const winGeom = new THREE.BoxGeometry(0.03, 0.03, 0.01);
            // Ventana frontal
            const win1 = new THREE.Mesh(winGeom, winMat);
            win1.position.set(-0.02, 0.01, 0.07);
            houseGroup.add(win1);
            const win2 = new THREE.Mesh(winGeom, winMat);
            win2.position.set(0.03, 0.01, 0.07);
            houseGroup.add(win2);

            cityGroup.add(houseGroup);
        });

        // Subestación transformadora eléctrica con transformador y aletas
        const subGroup = new THREE.Group();
        subGroup.position.set(-0.25, 0.05, 0.02);
        const subBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.08), new THREE.MeshStandardMaterial({ color: 0x475569 }));
        subGroup.add(subBody);

        // Aisladores de porcelana
        const insulatorMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.2 });
        for (let ins = -0.04; ins <= 0.04; ins += 0.04) {
            const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.04, 12), insulatorMat);
            insulator.position.set(ins, 0.07, 0);
            subGroup.add(insulator);
        }
        cityGroup.add(subGroup);

        // Farolas de iluminación pública con cabezal LED
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
        for (let lx = -0.45; lx <= 0.45; lx += 0.30) {
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.14, 8), poleMat);
            pole.position.set(lx, 0.07, 0.22);
            cityGroup.add(pole);

            const lightBulbMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
            this.streetLights.push(lightBulbMat);

            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.010, 8, 8), lightBulbMat);
            bulb.position.set(lx, 0.14, 0.22);
            cityGroup.add(bulb);
        }

        this.group.add(cityGroup);

        // =========================================================================
        // 6. VOLTÍMETRO Y TAQUÍMETRO ANALÓGICO CALIBRADO (0 A 12V)
        // =========================================================================
        const meterGroup = new THREE.Group();
        meterGroup.position.set(0.08, tableH + 0.02, 0.34);
        meterGroup.rotation.y = -Math.PI / 10;

        const meterBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.11, 0.06, 32),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 })
        );
        meterBody.rotation.x = Math.PI / 6;
        meterGroup.add(meterBody);
        this.interactableMeshes.push(meterBody);

        const meterBezel = new THREE.Mesh(
            new THREE.TorusGeometry(0.11, 0.010, 16, 32),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 })
        );
        meterBezel.rotation.x = Math.PI / 6;
        meterBezel.position.y = 0.035;
        meterGroup.add(meterBezel);

        // Cuadrante analógico con escalas de Viento (m/s) y Voltios (V)
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

        dCtx.fillStyle = '#0f172a';
        dCtx.font = 'bold 20px sans-serif';
        dCtx.textAlign = 'center';
        dCtx.fillText('VIENTO & VOLTAJE', 128, 92);
        dCtx.font = 'bold 15px sans-serif';
        dCtx.fillText('0V · 0m/s', 60, 165);
        dCtx.fillText('6V · 8m/s', 128, 65);
        dCtx.fillText('12V · 16m/s', 195, 165);

        const dialTex = new THREE.CanvasTexture(dialCanvas);
        const dialPlane = new THREE.Mesh(
            new THREE.CircleGeometry(0.10, 32),
            new THREE.MeshBasicMaterial({ map: dialTex })
        );
        dialPlane.rotation.x = -Math.PI / 3;
        dialPlane.position.set(0, 0.034, 0.015);
        meterGroup.add(dialPlane);

        // Aguja indicadora
        const needleGeom = new THREE.BoxGeometry(0.004, 0.08, 0.002);
        const needleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
        this.voltmeterNeedle = new THREE.Mesh(needleGeom, needleMat);
        this.voltmeterNeedle.position.set(0, 0.036, 0.015);
        this.voltmeterNeedle.rotation.x = -Math.PI / 3;
        meterGroup.add(this.voltmeterNeedle);

        this.group.add(meterGroup);

        // 7. POSTES ELÉCTRICOS EN MINIATURA Y CABLES AÉREOS
        const polesGroup = new THREE.Group();
        
        // Postes de madera tratada en miniatura
        const poleGeom = new THREE.CylinderGeometry(0.004, 0.006, 0.22, 8);
        const crossbarGeom = new THREE.BoxGeometry(0.06, 0.005, 0.005);
        const woodPoleMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 }); 
        const crossbarMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.8 });

        const polePositions = [
            new THREE.Vector3(-0.35, tableH, 0.02),
            new THREE.Vector3(-0.05, tableH, 0.02)
        ];

        const poleCrossbars: THREE.Vector3[] = [];

        polePositions.forEach((pos) => {
            const pole = new THREE.Mesh(poleGeom, woodPoleMat);
            pole.position.set(pos.x, pos.y + 0.11, pos.z);
            
            const crossbar = new THREE.Mesh(crossbarGeom, crossbarMat);
            crossbar.position.set(0, 0.09, 0); // Casi arriba del poste
            
            // Orientar la cruceta para que quede perpendicular a la dirección del cable
            crossbar.rotation.y = Math.PI / 2;
            pole.add(crossbar);
            polesGroup.add(pole);

            // Posición global de la cruceta para colgar los cables
            poleCrossbars.push(new THREE.Vector3(pos.x, pos.y + 0.20, pos.z));
        });

        this.group.add(polesGroup);

        // Catenarias (cables con hundimiento natural)
        const createCatenaryWire = (start: THREE.Vector3, end: THREE.Vector3, sag: number) => {
            const mid = start.clone().lerp(end, 0.5);
            mid.y -= sag;
            const curve = new THREE.CatmullRomCurve3([start, mid, end]);
            const tube = new THREE.TubeGeometry(curve, 16, 0.0012, 4, false);
            return new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: 0x1c1917 }));
        };

        // Origen en la base de la torre eólica
        const towerBaseL = new THREE.Vector3(turbineBaseX + 0.05, tableH + 0.05, -0.015);
        const towerBaseR = new THREE.Vector3(turbineBaseX + 0.05, tableH + 0.05, 0.015);

        // Destino en la subestación de la ciudad
        // La ciudad está en x=0.38, tableH, z=0. Subestación en x=-0.25 (local) => 0.13 global
        const subStationL = new THREE.Vector3(0.13, tableH + 0.08, 0.005);
        const subStationR = new THREE.Vector3(0.13, tableH + 0.08, 0.035);

        // Poste 1 (izq / der)
        const p0_L = new THREE.Vector3(poleCrossbars[0].x, poleCrossbars[0].y, poleCrossbars[0].z - 0.025);
        const p0_R = new THREE.Vector3(poleCrossbars[0].x, poleCrossbars[0].y, poleCrossbars[0].z + 0.025);

        // Poste 2 (izq / der)
        const p1_L = new THREE.Vector3(poleCrossbars[1].x, poleCrossbars[1].y, poleCrossbars[1].z - 0.025);
        const p1_R = new THREE.Vector3(poleCrossbars[1].x, poleCrossbars[1].y, poleCrossbars[1].z + 0.025);

        // Tramo 1: Torre -> Poste 1
        this.group.add(createCatenaryWire(towerBaseL, p0_L, 0.03));
        this.group.add(createCatenaryWire(towerBaseR, p0_R, 0.03));

        // Tramo 2: Poste 1 -> Poste 2
        this.group.add(createCatenaryWire(p0_L, p1_L, 0.035));
        this.group.add(createCatenaryWire(p0_R, p1_R, 0.035));

        // Tramo 3: Poste 2 -> Subestación
        this.group.add(createCatenaryWire(p1_L, subStationL, 0.025));
        this.group.add(createCatenaryWire(p1_R, subStationR, 0.025));
    }

    public setSleep(sleep: boolean): void {
        this.isSleeping = sleep;
    }

    public update(time: number, delta: number = 0.016): void {
        if (this.isSleeping) return;

        // 1. Interpolación inercial suave de RPM y Voltaje
        this.currentRpm += (this.targetRpm - this.currentRpm) * Math.min(1.0, delta * 3.2);
        this.currentVoltage += (this.targetVoltage - this.currentVoltage) * Math.min(1.0, delta * 3.2);

        // 2. Rotación de las aspas del aerogenerador y búsqueda de viento
        const rps = this.currentRpm / 60;
        this.currentAngle += rps * Math.PI * 2 * delta;
        this.rotorHub.rotation.x = this.currentAngle;
        this.generatorRotor.rotation.x = this.currentAngle;

        if (this.yawGroup) {
            this.yawGroup.rotation.y = Math.sin(time * 0.1) * 0.25;
        }

        // 3. Rotación del anemómetro en el techo
        this.anemometerAngle += rps * 3.5 * Math.PI * 2 * delta;
        this.anemometerHub.rotation.y = this.anemometerAngle;

        // 4. Parpadeo suave de la baliza de aviación (1 ciclo cada 1.5s)
        const beaconIntensity = Math.sin(time * 4.0) > 0.4 ? 1.0 : 0.15;
        (this.beaconLight.material as THREE.MeshBasicMaterial).color.setScalar(beaconIntensity);

        // 5. Aguja del voltímetro (-45° a +45°)
        const normV = Math.max(0, Math.min(1, this.currentVoltage / 12.0));
        const needleAngle = (1 - normV) * (Math.PI / 3) - (Math.PI / 3);
        this.voltmeterNeedle.rotation.z = -needleAngle;

        // 6. Brillo de ventanas y farolas en función del voltaje producido
        const emissiveLevel = 0.15 + normV * 1.35;
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

        const rpmMap = [35, 90, 180];
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
