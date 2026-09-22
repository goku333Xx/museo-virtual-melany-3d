import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { World } from './World';
import { InteractionSystem } from './InteractionSystem';
import { HUD } from './HUD';

import { SoundSynthesizer } from './SoundSynthesizer';

// --- ELEMENTOS DEL DOM ---
const startScreen = document.getElementById('start-screen') as HTMLElement;
const playBtn = document.getElementById('play-btn') as HTMLButtonElement;

// Controles Táctiles: Detección estricta para NUNCA mostrar joysticks en PC con mouse
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches && 
                      !window.matchMedia('(pointer: fine)').matches && 
                      window.innerWidth < 1024;
const touchControlsEl = document.getElementById('touch-controls') as HTMLElement | null;
const touchInteractBtn = document.getElementById('touch-interact-btn') as HTMLButtonElement | null;
const touchChallengeBtn = document.getElementById('touch-challenge-btn') as HTMLButtonElement | null;
const touchJumpBtn = document.getElementById('touch-jump-btn') as HTMLButtonElement | null;
const joystickBase = document.getElementById('joystick-base') as HTMLElement | null;
const joystickThumb = document.getElementById('joystick-thumb') as HTMLElement | null;

// --- INICIALIZACIÓN THREE.JS ---
const scene = new THREE.Scene();
// Fondo cósmico azul profundo de espacio exterior
scene.background = new THREE.Color(0x020308);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
// Spawn del jugador a escala humana (1.68m de altura)
camera.position.set(0, 1.68, 4.5);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    powerPreference: 'high-performance' 
});
const targetPixelRatio = isTouchDevice 
    ? Math.min(window.devicePixelRatio, 1.0) 
    : Math.min(window.devicePixelRatio, 1.25);
renderer.setPixelRatio(targetPixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = !isTouchDevice; // En móviles, deshabilitar sombras dinámicas para 60 FPS garantizados
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.getElementById('app')!.appendChild(renderer.domElement);

const hud = new HUD();
const world = new World(scene, hud);
world.setIsMobile(isTouchDevice);
const interactionSystem = new InteractionSystem(camera, hud);
interactionSystem.updateInteractables(world.getInteractables());

// Pre-compilación instantánea de shaders en GPU (cero lag en primera interacción)
renderer.compile(scene, camera);

// --- CONTROLES EN PRIMERA PERSONA (POINTER LOCK) ---
const controls = new PointerLockControls(camera, document.body);

let gameStarted = false;

// Inicio de la experiencia
playBtn.addEventListener('click', () => {
    SoundSynthesizer.getInstance().init();
    gameStarted = true;
    startScreen.classList.add('hidden');

    const nameInput = document.getElementById('student-name-input') as HTMLInputElement | null;
    const studentName = (nameInput?.value || '').trim() || 'Científico/a';
    hud.setStudentName(studentName);
    world.setStudentName(studentName);
    world.setIsMobile(isTouchDevice);

    if (isTouchDevice) {
        targetRotationY = camera.rotation.y;
        targetRotationX = camera.rotation.x;
        if (touchControlsEl) touchControlsEl.classList.remove('hidden');
    } else {
        controls.lock();
    }
});

// Permitir iniciar presionando Enter en el campo de texto del nombre
const nameInputElement = document.getElementById('student-name-input') as HTMLInputElement | null;
nameInputElement?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        playBtn.click();
    }
});

// Eventos de PointerLock y Recuperación a prueba de fallos tras presionar Esc
controls.addEventListener('lock', () => {
    startScreen.classList.add('hidden');
    hud.hidePauseModal();
});

controls.addEventListener('unlock', () => {
    // Si el juego ya inició y no está en medio de un modal (quiz, diario, victoria), mostrar pantalla de pausa
    if (gameStarted && !hud.isModalOpen && !isTouchDevice) {
        hud.showPauseModal(() => {
            controls.lock();
        });
    }
});

// Manejo de rechazo de PointerLock (cooldown del navegador tras presionar Esc)
document.addEventListener('pointerlockerror', () => {
    if (gameStarted && !hud.isModalOpen && !isTouchDevice) {
        hud.showPauseModal(() => {
            controls.lock();
        });
    }
});

// Permitir reanudar haciendo clic en el canvas 3D si el mouse quedó liberado
renderer.domElement.addEventListener('click', () => {
    if (gameStarted && !controls.isLocked && !hud.isModalOpen && !isTouchDevice) {
        controls.lock();
    }
});

// Permitir reanudar presionando Barra Espaciadora o Enter en la pantalla de pausa
window.addEventListener('keydown', (e) => {
    if (gameStarted && !controls.isLocked && !hud.isModalOpen && !isTouchDevice) {
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            controls.lock();
        }
    }
});

