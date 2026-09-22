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
    private propellerAngle: number = 0;
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
            name: "Luz Cenital Directa (Incidencia 90° · Potencia 100% · 2400 RPM)",
            efficiency: 1.0,
            rpm: 2400,
            voltage: "18.4 V",
            lux: "1000 W/m²",
            desc: "Los rayos de sol artificial caen de lleno a 90°. Las pelotitas de luz (fotones) impactan el silicio a toda velocidad y hacen correr billones de electrones, haciendo girar la hélice como un ventilador de avión."
        },
        {
            id: 1,
            name: "Luz Inclinada (Incidencia 45° · Potencia 50% · 1100 RPM)",
            efficiency: 0.5,
            rpm: 1100,
            voltage: "9.2 V",
            lux: "500 W/m²",
            desc: "Al inclinar el foco a 45° (como a la tarde cuando baja el sol), los rayos se desparraman en una superficie más grande. Menos fotones golpean cada centímetro y la hélice gira a media máquina."
        },
        {
            id: 2,
            name: "Sombra / Nube Tapada (Incidencia 0° · Potencia 0% · Frenado)",
            efficiency: 0.0,
            rpm: 0,
            voltage: "0.2 V",
            lux: "25 W/m²",
            desc: "Al tapar la luz, la electricidad se apaga al instante. Esto enseña que el panel solar no es una batería: ¡convierte la luz en energía en vivo y en directo en el mismo segundo!"
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
        // 3. BRAZO INDUSTRIAL Y "SOL ARTIFICIAL" (Cinemático y Regulable)
        // =========================================================================
        // Arco pórtico de soporte de acero estructural
        const arch = new THREE.Mesh(
            new THREE.TorusGeometry(0.72, 0.024, 16, 32, Math.PI * 0.75),
            mountMat
        );
        arch.rotation.z = Math.PI * 0.25;
        arch.position.set(-0.35, tableH + 0.44, -0.36);
        this.group.add(arch);

        this.sunLampPivot = new THREE.Group();
        this.sunLampPivot.position.copy(this.currentLampPos);

        // Cabezal industrial del foco con aletas de refrigeración de aluminio
        const reflectorMat = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            metalness: 0.85,
            roughness: 0.25
        });
        const lampHousing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.12, 0.22, 24),
            reflectorMat
        );
        lampHousing.position.y = 0.05;
        this.sunLampPivot.add(lampHousing);
        this.interactableMeshes.push(lampHousing);

        // Campana reflectora parabólica interior dorada
        const interiorCone = new THREE.Mesh(
            new THREE.ConeGeometry(0.16, 0.16, 24, 1, true),
            new THREE.MeshStandardMaterial({ color: 0xfde047, metalness: 0.95, roughness: 0.1 })
        );
        interiorCone.rotation.x = Math.PI;
        interiorCone.position.y = -0.04;
        this.sunLampPivot.add(interiorCone);

        // Bombilla solar incandescente de alta intensidad
        this.sunLampBulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.065, 24, 24),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        this.sunLampBulb.position.y = -0.05;
        this.sunLampPivot.add(this.sunLampBulb);

        // Destello radial suave (Sprite para simular resplandor del sol artificial)
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = 64;
        glowCanvas.height = 64;
        const gCtx = glowCanvas.getContext('2d')!;
        const grad = gCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        grad.addColorStop(0.35, 'rgba(251, 146, 60, 0.4)');
        grad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        gCtx.fillStyle = grad;
        gCtx.fillRect(0, 0, 64, 64);

        const glowTex = new THREE.CanvasTexture(glowCanvas);
        this.lampGlowSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
        );
        this.lampGlowSprite.position.set(0, -0.06, 0);
        this.lampGlowSprite.scale.set(0.65, 0.65, 0.65);
        this.sunLampPivot.add(this.lampGlowSprite);

        // Haz físico SpotLight proyectando luz sobre el panel (sin sobrecosto de shadow map)
        this.sunSpotLight = new THREE.SpotLight(0xfef08a, 4.2, 3.8, Math.PI / 4.8, 0.4, 1.2);
        this.sunSpotLight.position.set(0, -0.05, 0);
        this.sunSpotLight.target = panelGroup;
        this.sunSpotLight.castShadow = false;
        this.sunLampPivot.add(this.sunSpotLight);

        this.group.add(this.sunLampPivot);

        // =========================================================================
        // 4. MOTOR ELÉCTRICO DC TRANSPARENTE Y HÉLICE AERODINÁMICA (X = +0.50)
        // =========================================================================
        const motorGroup = new THREE.Group();
        motorGroup.position.set(0.50, tableH + 0.16, 0);

        // Pedestal de montaje antivibración de latón y goma
        const motorPedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.15, 0.28, 24),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 })
        );
        motorGroup.add(motorPedestal);

        // Carcasa del motor con ventana de acrílico transparente para ver el bobinado
        const motorHousing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 0.20, 24),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.15 })
        );
        motorHousing.rotation.z = Math.PI / 2;
        motorHousing.position.y = 0.20;
        motorGroup.add(motorHousing);
        this.interactableMeshes.push(motorHousing);

        // Bobinas de cobre del inducido visibles a través de la ventana
        const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.95, roughness: 0.1 });
        for (let i = 0; i < 3; i++) {
            const coil = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 12, 20), coilMat);
            coil.position.set(-0.04 + i * 0.04, 0.20, 0);
            coil.rotation.y = Math.PI / 2;
            motorGroup.add(coil);
        }

        // Eje de acero rectificado
        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, 0.10, 16),
            new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.05 })
        );
        shaft.rotation.z = Math.PI / 2;
        shaft.position.set(0.14, 0.20, 0);
        motorGroup.add(shaft);

        // Buje cónico de hélice
        this.propellerGroup = new THREE.Group();
        this.propellerGroup.position.set(0.18, 0.20, 0);

        const propSpinner = new THREE.Mesh(
            new THREE.ConeGeometry(0.038, 0.08, 20),
            new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.2 })
        );
        propSpinner.rotation.z = -Math.PI / 2;
        this.propellerGroup.add(propSpinner);

        // Hélice aerodinámica de 3 palas con perfil torsionado y bordes de alta visibilidad
        const bladeLen = 0.22;
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0, 0);
        bladeShape.lineTo(0.022, bladeLen * 0.25);
        bladeShape.lineTo(0.016, bladeLen * 0.85);
        bladeShape.lineTo(0, bladeLen);
        bladeShape.lineTo(-0.016, bladeLen * 0.85);
        bladeShape.lineTo(-0.022, bladeLen * 0.25);
        bladeShape.closePath();

        const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.005, bevelEnabled: false });
        bladeGeom.center();
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.3, roughness: 0.25 });

        for (let b = 0; b < 3; b++) {
            const bladePivot = new THREE.Group();
            bladePivot.rotation.x = (b * Math.PI * 2) / 3;

            const blade = new THREE.Mesh(bladeGeom, bladeMat);
            blade.position.set(0, bladeLen / 2 + 0.02, 0);
            blade.rotation.y = 0.25; // Ángulo de ataque aerodinámico
            bladePivot.add(blade);

            // Franja de advertencia en las puntas (estilo aviación)
            const tipMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.008, 0.035, 0.02),
                new THREE.MeshBasicMaterial({ color: 0xef4444 })
            );
            tipMesh.position.set(0, bladeLen + 0.01, 0);
            bladePivot.add(tipMesh);

            this.propellerGroup.add(bladePivot);
        }

        // Aro de protección aerodinámico perimetral (seguridad de laboratorio)
        const shroud = new THREE.Mesh(
            new THREE.TorusGeometry(bladeLen + 0.04, 0.010, 16, 32),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
        );
        shroud.rotation.y = Math.PI / 2;
        shroud.position.set(0.18, 0.20, 0);
        motorGroup.add(shroud);

        motorGroup.add(this.propellerGroup);
        this.group.add(motorGroup);

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
            new THREE.Vector3(0.42, tableH + 0.22, 0.08)
        ]);
        const wirePos = new THREE.Mesh(new THREE.TubeGeometry(wirePosCurve, 20, 0.008, 8, false), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }));

        const wireNegCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.15, tableH + 0.12, -0.15),
            new THREE.Vector3(0.08, tableH + 0.04, -0.22),
            new THREE.Vector3(0.42, tableH + 0.22, -0.08)
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

        // Estado del motor
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Inter", monospace';
        ctx.fillText(`MOTOR: ${Math.round(this.currentPropellerRpm)} RPM · POTENCIA: ${Math.round(info.efficiency * 100)}%`, 24, 218);

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

        // 3. Inercia física aerodinámica de la hélice
        const rpmLerp = Math.min(1.0, delta * 3.0);
        this.currentPropellerRpm += (this.targetPropellerRpm - this.currentPropellerRpm) * rpmLerp;

        const rps = this.currentPropellerRpm / 60;
        this.propellerAngle += rps * Math.PI * 2 * delta;
        this.propellerGroup.rotation.x = this.propellerAngle;
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
