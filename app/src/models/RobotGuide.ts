import * as THREE from 'three';
import { SoundSynthesizer } from '../SoundSynthesizer';

export const RobotState = {
    IDLE: 'IDLE',
    GUIDING: 'GUIDING',
    ARRIVED: 'ARRIVED'
} as const;
export type RobotState = (typeof RobotState)[keyof typeof RobotState];

export type RobotEmotion = 'neutral' | 'happy' | 'guiding' | 'blink';

export class RobotGuide {
    private group: THREE.Group;
    private eyeMesh: THREE.Mesh;
    private eyeCanvas: HTMLCanvasElement;
    private eyeCtx: CanvasRenderingContext2D;
    private eyeTexture: THREE.CanvasTexture;

    private leftArmGroup: THREE.Group;
    private rightArmGroup: THREE.Group;
    private thrusterLight: THREE.PointLight;
    private antennaBeacon: THREE.Mesh;
    private speechBubbleSprite: THREE.Sprite;
    private speechCanvas: HTMLCanvasElement;
    private speechCtx: CanvasRenderingContext2D;
    private speechTexture: THREE.CanvasTexture;

    private interactableMeshes: THREE.Object3D[] = [];

    private tips: string[] = [];
    private currentTipIndex: number = 0;
    private studentName: string = 'Científico/a';
    private isMobile: boolean = false;

    // Estado y Navegación
    private state: RobotState = RobotState.IDLE;
    private targetRoomId: number | null = null;
    private targetRoomName: string = '';
    private targetDestination: THREE.Vector3 = new THREE.Vector3();
    private waypoints: THREE.Vector3[] = [];
    private currentWaypointIdx: number = 0;
    private flightSpeed: number = 4.2; // Metros por segundo
    private currentEmotion: RobotEmotion = 'neutral';
    private emotionTimer: number = 0;
    private arrivedTimer: number = 0;

