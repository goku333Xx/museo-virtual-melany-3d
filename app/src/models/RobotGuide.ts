import * as THREE from 'three';
import { SoundSynthesizer } from '../SoundSynthesizer';

export const RobotState = {
    IDLE: 'IDLE',
    GUIDING: 'GUIDING',
    ARRIVED: 'ARRIVED'
} as const;
export type RobotState = (typeof RobotState)[keyof typeof RobotState];

export type RobotEmotion = 'neutral' | 'happy' | 'wink' | 'guiding' | 'celebrate' | 'blink' | 'pointing';

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
    private flightSpeed: number = 4.8; // Metros por segundo

    // Emociones y parpadeo optimizado
    private currentEmotion: RobotEmotion = 'neutral';
    private emotionTimer: number = 0;
    private arrivedTimer: number = 0;
    private blinkCooldown: number = 3.5;
    private isBlinking: boolean = false;
    private blinkDuration: number = 0.12;

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

        // Anillo ecuatorial cromo con ribete de neón cian
        const ringGeo = new THREE.TorusGeometry(0.27, 0.016, 16, 36);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9, roughness: 0.1 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        this.group.add(ring);

        // 2. Visor / Pantalla digital curva con ojos animados
        const visorGeo = new THREE.SphereGeometry(0.21, 24, 16, 0, Math.PI, 0, Math.PI / 2);
        visorGeo.rotateX(Math.PI / 2);
        const visorMat = new THREE.MeshStandardMaterial({
            color: 0x07111e,
            roughness: 0.2,
            metalness: 0.85
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 0.04, 0.09);
        visor.scale.set(1.02, 0.65, 1.02);
        this.group.add(visor);

        // Canvas dinámico para ojos LED de Mel-Bot (256x128 para alta definición)
        this.eyeCanvas = document.createElement('canvas');
        this.eyeCanvas.width = 256;
        this.eyeCanvas.height = 128;
        this.eyeCtx = this.eyeCanvas.getContext('2d')!;
        this.eyeTexture = new THREE.CanvasTexture(this.eyeCanvas);
        this.renderEyes('neutral');

        const eyeGeo = new THREE.PlaneGeometry(0.26, 0.13);
        const eyeMat = new THREE.MeshBasicMaterial({
            map: this.eyeTexture,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        this.eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
        this.eyeMesh.position.set(0, 0.04, 0.270);
        this.group.add(this.eyeMesh);

        // 3. Antena con baliza pulsante en la cabeza
        const antStem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.12, 12),
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
        );
        antStem.position.set(0, 0.31, 0);
        this.group.add(antStem);

        const beaconGeo = new THREE.SphereGeometry(0.032, 16, 16);
        const beaconMat = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00f0ff,
            emissiveIntensity: 1.0,
            roughness: 0.1
        });
        this.antennaBeacon = new THREE.Mesh(beaconGeo, beaconMat);
        this.antennaBeacon.position.set(0, 0.38, 0);
        this.group.add(this.antennaBeacon);

        // 4. Brazos flotantes magnéticos articulados (Saludan y Señalan)
        const armGeo = new THREE.CylinderGeometry(0.032, 0.024, 0.14, 16);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.3 });
        const handGeo = new THREE.SphereGeometry(0.032, 16, 16);
        const handMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.1, metalness: 0.8 });

        // Brazo izquierdo
        this.leftArmGroup = new THREE.Group();
        this.leftArmGroup.position.set(-0.32, 0.02, 0);
        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.y = -0.06;
        this.leftArmGroup.add(leftArm);
        const leftHand = new THREE.Mesh(handGeo, handMat);
        leftHand.position.y = -0.13;
        this.leftArmGroup.add(leftHand);
        this.group.add(this.leftArmGroup);

        // Brazo derecho
        this.rightArmGroup = new THREE.Group();
        this.rightArmGroup.position.set(0.32, 0.02, 0);
        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.y = -0.06;
        this.rightArmGroup.add(rightArm);
        const rightHand = new THREE.Mesh(handGeo, handMat);
        rightHand.position.y = -0.13;
        this.rightArmGroup.add(rightHand);
        this.group.add(this.rightArmGroup);

        // 5. Tobera de propulsión inferior iónica con resplandor
        const thrusterGeo = new THREE.ConeGeometry(0.10, 0.09, 20);
        const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
        const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
        thruster.position.y = -0.27;
        this.group.add(thruster);

        const flameGeo = new THREE.ConeGeometry(0.06, 0.16, 16);
        const flameMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.85
        });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.rotation.x = Math.PI;
        flame.position.y = -0.36;
        this.group.add(flame);

        this.thrusterLight = new THREE.PointLight(0x00f0ff, 1.8, 2.5, 2.0);
        this.thrusterLight.position.set(0, -0.38, 0);
        this.group.add(this.thrusterLight);

        // 6. Bocadillo de diálogo 3D flotante estilo Comic / Chibi (Sprite Billboard)
        this.speechCanvas = document.createElement('canvas');
        this.speechCanvas.width = 512;
        this.speechCanvas.height = 140;
        this.speechCtx = this.speechCanvas.getContext('2d')!;
        this.speechTexture = new THREE.CanvasTexture(this.speechCanvas);

        const spriteMat = new THREE.SpriteMaterial({
            map: this.speechTexture,
            transparent: true,
            depthTest: false
        });
        this.speechBubbleSprite = new THREE.Sprite(spriteMat);
        this.speechBubbleSprite.position.set(0, 0.68, 0);
        this.speechBubbleSprite.scale.set(1.4, 0.38, 1.0);
        this.group.add(this.speechBubbleSprite);

        this.updateSpeechBubble('💬 ¡Hola! Tócame para ayudarte', '#00f0ff');
        this.refreshTips();
    }

    public renderEyes(emotion: RobotEmotion) {
        this.currentEmotion = emotion;
        const ctx = this.eyeCtx;
        const w = this.eyeCanvas.width;
        const h = this.eyeCanvas.height;

        ctx.clearRect(0, 0, w, h);

        const eyeLX = 76;
        const eyeRX = 180;
        const eyeY = 64;

        // Mejillas sonrosadas Kawaii (Blush) que brillan suavemente
        const drawBlush = () => {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 110, 150, 0.65)';
            ctx.beginPath();
            ctx.ellipse(eyeLX - 8, eyeY + 34, 18, 10, 0, 0, Math.PI * 2);
            ctx.ellipse(eyeRX + 8, eyeY + 34, 18, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        if (emotion === 'happy') {
            // Ojos felices ultra adorables: Arcos sonrientes gruesos `^ ^` con pestañitas y blush
            drawBlush();
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';

            // Ojo izquierdo
            ctx.beginPath();
            ctx.arc(eyeLX, eyeY + 12, 28, Math.PI * 1.15, Math.PI * 1.85, false);
            ctx.stroke();

            // Ojo derecho
            ctx.beginPath();
            ctx.arc(eyeRX, eyeY + 12, 28, Math.PI * 1.15, Math.PI * 1.85, false);
            ctx.stroke();

            // Brillos blancos en las puntas
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeLX, eyeY - 14, 5, 0, Math.PI * 2);
            ctx.arc(eyeRX, eyeY - 14, 5, 0, Math.PI * 2);
            ctx.fill();

        } else if (emotion === 'wink') {
            // Guiño pícaro: Ojo izquierdo abierto anime + Ojo derecho guiñado `^`
            drawBlush();

            // Ojo izquierdo abierto con brillo
            const gradL = ctx.createLinearGradient(eyeLX, eyeY - 26, eyeLX, eyeY + 26);
            gradL.addColorStop(0, '#00f0ff');
            gradL.addColorStop(1, '#0284c7');
            ctx.fillStyle = gradL;
            ctx.beginPath();
            ctx.ellipse(eyeLX, eyeY, 24, 30, 0, 0, Math.PI * 2);
            ctx.fill();

            // Destello blanco
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeLX - 8, eyeY - 10, 9, 0, Math.PI * 2);
            ctx.arc(eyeLX + 9, eyeY + 10, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Ojo derecho guiñado
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(eyeRX, eyeY + 10, 26, Math.PI * 1.15, Math.PI * 1.85, false);
            ctx.stroke();

        } else if (emotion === 'celebrate') {
            // Ojos de estrella `★ ★` dorados para cuando completas una misión
            drawBlush();
            const drawStar = (cx: number, cy: number, r: number) => {
                ctx.save();
                ctx.fillStyle = '#fde047';
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r + cx, -Math.sin((18 + i * 72) * Math.PI / 180) * r + cy);
                    ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r / 2) + cx, -Math.sin((54 + i * 72) * Math.PI / 180) * (r / 2) + cy);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            };
            drawStar(eyeLX, eyeY, 30);
            drawStar(eyeRX, eyeY, 30);

        } else if (emotion === 'guiding') {
            // Ojos determinados de guía con flecha de dirección hacia adelante
            drawBlush();
            const grad = ctx.createLinearGradient(eyeLX, eyeY - 26, eyeLX, eyeY + 26);
            grad.addColorStop(0, '#fde047');
            grad.addColorStop(1, '#eab308');
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.ellipse(eyeLX, eyeY, 25, 28, 0, 0, Math.PI * 2);
            ctx.ellipse(eyeRX, eyeY, 25, 28, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupilas con destellos blancos
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeLX + 6, eyeY - 6, 8, 0, Math.PI * 2);
            ctx.arc(eyeRX + 6, eyeY - 6, 8, 0, Math.PI * 2);
            ctx.fill();

        } else if (emotion === 'blink') {
            // Pestañeo: Líneas horizontales finas con pestañitas
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(eyeLX - 22, eyeY);
            ctx.lineTo(eyeLX + 22, eyeY);
            ctx.moveTo(eyeRX - 22, eyeY);
            ctx.lineTo(eyeRX + 22, eyeY);
            ctx.stroke();

        } else if (emotion === 'pointing') {
            // Ojos mirando de lado con expresión decidida
            drawBlush();
            const grad = ctx.createLinearGradient(eyeLX, eyeY - 26, eyeLX, eyeY + 26);
            grad.addColorStop(0, '#00f0ff');
            grad.addColorStop(1, '#0284c7');
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.ellipse(eyeLX, eyeY, 24, 28, 0, 0, Math.PI * 2);
            ctx.ellipse(eyeRX, eyeY, 24, 28, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupilas desplazadas a la derecha
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeLX + 12, eyeY - 4, 8, 0, Math.PI * 2);
            ctx.arc(eyeRX + 12, eyeY - 4, 8, 0, Math.PI * 2);
            ctx.fill();

            // Cejas en ángulo
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(eyeLX - 20, eyeY - 35);
            ctx.lineTo(eyeLX + 20, eyeY - 25);
            ctx.moveTo(eyeRX - 20, eyeY - 35);
            ctx.lineTo(eyeRX + 20, eyeY - 25);
            ctx.stroke();

        } else {
            // 'neutral': Ojos anime kawaii grandes con degradado azul cian, brillo doble y blush
            drawBlush();

            const eyeGrad = ctx.createLinearGradient(eyeLX, eyeY - 30, eyeLX, eyeY + 30);
            eyeGrad.addColorStop(0, '#00f0ff');
            eyeGrad.addColorStop(0.7, '#0284c7');
            eyeGrad.addColorStop(1, '#075985');
            ctx.fillStyle = eyeGrad;

            // Forma de ojo ligeramente ovalada vertical
            ctx.beginPath();
            ctx.ellipse(eyeLX, eyeY, 24, 30, 0, 0, Math.PI * 2);
            ctx.ellipse(eyeRX, eyeY, 24, 30, 0, 0, Math.PI * 2);
            ctx.fill();

            // Borde superior más oscuro tipo párpado sutil
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(eyeLX, eyeY - 6, 24, Math.PI * 1.1, Math.PI * 1.9, false);
            ctx.arc(eyeRX, eyeY - 6, 24, Math.PI * 1.1, Math.PI * 1.9, false);
            ctx.stroke();

            // Destello principal brillante (Highlight grande arriba a la izquierda)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeLX - 8, eyeY - 10, 8.5, 0, Math.PI * 2);
            ctx.arc(eyeRX - 8, eyeY - 10, 8.5, 0, Math.PI * 2);
            ctx.fill();

            // Destello secundario pequeño (Highlight abajo a la derecha)
            ctx.beginPath();
            ctx.arc(eyeLX + 8, eyeY + 11, 4.5, 0, Math.PI * 2);
            ctx.arc(eyeRX + 8, eyeY + 11, 4.5, 0, Math.PI * 2);
            ctx.fill();
        }

        this.eyeTexture.needsUpdate = true;
    }

    public updateSpeechBubble(text: string, accentColor: string = '#00f0ff') {
        const ctx = this.speechCtx;
        const w = this.speechCanvas.width;
        const h = this.speechCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Fondo del globo de diálogo
        ctx.fillStyle = 'rgba(8, 16, 32, 0.95)';
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 5;

        const r = 24;
        const padX = 16;
        const padY = 12;
        const boxW = w - padX * 2;
        const boxH = h - padY * 2 - 20;

        ctx.beginPath();
        ctx.roundRect(padX, padY, boxW, boxH, r);
        ctx.fill();
        ctx.stroke();

        // Pico del globo apuntando hacia Mel-Bot
        ctx.beginPath();
        ctx.moveTo(w / 2 - 14, padY + boxH);
        ctx.lineTo(w / 2, h - 8);
        ctx.lineTo(w / 2 + 14, padY + boxH);
        ctx.closePath();
        ctx.fillStyle = 'rgba(8, 16, 32, 0.95)';
        ctx.fill();
        ctx.stroke();

        // Texto en negrita y legible, reducido a 24px para mejor wrapping
        ctx.font = 'bold 24px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxWidth = 460;
        const lineHeight = 28;
        const paragraphs = text.split(/<br\s*\/?>/i);
        const lines: string[] = [];

        for (const paragraph of paragraphs) {
            const words = paragraph.split(' ');
            let currentLine = '';

            for (let i = 0; i < words.length; i++) {
                const testLine = currentLine + words[i] + ' ';
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && i > 0) {
                    lines.push(currentLine.trim());
                    currentLine = words[i] + ' ';
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine.trim());
        }

        const totalTextHeight = lines.length * lineHeight;
        let startY = padY + (boxH / 2) - (totalTextHeight / 2) + (lineHeight / 2);

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], w / 2, startY + (i * lineHeight));
        }

        this.speechTexture.needsUpdate = true;
    }

    public showDoorBlockedMessage(currentRoomName: string, requiredRoomName: string): void {
        this.updateSpeechBubble(`💬 🔒 ¡${requiredRoomName} está bloqueada! Primero completá ${currentRoomName} 🏆`, '#f87171');
        this.renderEyes('happy');
    }

    public startGuiding(roomId: number, roomName: string, destination: THREE.Vector3, directFlight: boolean = false) {
        SoundSynthesizer.getInstance().playSuccess();
        this.state = RobotState.GUIDING;
        this.targetRoomId = roomId;
        this.targetRoomName = roomName;
        this.targetDestination.copy(destination);
        this.targetDestination.y = 1.75;

        this.renderEyes('guiding');
        this.updateSpeechBubble(`💬 ¡Seguime! 🚀 Vamos a ${roomName}`, '#fde047');

        // Construir waypoints de vuelo cinemático inteligente:
        this.waypoints = [];
        const currentPos = this.group.position;
        const distDirect = currentPos.distanceTo(destination);

        // Si ya está cerca de la sala o es vuelo directo, va directo al pedestal sin pasar por el atrio central
        if (directFlight || distDirect < 10.0) {
            this.waypoints.push(new THREE.Vector3(destination.x, 1.75, destination.z));
        } else {
            // Pasa por un punto intermedio elevado en el atrio antes de entrar por la puerta
            this.waypoints.push(new THREE.Vector3(currentPos.x * 0.4, 2.2, currentPos.z * 0.4));
            this.waypoints.push(new THREE.Vector3(destination.x, 1.75, destination.z));
        }
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
                `🤖 Mel-Bot: ¡Hola ${this.studentName}! Tocá el botón [⚡ INTERACTUAR] para probar los experimentos y [🚀 Pedir Guía] si querés que te lleve a una sala.`,
                `🤖 Mel-Bot: ¡Mirá el multímetro de las papas! Marca 1.94V reales de las 2 papas en serie sumando energía.`,
                `🤖 Mel-Bot: En la Bobina de Tesla, la energía viaja invisible por el aire y enciende el tubo fluorescente.`,
                `🤖 Mel-Bot: En la maqueta eólica, el viento hace girar imanes de fuerza para iluminar toda la ciudad.`,
                `🤖 Mel-Bot: ¡Buscá los 7 Orbes Cuánticos flotando en el museo para ganar +25 XP en cada uno!`
            ];
        } else {
            this.tips = [
                `🤖 Mel-Bot: ¡Hola ${this.studentName}! Presioná [E] para probar los experimentos y tocame para que te guíe volando a la siguiente sala.`,
                `🤖 Mel-Bot: ¡Mirá el multímetro de las papas! Marca 1.94V reales de las 2 papas en serie sumando energía.`,
                `🤖 Mel-Bot: En la Bobina de Tesla, la energía viaja invisible por el aire y enciende el tubo fluorescente sin cables.`,
                `🤖 Mel-Bot: En la maqueta eólica, el viento hace girar imanes de fuerza para iluminar toda la ciudad.`,
                `🤖 Mel-Bot: ¡Buscá los 7 Orbes Cuánticos flotando en el museo para ganar +25 XP en cada uno!`
            ];
        }
    }

    public update(time: number, playerPos: THREE.Vector3, delta: number = 0.016): void {
        const hoverY = Math.sin(time * 2.8) * 0.09;

        // Gestión de emociones temporales
        if (this.emotionTimer > 0) {
            this.emotionTimer -= delta;
            if (this.emotionTimer <= 0 && this.state === RobotState.IDLE) {
                this.renderEyes('neutral');
            }
        }

        // Pestañeo discreto optimizado (solo actualiza textura 2 veces por pestañeo, cada 4 segundos)
        if (this.state === RobotState.IDLE && this.currentEmotion === 'neutral' || this.currentEmotion === 'blink') {
            this.blinkCooldown -= delta;
            if (!this.isBlinking && this.blinkCooldown <= 0) {
                this.isBlinking = true;
                this.blinkDuration = 0.12;
                this.renderEyes('blink');
            } else if (this.isBlinking) {
                this.blinkDuration -= delta;
                if (this.blinkDuration <= 0) {
                    this.isBlinking = false;
                    this.blinkCooldown = 3.5 + Math.random() * 2.0;
                    this.renderEyes('neutral');
                }
            }
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
                this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, 0.14);

                // Inclinación aerodinámica cinemática
                this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, -Math.sin(dirX * 0.1) * 0.25, 0.1);

                // Brazo derecho apuntando al frente
                this.rightArmGroup.rotation.x = -Math.PI / 2.2;
                this.rightArmGroup.rotation.z = -0.15;
                this.leftArmGroup.rotation.x = Math.sin(time * 4) * 0.2;

                // Movimiento hacia el waypoint
                const step = this.flightSpeed * delta;
                if (distToWp < step || distToWp < 0.35) {
                    this.currentWaypointIdx++;
                    if (this.currentWaypointIdx >= this.waypoints.length) {
                        // Llegada al destino final de la sala
                        this.state = RobotState.ARRIVED;
                        this.arrivedTimer = 7.0; // 7 segundos de celebración y aviso
                        this.renderEyes('celebrate');
                        this.updateSpeechBubble(`💬 ¡Llegamos a ${this.targetRoomName}! 🔬 ¡Hacé el experimento!`, '#4ade80');
                        SoundSynthesizer.getInstance().playSuccess();
                    }
                } else {
                    curPos.x += (dirX / distToWp) * step;
                    curPos.y += dirY * 0.08;
                    curPos.z += (dirZ / distToWp) * step;
                }
            }

        } else if (this.state === RobotState.ARRIVED) {
            // Secuencia de llegada dividida en fases
            this.arrivedTimer -= delta;
            const elapsed = 7.0 - this.arrivedTimer;

            if (elapsed < 4.0) {
                // Phase 1 (0-4s): Mirar al pedestal y señalar
                const dirToTarget = new THREE.Vector3().subVectors(this.targetDestination, this.group.position);
                const targetRot = Math.atan2(dirToTarget.x, dirToTarget.z);
                this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetRot, 0.1);
                this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, 0, 0.1);

                this.rightArmGroup.rotation.x = -Math.PI / 2.2;
                this.rightArmGroup.rotation.z = -0.1;
                this.leftArmGroup.rotation.x = -Math.PI / 3;
                this.leftArmGroup.rotation.z = 0.3;

                if (elapsed < delta * 2) {
                    this.renderEyes('pointing');
                    this.updateSpeechBubble('💬 ¡Mirá! 👉 ¡Probá el experimento con [E]!', '#4ade80');
                }
            } else if (elapsed < 7.0) {
                // Phase 2 (4-7s): Mirar al jugador y bajar los brazos
                const dirToPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
                const targetRot = Math.atan2(dirToPlayer.x, dirToPlayer.z);
                this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetRot, 0.08);
                this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, 0, 0.1);

                this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, Math.sin(time * 2.0) * 0.08, 0.1);
                this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(this.rightArmGroup.rotation.z, 0, 0.1);
                this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, -Math.sin(time * 2.0) * 0.08, 0.1);
                this.leftArmGroup.rotation.z = THREE.MathUtils.lerp(this.leftArmGroup.rotation.z, 0, 0.1);

                if (elapsed - 4.0 < delta * 2) {
                    this.renderEyes('happy');
                    this.updateSpeechBubble('💬 ¿Necesitás ayuda? ¡Tocame!', '#fde047');
                }
            }

            if (this.arrivedTimer <= 0) {
                this.state = RobotState.IDLE;
                this.renderEyes('neutral');
                this.updateSpeechBubble('💬 ¡Hacé el experimento y tocá Desafío! 🏆', '#fde047');
            }

        } else {
            // Estado IDLE: flotación suave y orientación hacia el jugador si está cerca
            this.group.position.y = 1.6 + hoverY;

            const distToPlayer = this.group.position.distanceTo(playerPos);
            if (distToPlayer < 7.0) {
                // Mirar suavemente al jugador
                const dirToPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
                const targetRot = Math.atan2(dirToPlayer.x, dirToPlayer.z);
                this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetRot, 0.06);

                // Saludo con la mano derecha si el jugador está a menos de 4 metros
                if (distToPlayer < 4.0) {
                    this.rightArmGroup.rotation.x = -Math.PI / 2.2 + Math.sin(time * 6.0) * 0.22;
                    this.rightArmGroup.rotation.z = Math.sin(time * 8.0) * 0.15;
                } else {
                    this.rightArmGroup.rotation.x = Math.sin(time * 2.0) * 0.08;
                    this.rightArmGroup.rotation.z = 0;
                }
            } else {
                this.rightArmGroup.rotation.x = Math.sin(time * 2.0) * 0.08;
                this.rightArmGroup.rotation.z = 0;
            }

            this.leftArmGroup.rotation.x = -Math.sin(time * 2.0) * 0.08;
            this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, 0, 0.1);
        }

        // Baliza y propulsor
        const beaconPulse = 0.5 + Math.sin(time * 5.0) * 0.5;
        (this.antennaBeacon.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + beaconPulse * 1.2;
        this.thrusterLight.intensity = 1.4 + Math.sin(time * 12.0) * 0.5;
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    public getInteractables(): THREE.Object3D[] {
        return this.interactableMeshes;
    }
}
