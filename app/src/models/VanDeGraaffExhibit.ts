import * as THREE from 'three';
import { SoundSynthesizer } from '../SoundSynthesizer';

export interface VanDeGraaffModeInfo {
    id: number;
    name: string;
    voltage: string;
    desc: string;
}

export class VanDeGraaffExhibit {
    private group: THREE.Group;
    private beltMesh: THREE.Mesh;
    private hairsData: {mesh: THREE.Mesh, qCharged: THREE.Quaternion, qDischarged: THREE.Quaternion}[] = [];
    private coronaMesh!: THREE.Mesh;
    private innerCoronaMesh!: THREE.Mesh;
    private sparkLine: THREE.Line;
    private sparkPositions = new Float32Array(9 * 3);
    private sparkPosAttr: THREE.BufferAttribute;
    private sparkLight: THREE.PointLight;
    private interactableMeshes: THREE.Object3D[] = [];
    
    private isSleeping = false;
    private hairLift: number = 0;

    private currentMode: number = 0;
    private beltOffset: number = 0;
    private targetHairLift: number = 1.0;

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
        const motorGroup = new THREE.Group();
        motorGroup.position.set(genX, tableH + baseH / 2, 0);
        
        // Base de hierro del motor
        const baseGeom = new THREE.CylinderGeometry(0.24, 0.28, baseH, 32);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.castShadow = true;
        motorGroup.add(base);
        this.interactableMeshes.push(base);