    constructor() {
        this.group = new THREE.Group();
        this.group.position.set(1.5, 1.6, 2.0); // Cerca del spawn del jugador en el Atrio Central

        // 1. Chasis principal de Mel-Bot (Esfera aerodinámica blanco cerámico pulido estilo Chibi)
        const bodyGeo = new THREE.SphereGeometry(0.26, 32, 32);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.15,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        this.group.add(body);
        this.interactableMeshes.push(body);

        // Anillo ecuatorial cromo con ribete dorado
        const ringGeo = new THREE.TorusGeometry(0.27, 0.018, 16, 36);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9, roughness: 0.1 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        this.group.add(ring);

        // 2. Visor / Pantalla digital curva con ojos animados
        const visorGeo = new THREE.SphereGeometry(0.20, 24, 16, 0, Math.PI, 0, Math.PI / 2);
        visorGeo.rotateX(Math.PI / 2);
        const visorMat = new THREE.MeshStandardMaterial({
            color: 0x07111e,
            roughness: 0.2,
            metalness: 0.85
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 0.04, 0.09);
        visor.scale.set(1.02, 0.62, 1.02);
        this.group.add(visor);

        // Canvas dinámico para ojos LED de Mel-Bot
        this.eyeCanvas = document.createElement('canvas');
        this.eyeCanvas.width = 128;
        this.eyeCanvas.height = 64;
        this.eyeCtx = this.eyeCanvas.getContext('2d')!;
        this.eyeTexture = new THREE.CanvasTexture(this.eyeCanvas);
        this.renderEyes('neutral');

        const eyeGeo = new THREE.PlaneGeometry(0.24, 0.12);
        const eyeMat = new THREE.MeshBasicMaterial({
            map: this.eyeTexture,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        this.eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
        this.eyeMesh.position.set(0, 0.04, 0.265);
        this.group.add(this.eyeMesh);

        // 3. Brazos magnéticos flotantes y articulados (Chibi)
        const armMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25, metalness: 0.3 });
        const cuffMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 });
        const handMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.3, metalness: 0.7 });

        // Brazo Izquierdo
        this.leftArmGroup = new THREE.Group();
        this.leftArmGroup.position.set(-0.32, -0.02, 0);
        this.createArmGeometry(this.leftArmGroup, false, armMat, cuffMat, handMat);
        this.group.add(this.leftArmGroup);

        // Brazo Derecho (El que saluda o señala "¡SÍGUEME!")
        this.rightArmGroup = new THREE.Group();
        this.rightArmGroup.position.set(0.32, -0.02, 0);
        this.createArmGeometry(this.rightArmGroup, true, armMat, cuffMat, handMat);
        this.group.add(this.rightArmGroup);

        // 4. Antena superior con baliza parpadeante
        const antPoleGeo = new THREE.CylinderGeometry(0.006, 0.008, 0.16, 12);
        const antPoleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
        const antPole = new THREE.Mesh(antPoleGeo, antPoleMat);
        antPole.position.set(0, 0.33, 0);
        this.group.add(antPole);

        const beaconGeo = new THREE.SphereGeometry(0.028, 16, 16);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        this.antennaBeacon = new THREE.Mesh(beaconGeo, beaconMat);
        this.antennaBeacon.position.set(0, 0.42, 0);
        this.group.add(this.antennaBeacon);

        // 5. Propulsor de levitación inferior con luz azul
        const thrusterGeo = new THREE.CylinderGeometry(0.09, 0.05, 0.07, 24);
        const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
        const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
        thruster.position.set(0, -0.26, 0);
        this.group.add(thruster);

        this.thrusterLight = new THREE.PointLight(0x00f0ff, 2.0, 3.0, 2.0);
        this.thrusterLight.position.set(0, -0.34, 0);
        this.group.add(this.thrusterLight);

        // 6. Globo de Diálogo 3D Flotante (Sprite Billboard sobre su cabeza)
        this.speechCanvas = document.createElement('canvas');
        this.speechCanvas.width = 512;
        this.speechCanvas.height = 140;
        this.speechCtx = this.speechCanvas.getContext('2d')!;
        this.speechTexture = new THREE.CanvasTexture(this.speechCanvas);
        this.updateSpeechBubble('💬 ¡Hola Científico/a! 🤖', '#00f0ff');

        const spriteMat = new THREE.SpriteMaterial({
            map: this.speechTexture,
            transparent: true,
            depthTest: false
        });
        this.speechBubbleSprite = new THREE.Sprite(spriteMat);
        this.speechBubbleSprite.position.set(0, 0.65, 0);
        this.speechBubbleSprite.scale.set(1.5, 0.42, 1.0);
        this.group.add(this.speechBubbleSprite);

        this.refreshTips();
    }

    private createArmGeometry(
        parentGroup: THREE.Group, 
        isRight: boolean, 
        armMat: THREE.Material, 
        cuffMat: THREE.Material, 
        handMat: THREE.Material
    ) {
        // Manguito / hombrera flotante
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16), cuffMat);
        cuff.rotation.z = Math.PI / 2;
        parentGroup.add(cuff);

        // Antebrazo cilíndrico
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.14, 16), armMat);
        arm.position.set(0, -0.07, 0);
        parentGroup.add(arm);

        // Manopla / Mano robótica
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), handMat);
        hand.position.set(0, -0.15, 0);
        hand.scale.set(1.0, 0.7, 0.9);
        parentGroup.add(hand);

        // Pulgar pequeño
        const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), handMat);
        thumb.position.set(isRight ? -0.028 : 0.028, -0.14, 0.015);
        parentGroup.add(thumb);
    }

    public renderEyes(emotion: RobotEmotion) {
        this.currentEmotion = emotion;
        const ctx = this.eyeCtx;
        const w = this.eyeCanvas.width;
        const h = this.eyeCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;

        if (emotion === 'happy') {
            // Ojos en arco sonriente súper felices (^ ^)
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(38, 38, 16, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(90, 38, 16, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();

            // Estrellitas de emoción
            ctx.fillStyle = '#fde047';
            ctx.fillRect(20, 20, 4, 4);
            ctx.fillRect(104, 20, 4, 4);
        } else if (emotion === 'guiding') {
            // Ojos determinados de navegación con flechas brillantes
            ctx.beginPath();
            ctx.arc(38, 32, 15, 0, Math.PI * 2);
            ctx.arc(90, 32, 15, 0, Math.PI * 2);
            ctx.fill();

            // Pupilas de energía cian intenso
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(43, 30, 6, 0, Math.PI * 2);
            ctx.arc(95, 30, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (emotion === 'blink') {
            // Pestañeo
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#00f0ff';
            ctx.beginPath();
            ctx.moveTo(24, 32); ctx.lineTo(52, 32);
            ctx.moveTo(76, 32); ctx.lineTo(104, 32);
            ctx.stroke();
        } else {
            // 'neutral': Dos ojos circulares curiosos con doble brillo anime
            ctx.beginPath();
            ctx.arc(38, 32, 14, 0, Math.PI * 2);
            ctx.arc(90, 32, 14, 0, Math.PI * 2);
            ctx.fill();

            // Destellos blancos de ternura
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(34, 28, 5, 0, Math.PI * 2);
            ctx.arc(86, 28, 5, 0, Math.PI * 2);
            ctx.arc(42, 36, 2.5, 0, Math.PI * 2);
            ctx.arc(94, 36, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        this.eyeTexture.needsUpdate = true;
    }

    public updateSpeechBubble(text: string, accentColor: string = '#00f0ff') {
        const ctx = this.speechCtx;
        const w = this.speechCanvas.width;
        const h = this.speechCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Fondo del globo de diálogo estilo Glassmorphism
        ctx.fillStyle = 'rgba(6, 14, 26, 0.94)';
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 4;

        const r = 24;
        const padX = 14;
        const padY = 10;
        const boxW = w - padX * 2;
        const boxH = h - padY * 2 - 18;

        ctx.beginPath();
        ctx.roundRect(padX, padY, boxW, boxH, r);
        ctx.fill();
        ctx.stroke();

        // Pico del globo apuntando hacia la cabeza de Mel-Bot
        ctx.beginPath();
        ctx.moveTo(w / 2 - 14, padY + boxH);
        ctx.lineTo(w / 2, h - 8);
        ctx.lineTo(w / 2 + 14, padY + boxH);
        ctx.closePath();
        ctx.fillStyle = 'rgba(6, 14, 26, 0.94)';
        ctx.fill();
        ctx.stroke();

        // Texto en negrita, legible y amigable
        ctx.font = 'bold 30px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w / 2, padY + boxH / 2);

        this.speechTexture.needsUpdate = true;
    }

    public startGuiding(roomId: number, roomName: string, destination: THREE.Vector3) {
        SoundSynthesizer.getInstance().playSuccess();
        this.state = RobotState.GUIDING;
        this.targetRoomId = roomId;
        this.targetRoomName = roomName;
        this.targetDestination.copy(destination);
        this.targetDestination.y = 1.8;

        this.renderEyes('guiding');
        this.updateSpeechBubble(`💬 ¡SÍGUEME! 🚀 ${roomName}`, '#fde047');

        // Construir waypoints de vuelo cinemático:
        // Si Mel-Bot está lejos del atrio central, pasa por el centro (0, 2.0, 0) y luego va al portal
        this.waypoints = [];
        const currentPos = this.group.position;
        const distToCenter = Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z);
        
        if (distToCenter > 4.0) {
            // Pasar por un punto intermedio elevado en el atrio
            this.waypoints.push(new THREE.Vector3(currentPos.x * 0.4, 2.2, currentPos.z * 0.4));
        }
        this.waypoints.push(new THREE.Vector3(this.targetDestination.x, 1.8, this.targetDestination.z));
        this.currentWaypointIdx = 0;
    }

    public stopGuiding() {
        this.state = RobotState.IDLE;
        this.renderEyes('neutral');
        this.updateSpeechBubble('💬 ¡Hola Científico/a! 🤖', '#00f0ff');
    }

    public isGuiding(): boolean {
        return this.state === RobotState.GUIDING;
    }

    public getTargetRoomId(): number | null {
        return this.targetRoomId;
    }

    public talk(): string {
        SoundSynthesizer.getInstance().playRobotChirp();
        this.renderEyes('happy');
        this.emotionTimer = 3.0; // Volver a neutral en 3 segundos

        const tip = this.tips[this.currentTipIndex];
        this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length;
        return tip;
    }

    public getCurrentTip(): string {
        return this.tips[this.currentTipIndex];
    }

    public setIsMobile(isMobile: boolean): void {
        this.isMobile = isMobile;
        this.refreshTips();
    }

    public setStudentName(name: string): void {
        this.studentName = name;
        this.refreshTips();
    }

    private refreshTips(): void {
        if (this.isMobile) {
            this.tips = [
                `🤖 Mel-Bot: ¡Hola ${this.studentName}! Tocá el botón [⚡ INTERACTUAR] para manipular los experimentos y [🚀 Pedir Guía] si querés que te lleve a una sala.`,
                `🤖 Mel-Bot: ¡Mirá el multímetro de las papas! Marca 1.94V reales de las 2 papas en serie sumando energía.`,
                `🤖 Mel-Bot: En la Bobina de Tesla, la energía viaja invisible por el aire y enciende el tubo fluorescente.`,
                `🤖 Mel-Bot: El aerogenerador hace girar imanes de fuerza para iluminar toda la maqueta de la ciudad.`,
                `🤖 Mel-Bot: ¡Buscá los 7 Orbes Cuánticos flotando en el museo para ganar +25 XP en cada uno!`
            ];
        } else {
            this.tips = [
                `🤖 Mel-Bot: ¡Hola ${this.studentName}! Presioná [E] para probar los experimentos y [R] para que te guíe volando a la siguiente sala.`,
                `🤖 Mel-Bot: ¡Mirá el multímetro de las papas! Marca 1.94V reales de las 2 papas en serie sumando energía.`,
                `🤖 Mel-Bot: En la Bobina de Tesla, la energía viaja invisible por el aire y enciende el tubo fluorescente sin cables.`,
                `🤖 Mel-Bot: El aerogenerador hace girar imanes de fuerza para iluminar toda la maqueta de la ciudad.`,
                `🤖 Mel-Bot: ¡Buscá los 7 Orbes Cuánticos flotando en el museo para ganar +25 XP en cada uno!`
            ];
        }
    }

    public update(time: number, playerPos: THREE.Vector3, delta: number = 0.016): void {
        const hoverY = Math.sin(time * 2.8) * 0.09;

        // Gestión de emociones temporales (por ejemplo volver de 'happy' a 'neutral')
        if (this.emotionTimer > 0) {
            this.emotionTimer -= delta;
            if (this.emotionTimer <= 0 && this.state === RobotState.IDLE) {
                this.renderEyes('neutral');
            }
        }

        // Pestañeo natural cada 4.5 segundos
        if (this.state === RobotState.IDLE && Math.sin(time * 1.4) > 0.98 && this.currentEmotion === 'neutral') {
            this.renderEyes('blink');
        } else if (this.currentEmotion === 'blink') {
            this.renderEyes('neutral');
        }

        // =====================================================================
        // MÁQUINA DE ESTADOS: GUIDING (VUELO DE GUÍA A LA SALA)
        // =====================================================================
        if (this.state === RobotState.GUIDING) {
            if (this.waypoints.length > 0 && this.currentWaypointIdx < this.waypoints.length) {
                const targetWp = this.waypoints[this.currentWaypointIdx];
                const curPos = this.group.position;
                
                const dirX = targetWp.x - curPos.x;
                const dirY = (targetWp.y + hoverY) - curPos.y;
                const dirZ = targetWp.z - curPos.z;
                const distToWp = Math.sqrt(dirX * dirX + dirZ * dirZ);

                // Rotación hacia donde vuela
                const targetAngle = Math.atan2(dirX, dirZ);
                this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, 0.12);

                // Inclinación bancada cinemática
                this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, -Math.sin(dirX * 0.1) * 0.25, 0.1);

                // Brazo derecho apuntando al frente
                this.rightArmGroup.rotation.x = -Math.PI / 2.2;
                this.rightArmGroup.rotation.z = -0.15;
                this.leftArmGroup.rotation.x = Math.sin(time * 4) * 0.2;

                // Movimiento hacia el waypoint
                const step = this.flightSpeed * delta;
                if (distToWp > step) {
                    curPos.x += (dirX / distToWp) * step;
                    curPos.z += (dirZ / distToWp) * step;
                    curPos.y += dirY * 0.08;
                } else {
                    curPos.x = targetWp.x;
                    curPos.z = targetWp.z;
                    this.currentWaypointIdx++;
                }

                // Luz del propulsor súper brillante durante el vuelo
                this.thrusterLight.intensity = 2.8 + Math.sin(time * 12.0) * 0.8;
                this.thrusterLight.color.setHex(0x00f0ff);
            } else {
                // Llegó a la puerta de la sala
                this.state = RobotState.ARRIVED;
                this.arrivedTimer = 18.0; // Se queda indicando la sala durante 18 segundos
                this.renderEyes('happy');
                this.updateSpeechBubble(`💬 ¡Llegamos! 🔬 ${this.targetRoomName}`, '#4ade80');
                SoundSynthesizer.getInstance().playSuccess();
            }
            return;
        }

        // =====================================================================
        // MÁQUINA DE ESTADOS: ARRIVED (ESPERANDO EN LA ENTRADA DE LA SALA)
        // =====================================================================
        if (this.state === RobotState.ARRIVED) {
            this.arrivedTimer -= delta;
            const targetY = 1.75 + hoverY;
            this.group.position.y += (targetY - this.group.position.y) * 0.08;

            // Mirar hacia el jugador que viene caminando
            this.group.lookAt(playerPos.x, this.group.position.y, playerPos.z);
            this.group.rotation.z = 0;

            // Brazo derecho saludando alegremente hacia la sala
            this.rightArmGroup.rotation.x = -0.3 + Math.sin(time * 6.0) * 0.35;
            this.rightArmGroup.rotation.z = -0.4 + Math.cos(time * 6.0) * 0.2;
            this.leftArmGroup.rotation.x = 0;

            // Distancia del jugador a la entrada de la sala
            const distToPlayer = this.group.position.distanceTo(playerPos);
            if (distToPlayer < 3.2 || this.arrivedTimer <= 0) {
                // El jugador ya entró o pasó el tiempo
                this.state = RobotState.IDLE;
                this.renderEyes('neutral');
                this.updateSpeechBubble('💬 ¡Hola Científico/a! 🤖', '#00f0ff');
            }
            return;
        }

        // =====================================================================
        // MÁQUINA DE ESTADOS: IDLE (ACOMPAÑANTE EN ESPERA O CERCA DEL JUGADOR)
        // =====================================================================
        const targetY = 1.65 + hoverY;
        this.group.position.y += (targetY - this.group.position.y) * 0.08;

        const currentPos = this.group.position;
        const dx = currentPos.x - playerPos.x;
        const dz = currentPos.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Si el jugador se aleja a más de 5.5m, Mel-Bot avanza flotando para acompañarlo
        if (dist > 5.5) {
            const dirX = (playerPos.x - currentPos.x) / dist;
            const dirZ = (playerPos.z - currentPos.z) / dist;

            const targetX = playerPos.x - dirX * 2.8;
            const targetZ = playerPos.z - dirZ * 2.8;

            currentPos.x += (targetX - currentPos.x) * 0.035;
            currentPos.z += (targetZ - currentPos.z) * 0.035;
        }

        // Mirar siempre al jugador de frente
        this.group.lookAt(playerPos.x, currentPos.y, playerPos.z);
        this.group.rotation.z = 0;

        // Si el jugador está cerca (< 3.5m), Mel-Bot saluda amistosamente con su manito derecha
        if (dist < 3.5) {
            this.rightArmGroup.rotation.x = -0.5 + Math.sin(time * 7.0) * 0.4;
            this.rightArmGroup.rotation.z = -0.3 + Math.cos(time * 7.0) * 0.25;
            this.leftArmGroup.rotation.x = Math.sin(time * 2.0) * 0.1;
        } else {
            // Brazos relajados flotando
            this.rightArmGroup.rotation.x = Math.sin(time * 2.0) * 0.08;
            this.rightArmGroup.rotation.z = 0;
            this.leftArmGroup.rotation.x = Math.sin(time * 2.0 + 1.0) * 0.08;
            this.leftArmGroup.rotation.z = 0;
        }

        // Parpadeo sutil de la baliza superior
        const beaconPulse = (Math.sin(time * 5.0) + 1.0) * 0.5;
        this.thrusterLight.intensity = 1.5 + beaconPulse * 0.7;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }
}
