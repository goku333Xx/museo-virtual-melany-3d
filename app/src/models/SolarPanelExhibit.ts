import * as THREE from 'three';

export interface SolarPanelModeInfo {
    id: number;
    name: string;
    efficiency: number; // 0 to 1
    rpm: number;
    desc: string;
}

export class SolarPanelExhibit {
    private group: THREE.Group;
    private sunLampPivot: THREE.Group;
    private sunSpotLight: THREE.SpotLight;
    private sunLampBulb: THREE.Mesh;
    private propellerGroup: THREE.Group;
    private currentPropellerRpm: number = 2400;
    private targetPropellerRpm: number = 2400;
    private propellerAngle: number = 0;
    private interactableMeshes: THREE.Object3D[] = [];

    private currentMode: number = 0;
    private readonly modes: SolarPanelModeInfo[] = [
        {
            id: 0,
            name: "Luz Cenital Directa (Incidencia 90° · Potencia 100% · 2400 RPM)",
            efficiency: 1.0,
            rpm: 2400,
            desc: "Los fotones impactan perpendicularmente contra las celdas de silicio. La excitación de electrones es máxima, desatando la mayor corriente para el motor de la hélice."
        },
        {
            id: 1,
            name: "Luz Inclinada (Incidencia 45° · Potencia 50% · 1100 RPM)",
            efficiency: 0.5,
            rpm: 1100,
            desc: "Al inclinar el foco solar, los fotones se dispersan en una superficie mayor. Menos electrones son liberados por segundo y la hélice reduce su velocidad."
        },
        {
            id: 2,
            name: "Sombra / Eclipse (Incidencia 0° · Potencia 0% · Frenado)",
            efficiency: 0.0,
            rpm: 0,
            desc: "Al interponerse un obstáculo, el flujo fotoeléctrico se corta de inmediato demostrando que el panel no almacena energía sino que la transforma en tiempo real."
        }
    ];

