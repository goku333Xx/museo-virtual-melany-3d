import * as THREE from 'three';

export interface OpticsModeInfo {
    id: number;
    name: string;
    desc: string;
}

export class OpticsExhibit {
    private group: THREE.Group;
    private prismStage: THREE.Group;
    private prismMesh: THREE.Mesh;
    private incomingBeam: THREE.Mesh;
    private internalBeam: THREE.Mesh;
    private rainbowGroup: THREE.Group;
    private monochromaticBeam: THREE.Mesh;
    private screenMesh: THREE.Mesh;
    private screenMaterial: THREE.MeshStandardMaterial;
    private interactableMeshes: THREE.Object3D[] = [];

    private currentMode: number = 0;
    private readonly modes: OpticsModeInfo[] = [
        {
            id: 0,
            name: "Luz Blanca (Dispersión Cromática Completa)",
            desc: "La luz blanca está compuesta por todas las frecuencias del arcoíris. El vidrio frena más a la luz violeta que a la roja, separándolas en un abanico continuo."
        },
        {
            id: 1,
            name: "Láser Verde (532 nm Monocromático)",
            desc: "Al emitir una sola longitud de onda pura, el rayo se desvía (refracción) pero NO se divide en colores porque no tiene otras frecuencias."
        },
        {
            id: 2,
            name: "Láser Rojo (650 nm Monocromático)",
            desc: "La luz roja tiene mayor longitud de onda y viaja más rápido dentro del cristal que la verde, por lo que sufre una desviación angular menor."
        }
    ];