// Sincronización automática de modales con pointer lock
hud.onOpenModal = () => {
    if (controls.isLocked) {
        controls.unlock();
    }
};

hud.onCloseModal = () => {
    if (gameStarted && !hud.isModalOpen && !isTouchDevice) {
        controls.lock();
    }
};

// --- FÍSICAS DE ALTURA DINÁMICA & MESAS DE EXPERIMENTOS ---
// Las mesas son de 2.4m x 2.4m, altura 1.2m
const pedestals = [
    { minX: -16.2, maxX: -13.8, minZ: -1.2, maxZ: 1.2, height: 1.2 },    // 1. Papa (Oeste)
    { minX: 14.8, maxX: 17.2, minZ: -1.2, maxZ: 1.2, height: 1.2 },      // 2. Tesla (Este)
    { minX: -1.2, maxX: 1.2, minZ: -16.2, maxZ: -13.8, height: 1.2 },    // 3. Eólica (Norte)
    { minX: 10.8, maxX: 13.2, minZ: -13.2, maxZ: -10.8, height: 1.2 },   // 4. Solar (Noreste)
    { minX: -13.2, maxX: -10.8, minZ: -13.2, maxZ: -10.8, height: 1.2 },  // 5. Van de Graaff (Noroeste)
    { minX: -1.2, maxX: 1.2, minZ: 12.8, maxZ: 15.2, height: 1.2 },      // 6. Newton (Sur)
    { minX: 10.8, maxX: 13.2, minZ: 8.8, maxZ: 11.2, height: 1.2 },      // 7. Dínamo (Sureste)
    { minX: -1.2, maxX: 1.2, minZ: 22.8, maxZ: 25.2, height: 1.2 }       // 8. Prisma (Galería)
];

function getGroundHeight(x: number, z: number, currentCamY: number): number {
    for (let i = 0; i < pedestals.length; i++) {
        const p = pedestals[i];
        if (x >= p.minX && x <= p.maxX && z >= p.minZ && z <= p.maxZ) {
            // Si el jugador está sobre o cerca de la superficie del pedestal
            if (currentCamY >= 1.68 + p.height - 0.35) {
                return 1.68 + p.height; // 2.88m (subido a la mesa)
            }
        }
    }
    return 1.68; // Suelo de mármol del museo
}

function isInsidePedestalObstacle(x: number, z: number, camY: number): boolean {
    const bodyMargin = 0.22;
    // Pedestales (bloquean si el jugador no saltó por encima)
    if (camY < 2.75) {
        for (let i = 0; i < pedestals.length; i++) {
            const p = pedestals[i];
            if (x >= p.minX - bodyMargin && x <= p.maxX + bodyMargin &&
                z >= p.minZ - bodyMargin && z <= p.maxZ + bodyMargin) {
                return true;
            }
        }
    }
    // Paredes interiores de las salas cerradas (altura 4.5m)
    if (camY < 4.5) {
        const wallBoxes = world.getWallBoxes();
        for (let i = 0; i < wallBoxes.length; i++) {
            const w = wallBoxes[i];
            if (x >= w.minX - bodyMargin && x <= w.maxX + bodyMargin &&
                z >= w.minZ - bodyMargin && z <= w.maxZ + bodyMargin) {
                return true;
            }
        }
    }
    return false;
}

// --- ENTRADA DE TECLADO ---
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isSprinting = false;

// Variables para Joystick Táctil
let touchMoveX = 0;
let touchMoveZ = 0;
let joystickTouchId: number | null = null;
let joystickCenterX = 0;
let joystickCenterY = 0;

// Variables para Rotación Táctil de Cámara con Suavizado Cinematográfico
let lookTouchId: number | null = null;
let lastLookX = 0;
let lastLookY = 0;
let targetRotationY = camera.rotation.y;
let targetRotationX = camera.rotation.x;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
let stepTimer = 0;
let lastOnGroundTime = performance.now();

const tryJump = () => {
    const currentGroundY = getGroundHeight(camera.position.x, camera.position.z, camera.position.y);
    const timeSinceGrounded = performance.now() - lastOnGroundTime;
    const isGrounded = Math.abs(camera.position.y - currentGroundY) < 0.35 || 
                       (timeSinceGrounded < 180 && velocity.y <= 0.5);

    if (isGrounded) {
        velocity.y = 8.8; // Salto con altura suficiente para subirse a la mesa del experimento
        lastOnGroundTime = 0; // Consumir salto inmediatamente para evitar doble salto
        SoundSynthesizer.getInstance().playFootstep();
    }
};

