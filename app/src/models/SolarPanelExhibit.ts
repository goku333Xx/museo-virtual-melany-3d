import * as THREE from 'three';

export interface SolarPanelModeInfo {
    id: number;
    name: string;
    efficiency: number; // 0 to 1
    rpm: number;
    voltage: string;
    lux: string;
    desc: string;
}

export class SolarPanelExhibit {
    private group: THREE.Group;
    private sunLampPivot: THREE.Group;
    private sunSpotLight: THREE.SpotLight;
    private sunLampBulb: THREE.Mesh;
    private lampGlowSprite: THREE.Sprite;
    private propellerGroup: THREE.Group;
    private currentPropellerRpm: number = 2400;
    private targetPropellerRpm: number = 2400;
    private interactableMeshes: THREE.Object3D[] = [];

    // Animación cinemática suave del foco solar
    private targetLampPos = new THREE.Vector3(-0.35, 1.05, 0);
    private currentLampPos = new THREE.Vector3(-0.35, 1.05, 0);
    private targetLampRotZ: number = 0;
    private currentLampRotZ: number = 0;
    private targetLightIntensity: number = 4.2;
    private currentLightIntensity: number = 4.2;
    private targetBulbColor = new THREE.Color(0xfef08a);
    private currentBulbColor = new THREE.Color(0xfef08a);

    // Pantalla digital LCD de telemetría solar
    private digitalCanvas: HTMLCanvasElement;
    private digitalCtx: CanvasRenderingContext2D;
    private digitalTexture: THREE.CanvasTexture;
    private digitalMesh: THREE.Mesh;

    // Aguja de inclinación de transportador
    private angleNeedle: THREE.Mesh;

    private currentMode: number = 0;
    private isSleeping: boolean = false;

    private readonly modes: SolarPanelModeInfo[] = [
        {
            id: 0,
            name: "Luz Cenital Directa (Incidencia 90° · Potencia 100% · Carga Rápida)",
            efficiency: 1.0,
            rpm: 2400,
            voltage: "18.4 V",
            lux: "1000 W/m²",
            desc: "Los rayos del potente foco de estudio caen de lleno a 90°. Los fotones impactan el silicio a toda velocidad y generan un flujo eléctrico intenso que carga las baterías de litio al máximo nivel."
        },
        {
            id: 1,
            name: "Luz Inclinada (Incidencia 45° · Potencia 50% · Carga Lenta)",
            efficiency: 0.5,
            rpm: 1200,
            voltage: "9.2 V",
            lux: "500 W/m²",
            desc: "Al inclinar el foco a 45° (como a la tarde cuando baja el sol), los rayos se desparraman. Menos fotones golpean cada centímetro del panel, por lo que las baterías se cargan a la mitad de velocidad."
        },
        {
            id: 2,
            name: "Sombra / Nube Tapada (Incidencia 0° · Potencia 0% · Sin Carga)",
            efficiency: 0.0,
            rpm: 0,
            voltage: "0.2 V",
            lux: "25 W/m²",
            desc: "Al apagar o tapar el foco, la producción eléctrica cae al instante. Las baterías dejan de recibir energía. ¡Esto demuestra que los paneles solares necesitan luz directa y constante para funcionar bien!"
        }
    ];

