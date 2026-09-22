import * as THREE from 'three';
import type { Interactable } from './World';
import { HUD } from './HUD';

export class InteractionSystem {
    private raycaster: THREE.Raycaster;
    private center: THREE.Vector2;
    private camera: THREE.Camera;
    private hud: HUD;
    
    private currentTarget: Interactable | null = null;
    private interactableMeshes: THREE.Object3D[] = [];
    private allInteractables: Interactable[] = [];
    private crosshairEl: HTMLElement | null;

    constructor(camera: THREE.Camera, hud: HUD) {
        this.camera = camera;
        this.hud = hud;
        this.raycaster = new THREE.Raycaster();
        this.center = new THREE.Vector2(0, 0); // Centro de la pantalla (crosshair)
        this.crosshairEl = document.getElementById('crosshair');
    }

    public updateInteractables(list: Interactable[]) {
        this.allInteractables = list;
        this.interactableMeshes = list.map(i => i.object);
    }

    public update() {
        if (this.hud.isModalOpen) {
            this.currentTarget = null;
            this.hud.hideExhibitCard();
            this.crosshairEl?.classList.remove('interactive');
            return;
        }

        // Raycasting desde el centro de la cámara
        this.raycaster.setFromCamera(this.center, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactableMeshes, true);

        if (intersects.length > 0) {
            const hit = intersects[0];
            // Rango de detección cómodo y amplio (7.0 metros)
            if (hit.distance < 7.0) {
                // Buscar hacia arriba en la jerarquía si el objeto impactado es hijo de un interactable registrado
                let obj: THREE.Object3D | null = hit.object;
                let found: Interactable | undefined;
                while (obj) {
                    found = this.allInteractables.find(item => item.object === obj);
                    if (found) break;
                    obj = obj.parent;
                }

                if (found) {
                    this.currentTarget = found;
                    this.crosshairEl?.classList.add('interactive');
                    
                    // Texto dinámico de modo en tiempo real
                    const modeText = found.getModeText ? found.getModeText() : found.modeText;
                    
                    // Doble canal de acción desacoplado: [E] Probar / [R] Responder
                    const isDone = this.hud.isMissionCompleted(found.id);
                    const badgeText = isDone ? "✅ ¡Misión Cumplida! (Medalla Ganada)" : found.badge;
                    const actionEText = isDone 
                        ? "⚡ [E] Probar / Manipular física" 
                        : "⚡ [E] Probar Experimento";
                    const actionRText = isDone
                        ? "⭐ Desafío Aprobado (+100 XP)"
                        : "📝 [R] Responder Desafío (+100 XP)";

                    this.hud.showExhibitCard(
                        found.title,
                        found.tag,
                        found.description,
                        badgeText,
                        modeText,
                        actionEText,
                        actionRText,
                        isDone
                    );
                    return;
                }
            }
        }

        // Si no está mirando un experimento o su pedestal
        if (this.currentTarget) {
            this.currentTarget = null;
            this.hud.hideExhibitCard();
            this.crosshairEl?.classList.remove('interactive');
        }
    }

    // ACCIÓN [E]: Probar y manipular libremente
    public interact() {
        if (this.hud.isModalOpen) return;

        if (this.currentTarget && this.currentTarget.onInteract) {
            this.currentTarget.onInteract();
        }
    }

    // ACCIÓN [R]: Responder el desafío o trivia científica
    public challenge() {
        if (this.hud.isModalOpen) return;

        if (this.currentTarget) {
            if (this.currentTarget.onChallenge) {
                this.currentTarget.onChallenge();
            } else if (this.currentTarget.quiz) {
                if (!this.hud.isMissionCompleted(this.currentTarget.id)) {
                    this.hud.openQuiz(this.currentTarget.quiz, (success) => {
                        if (success) {
                            this.hud.completeMission(this.currentTarget!.id);
                        }
                    });
                } else {
                    this.hud.showAchievementToast('Estación Ya Completada', 'Ya respondiste este desafío. ¡Seguí jugando con [E]!');
                }
            }
        }
    }

    public getCurrentTarget(): Interactable | null {
        return this.currentTarget;
    }
}
