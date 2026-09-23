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
    private rearScreenMaterial!: THREE.MeshStandardMaterial;
    private inGlowMesh!: THREE.Mesh;
    private monoGlowMesh!: THREE.Mesh;
    private interactableMeshes: THREE.Object3D[] = [];

    private currentMode: number = 0;
    private isSleeping = false;
    private labels: THREE.Sprite[] = [];
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
            transparent: true,
            depthWrite: false
        });
        const ruler = new THREE.Mesh(rulerGeom, rulerMat);
        ruler.rotation.x = -Math.PI / 2;
        ruler.position.set(0, railHeight + 0.002, 0.09);
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

        const beamY = railHeight + 0.022 + 0.02 + 0.26; // Altura exacta del eje óptico: ~0.362m
        const beamSpan = 0.628; // Distancia exacta desde cara de salida del prisma (+0.105) hasta la pantalla (+0.733)

        // 4. HAZ DE LUZ ENTRANTE (Colimado, va del láser a la cara izquierda del prisma SIN HUECOS)
        // Salida colimador: X = -0.61. Cara izquierda del prisma: X = -0.105. Longitud = 0.505m
        const inBeamLen = 0.505;
        const inBeamStartX = -0.61;
        const inBeamGeom = new THREE.CylinderGeometry(0.013, 0.013, inBeamLen, 16);
        inBeamGeom.rotateZ(Math.PI / 2);
        const inBeamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.96 });
        this.incomingBeam = new THREE.Mesh(inBeamGeom, inBeamMat);
        this.incomingBeam.position.set(inBeamStartX + inBeamLen / 2, beamY, 0);
        this.group.add(this.incomingBeam);

        // Halo luminiscente exterior del haz incidente
        const inGlowGeom = new THREE.CylinderGeometry(0.024, 0.024, inBeamLen, 16);
        inGlowGeom.rotateZ(Math.PI / 2);
        const inGlowMat = new THREE.MeshBasicMaterial({
            color: 0x93c5fd,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending
        });
        this.inGlowMesh = new THREE.Mesh(inGlowGeom, inGlowMat);
        this.incomingBeam.add(this.inGlowMesh);

        // 5. ETAPA GONIOMÉTRICA DE PRECISIÓN Y PRISMA GIGANTE (Montado sobre carrierPrism en X = 0)
        this.prismStage.position.set(0, railHeight + 0.022, 0);

        // Torreta circular con escala en grados (radio 0.22m) - Anodized black metal
        const stageDisc = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.23, 0.035, 48),
            new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.95, roughness: 0.4 })
        );
        stageDisc.position.set(0, 0.018, 0);
        this.prismStage.add(stageDisc);

        // Tiny glowing indicator LEDs around the disc
        const ledMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00f0ff, emissiveIntensity: 2.0 });
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12;
            const led = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.005, 0.005), ledMat);
            led.position.set(Math.cos(angle) * 0.225, 0.025, Math.sin(angle) * 0.225);
            this.prismStage.add(led);
        }

        // 3 tornillos micrométricos niveladores de metal oscuro
        const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.3 });
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.045, 16), darkMetalMat);
            screw.position.set(Math.cos(angle) * 0.16, 0.04, Math.sin(angle) * 0.16);
            this.prismStage.add(screw);
        }

        // Base de sujeción del prisma - Anodized black metal
        const prismPlate = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.02, 36),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.85, roughness: 0.2 })
        );
        prismPlate.position.set(0, 0.065, 0);
        this.prismStage.add(prismPlate);

        // PRISMA DE CRISTAL FLINT EQUILÁTERO GIGANTE Y REALISTA (Lado 0.42m, centrado verticalmente en el haz)
        const s = 0.42; // Lado del triángulo equilátero
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
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.02,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            iridescence: 1.0,
            iridescenceIOR: 1.5,
            side: THREE.DoubleSide
        });

        this.prismMesh = new THREE.Mesh(prismGeom, prismMat);
        // Altura exacta del eje óptico dentro del stage: 0.362 - 0.082 = 0.28m
        this.prismMesh.position.set(0, 0.28, 0);
        this.prismMesh.castShadow = true;
        this.prismStage.add(this.prismMesh);
        this.interactableMeshes.push(this.prismMesh);

        // Haz interno que viaja y se refracta dentro del cristal de entrada (-0.105) a salida (+0.105)
        const intBeamLen = 0.21;
        const internalBeamGeom = new THREE.CylinderGeometry(0.013, 0.022, intBeamLen, 16);
        internalBeamGeom.rotateZ(Math.PI / 2);
        const internalMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.88 });
        this.internalBeam = new THREE.Mesh(internalBeamGeom, internalMat);
        this.internalBeam.position.set(0.0, 0.28, 0);
        this.prismStage.add(this.internalBeam);

        this.group.add(this.prismStage);

        // 6. ABANICO ESPECTRAL DE SALIDA CONTINUO (NACE EN X = +0.105 EXACTO)
        this.rainbowGroup = new THREE.Group();
        this.rainbowGroup.position.set(0.105, beamY, 0);

        // Rayos de dispersión cromática (Arcoíris Volumétrico)
        const spectralRays = [
            { name: "ROJO", col: 0xff0022, angle: -0.06 },
            { name: "NARANJA", col: 0xff6600, angle: -0.02 },
            { name: "AMARILLO", col: 0xffcc00, angle: 0.02 },
            { name: "VERDE", col: 0x00dd44, angle: 0.06 },
            { name: "CIAN", col: 0x00d4ff, angle: 0.10 },
            { name: "AZUL", col: 0x1155ff, angle: 0.14 },
            { name: "VIOLETA", col: 0x8800ff, angle: 0.18 }
        ];

        spectralRays.forEach((ray) => {
            const rayPivot = new THREE.Group();
            rayPivot.rotation.y = ray.angle;

            // Núcleo del rayo (más denso)
            const coreGeo = new THREE.CylinderGeometry(0.004, 0.004, beamSpan, 12);
            coreGeo.rotateZ(Math.PI / 2);
            const coreMat = new THREE.MeshBasicMaterial({
                color: ray.col,
                transparent: true,
                opacity: 0.85
            });
            const coreMesh = new THREE.Mesh(coreGeo, coreMat);
            coreMesh.position.set(beamSpan / 2, 0, 0);
            rayPivot.add(coreMesh);

            // Halo del rayo (brillo aditivo)
            const glowGeo = new THREE.CylinderGeometry(0.012, 0.012, beamSpan, 12);
            glowGeo.rotateZ(Math.PI / 2);
            const glowMat = new THREE.MeshBasicMaterial({
                color: ray.col,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const glowMesh = new THREE.Mesh(glowGeo, glowMat);
            glowMesh.position.set(beamSpan / 2, 0, 0);
            rayPivot.add(glowMesh);

            // Etiqueta del color
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 32;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(ray.name, 64, 24);
            const tex = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
            
            sprite.position.set(beamSpan * 0.8, 0.05, 0);
            sprite.scale.set(0.08, 0.02, 1);
            rayPivot.add(sprite);
            this.labels.push(sprite);

            this.rainbowGroup.add(rayPivot);
        });

        this.group.add(this.rainbowGroup);

        // 7. HAZ MONOCROMÁTICO (Nace en X = +0.105 hasta la pantalla en X = 0.733)
        const monoGeo = new THREE.CylinderGeometry(0.013, 0.013, beamSpan, 12);
        monoGeo.rotateZ(Math.PI / 2);
        const monoMat = new THREE.MeshBasicMaterial({
            color: 0x22c55e,
            transparent: true,
            opacity: 0.95
        });
        this.monochromaticBeam = new THREE.Mesh(monoGeo, monoMat);
        this.monochromaticBeam.position.set(0.105 + beamSpan / 2, beamY, 0);

        const monoGlowGeo = new THREE.CylinderGeometry(0.024, 0.024, beamSpan, 12);
        monoGlowGeo.rotateZ(Math.PI / 2);
        const monoGlowMat = new THREE.MeshBasicMaterial({
            color: 0x4ade80,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.monoGlowMesh = new THREE.Mesh(monoGlowGeo, monoGlowMat);
        this.monochromaticBeam.add(this.monoGlowMesh);

        this.monochromaticBeam.visible = false;
        this.group.add(this.monochromaticBeam);

        // 8. PANTALLA RECEPTORA ESMERILADA DE LABORATORIO 360° (carrierScreen)
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

        // Marco exterior de la pantalla receptora (abierto en el centro para ver a través del vidrio)
        const screenFrame = new THREE.Mesh(
            new THREE.BoxGeometry(0.024, 0.38, 0.50),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 })
        );
        screenFrame.position.set(0, 0.26, 0);
        screenHolder.add(screenFrame);

        // Panel difusor de vidrio esmerilado translúcido con espesor 3D
        const diffuserGeom = new THREE.BoxGeometry(0.012, 0.34, 0.46);
        const diffuserMat = new THREE.MeshPhysicalMaterial({
            color: 0xf8fafc,
            transmission: 0.75,
            roughness: 0.25,
            thickness: 0.015,
            transparent: true,
            opacity: 0.92
        });
        const diffuserMesh = new THREE.Mesh(diffuserGeom, diffuserMat);
        diffuserMesh.position.set(0, 0.26, 0);
        screenHolder.add(diffuserMesh);

        // Pantalla receptora FRONTAL (mirando hacia el láser y prisma, -X)
        const screenGeom = new THREE.PlaneGeometry(0.45, 0.33);
        this.screenMaterial = new THREE.MeshStandardMaterial({
            map: this.generateScreenTexture(0),
            roughness: 0.8,
            metalness: 0.05,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: this.generateScreenTexture(0),
            emissiveIntensity: 0.4
        });
        this.screenMesh = new THREE.Mesh(screenGeom, this.screenMaterial);
        this.screenMesh.position.set(-0.007, 0.26, 0);
        this.screenMesh.rotation.y = -Math.PI / 2;
        screenHolder.add(this.screenMesh);
        this.interactableMeshes.push(this.screenMesh);

        // Pantalla receptora TRASERA (mirando hacia afuera, +X) para que se vea iluminada en 360°
        this.rearScreenMaterial = new THREE.MeshStandardMaterial({
            map: this.generateRearScreenTexture(0),
            roughness: 0.85,
            metalness: 0.05,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: this.generateRearScreenTexture(0),
            emissiveIntensity: 0.35
        });
        const rearScreenMesh = new THREE.Mesh(screenGeom, this.rearScreenMaterial);
        rearScreenMesh.position.set(0.007, 0.26, 0);
        rearScreenMesh.rotation.y = Math.PI / 2; // Orientada hacia atrás
        screenHolder.add(rearScreenMesh);

        carrierScreen.add(screenHolder);
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

    private generateRearScreenTexture(mode: number): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;

        // Fondo difusor esmerilado translúcido visto desde atrás
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 512, 512);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 512; x += 32) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
        }
        for (let y = 0; y < 512; y += 32) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
        }

        // Marco del sensor óptico
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(100, 150, 312, 212);

        if (mode === 0) {
            // Banda espectral invertida vista desde atrás (efecto translúcido a través del vidrio)
            const grad = ctx.createLinearGradient(110, 256, 402, 256);
            grad.addColorStop(0.00, '#8800ff'); // Violeta
            grad.addColorStop(0.15, '#1155ff'); // Azul
            grad.addColorStop(0.30, '#00d4ff'); // Cian
            grad.addColorStop(0.48, '#00dd44'); // Verde
            grad.addColorStop(0.65, '#ffcc00'); // Amarillo
            grad.addColorStop(0.82, '#ff6600'); // Naranja
            grad.addColorStop(1.00, '#ff0022'); // Rojo

            ctx.fillStyle = grad;
            ctx.fillRect(110, 210, 292, 92);

            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
            ctx.fillText('PANTALLA DIFUSORA TRASERA (360°)', 105, 335);
            ctx.font = 'bold 12px monospace';
            ctx.fillText('TRANSMISIÓN ESPECTRAL • CAPTURA ÓPTICA', 105, 358);
        } else if (mode === 1) {
            // Mancha láser verde monocromática vista desde atrás
            const radGrad = ctx.createRadialGradient(256, 256, 0, 256, 256, 40);
            radGrad.addColorStop(0, '#ffffff');
            radGrad.addColorStop(0.35, '#22c55e');
            radGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(256, 256, 40, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
            ctx.fillText('PANTALLA TRASERA • LÁSER 532 nm', 110, 335);
        } else {
            // Mancha láser roja monocromática vista desde atrás
            const radGrad = ctx.createRadialGradient(287, 256, 0, 287, 256, 40);
            radGrad.addColorStop(0, '#ffffff');
            radGrad.addColorStop(0.35, '#ef4444');
            radGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(287, 256, 40, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
            ctx.fillText('PANTALLA TRASERA • LÁSER 650 nm', 110, 335);
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

        // Actualizar textura proyectada en pantalla frontal y trasera
        const frontTex = this.generateScreenTexture(this.currentMode);
        this.screenMaterial.map?.dispose();
        this.screenMaterial.map = frontTex;
        this.screenMaterial.emissiveMap?.dispose();
        this.screenMaterial.emissiveMap = frontTex;
        this.screenMaterial.needsUpdate = true;

        if (this.rearScreenMaterial) {
            const rearTex = this.generateRearScreenTexture(this.currentMode);
            this.rearScreenMaterial.map?.dispose();
            this.rearScreenMaterial.map = rearTex;
            this.rearScreenMaterial.emissiveMap?.dispose();
            this.rearScreenMaterial.emissiveMap = rearTex;
            this.rearScreenMaterial.needsUpdate = true;
        }

        if (this.currentMode === 0) {
            inMat.color.setHex(0xffffff);
            intMat.color.setHex(0xffffff);
            if (this.inGlowMesh) (this.inGlowMesh.material as THREE.MeshBasicMaterial).color.setHex(0x93c5fd);
            this.screenMaterial.emissive.setHex(0xffffff);
            this.screenMaterial.emissiveIntensity = 0.45;
            if (this.rearScreenMaterial) {
                this.rearScreenMaterial.emissive.setHex(0xffffff);
                this.rearScreenMaterial.emissiveIntensity = 0.40;
            }
            this.rainbowGroup.visible = true;
            this.monochromaticBeam.visible = false;
        } else if (this.currentMode === 1) {
            inMat.color.setHex(0x22c55e);
            intMat.color.setHex(0x22c55e);
            monoMat.color.setHex(0x22c55e);
            if (this.inGlowMesh) (this.inGlowMesh.material as THREE.MeshBasicMaterial).color.setHex(0x4ade80);
            if (this.monoGlowMesh) (this.monoGlowMesh.material as THREE.MeshBasicMaterial).color.setHex(0x4ade80);
            this.screenMaterial.emissive.setHex(0x22c55e);
            this.screenMaterial.emissiveIntensity = 0.65;
            if (this.rearScreenMaterial) {
                this.rearScreenMaterial.emissive.setHex(0x22c55e);
                this.rearScreenMaterial.emissiveIntensity = 0.55;
            }
            this.rainbowGroup.visible = false;
            this.monochromaticBeam.visible = true;
            this.monochromaticBeam.rotation.y = 0.05;
        } else {
            inMat.color.setHex(0xef4444);
            intMat.color.setHex(0xef4444);
            monoMat.color.setHex(0xef4444);
            if (this.inGlowMesh) (this.inGlowMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf87171);
            if (this.monoGlowMesh) (this.monoGlowMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf87171);
            this.screenMaterial.emissive.setHex(0xef4444);
            this.screenMaterial.emissiveIntensity = 0.65;
            if (this.rearScreenMaterial) {
                this.rearScreenMaterial.emissive.setHex(0xef4444);
                this.rearScreenMaterial.emissiveIntensity = 0.55;
            }
            this.rainbowGroup.visible = false;
            this.monochromaticBeam.visible = true;
            this.monochromaticBeam.rotation.y = -0.03;
        }
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }

    public setSleep(sleep: boolean): void {
        this.isSleeping = sleep;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    public update(time: number): void {
        if (this.isSleeping) return;
        // Giro suave del prisma sobre su torreta goniométrica
        const rotOffset = Math.sin(time * 1.4) * 0.04;
        this.prismMesh.rotation.y = rotOffset;
        this.internalBeam.rotation.y = rotOffset * 0.6;

        // Sutil parpadeo de coherencia óptica del láser
        const inMat = this.incomingBeam.material as THREE.MeshBasicMaterial;
        inMat.opacity = 0.90 + Math.sin(time * 8.0) * 0.08;
    }
}