    constructor() {
        this.group = new THREE.Group();

        // 1. BANCO DE PRUEBAS DE LABORATORIO DE ALTA PRECISIÓN (2.2m x 1.4m x 0.12m)
        const tableW = 2.2;
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

        // Bisel de latón pulido alrededor de la mesa
        const rim = new THREE.Mesh(
            new THREE.BoxGeometry(tableW + 0.04, 0.02, tableD + 0.04),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.92, roughness: 0.18 })
        );
        rim.position.set(0, tableH + 0.01, 0);
        this.group.add(rim);

        // =========================================================================
        // 2. PANEL SOLAR MONOCRISTALINO REALISTA CON CELDAS Y BASTIDOR DE ALUMINIO
        // =========================================================================
        const panelGroup = new THREE.Group();
        panelGroup.position.set(-0.35, tableH + 0.22, 0);
        panelGroup.rotation.x = Math.PI / 10; // Inclinación fija óptima de 18°

        const frameW = 0.92;
        const frameD = 0.68;
        const frameH = 0.04;

        // Marco de aluminio anodizado con chaflanes en esquinas
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xcfd8dc,
            metalness: 0.95,
            roughness: 0.15
        });
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(frameW, frameH, frameD),
            frameMat
        );
        panelGroup.add(frame);
        this.interactableMeshes.push(frame);

        // Base de fondo de tedlar blanco aislante
        const backSheet = new THREE.Mesh(
            new THREE.PlaneGeometry(frameW - 0.02, frameD - 0.02),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
        );
        backSheet.rotation.x = -Math.PI / 2;
        backSheet.position.y = frameH / 2 + 0.001;
        panelGroup.add(backSheet);

        // Vidrio templado con tratamiento antirreflejo y silicio monocristalino (azul oscuro iridiscente)
        const siliconMat = new THREE.MeshPhysicalMaterial({
            color: 0x081735,
            roughness: 0.08,
            metalness: 0.65,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            reflectivity: 0.85
        });

        // 12 celdas monocristalinas individuales con esquinas recortadas (4 columnas x 3 filas)
        const cellCols = 4;
        const cellRows = 3;
        const cellW = 0.20;
        const cellH = 0.19;
        const gap = 0.016;

        const startX = -((cellCols - 1) * (cellW + gap)) / 2;
        const startZ = -((cellRows - 1) * (cellH + gap)) / 2;

        const cellGeom = new THREE.PlaneGeometry(cellW, cellH);

        for (let c = 0; c < cellCols; c++) {
            for (let r = 0; r < cellRows; r++) {
                const cellMesh = new THREE.Mesh(cellGeom, siliconMat);
                cellMesh.rotation.x = -Math.PI / 2;
                cellMesh.position.set(startX + c * (cellW + gap), frameH / 2 + 0.003, startZ + r * (cellH + gap));
                panelGroup.add(cellMesh);

                // Líneas conductoras plateadas de contacto (busbars)
                const busMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
                for (let b = -0.06; b <= 0.06; b += 0.06) {
                    const busbar = new THREE.Mesh(new THREE.PlaneGeometry(0.003, cellH), busMat);
                    busbar.rotation.x = -Math.PI / 2;
                    busbar.position.set(startX + c * (cellW + gap) + b, frameH / 2 + 0.004, startZ + r * (cellH + gap));
                    panelGroup.add(busbar);
                }
            }
        }

        // Soportes del panel con escala de ángulo graduada
        const mountMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.24, 16), mountMat);
        postL.position.set(-0.38, -0.12, 0);
        panelGroup.add(postL);

        const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.24, 16), mountMat);
        postR.position.set(0.38, -0.12, 0);
        panelGroup.add(postR);

        // Transportador de ángulos analógico en el lateral
        const protractorGroup = new THREE.Group();
        protractorGroup.position.set(-0.48, tableH + 0.16, 0);
        const protGeom = new THREE.CircleGeometry(0.09, 24, 0, Math.PI);
        const protMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2, side: THREE.DoubleSide });
        const prot = new THREE.Mesh(protGeom, protMat);
        prot.rotation.y = Math.PI / 2;
        protractorGroup.add(prot);

        // Aguja indicadora
        const needleGeom = new THREE.BoxGeometry(0.004, 0.08, 0.002);
        needleGeom.translate(0, 0.04, 0);
        this.angleNeedle = new THREE.Mesh(needleGeom, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        this.angleNeedle.rotation.x = Math.PI / 2 - Math.PI / 10;
        this.angleNeedle.position.set(-0.002, 0, 0);
        protractorGroup.add(this.angleNeedle);
        this.group.add(protractorGroup);

        this.group.add(panelGroup);

        // =========================================================================
        // 3. FOCO DE ESTUDIO CINEMÁTICO (SOL ARTIFICIAL)
        // =========================================================================
        // Brazo telescópico y arco pórtico
        const arch = new THREE.Mesh(
            new THREE.TorusGeometry(0.72, 0.024, 16, 32, Math.PI * 0.75),
            mountMat
        );
        arch.rotation.z = Math.PI * 0.25;
        arch.position.set(-0.35, tableH + 0.44, -0.36);
        this.group.add(arch);

        this.sunLampPivot = new THREE.Group();
        this.sunLampPivot.position.copy(this.currentLampPos);

        // Carcasa de foco de estudio profesional tipo ARRI / Fresnel
        const housingMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.9,
            roughness: 0.2
        });
        const lampHousing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.25, 32),
            housingMat
        );
        lampHousing.rotation.z = Math.PI / 2;
        lampHousing.position.y = 0.05;
        this.sunLampPivot.add(lampHousing);
        this.interactableMeshes.push(lampHousing);
        
        // Aletas direccionales (Barndoors) del foco de estudio
        const barndoorMat = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.8, roughness: 0.5 });
        const flapGeom = new THREE.BoxGeometry(0.18, 0.01, 0.12);
        
        const flapTop = new THREE.Mesh(flapGeom, barndoorMat);
        flapTop.position.set(0, -0.08, 0.14);
        flapTop.rotation.x = Math.PI / 6;
        this.sunLampPivot.add(flapTop);

        const flapBottom = new THREE.Mesh(flapGeom, barndoorMat);
        flapBottom.position.set(0, -0.08, -0.14);
        flapBottom.rotation.x = -Math.PI / 6;
        this.sunLampPivot.add(flapBottom);
        
        const flapSideGeom = new THREE.BoxGeometry(0.01, 0.18, 0.12);
        const flapLeft = new THREE.Mesh(flapSideGeom, barndoorMat);
        flapLeft.position.set(0.14, -0.08, 0);
        flapLeft.rotation.z = Math.PI / 6;
        this.sunLampPivot.add(flapLeft);

        const flapRight = new THREE.Mesh(flapSideGeom, barndoorMat);
        flapRight.position.set(-0.14, -0.08, 0);
        flapRight.rotation.z = -Math.PI / 6;
        this.sunLampPivot.add(flapRight);

        // Lente de cristal de cuarzo (Fresnel)
        const lensMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, opacity: 1, roughness: 0.2, thickness: 0.05 });
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 32), lensMat);
        lens.rotation.z = Math.PI / 2;
        lens.position.y = -0.08;
        this.sunLampPivot.add(lens);

        // Bombilla halógena interna
        this.sunLampBulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 24, 24),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        this.sunLampBulb.position.y = 0.02;
        this.sunLampPivot.add(this.sunLampBulb);

        // Destello radial (Sprite)
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = 128;
        glowCanvas.height = 128;
        const gCtx = glowCanvas.getContext('2d')!;
        const grad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.2, 'rgba(254, 240, 138, 0.8)');
        grad.addColorStop(0.5, 'rgba(251, 146, 60, 0.3)');
        grad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        gCtx.fillStyle = grad;
        gCtx.fillRect(0, 0, 128, 128);

        const glowTex = new THREE.CanvasTexture(glowCanvas);
        this.lampGlowSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
        );
        this.lampGlowSprite.position.set(0, -0.09, 0);
        this.lampGlowSprite.scale.set(0.8, 0.8, 0.8);
        this.sunLampPivot.add(this.lampGlowSprite);

        // Haz SpotLight
        this.sunSpotLight = new THREE.SpotLight(0xfef08a, 4.2, 3.8, Math.PI / 5, 0.5, 1.0);
        this.sunSpotLight.position.set(0, 0, 0);
        this.sunSpotLight.target = panelGroup;
        this.sunSpotLight.castShadow = false;
        this.sunLampPivot.add(this.sunSpotLight);

        this.group.add(this.sunLampPivot);

        // =========================================================================
        // 4. BANCO DE BATERÍAS DE LITIO DE ALTA TECNOLOGÍA (X = +0.50)
        // =========================================================================
        const batteryGroup = new THREE.Group();
        batteryGroup.position.set(0.50, tableH + 0.12, 0);

        // Rack de almacenamiento metálico
        const rackGeom = new THREE.BoxGeometry(0.35, 0.22, 0.25);
        const rackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
        const rack = new THREE.Mesh(rackGeom, rackMat);
        batteryGroup.add(rack);
        this.interactableMeshes.push(rack);
        
        // Letrero "STORAGE"
        const plate = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.04, 0.26),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.4 })
        );
        plate.position.set(0, 0.10, 0);
        batteryGroup.add(plate);

        // Baterías cilíndricas transparentes que se llenan de luz
        this.propellerGroup = new THREE.Group(); // Reutilizamos esta variable para guardar los núcleos luminosos
        this.propellerGroup.position.set(0, 0, 0);
        
        const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, opacity: 1, roughness: 0.1 });
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x22c55e, emissiveIntensity: 2.0 });

        for (let i = 0; i < 4; i++) {
            const xPos = -0.10 + i * 0.066;
            
            // Cápsula de cristal
            const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 16), glassMat);
            cylinder.position.set(xPos, 0, 0.12);
            batteryGroup.add(cylinder);

            // Tapa de contacto superior e inferior
            const capGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.015, 16);
            const capMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 });
            const capTop = new THREE.Mesh(capGeom, capMat);
            capTop.position.set(xPos, 0.08, 0.12);
            batteryGroup.add(capTop);
            
            const capBot = new THREE.Mesh(capGeom, capMat);
            capBot.position.set(xPos, -0.08, 0.12);
            batteryGroup.add(capBot);

            // Núcleo de energía luminoso (simulando nivel de carga)
            const core = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 12), coreMat);
            core.position.set(xPos, -0.075, 0.12);
            this.propellerGroup.add(core); // Lo agregamos a propellerGroup para iterar sobre ellos luego
        }
        
        batteryGroup.add(this.propellerGroup);
        this.group.add(batteryGroup);

        // =========================================================================
        // 5. MULTÍMETRO DIGITAL Y RADIÓMETRO SOLAR (PANTALLA LCD EN VIVO)
        // =========================================================================
        this.digitalCanvas = document.createElement('canvas');
        this.digitalCanvas.width = 512;
        this.digitalCanvas.height = 256;
        this.digitalCtx = this.digitalCanvas.getContext('2d')!;

        this.digitalTexture = new THREE.CanvasTexture(this.digitalCanvas);
        const screenMat = new THREE.MeshBasicMaterial({ map: this.digitalTexture });

        // Consola metálica inclinada para la pantalla
        const meterBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.38, 0.08, 0.24),
            new THREE.MeshStandardMaterial({ color: 0x181e28, metalness: 0.85, roughness: 0.3 })
        );
        meterBox.position.set(0.08, tableH + 0.04, 0.32);
        meterBox.rotation.x = Math.PI / 6; // Inclinado hacia el observador
        this.group.add(meterBox);
        this.interactableMeshes.push(meterBox);

        this.digitalMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.17), screenMat);
        this.digitalMesh.position.set(0.08, tableH + 0.082, 0.32);
        this.digitalMesh.rotation.x = -Math.PI / 3;
        this.group.add(this.digitalMesh);

        this.updateDigitalDisplay();

        // 6. CABLES CONDUCTORES DE ALIMENTACIÓN
        const wirePosCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.15, tableH + 0.12, 0.15),
            new THREE.Vector3(0.08, tableH + 0.04, 0.22),
            new THREE.Vector3(0.42, tableH + 0.12, 0.08)
        ]);
        const wirePos = new THREE.Mesh(new THREE.TubeGeometry(wirePosCurve, 20, 0.008, 8, false), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }));

        const wireNegCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.15, tableH + 0.12, -0.15),
            new THREE.Vector3(0.08, tableH + 0.04, -0.22),
            new THREE.Vector3(0.42, tableH + 0.12, -0.08)
        ]);
        const wireNeg = new THREE.Mesh(new THREE.TubeGeometry(wireNegCurve, 20, 0.008, 8, false), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }));

        this.group.add(wirePos, wireNeg);
    }

    private updateDigitalDisplay(): void {
        const info = this.modes[this.currentMode];
        const ctx = this.digitalCtx;
        const w = this.digitalCanvas.width;
        const h = this.digitalCanvas.height;

        // Fondo de pantalla LCD estilo instrumento científico de laboratorio
        ctx.fillStyle = '#06101e';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, w - 8, h - 8);

        // Encabezado
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px "Inter", monospace';
        ctx.fillText('⚡ TELEMETRÍA SOLAR FOTOVOLTAICA', 24, 38);

        // Medidor de Irradiancia
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px "Inter", monospace';
        ctx.fillText('FLUJO DE FOTONES:', 24, 80);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 36px "Inter", monospace';
        ctx.fillText(info.lux, 24, 122);

        // Voltaje y RPM
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px "Inter", monospace';
        ctx.fillText('TENSIÓN:', 280, 80);

        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 36px "Inter", monospace';
        ctx.fillText(info.voltage, 280, 122);

        // Barra de potencia
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(24, 150, w - 48, 28);

        const powerWidth = (w - 48) * info.efficiency;
        ctx.fillStyle = info.efficiency > 0.6 ? '#22c55e' : (info.efficiency > 0.2 ? '#f59e0b' : '#ef4444');
        ctx.fillRect(24, 150, powerWidth, 28);

        // Estado del motor -> Estado de Batería
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Inter", monospace';
        
        let chargePercentage = Math.round((this.currentPropellerRpm / 2400) * 100);
        chargePercentage = Math.max(0, Math.min(100, chargePercentage));
        ctx.fillText(`CARGA: ${chargePercentage}% · POTENCIA: ${Math.round(info.efficiency * 100)}%`, 24, 218);

        this.digitalTexture.needsUpdate = true;
    }

    public setSleep(sleep: boolean): void {
        this.isSleeping = sleep;
    }

    public update(_time: number, delta: number = 0.016): void {
        if (this.isSleeping) return;

        // 1. Interpolación cinemática suave del foco solar (movimiento y rotación)
        const lerpFactor = Math.min(1.0, delta * 3.5);
        this.currentLampPos.lerp(this.targetLampPos, lerpFactor);
        this.sunLampPivot.position.copy(this.currentLampPos);

        this.currentLampRotZ += (this.targetLampRotZ - this.currentLampRotZ) * lerpFactor;
        this.sunLampPivot.rotation.z = this.currentLampRotZ;

        // 2. Interpolación de intensidad lumínica y color de bombilla
        this.currentLightIntensity += (this.targetLightIntensity - this.currentLightIntensity) * lerpFactor;
        this.sunSpotLight.intensity = this.currentLightIntensity;

        this.currentBulbColor.lerp(this.targetBulbColor, lerpFactor);
        (this.sunLampBulb.material as THREE.MeshBasicMaterial).color.copy(this.currentBulbColor);
        this.lampGlowSprite.material.opacity = Math.min(1.0, this.currentLightIntensity / 4.0) * 0.85;

        // 3. Simulación física del nivel de carga de la batería (reusando variables de motor)
        const rpmLerp = Math.min(1.0, delta * 2.5);
        this.currentPropellerRpm += (this.targetPropellerRpm - this.currentPropellerRpm) * rpmLerp;

        const chargeLevel = Math.max(0.01, this.currentPropellerRpm / 2400.0);
        
        this.propellerGroup.children.forEach(core => {
            // Escalar en Y para simular llenado
            core.scale.y = chargeLevel;
            // Ajustar posición para que crezca desde abajo
            core.position.y = -0.075 + (0.15 * chargeLevel) / 2;
        });
        
        // Actualizar UI con el nivel intermedio
        if (Math.abs(this.targetPropellerRpm - this.currentPropellerRpm) > 10) {
            this.updateDigitalDisplay();
        }
    }

    public cycleMode(): SolarPanelModeInfo {
        this.currentMode = (this.currentMode + 1) % this.modes.length;
        const info = this.modes[this.currentMode];

        this.targetPropellerRpm = info.rpm;

        // Configurar los objetivos cinemáticos suaves
        if (info.id === 0) {
            // Cenital directo (90°)
            this.targetLampPos.set(-0.35, 1.05, 0);
            this.targetLampRotZ = 0;
            this.targetLightIntensity = 4.2;
            this.targetBulbColor.setHex(0xfef08a);
            this.angleNeedle.rotation.x = Math.PI / 2 - Math.PI / 10;
        } else if (info.id === 1) {
            // Inclinado (45°)
            this.targetLampPos.set(-0.72, 0.88, 0);
            this.targetLampRotZ = -Math.PI / 4;
            this.targetLightIntensity = 2.2;
            this.targetBulbColor.setHex(0xfb923c);
            this.angleNeedle.rotation.x = Math.PI / 4;
        } else {
            // Sombra / Tapado
            this.targetLampPos.set(-0.35, 1.05, 0);
            this.targetLampRotZ = 0;
            this.targetLightIntensity = 0.05;
            this.targetBulbColor.setHex(0x334155);
            this.angleNeedle.rotation.x = 0;
        }

        this.updateDigitalDisplay();
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
