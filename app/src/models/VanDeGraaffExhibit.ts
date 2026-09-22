import * as THREE from 'three';

export interface VanDeGraaffModeInfo {
    id: number;
    name: string;
    voltage: string;
    desc: string;
}

export class VanDeGraaffExhibit {
    private group: THREE.Group;
    private beltMesh: THREE.Mesh;
    private ribbons: THREE.Mesh[] = [];
    private sparkLine: THREE.Line;
    private sparkPoints: THREE.Vector3[] = [];
    private sparkLight: THREE.PointLight;
    private interactableMeshes: THREE.Object3D[] = [];

    private currentMode: number = 0;
    private beltOffset: number = 0;
    private ribbonLift: number = 1.0;
    private targetRibbonLift: number = 1.0;

    private readonly modes: VanDeGraaffModeInfo[] = [
        {
            id: 0,
            name: "Carga Electrostática (150.000 V · Cintas Levitando)",
            voltage: "150.000 V",
            desc: "La correa de caucho transporta electrones por fricción triboeléctrica. La cúpula se carga positivamente y las tiras de papel levitan porque las cargas iguales se repelen."
        },
        {
            id: 1,
            name: "Descarga de Chispas (Ruptura Dieléctrica del Aire)",
            voltage: "180.000 V (Pico)",
            desc: "Al acercar la esfera de tierra, el campo electrostático supera la resistencia del aire (30.000 V/cm), ionizándolo y desatando relámpagos crepitantes en miniatura."
        },
        {
            id: 2,
            name: "Puesta a Tierra / Neutro (0 V · Reposo)",
            voltage: "0 V",
            desc: "El circuito se descarga por completo a tierra. Al no haber exceso de cargas eléctricas, la fuerza electrostática cesa y las tiras caen por gravedad."
        }
    ];