    constructor() {
        this.group = new THREE.Group();
        this.prismStage = new THREE.Group();

        // 1. BANCO ÓPTICO DE LABORATORIO DE PRECISIÓN (Riel de 2.0m x 0.28m)
        const railLength = 2.0;
        const railWidth = 0.28;
        const railHeight = 0.06;

        const railGeom = new THREE.BoxGeometry(railLength, railHeight, railWidth);
        const railMat = new THREE.MeshStandardMaterial({
            color: 0x161b26,
            metalness: 0.9,
            roughness: 0.2
        });
        const rail = new THREE.Mesh(railGeom, railMat);
        rail.position.set(0, railHeight / 2, 0);
        rail.castShadow = true;
        rail.receiveShadow = true;
        this.group.add(rail);
        this.interactableMeshes.push(rail);

        // Regla graduada milimétrica sobre el riel
        const rulerGeom = new THREE.PlaneGeometry(railLength - 0.1, 0.03);
        const rulerMat = new THREE.MeshBasicMaterial({
            map: this.generateRulerTexture(),
            transparent: true
        });
        const ruler = new THREE.Mesh(rulerGeom, rulerMat);
        ruler.rotation.x = -Math.PI / 2;
        ruler.position.set(0, railHeight + 0.001, 0.09);
        this.group.add(ruler);

        // Patas niveladoras de bronce en los extremos del riel
        const footMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
        [-railLength / 2 + 0.1, railLength / 2 - 0.1].forEach(fx => {
            [-railWidth / 2 + 0.05, railWidth / 2 - 0.05].forEach(fz => {
                const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.04, 16), footMat);
                foot.position.set(fx, 0.02, fz);
                this.group.add(foot);
            });
        });

        // 2. CARROS DESLIZANTES MECANIZADOS CON PERILLAS MOLETEADAS
        const carrierMat = new THREE.MeshStandardMaterial({ color: 0x242d3d, metalness: 0.8, roughness: 0.25 });
        const knobMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });

        const createCarrier = (x: number, width: number = 0.28): THREE.Mesh => {
            const cGeom = new THREE.BoxGeometry(width, 0.045, railWidth + 0.04);
            const cMesh = new THREE.Mesh(cGeom, carrierMat);
            cMesh.position.set(x, railHeight + 0.022, 0);
            this.group.add(cMesh);

            const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.025, 16), knobMat);
            knob.position.set(0, 0, railWidth / 2 + 0.03);
            knob.rotation.x = Math.PI / 2;
            cMesh.add(knob);

            return cMesh;
        };

        const carrierLaser = createCarrier(-0.75, 0.26);
        createCarrier(0.0, 0.38);
        const carrierScreen = createCarrier(0.75, 0.26);

        // 3. EMISOR LÁSER / COLIMADOR INDUSTRIAL (Montado sobre carrierLaser)
        const emitterGroup = new THREE.Group();
        emitterGroup.position.set(0, 0.02, 0);

        // Dos postes cromados regulables
        const postLaser = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.018, 0.22, 16),
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.1 })
        );
        postLaser.position.set(0, 0.11, 0);
        emitterGroup.add(postLaser);

        // Bloque de abrazadera de precisión
        const clampLaser = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.06, 0.08),
            carrierMat
        );
        clampLaser.position.set(0, 0.20, 0);
        emitterGroup.add(clampLaser);

        // Cabezal cilíndrico del láser de alta potencia con aletas de disipación
        const laserBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.055, 0.28, 24),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.3 })
        );
        laserBody.rotation.z = Math.PI / 2;
        laserBody.position.set(0, 0.26, 0);
        emitterGroup.add(laserBody);
        this.interactableMeshes.push(laserBody);

        // Lente colimadora de salida con anillo de bronce
        const nozzleRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.045, 0.01, 16, 24),
            footMat
        );
        nozzleRing.rotation.y = Math.PI / 2;
        nozzleRing.position.set(0.14, 0.26, 0);
        emitterGroup.add(nozzleRing);

        carrierLaser.add(emitterGroup);

        const beamY = railHeight + 0.022 + 0.02 + 0.26; // Altura exacta del eje óptico: ~0.36m

        // 4. HAZ DE LUZ ENTRANTE (Colimado, va del láser a la cara izquierda del prisma)
        const beamStartX = -0.60;
        const beamEndX = -0.16;
        const inBeamLen = beamEndX - beamStartX;
        const inBeamGeom = new THREE.CylinderGeometry(0.014, 0.014, inBeamLen, 16);
        inBeamGeom.rotateZ(Math.PI / 2);
        const inBeamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
        this.incomingBeam = new THREE.Mesh(inBeamGeom, inBeamMat);
        this.incomingBeam.position.set(beamStartX + inBeamLen / 2, beamY, 0);
        this.group.add(this.incomingBeam);

        // 5. ETAPA GONIOMÉTRICA DE PRECISIÓN Y PRISMA GIGANTE (Montado sobre carrierPrism)
        this.prismStage.position.set(0, railHeight + 0.022, 0);

        // Torreta circular con escala en grados (radio 0.22m)
        const stageDisc = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.23, 0.035, 48),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
        );
        stageDisc.position.set(0, 0.018, 0);
        this.prismStage.add(stageDisc);

        // 3 tornillos micrométricos niveladores de bronce
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.045, 16), footMat);
            screw.position.set(Math.cos(angle) * 0.16, 0.04, Math.sin(angle) * 0.16);
            this.prismStage.add(screw);
        }

        // Base de sujeción del prisma
        const prismPlate = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.02, 36),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
        );
        prismPlate.position.set(0, 0.065, 0);
        this.prismStage.add(prismPlate);

        // PRISMA DE CRISTAL FLINT EQUILÁTERO GIGANTE Y REALISTA (Lado 0.44m, Altura 0.36m, Profundidad 0.28m)
        const s = 0.42; // Lado del triángulo equilátero (+300% de tamaño)
        const h = s * Math.sin(Math.PI / 3);
        const prismShape = new THREE.Shape();
        prismShape.moveTo(-s / 2, -h / 3);
        prismShape.lineTo(s / 2, -h / 3);
        prismShape.lineTo(0, (2 * h) / 3);
        prismShape.closePath();

        const extrudeSettings = {
            depth: 0.26,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 1,
            bevelSize: 0.012,
            bevelThickness: 0.012
        };

        const prismGeom = new THREE.ExtrudeGeometry(prismShape, extrudeSettings);
        prismGeom.center();

        const prismMat = new THREE.MeshPhysicalMaterial({
            color: 0xf0f9ff,
            transmission: 0.95,
            opacity: 1.0,
            transparent: true,
            roughness: 0.02,
            ior: 1.66, // Cristal Flint pesado de dispersión cromática de alta fidelidad
            thickness: 0.25,
            specularIntensity: 1.0,
            specularColor: 0xffffff
        });

        this.prismMesh = new THREE.Mesh(prismGeom, prismMat);
        // Centrar verticalmente en la trayectoria del haz óptico
        this.prismMesh.position.set(0, 0.25, 0);
        this.prismMesh.castShadow = true;
        this.prismStage.add(this.prismMesh);
        this.interactableMeshes.push(this.prismMesh);

        // Haz interno que viaja y se refracta dentro del cristal
        const internalBeamGeom = new THREE.CylinderGeometry(0.015, 0.025, 0.26, 16);
        internalBeamGeom.rotateZ(Math.PI / 2.3);
        const internalMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
        this.internalBeam = new THREE.Mesh(internalBeamGeom, internalMat);
        this.internalBeam.position.set(0.0, 0.25, 0);
        this.prismStage.add(this.internalBeam);

        this.group.add(this.prismStage);

        // 6. ABANICO ESPECTRAL DE SALIDA CONTINUO (EL ARCOÍRIS NÍTIDO Y SATURADO)
        this.rainbowGroup = new THREE.Group();
        this.rainbowGroup.position.set(0.14, beamY, 0);

        // Construir la malla continua del arcoíris sin blanquearse
        this.buildVibrantRainbowFan();

        // Rayos de guía espectral nítidos con colores saturados puros
        const spectralRays = [
            { col: 0xff0022, angle: -0.06, name: "700nm Rojo" },
            { col: 0xff6600, angle: -0.02, name: "620nm Naranja" },
            { col: 0xffcc00, angle: 0.02, name: "580nm Amarillo" },
            { col: 0x00dd44, angle: 0.06, name: "530nm Verde" },
            { col: 0x00d4ff, angle: 0.10, name: "490nm Cian" },
            { col: 0x1155ff, angle: 0.14, name: "450nm Azul" },
            { col: 0x8800ff, angle: 0.18, name: "400nm Violeta" }
        ];

        const beamSpan = 0.60;
        spectralRays.forEach(ray => {
            const rayGeo = new THREE.CylinderGeometry(0.006, 0.01, beamSpan, 8);
            rayGeo.rotateZ(Math.PI / 2);
            const rayMat = new THREE.MeshBasicMaterial({
                color: ray.col,
                transparent: true,
                opacity: 0.90
            });
            const rMesh = new THREE.Mesh(rayGeo, rayMat);

            const rayPivot = new THREE.Group();
            rayPivot.rotation.y = ray.angle;
            rMesh.position.set(beamSpan / 2, 0, 0);
            rayPivot.add(rMesh);
            this.rainbowGroup.add(rayPivot);
        });

        this.group.add(this.rainbowGroup);

        // 7. HAZ MONOCROMÁTICO (Para modos Láser Verde y Rojo)
        const monoGeo = new THREE.CylinderGeometry(0.014, 0.014, beamSpan, 12);
        monoGeo.rotateZ(Math.PI / 2);
        const monoMat = new THREE.MeshBasicMaterial({
            color: 0x22c55e,
            transparent: true,
            opacity: 0.95
        });
        this.monochromaticBeam = new THREE.Mesh(monoGeo, monoMat);
        this.monochromaticBeam.position.set(0.14 + beamSpan / 2, beamY, 0);
        this.monochromaticBeam.visible = false;
        this.group.add(this.monochromaticBeam);

        // 8. PANTALLA RECEPTORA ESMERILADA DE LABORATORIO (carrierScreen)
        const screenHolder = new THREE.Group();
        screenHolder.position.set(0, 0.02, 0);

        // Dos postes cromados de soporte robustos
        [-0.18, 0.18].forEach(pz => {
            const sPost = new THREE.Mesh(
                new THREE.CylinderGeometry(0.014, 0.014, 0.42, 16),
                new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.1 })
            );
            sPost.position.set(0, 0.21, pz);
            screenHolder.add(sPost);
        });

        // Marco de la pantalla receptora (0.50m x 0.38m)
        const screenFrame = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.38, 0.50),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 })
        );
        screenFrame.position.set(0, 0.26, 0);
        screenHolder.add(screenFrame);

        // Pantalla receptora con textura de espectro proyectado en tiempo real
        const screenGeom = new THREE.PlaneGeometry(0.46, 0.34);
        this.screenMaterial = new THREE.MeshStandardMaterial({
            map: this.generateScreenTexture(0),
            roughness: 0.9,
            metalness: 0.05
        });
        this.screenMesh = new THREE.Mesh(screenGeom, this.screenMaterial);
        this.screenMesh.position.set(-0.017, 0.26, 0);
        this.screenMesh.rotation.y = -Math.PI / 2;
        screenHolder.add(this.screenMesh);
        this.interactableMeshes.push(this.screenMesh);

        carrierScreen.add(screenHolder);
    }

    private buildVibrantRainbowFan() {
        const fanGeom = new THREE.BufferGeometry();
        const segments = 36;
        const length = 0.60;
        const startWidth = 0.025;

        const positions: number[] = [];
        const colors: number[] = [];

        // Generar un abanico plano continuo con interpolación de colores espectrales de alta saturación
        for (let i = 0; i <= segments; i++) {
            const t = i / segments; // 0 (Rojo) a 1 (Violeta)
            const angle = -0.06 + t * 0.24; // Extensión angular del arcoíris

            const xEnd = Math.cos(angle) * length;
            const zEnd = Math.sin(angle) * length;

            // Vértice en el origen del prisma
            positions.push(0, 0, (t - 0.5) * startWidth);
            // Vértice en la pantalla receptora
            positions.push(xEnd, 0, zEnd);

            // Color saturado puro
            const col = this.getSaturatedSpectralColor(t);
            colors.push(col.r, col.g, col.b);
            colors.push(col.r, col.g, col.b);
        }

        const indices: number[] = [];
        for (let i = 0; i < segments; i++) {
            const v1 = i * 2;
            const v2 = v1 + 1;
            const v3 = v1 + 2;
            const v4 = v1 + 3;
            indices.push(v1, v2, v3);
            indices.push(v2, v4, v3);
        }

        fanGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        fanGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        fanGeom.setIndex(indices);
        fanGeom.computeVertexNormals();

        // Usar NormalBlending con alta opacidad para que los colores brillen vivos y no se saturen en blanco
        const fanMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.88,
            depthWrite: false
        });

        const fanMesh = new THREE.Mesh(fanGeom, fanMat);
        this.rainbowGroup.add(fanMesh);
    }

    private getSaturatedSpectralColor(t: number): THREE.Color {
        const c = new THREE.Color();
        if (t < 0.16) {
            c.setRGB(1.0, (t / 0.16) * 0.45, 0.0); // Rojo puro a Naranja intenso
        } else if (t < 0.33) {
            c.setRGB(1.0, 0.45 + ((t - 0.16) / 0.17) * 0.55, 0.0); // Naranja a Amarillo puro
        } else if (t < 0.50) {
            c.setRGB(1.0 - ((t - 0.33) / 0.17), 1.0, 0.0); // Amarillo a Verde puro
        } else if (t < 0.67) {
            c.setRGB(0.0, 1.0, ((t - 0.50) / 0.17)); // Verde a Cian eléctrico
        } else if (t < 0.83) {
            c.setRGB(0.08, 1.0 - ((t - 0.67) / 0.16) * 0.75, 1.0); // Cian a Azul zafiro
        } else {
            c.setRGB(0.55 + ((t - 0.83) / 0.17) * 0.45, 0.0, 1.0); // Azul a Violeta real
        }
        return c;
    }

    private generateRulerTexture(): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 32;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1024, 32);

        ctx.strokeStyle = '#d4af37';
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px monospace';
        ctx.lineWidth = 1;

        for (let x = 10; x < 1014; x += 10) {
            const isMajor = (x % 50 === 0);
            const lineH = isMajor ? 14 : 7;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, lineH);
            ctx.stroke();

            if (isMajor && x < 980) {
                ctx.fillText(`${x / 10}`, x - 6, 26);
            }
        }

        return new THREE.CanvasTexture(canvas);
    }

    private generateScreenTexture(mode: number): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;

        // Fondo blanco esmerilado de laboratorio con cuadrícula milimétrica nítida
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 512, 512);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 512; x += 32) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
        }
        for (let y = 0; y < 512; y += 32) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
        }

        // Marco de colimación central
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.strokeRect(100, 150, 312, 212);

        if (mode === 0) {
            // Banda espectral del arcoíris centrada con colores saturados
            const grad = ctx.createLinearGradient(110, 256, 402, 256);
            grad.addColorStop(0.00, '#ff0022'); // Rojo
            grad.addColorStop(0.18, '#ff6600'); // Naranja
            grad.addColorStop(0.35, '#ffcc00'); // Amarillo
            grad.addColorStop(0.52, '#00dd44'); // Verde
            grad.addColorStop(0.70, '#00d4ff'); // Cian
            grad.addColorStop(0.85, '#1155ff'); // Azul
            grad.addColorStop(1.00, '#8800ff'); // Violeta

            ctx.fillStyle = grad;
            ctx.fillRect(110, 210, 292, 92);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
            ctx.fillText('DISPERSIÓN CROMÁTICA CONTINUA', 115, 335);
            ctx.font = 'bold 13px monospace';
            ctx.fillText('700nm <---------------------------------> 400nm', 115, 358);
        } else if (mode === 1) {
            // Mancha láser verde monocromática nítida
            const radGrad = ctx.createRadialGradient(256, 256, 0, 256, 256, 35);
            radGrad.addColorStop(0, '#ffffff');
            radGrad.addColorStop(0.35, '#22c55e');
            radGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(256, 256, 35, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
            ctx.fillText('LÁSER VERDE • 532 nm (MONOCROMÁTICO)', 95, 335);
        } else {
            // Mancha láser roja monocromática nítida
            const radGrad = ctx.createRadialGradient(225, 256, 0, 225, 256, 35);
            radGrad.addColorStop(0, '#ffffff');
            radGrad.addColorStop(0.35, '#ef4444');
            radGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(225, 256, 35, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
            ctx.fillText('LÁSER ROJO • 650 nm (MENOR DESVÍO)', 105, 335);
        }

        return new THREE.CanvasTexture(canvas);
    }

    public cycleMode(): OpticsModeInfo {
        this.currentMode = (this.currentMode + 1) % this.modes.length;
        this.applyCurrentMode();
        return this.modes[this.currentMode];
    }

    public getCurrentModeInfo(): OpticsModeInfo {
        return this.modes[this.currentMode];
    }

    private applyCurrentMode() {
        const inMat = this.incomingBeam.material as THREE.MeshBasicMaterial;
        const intMat = this.internalBeam.material as THREE.MeshBasicMaterial;
        const monoMat = this.monochromaticBeam.material as THREE.MeshBasicMaterial;

        // Actualizar textura proyectada en la pantalla
        this.screenMaterial.map?.dispose();
        this.screenMaterial.map = this.generateScreenTexture(this.currentMode);
        this.screenMaterial.needsUpdate = true;

        if (this.currentMode === 0) {
            inMat.color.setHex(0xffffff);
            intMat.color.setHex(0xffffff);
            this.rainbowGroup.visible = true;
            this.monochromaticBeam.visible = false;
        } else if (this.currentMode === 1) {
            inMat.color.setHex(0x22c55e);
            intMat.color.setHex(0x22c55e);
            monoMat.color.setHex(0x22c55e);
            this.rainbowGroup.visible = false;
            this.monochromaticBeam.visible = true;
            this.monochromaticBeam.rotation.y = 0.05;
        } else {
            inMat.color.setHex(0xef4444);
            intMat.color.setHex(0xef4444);
            monoMat.color.setHex(0xef4444);
            this.rainbowGroup.visible = false;
            this.monochromaticBeam.visible = true;
            this.monochromaticBeam.rotation.y = -0.03;
        }
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    public update(time: number): void {
        // Giro suave del prisma sobre su torreta goniométrica
        const rotOffset = Math.sin(time * 1.4) * 0.04;
        this.prismMesh.rotation.y = rotOffset;
        this.internalBeam.rotation.y = rotOffset * 0.6;

        // Sutil parpadeo de coherencia óptica del láser
        const inMat = this.incomingBeam.material as THREE.MeshBasicMaterial;
        inMat.opacity = 0.90 + Math.sin(time * 8.0) * 0.08;
    }
}