        // Estator acanalado del motor
        const motorBodyGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 32);
        const motorBodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.4 });
        const motorBody = new THREE.Mesh(motorBodyGeom, motorBodyMat);
        motorBody.position.y = baseH / 2 + 0.075;
        motorGroup.add(motorBody);
        
        // Aletas de refrigeración
        const finGeom = new THREE.TorusGeometry(0.19, 0.005, 8, 32);
        for(let i=0; i<6; i++) {
            const fin = new THREE.Mesh(finGeom, motorBodyMat);
            fin.rotation.x = Math.PI/2;
            fin.position.y = baseH/2 + 0.03 + i*0.02;
            motorGroup.add(fin);
        }

        this.group.add(motorGroup);

        // Placa técnica de peligro: Alto Voltaje
        const plaque = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.08, 0.005),
            new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        plaque.position.set(genX, tableH + baseH * 0.6, 0.265);
        plaque.rotation.x = -Math.atan2(0.04, baseH);
        this.group.add(plaque);

        // 3. COLUMNA AISLANTE DE METACRILATO TRANSPARENTE
        const columnH = 0.82;
        const columnY = tableH + baseH + 0.15 + columnH / 2; // Ajustado por la altura del motor
        const column = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, columnH, 32),
            new THREE.MeshStandardMaterial({
                color: 0xe8f4f8,
                transparent: true,
                opacity: 0.25,
                roughness: 0.05,
                metalness: 0.15
            })
        );
        column.position.set(genX, columnY, 0);
        this.group.add(column);

        // 4. CORREA DE CAUCHO INTERIOR QUE TRANSPORTA CARGA
        const beltGeom = new THREE.BoxGeometry(0.08, columnH - 0.04, 0.01);
        const beltCanvas = document.createElement('canvas');
        beltCanvas.width = 128;
        beltCanvas.height = 128;
        const bCtx = beltCanvas.getContext('2d')!;
        
        // Gradiente radial para simular volumen y tensión en la correa
        const beltGrad = bCtx.createLinearGradient(0, 0, 128, 0);
        beltGrad.addColorStop(0, '#78350f'); // Borde oscuro
        beltGrad.addColorStop(0.2, '#d97706');
        beltGrad.addColorStop(0.5, '#f59e0b'); // Centro brillante (tensión)
        beltGrad.addColorStop(0.8, '#d97706');
        beltGrad.addColorStop(1, '#78350f');
        bCtx.fillStyle = beltGrad;
        bCtx.fillRect(0, 0, 128, 128);
        
        // Textura nervada tipo correa industrial
        bCtx.strokeStyle = 'rgba(0,0,0,0.3)';
        bCtx.lineWidth = 4;
        for(let i=0; i<128; i+=16) {
            bCtx.beginPath();
            bCtx.moveTo(0, i);
            bCtx.lineTo(128, i);
            bCtx.stroke();
        }
        
        // Símbolos de flujo de electrones (triángulos)
        bCtx.fillStyle = 'rgba(255,255,255,0.7)';
        bCtx.beginPath();
        bCtx.moveTo(48, 80); bCtx.lineTo(64, 48); bCtx.lineTo(80, 80);
        bCtx.fill();

        const beltTex = new THREE.CanvasTexture(beltCanvas);
        beltTex.wrapS = THREE.RepeatWrapping;
        beltTex.wrapT = THREE.RepeatWrapping;
        beltTex.repeat.set(1, 4);

        const beltMat = new THREE.MeshStandardMaterial({
            map: beltTex,
            roughness: 0.7,
            metalness: 0.2
        });
        this.beltMesh = new THREE.Mesh(beltGeom, beltMat);
        this.beltMesh.position.set(genX, columnY, 0);
        this.group.add(this.beltMesh);

        // Rodillos de teflón y aluminio en extremos de la correa
        const rollerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
        const rollerBot = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.09, 16), rollerMat);
        rollerBot.rotation.z = Math.PI / 2;
        rollerBot.position.set(genX, tableH + baseH + 0.15 + 0.03, 0);
        const rollerTop = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.09, 16), rollerMat);
        rollerTop.rotation.z = Math.PI / 2;
        rollerTop.position.set(genX, tableH + baseH + 0.15 + columnH - 0.03, 0);
        this.group.add(rollerBot, rollerTop);

        // 5. CÚPULA DE ALTO VOLTAJE DE ALUMINIO ESPEJADO
        const domeRadius = 0.28;
        const domeY = tableH + baseH + 0.15 + columnH + domeRadius * 0.75;

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

        // 6. INTENSE VIOLET CORONA DISCHARGE
        const coronaGeom = new THREE.SphereGeometry(domeRadius * 1.15, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({
            color: 0x9333ea,
            transparent: true,
            opacity: 0.0, // Will be animated based on charge
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false
        });
        this.coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
        this.coronaMesh.position.set(genX, domeY, 0);
        this.group.add(this.coronaMesh);
        
        const innerCoronaGeom = new THREE.SphereGeometry(domeRadius * 1.05, 32, 32);
        const innerCoronaMat = new THREE.MeshBasicMaterial({
            color: 0xd8b4fe,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.innerCoronaMesh = new THREE.Mesh(innerCoronaGeom, innerCoronaMat);
        this.innerCoronaMesh.position.set(genX, domeY, 0);
        this.group.add(this.innerCoronaMesh);

        // 7. ELECTROSTATIC HAIRS (INTENSE & REALISTIC)
        const numHairs = 150;
        
        // Use a golden spiral distribution for even placement on the upper hemisphere
        const phiStep = Math.PI * (3 - Math.sqrt(5)); // golden angle
        
        for (let i = 0; i < numHairs; i++) {
            const hairMat = new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                emissive: 0x8b5cf6,
                emissiveIntensity: 0.0, // Glow when charged
                roughness: 0.3,
                metalness: 0.2
            });

            // y goes from 1 to 0 (top half of sphere)
            const y = 1 - (i / (numHairs - 1)); 
            const radiusAtY = Math.sqrt(1 - y * y);
            const theta = phiStep * i;

            const surfaceX = Math.cos(theta) * radiusAtY;
            const surfaceY = y;
            const surfaceZ = Math.sin(theta) * radiusAtY;
            
            const normal = new THREE.Vector3(surfaceX, surfaceY, surfaceZ);

            // Tapered hair strand (8 segments for better visual quality)
            const hairGeo = new THREE.CylinderGeometry(0.001, 0.003, 0.35, 8);
            hairGeo.translate(0, 0.175, 0); // Pivot at base
            const hair = new THREE.Mesh(hairGeo, hairMat);
            
            hair.position.set(
                genX + normal.x * domeRadius,
                domeY + normal.y * domeRadius,
                normal.z * domeRadius
            );

            // Charged orientation (pointing outwards along normal)
            const up = new THREE.Vector3(0, 1, 0);
            const qCharged = new THREE.Quaternion().setFromUnitVectors(up, normal);

            // Discharged orientation (hanging down with slight outward angle)
            const downAndOut = new THREE.Vector3(normal.x * 0.1, -1, normal.z * 0.1).normalize();
            const qDischarged = new THREE.Quaternion().setFromUnitVectors(up, downAndOut);

            hair.quaternion.copy(qDischarged); // Start uncharged

            this.group.add(hair);
            this.hairsData.push({ mesh: hair, qCharged, qDischarged });
        }

        // 8. ESFERA DE DESCARGA SECUNDARIA A TIERRA (X = +0.35)
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

        // 9. ARCOS DE CHISPAS PROCEDURALES (DESCARGA ENTRE ESFERAS)
        const sparkGeom = new THREE.BufferGeometry();
        this.sparkPosAttr = new THREE.BufferAttribute(this.sparkPositions, 3);
        sparkGeom.setAttribute('position', this.sparkPosAttr);
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
        if (this.isSleeping) return;
        // Animación de la correa girando
        if (this.currentMode !== 2) {
            this.beltOffset = (this.beltOffset + delta * 2.5) % 1.0;
            if ((this.beltMesh.material as THREE.MeshStandardMaterial).map) {
                (this.beltMesh.material as THREE.MeshStandardMaterial).map!.offset.y = this.beltOffset;
            }
        }

        // Interpolación de levitación de pelos y brillo de corona
        this.hairLift += (this.targetHairLift - this.hairLift) * Math.min(1.0, delta * 3.0);

        // Actualizar intensidad de la corona violeta
        (this.coronaMesh.material as THREE.MeshBasicMaterial).opacity = this.hairLift * 0.4 + (Math.random() * 0.1 * this.hairLift);
        (this.innerCoronaMesh.material as THREE.MeshBasicMaterial).opacity = this.hairLift * 0.7 + (Math.random() * 0.15 * this.hairLift);

        // Animar pelos electrizados
        this.hairsData.forEach((hairData, idx) => {
            // Interpolar desde estado caído a erizado usando slerp
            hairData.mesh.quaternion.copy(hairData.qDischarged).slerp(hairData.qCharged, this.hairLift);
            
            // Si hay carga, los pelos vibran y brillan
            if (this.hairLift > 0.01) {
                const flutter = Math.sin(time * 20.0 + idx * 3.14) * 0.08 * this.hairLift;
                hairData.mesh.rotateX(flutter);
                hairData.mesh.rotateZ(flutter * 0.7);
                
                (hairData.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = this.hairLift * 2.5;
            } else {
                (hairData.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
            }
        });

        // Simulación de chispas en modo de descarga
        if (this.currentMode === 1) {
            const genX = -0.25;
            const wandX = 0.35;
            const domeY = 1.30;

            const startX = genX + 0.28;
            const startY = domeY;
            const startZ = 0;
            const endX = wandX - 0.12;
            const endY = domeY;
            const endZ = 0;

            const isSparking = Math.random() > 0.35;
            this.sparkLine.visible = isSparking;
            this.sparkLight.intensity = isSparking ? (2.5 + Math.random() * 2.0) : 0;

            if (isSparking) {
                SoundSynthesizer.getInstance().playElectrostaticSpark();
                const segments = 8;
                for (let s = 0; s <= segments; s++) {
                    const alpha = s / segments;
                    const jx = (s > 0 && s < segments) ? (Math.random() - 0.5) * 0.06 : 0;
                    const jy = (s > 0 && s < segments) ? (Math.random() - 0.5) * 0.08 : 0;
                    const jz = (s > 0 && s < segments) ? (Math.random() - 0.5) * 0.08 : 0;
                    const idx = s * 3;
                    this.sparkPositions[idx] = startX + (endX - startX) * alpha + jx;
                    this.sparkPositions[idx + 1] = startY + (endY - startY) * alpha + jy;
                    this.sparkPositions[idx + 2] = startZ + (endZ - startZ) * alpha + jz;
                }
                this.sparkPosAttr.needsUpdate = true;
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
            this.targetHairLift = 1.0;
        } else if (info.id === 1) {
            this.targetHairLift = 0.85;
        } else {
            this.targetHairLift = 0.0; // Pelos caen por gravedad
        }

        return info;
    }

    public getCurrentModeInfo(): VanDeGraaffModeInfo {
        return this.modes[this.currentMode];
    }

    public setSleep(sleep: boolean): void {
        this.isSleeping = sleep;
        if (this.sparkLight) this.sparkLight.visible = !sleep && this.currentMode === 1 && Math.random() > 0.35;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }
}