const isInputFocused = (): boolean => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return false;
    const tag = active.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable;
};

const onKeyDown = (event: KeyboardEvent) => {
    // Si el usuario está escribiendo en un input/textarea (ej. ingresando su nombre "Julián") o el juego no arrancó, ignorar atajos
    const target = event.target as HTMLElement | null;
    if (!gameStarted || isInputFocused() || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        return;
    }

    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = true; break;
        case 'ShiftLeft': isSprinting = true; break;
        case 'Space': 
            if (controls.isLocked || isTouchDevice) {
                tryJump();
            }
            break;
        case 'KeyE':
            if (controls.isLocked || isTouchDevice) {
                interactionSystem.interact(); // Probar y manipular experimento
            }
            break;
        case 'KeyR':
            if (controls.isLocked || isTouchDevice) {
                interactionSystem.challenge(); // Responder desafío pedagógico
            }
            break;
        case 'KeyJ':
            hud.toggleJournal();
            break;
    }
};

const onKeyUp = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (isInputFocused() || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        return;
    }

    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = false; break;
        case 'ShiftLeft': isSprinting = false; break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// --- GESTIÓN DE EVENTOS TÁCTILES MÓVILES ---
if (isTouchDevice) {
    // Joystick Táctil
    if (joystickBase && joystickThumb) {
        joystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            joystickTouchId = touch.identifier;
            const rect = joystickBase.getBoundingClientRect();
            joystickCenterX = rect.left + rect.width / 2;
            joystickCenterY = rect.top + rect.height / 2;
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (joystickTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === joystickTouchId) {
                    const dx = touch.clientX - joystickCenterX;
                    const dy = touch.clientY - joystickCenterY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);
                    const maxDist = 45;
                    const clampedDist = Math.min(dist, maxDist);
                    const distRatio = clampedDist / maxDist;
                    const thumbX = Math.cos(angle) * clampedDist;
                    const thumbY = Math.sin(angle) * clampedDist;
                    
                    joystickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;
                    
                    // Zona muerta ergonómica (5%) y aceleración progresiva
                    if (distRatio < 0.05) {
                        touchMoveX = 0;
                        touchMoveZ = 0;
                    } else {
                        const normalized = (distRatio - 0.05) / 0.95;
                        const curved = Math.pow(normalized, 1.35);
                        touchMoveX = (thumbX / clampedDist) * curved;
                        touchMoveZ = (-thumbY / clampedDist) * curved; // Arriba = avanzar (+Z hacia adelante)
                    }
                    break;
                }
            }
        }, { passive: false });

        const resetJoystick = () => {
            joystickTouchId = null;
            if (joystickThumb) joystickThumb.style.transform = 'translate(0px, 0px)';
            touchMoveX = 0;
            touchMoveZ = 0;
        };

        window.addEventListener('touchend', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystickTouchId) {
                    resetJoystick();
                    break;
                }
            }
        });

        window.addEventListener('touchcancel', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystickTouchId) {
                    resetJoystick();
                    break;
                }
            }
        });
    }

    // Rotación de Cámara por Arrastre en pantalla táctil con Suavizado Cinematográfico
    window.addEventListener('touchstart', (e) => {
        if (!gameStarted || hud.isModalOpen) return;
        SoundSynthesizer.getInstance().init();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            // Si el toque es en la mitad derecha o arriba y no es el joystick
            if (touch.clientX > window.innerWidth * 0.35 && lookTouchId === null) {
                // Verificar que no sea un botón de acción
                const target = touch.target as HTMLElement;
                if (!target.closest('button')) {
                    lookTouchId = touch.identifier;
                    lastLookX = touch.clientX;
                    lastLookY = touch.clientY;
                    break;
                }
            }
        }
    });

    window.addEventListener('touchmove', (e) => {
        if (lookTouchId === null || hud.isModalOpen) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === lookTouchId) {
                const deltaX = touch.clientX - lastLookX;
                const deltaY = touch.clientY - lastLookY;
                lastLookX = touch.clientX;
                lastLookY = touch.clientY;

                targetRotationY -= deltaX * 0.0035;
                targetRotationX = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, targetRotationX - deltaY * 0.0035));
                break;
            }
        }
    });

    const resetLookTouch = () => {
        lookTouchId = null;
    };
    window.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === lookTouchId) {
                resetLookTouch();
                break;
            }
        }
    });
    window.addEventListener('touchcancel', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === lookTouchId) {
                resetLookTouch();
                break;
            }
        }
    });

    // Botones de acción táctiles con soporte multi-touch simultáneo al joystick
    const bindTouchAction = (btn: HTMLElement | null, action: () => void) => {
        if (!btn) return;
        let lastTrigger = 0;
        const trigger = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const now = performance.now();
            if (now - lastTrigger < 200) return;
            lastTrigger = now;
            SoundSynthesizer.getInstance().init();
            action();
        };
        btn.addEventListener('touchstart', trigger, { passive: false });
        btn.addEventListener('click', trigger);
    };

    bindTouchAction(touchInteractBtn, () => interactionSystem.interact());
    bindTouchAction(touchChallengeBtn, () => interactionSystem.challenge());
    bindTouchAction(touchJumpBtn, () => tryJump());
}