    constructor() {
        this.group = new THREE.Group();

        // 1. BANCO DE PRUEBAS DE ENERGÍA SOLAR (2.0m x 1.4m x 0.10m)
        const tableW = 2.0;
        const tableD = 1.4;
        const tableH = 0.10;

        const table = new THREE.Mesh(
            new THREE.BoxGeometry(tableW, tableH, tableD),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 })
        );
        table.position.set(0, tableH / 2, 0);
        table.receiveShadow = true;
        this.group.add(table);
        this.interactableMeshes.push(table);

        // Borde perimetral de latón cepillado
        const rim = new THREE.Mesh(
            new THREE.BoxGeometry(tableW + 0.04, 0.02, tableD + 0.04),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
        );
        rim.position.set(0, tableH + 0.01, 0);
        this.group.add(rim);

        // 2. PANEL SOLAR FOTOVOLTAICO MONOCRISTALINO (X = -0.35)
        const panelGroup = new THREE.Group();
        panelGroup.position.set(-0.35, tableH + 0.22, 0);
        panelGroup.rotation.x = Math.PI / 10; // Inclinación fija óptima de 18 grados

        // Bastidor de aluminio anodizado del panel
        const frameW = 0.85;
        const frameD = 0.65;
        const frameH = 0.035;
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(frameW, frameH, frameD),
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 })
        );
        panelGroup.add(frame);
        this.interactableMeshes.push(frame);

        // Soporte inclinable con tornillos micrométricos
        const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
        const postLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 16), standMat);
        postLeft.position.set(-0.35, -0.12, 0);
        panelGroup.add(postLeft);

        const postRight = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 16), standMat);
        postRight.position.set(0.35, -0.12, 0);
        panelGroup.add(postRight);

        // Celdas solares fotovoltaicas de silicio (Azul marino profundo iridiscente)
        const cellGeom = new THREE.PlaneGeometry(frameW - 0.04, frameD - 0.04);
        const cellMat = new THREE.MeshPhysicalMaterial({
            color: 0x0c2548,
            roughness: 0.1,
            metalness: 0.7,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            reflectivity: 0.8
        });
        const cells = new THREE.Mesh(cellGeom, cellMat);
        cells.rotation.x = -Math.PI / 2;
        cells.position.y = frameH / 2 + 0.002;
        panelGroup.add(cells);

        // Cuadrícula de líneas de plata conductoras (busbars)
        const busbarMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
        for (let bx = -0.35; bx <= 0.35; bx += 0.14) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(0.004, frameD - 0.05), busbarMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(bx, frameH / 2 + 0.003, 0);
            panelGroup.add(line);
        }

        this.group.add(panelGroup);

        // 3. BRAZO INDUSTRIAL Y "SOL ARTIFICIAL" (Foco de Luz Regulable)
        this.sunLampPivot = new THREE.Group();
        this.sunLampPivot.position.set(-0.35, tableH + 0.85, 0);

        // Mástil de sujeción arqueado de acero
        const archGantry = new THREE.Mesh(
            new THREE.TorusGeometry(0.70, 0.025, 16, 32, Math.PI * 0.75),
            standMat
        );
        archGantry.rotation.z = Math.PI * 0.25;
        archGantry.position.set(-0.35, tableH + 0.40, -0.35);
        this.group.add(archGantry);

        // Cabezal del reflector con aletas de disipación
        const lampReflector = new THREE.Mesh(
            new THREE.ConeGeometry(0.16, 0.22, 24, 1, true),
            new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 })
        );
        lampReflector.rotation.x = Math.PI; // Apuntando hacia abajo
        this.sunLampPivot.add(lampReflector);

        // Bombilla halógena incandescente de alta intensidad
        this.sunLampBulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 24, 24),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        this.sunLampBulb.position.y = -0.06;
        this.sunLampPivot.add(this.sunLampBulb);

        // Haz físico SpotLight proyectando luz y sombra real sobre el panel
        this.sunSpotLight = new THREE.SpotLight(0xfef08a, 4.0, 3.5, Math.PI / 5, 0.35, 1);
        this.sunSpotLight.position.set(0, -0.05, 0);
        this.sunSpotLight.target = panelGroup;
        this.sunSpotLight.castShadow = true;
        this.sunLampPivot.add(this.sunSpotLight);

        this.group.add(this.sunLampPivot);
        this.interactableMeshes.push(lampReflector);

        // 4. MOTOR ELÉCTRICO DC Y HÉLICE DE ALTA VELOCIDAD (X = +0.48)
        const motorGroup = new THREE.Group();
        motorGroup.position.set(0.48, tableH + 0.16, 0);

        // Pedestal de acrílico transparente para el motor
        const motorPedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.16, 0.32, 24),
            new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                transmission: 0.9,
                opacity: 0.95,
                roughness: 0.1
            })
        );
        motorGroup.add(motorPedestal);

        // Carcasa cilíndrica del motor de corriente continua (DC)
        const motorBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.065, 0.065, 0.18, 24),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
        );
        motorBody.rotation.z = Math.PI / 2;
        motorBody.position.y = 0.22;
        motorGroup.add(motorBody);
        this.interactableMeshes.push(motorBody);

        // Eje de acero cromado
        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, 0.08, 16),
            new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.05 })
        );
        shaft.rotation.z = Math.PI / 2;
        shaft.position.set(0.12, 0.22, 0);
        motorGroup.add(shaft);

        // Buje y Hélice aerodinámica de 2 palas
        this.propellerGroup = new THREE.Group();
        this.propellerGroup.position.set(0.16, 0.22, 0);

        const propHub = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.3 })
        );
        this.propellerGroup.add(propHub);

        // Palas de la hélice con perfil torsor
        const propBladeGeom = new THREE.BoxGeometry(0.01, 0.38, 0.035);
        propBladeGeom.rotateY(0.25);
        const propBladeMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            metalness: 0.4,
            roughness: 0.2
        });
        const propBlade = new THREE.Mesh(propBladeGeom, propBladeMat);
        this.propellerGroup.add(propBlade);

        motorGroup.add(this.propellerGroup);
        this.group.add(motorGroup);

        // 5. CABLES CONDUCTORES DE ALIMENTACIÓN (Amarillo y Negro)
        const wireMatPos = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
        const wireMatNeg = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });

        const wirePosCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.15, tableH + 0.12, 0.15),
            new THREE.Vector3(0.10, tableH + 0.04, 0.22),
            new THREE.Vector3(0.40, tableH + 0.28, 0.08)
        ]);
        const wirePos = new THREE.Mesh(new THREE.TubeGeometry(wirePosCurve, 24, 0.009, 8, false), wireMatPos);

        const wireNegCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.15, tableH + 0.12, -0.15),
            new THREE.Vector3(0.10, tableH + 0.04, -0.22),
            new THREE.Vector3(0.40, tableH + 0.28, -0.08)
        ]);
        const wireNeg = new THREE.Mesh(new THREE.TubeGeometry(wireNegCurve, 24, 0.009, 8, false), wireMatNeg);

        this.group.add(wirePos, wireNeg);
    }

    public update(_time: number, delta: number = 0.016): void {
        // Suave aceleración / desaceleración inercial de la hélice
        this.currentPropellerRpm += (this.targetPropellerRpm - this.currentPropellerRpm) * Math.min(1.0, delta * 4.0);

        const rps = this.currentPropellerRpm / 60;
        this.propellerAngle += rps * Math.PI * 2 * delta;
        this.propellerGroup.rotation.x = this.propellerAngle;
    }

    public cycleMode(): SolarPanelModeInfo {
        this.currentMode = (this.currentMode + 1) % this.modes.length;
        const info = this.modes[this.currentMode];

        this.targetPropellerRpm = info.rpm;

        // Posicionar el brazo del sol artificial
        if (info.id === 0) {
            // Cenital directo (90 grados)
            this.sunLampPivot.position.set(-0.35, 0.95, 0);
            this.sunLampPivot.rotation.z = 0;
            this.sunSpotLight.intensity = 4.0;
            (this.sunLampBulb.material as THREE.MeshBasicMaterial).color.setHex(0xfef08a);
        } else if (info.id === 1) {
            // Inclinado a 45 grados
            this.sunLampPivot.position.set(-0.70, 0.85, 0);
            this.sunLampPivot.rotation.z = -Math.PI / 4;
            this.sunSpotLight.intensity = 2.0;
            (this.sunLampBulb.material as THREE.MeshBasicMaterial).color.setHex(0xfb923c);
        } else {
            // Sombra / Apagado
            this.sunLampPivot.position.set(-0.35, 0.95, 0);
            this.sunSpotLight.intensity = 0.05;
            (this.sunLampBulb.material as THREE.MeshBasicMaterial).color.setHex(0x475569);
        }

        return info;
    }

    public getCurrentModeInfo(): SolarPanelModeInfo {
        return this.modes[this.currentMode];
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }
}