    constructor() {
        this.group = new THREE.Group();

        // 1. BANCO DE LABORATORIO DE ALTA TENSIÓN (1.8m x 1.2m x 0.10m)
        const tableW = 1.8;
        const tableD = 1.2;
        const tableH = 0.10;

        const tableMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.9,
            roughness: 0.2
        });
        const table = new THREE.Mesh(new THREE.BoxGeometry(tableW, tableH, tableD), tableMat);
        table.position.set(0, tableH / 2, 0);
        table.receiveShadow = true;
        this.group.add(table);
        this.interactableMeshes.push(table);

        // Bisel perimetral de bronce
        const rim = new THREE.Mesh(
            new THREE.BoxGeometry(tableW + 0.04, 0.02, tableD + 0.04),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
        );
        rim.position.set(0, tableH + 0.01, 0);
        this.group.add(rim);

        // 2. BASE MOTORIZADA DEL GENERADOR (X = -0.25)
        const genX = -0.25;
        const baseH = 0.22;
        const baseGeom = new THREE.CylinderGeometry(0.24, 0.28, baseH, 32);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.85,
            roughness: 0.25
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.set(genX, tableH + baseH / 2, 0);
        base.castShadow = true;
        this.group.add(base);
        this.interactableMeshes.push(base);

        // Placa técnica de peligro: Alto Voltaje
        const plaque = new THREE.Mesh(
            new THREE.PlaneGeometry(0.16, 0.08),
            new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        plaque.position.set(genX, tableH + baseH * 0.6, 0.26);
        this.group.add(plaque);

        // 3. COLUMNA AISLANTE DE METACRILATO TRANSPARENTE
        const columnH = 0.82;
        const columnY = tableH + baseH + columnH / 2;
        const column = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, columnH, 32),
            new THREE.MeshPhysicalMaterial({
                color: 0xe0f2fe,
                transmission: 0.92,
                opacity: 0.96,
                transparent: true,
                roughness: 0.04,
                ior: 1.49
            })
        );
        column.position.set(genX, columnY, 0);
        this.group.add(column);

        // 4. CORREA DE CAUCHO INTERIOR QUE TRANSPORTA CARGA
        const beltGeom = new THREE.BoxGeometry(0.08, columnH - 0.04, 0.01);
        const beltMat = new THREE.MeshStandardMaterial({
            color: 0xd97706,
            roughness: 0.8,
            metalness: 0.1
        });
        this.beltMesh = new THREE.Mesh(beltGeom, beltMat);
        this.beltMesh.position.set(genX, columnY, 0);
        this.group.add(this.beltMesh);

        // Rodillos de teflón y aluminio en extremos de la correa
        const rollerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
        const rollerBot = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.09, 16), rollerMat);
        rollerBot.rotation.z = Math.PI / 2;
        rollerBot.position.set(genX, tableH + baseH + 0.03, 0);
        const rollerTop = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.09, 16), rollerMat);
        rollerTop.rotation.z = Math.PI / 2;
        rollerTop.position.set(genX, tableH + baseH + columnH - 0.03, 0);
        this.group.add(rollerBot, rollerTop);

        // 5. CÚPULA DE ALTO VOLTAJE DE ALUMINIO ESPEJADO
        const domeRadius = 0.28;
        const domeY = tableH + baseH + columnH + domeRadius * 0.75;

        const domeGeom = new THREE.SphereGeometry(domeRadius, 48, 48);
        const domeMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            metalness: 0.98,
            roughness: 0.08
        });
        const dome = new THREE.Mesh(domeGeom, domeMat);
        dome.position.set(genX, domeY, 0);
        dome.castShadow = true;
        this.group.add(dome);
        this.interactableMeshes.push(dome);

        // 6. CINTAS CONDUCTORAS LEVITANTES (REPULSIÓN ELECTRÓNICA)
        const ribbonMat = new THREE.MeshStandardMaterial({
            color: 0x93c5fd,
            metalness: 0.8,
            roughness: 0.3,
            side: THREE.DoubleSide
        });

        const numRibbons = 8;
        for (let i = 0; i < numRibbons; i++) {
            const angle = (i * Math.PI * 2) / numRibbons;
            const rGeom = new THREE.PlaneGeometry(0.025, 0.35, 1, 8);
            rGeom.translate(0, 0.175, 0); // Pivote en la base de la cinta

            const ribbon = new THREE.Mesh(rGeom, ribbonMat);
            // Anclada en el polo superior de la cúpula
            ribbon.position.set(
                genX + Math.cos(angle) * 0.08,
                domeY + domeRadius * 0.95,
                Math.sin(angle) * 0.08
            );
            ribbon.rotation.y = angle;
            this.ribbons.push(ribbon);
            this.group.add(ribbon);
        }

        // 7. ESFERA DE DESCARGA SECUNDARIA A TIERRA (X = +0.35)
        const wandX = 0.35;
        const wandY = domeY;

        const wandPost = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.018, wandY, 16),
            new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 })
        );
        wandPost.position.set(wandX, wandY / 2, 0);
        this.group.add(wandPost);

        const wandSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 })
        );
        wandSphere.position.set(wandX, wandY, 0);
        wandSphere.castShadow = true;
        this.group.add(wandSphere);
        this.interactableMeshes.push(wandSphere);

        // Cable verde de puesta a tierra
        const groundWireMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 });
        const groundWireCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(wandX, 0.02, 0),
            new THREE.Vector3(wandX + 0.15, tableH + 0.01, 0.25),
            new THREE.Vector3(tableW / 2 - 0.05, tableH + 0.01, 0.35)
        ]);
        const groundWire = new THREE.Mesh(new THREE.TubeGeometry(groundWireCurve, 20, 0.008, 8, false), groundWireMat);
        this.group.add(groundWire);

        // 8. ARCOS DE CHISPAS PROCEDURALES (DESCARGA ENTRE ESFERAS)
        const sparkCount = 10;
        for (let i = 0; i <= sparkCount; i++) {
            this.sparkPoints.push(new THREE.Vector3());
        }
        const sparkGeom = new THREE.BufferGeometry().setFromPoints(this.sparkPoints);
        const sparkMat = new THREE.LineBasicMaterial({
            color: 0xc084fc,
            linewidth: 3,
            blending: THREE.AdditiveBlending
        });
        this.sparkLine = new THREE.Line(sparkGeom, sparkMat);
        this.sparkLine.visible = false;
        this.group.add(this.sparkLine);

        // Luz estroboscópica de las chispas
        this.sparkLight = new THREE.PointLight(0xc084fc, 0, 3.0);
        this.sparkLight.position.set((genX + wandX) / 2, domeY, 0);
        this.group.add(this.sparkLight);
    }

    public update(time: number, delta: number = 0.016): void {
        // Animación de la correa girando
        if (this.currentMode !== 2) {
            this.beltOffset = (this.beltOffset + delta * 2.5) % 1.0;
        }

        // Interpolación de levitación de las cintas
        this.ribbonLift += (this.targetRibbonLift - this.ribbonLift) * Math.min(1.0, delta * 3.0);

        this.ribbons.forEach((ribbon, idx) => {
            const angle = (idx * Math.PI * 2) / this.ribbons.length;
            const flutter = Math.sin(time * 8.0 + idx) * 0.06 * this.ribbonLift;

            // Cuando está cargada, la cinta se inclina hacia afuera desafiando la gravedad
            const liftAngle = (Math.PI / 2.3) * this.ribbonLift + flutter;
            ribbon.rotation.z = Math.cos(angle) * liftAngle;
            ribbon.rotation.x = -Math.sin(angle) * liftAngle;
        });

        // Simulación de chispas en modo de descarga
        if (this.currentMode === 1) {
            const genX = -0.25;
            const wandX = 0.35;
            const domeY = 1.15;

            const start = new THREE.Vector3(genX + 0.28, domeY, 0);
            const end = new THREE.Vector3(wandX - 0.12, domeY, 0);

            const isSparking = Math.random() > 0.35;
            this.sparkLine.visible = isSparking;
            this.sparkLight.intensity = isSparking ? (2.5 + Math.random() * 2.0) : 0;

            if (isSparking) {
                const points: THREE.Vector3[] = [];
                const segments = 8;
                for (let s = 0; s <= segments; s++) {
                    const alpha = s / segments;
                    const p = new THREE.Vector3().lerpVectors(start, end, alpha);
                    if (s > 0 && s < segments) {
                        p.x += (Math.random() - 0.5) * 0.06;
                        p.y += (Math.random() - 0.5) * 0.08;
                        p.z += (Math.random() - 0.5) * 0.08;
                    }
                    points.push(p);
                }
                this.sparkLine.geometry.setFromPoints(points);
            }
        } else {
            this.sparkLine.visible = false;
            this.sparkLight.intensity = 0;
        }
    }

    public cycleMode(): VanDeGraaffModeInfo {
        this.currentMode = (this.currentMode + 1) % this.modes.length;
        const info = this.modes[this.currentMode];

        if (info.id === 0) {
            this.targetRibbonLift = 1.0;
        } else if (info.id === 1) {
            this.targetRibbonLift = 0.85;
        } else {
            this.targetRibbonLift = 0.05; // Cintas caen por gravedad
        }

        return info;
    }

    public getCurrentModeInfo(): VanDeGraaffModeInfo {
        return this.modes[this.currentMode];
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }
}