// --- CONTROL DE RESIZE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const updatedIsMobile = (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches) || window.innerWidth <= 768;
    world.setIsMobile(updatedIsMobile);
});

// --- BUCLE PRINCIPAL DE RENDER (60+ FPS) ---
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    let delta = (time - prevTime) / 1000;
    if (delta > 0.05) delta = 0.05; // Protección contra desfasaje de físicas

    const isSimActive = controls.isLocked || (isTouchDevice && gameStarted && !hud.isModalOpen);

    if (isSimActive) {
        // Suavizado cinemático de rotación en pantalla táctil móvil
        if (isTouchDevice) {
            camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.38;
            camera.rotation.x += (targetRotationX - camera.rotation.x) * 0.38;
        }

        // Amortiguación y gravedad
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 22.0 * delta; // Gravedad suave

        let inputZ = (Number(moveForward) - Number(moveBackward)) + touchMoveZ;
        let inputX = (Number(moveRight) - Number(moveLeft)) + touchMoveX;

        const inputLen = Math.sqrt(inputX * inputX + inputZ * inputZ);
        if (inputLen > 1) {
            inputX /= inputLen;
            inputZ /= inputLen;
        }

        const speed = isSprinting ? 70.0 : 36.0; // Velocidades ergonómicas
        
        if (Math.abs(inputZ) > 0.01) velocity.z -= inputZ * speed * delta;
        if (Math.abs(inputX) > 0.01) velocity.x -= inputX * speed * delta;

        // --- COLISIONES SUAVES CON DESLIZAMIENTO INDEPENDIENTE EN X Y Z ---
        const origX = camera.position.x;
        const origZ = camera.position.z;

        // Movimiento tentativo en X
        controls.moveRight(-velocity.x * delta);
        if (isInsidePedestalObstacle(camera.position.x, origZ, camera.position.y)) {
            camera.position.x = origX; // Deslizarse a lo largo del pedestal sin frenarse en seco
            velocity.x = 0;
        }

        // Movimiento tentativo en Z
        controls.moveForward(-velocity.z * delta);
        if (isInsidePedestalObstacle(camera.position.x, camera.position.z, camera.position.y)) {
            camera.position.z = origZ; // Deslizarse a lo largo del pedestal sin frenarse en seco
            velocity.z = 0;
        }

        // Límites de las paredes perimetrales del museo (72x72)
        camera.position.x = Math.max(-34.2, Math.min(34.2, camera.position.x));
        camera.position.z = Math.max(-34.2, Math.min(34.2, camera.position.z));

        camera.position.y += velocity.y * delta;

        // Límite de suelo dinámico (piso de mármol 1.68m o sobre la mesa del pedestal 2.88m)
        const groundY = getGroundHeight(camera.position.x, camera.position.z, camera.position.y);
        const isOnGround = Math.abs(camera.position.y - groundY) < 0.18;

        if (camera.position.y <= groundY) {
            velocity.y = 0;
            camera.position.y = groundY;
            lastOnGroundTime = performance.now();
        } else if (isOnGround) {
            lastOnGroundTime = performance.now();
        }

        // Sonido de pasos procedurales al caminar sobre el suelo
        if (isOnGround && (Math.abs(velocity.x) > 0.8 || Math.abs(velocity.z) > 0.8)) {
            stepTimer += delta;
            const stepInterval = isSprinting ? 0.28 : 0.42;
            if (stepTimer >= stepInterval) {
                SoundSynthesizer.getInstance().playFootstep();
                stepTimer = 0;
            }
        } else {
            stepTimer = 0.2;
        }

        // Detección de interacción
        interactionSystem.update();
        
        // Minimapa 1:1 en tiempo real
        hud.updateMinimap(camera.position.x, camera.position.z, camera.rotation.y);
    }

    // Actualizar animaciones del mundo físico (siempre, incluso en pausa para no perder continuidad visual)
    world.update(delta, camera.position);

    prevTime = time;
    renderer.render(scene, camera);
}

animate();
