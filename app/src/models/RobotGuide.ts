import * as THREE from 'three';
import { SoundSynthesizer } from '../SoundSynthesizer';

export class RobotGuide {
    private group: THREE.Group;
    private eyeMesh: THREE.Mesh;
    private thrusterLight: THREE.PointLight;
    private antennaBeacon: THREE.Mesh;
    private interactableMeshes: THREE.Object3D[] = [];

    private tips: string[] = [
        "🤖 Mel-Bot: ¡Hola científico/a! Con la tecla [E] podés encender o probar los experimentos sin apuro ni exámenes sorpresas.",
        "🤖 Mel-Bot: Cuando sientas que descubriste el misterio, pulsá la tecla [R] para responder el desafío pedagógico y ganar +100 XP.",
        "🤖 Mel-Bot: En el cielo tenés un domo cósmico con más de 4000 estrellas y nebulosas. ¡El techo del museo está abierto al universo!",
        "🤖 Mel-Bot: Hay 3 Orbes de Energía Cuántica escondidos en rincones secretos del museo... ¿Podrás encontrarlos todos?",
        "🤖 Mel-Bot: Pulsá [J] en cualquier momento para abrir tu Diario del Científico con las fórmulas y principios físicos reales.",
        "🤖 Mel-Bot: Las 4 papas en serie suman ~1.96V reales, superando el umbral de conducción del diodo LED."
    ];
    private currentTipIndex: number = 0;
    private studentName: string = 'Científico/a';

    public setStudentName(name: string): void {
        this.studentName = name;
        this.tips = [
            `🤖 Mel-Bot: ¡Hola ${this.studentName}! Soy Mel-Bot, tu asistente de ciencias. Con [E] podés probar los experimentos libremente.`,
            `🤖 Mel-Bot: ¡Mirá a la derecha de las papas, ${this.studentName}! El multímetro digital marca 1.96V reales de las 4 papas en serie.`,
            `🤖 Mel-Bot: ¡En el prisma, ${this.studentName}, el cristal divide la luz en arcoíris! Con [E] podés cambiar entre luz blanca y láseres.`,
            `🤖 Mel-Bot: En la Cuna de Newton, ${this.studentName}, la energía viaja a través del acero sin que las bolas del medio se muevan.`,
            `🤖 Mel-Bot: ¡Pulsá [R] para responder el desafío pedagógico y ganar +100 XP, ${this.studentName}!`
        ];
    }

    constructor() {
        this.group = new THREE.Group();
        this.group.position.set(1.5, 1.6, 6.0); // Cerca del spawn del jugador

        // 1. Chasis principal de Mel-Bot (Esfera aerodinámica blanco cerámico pulido)
        const bodyGeo = new THREE.SphereGeometry(0.24, 32, 32);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.15,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        this.group.add(body);
        this.interactableMeshes.push(body);

        // Anillo ecuatorial cromo
        const ringGeo = new THREE.TorusGeometry(0.25, 0.018, 16, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9, roughness: 0.1 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        this.group.add(ring);

        // 2. Visor / Pantalla digital curva con ojos
        const visorGeo = new THREE.SphereGeometry(0.18, 24, 16, 0, Math.PI, 0, Math.PI / 2);
        visorGeo.rotateX(Math.PI / 2);
        const visorMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.2,
            metalness: 0.8
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 0.04, 0.08);
        visor.scale.set(1, 0.6, 1);
        this.group.add(visor);

        // Ojos digitales de neón cian
        const eyeCanvas = document.createElement('canvas');
        eyeCanvas.width = 128;
        eyeCanvas.height = 64;
        const eyeCtx = eyeCanvas.getContext('2d')!;
        eyeCtx.fillStyle = '#00f0ff';
        // Dos ojos redondos amigables
        eyeCtx.beginPath();
        eyeCtx.arc(38, 32, 14, 0, Math.PI * 2);
        eyeCtx.arc(90, 32, 14, 0, Math.PI * 2);
        eyeCtx.fill();

        const eyeTex = new THREE.CanvasTexture(eyeCanvas);
        const eyeGeo = new THREE.PlaneGeometry(0.22, 0.11);
        const eyeMat = new THREE.MeshBasicMaterial({
            map: eyeTex,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        this.eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
        this.eyeMesh.position.set(0, 0.04, 0.245);
        this.group.add(this.eyeMesh);

        // 3. Antena superior con baliza parpadeante
        const antPoleGeo = new THREE.CylinderGeometry(0.006, 0.008, 0.15, 12);
        const antPoleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
        const antPole = new THREE.Mesh(antPoleGeo, antPoleMat);
        antPole.position.set(0, 0.31, 0);
        this.group.add(antPole);

        const beaconGeo = new THREE.SphereGeometry(0.025, 16, 16);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        this.antennaBeacon = new THREE.Mesh(beaconGeo, beaconMat);
        this.antennaBeacon.position.set(0, 0.38, 0);
        this.group.add(this.antennaBeacon);

        // 4. Propulsor de levitación inferior con luz azul
        const thrusterGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.06, 24);
        const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
        const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
        thruster.position.set(0, -0.24, 0);
        this.group.add(thruster);

        this.thrusterLight = new THREE.PointLight(0x00f0ff, 1.8, 2.5, 2.0);
        this.thrusterLight.position.set(0, -0.32, 0);
        this.group.add(this.thrusterLight);
    }

    public talk(): string {
        SoundSynthesizer.getInstance().playRobotChirp();
        const tip = this.tips[this.currentTipIndex];
        this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length;
        return tip;
    }

    public getCurrentTip(): string {
        return this.tips[this.currentTipIndex];
    }

    public update(time: number, playerPos: THREE.Vector3): void {
        // Levitación armónica suave
        const hoverY = Math.sin(time * 2.5) * 0.08;
        const targetY = 1.65 + hoverY;
        this.group.position.y += (targetY - this.group.position.y) * 0.08;

        // Calcular distancia horizontal al jugador
        const currentPos = this.group.position;
        const dx = currentPos.x - playerPos.x;
        const dz = currentPos.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Si el jugador se aleja a más de 4.2m, Mel-Bot avanza suavemente para no perderlo
        if (dist > 4.2) {
            // Posicionarse a 2.5m de distancia respetuosa
            const dirX = (playerPos.x - currentPos.x) / dist;
            const dirZ = (playerPos.z - currentPos.z) / dist;

            const targetX = playerPos.x - dirX * 2.4;
            const targetZ = playerPos.z - dirZ * 2.4;

            currentPos.x += (targetX - currentPos.x) * 0.04;
            currentPos.z += (targetZ - currentPos.z) * 0.04;
        }
        // SI EL JUGADOR SE ACERCA (dist <= 4.2m): Mel-Bot SE QUEDA COMPLETAMENTE QUIETO
        // Nunca retrocede ni huye, permitiendo al jugador examinarlo y hablar con él cara a cara.

        // Mirar siempre al jugador de frente
        this.group.lookAt(playerPos.x, currentPos.y, playerPos.z);

        // Parpadeo sutil de la baliza superior
        const beaconPulse = (Math.sin(time * 6.0) + 1.0) * 0.5;
        this.thrusterLight.intensity = 1.4 + beaconPulse * 0.8;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }
}
