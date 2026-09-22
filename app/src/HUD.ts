import { SoundSynthesizer } from './SoundSynthesizer';

export interface QuizData {
    id: number;
    title: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export class HUD {
    // HUD Elements
    private scoreText: HTMLElement;
    private rankText: HTMLElement;
    private progressText: HTMLElement | null;
    
    // Exhibit Card
    private exhibitCard: HTMLElement;
    private cardTag: HTMLElement;
    private cardMode: HTMLElement;
    private cardTitle: HTMLElement;
    private cardDesc: HTMLElement;
    private cardBadge: HTMLElement;
    private cardActionE: HTMLElement | null;
    private cardActionR: HTMLElement | null;

    // Minimap
    private minimapCanvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null;

    // Quiz
    private quizOverlay: HTMLElement;
    private quizQuestion: HTMLElement;
    private quizOptions: HTMLElement;
    private quizFeedback: HTMLElement;
    private feedbackIcon: HTMLElement;
    private feedbackText: HTMLElement;
    private quizContinueBtn: HTMLButtonElement;
    private quizRetryCloseBtn: HTMLButtonElement;
    private quizParticlesContainer: HTMLElement | null;

    // Victory Celebration Modal & Canvas
    private victoryModal: HTMLElement;
    private victoryCloseBtn: HTMLButtonElement;
    private victoryTitle: HTMLElement | null;
    private celebrationCanvas: HTMLCanvasElement;
    private celebrationTriggered: boolean = false;

    // Pause Modal
    private pauseModal: HTMLElement;
    private resumeBtn: HTMLButtonElement;
    private pauseMuteBtn: HTMLButtonElement | null;

    // Mission Panel & Mobile Toggle
    private missionToggleBtn: HTMLButtonElement | null;
    private missionBody: HTMLElement | null;
    private missionCounterBadge: HTMLElement | null;
    private isMissionCollapsed: boolean = false;

    // Mobile exhibit action buttons
    private touchExhibitActions: HTMLElement | null;
    private touchInteractLabel: HTMLElement | null;
    private touchChallengeBtn: HTMLButtonElement | null;
    private touchChallengeLabel: HTMLElement | null;

    // Audio & Journal Controls
    private muteBtn: HTMLButtonElement | null;
    private journalBtn: HTMLButtonElement | null;
    private journalModal: HTMLElement | null;
    private journalCloseBtn: HTMLButtonElement | null;

    // Achievement Toast
    private achievementToast: HTMLElement | null;
    private achTitle: HTMLElement | null;
    private achDesc: HTMLElement | null;
    private toastTimeout: number | null = null;

    // Callbacks for PointerLock synchronization
    public onOpenModal?: () => void;
    public onCloseModal?: () => void;

    // State
    private xp: number = 0;
    private completedMissions: Set<number> = new Set();
    public isModalOpen: boolean = false;
    private currentQuizCallback: ((success: boolean) => void) | null = null;
    private activeQuizOptions: HTMLButtonElement[] = [];
    private studentName: string = 'Científico';

    private readonly roomWidth = 72;
    private readonly roomDepth = 72;

    constructor() {
        this.scoreText = document.getElementById('score-text') as HTMLElement;
        this.rankText = document.getElementById('rank-text') as HTMLElement;
        this.progressText = document.getElementById('mission-progress-text');

        this.missionToggleBtn = document.getElementById('mission-toggle-btn') as HTMLButtonElement | null;
        this.missionBody = document.getElementById('mission-body');
        this.missionCounterBadge = document.getElementById('mission-counter-badge');

        // Las misiones comienzan siempre expandidas
        this.isMissionCollapsed = false;

        this.exhibitCard = document.getElementById('exhibit-card') as HTMLElement;
        this.cardTag = document.getElementById('card-tag') as HTMLElement;
        this.cardMode = document.getElementById('card-mode') as HTMLElement;
        this.cardTitle = document.getElementById('card-title') as HTMLElement;
        this.cardDesc = document.getElementById('card-desc') as HTMLElement;
        this.cardBadge = document.getElementById('card-badge') as HTMLElement;
        this.cardActionE = document.getElementById('card-action-e');
        this.cardActionR = document.getElementById('card-action-r');

        this.touchExhibitActions = document.getElementById('touch-exhibit-actions');
        this.touchInteractLabel = document.getElementById('touch-interact-label');
        this.touchChallengeBtn = document.getElementById('touch-challenge-btn') as HTMLButtonElement | null;
        this.touchChallengeLabel = document.getElementById('touch-challenge-label');

        this.minimapCanvas = document.getElementById('minimapCanvas') as HTMLCanvasElement;
        this.ctx = this.minimapCanvas.getContext('2d');

        this.quizOverlay = document.getElementById('quiz-overlay') as HTMLElement;
        this.quizQuestion = document.getElementById('quiz-question') as HTMLElement;
        this.quizOptions = document.getElementById('quiz-options') as HTMLElement;
        this.quizFeedback = document.getElementById('quiz-feedback') as HTMLElement;
        this.feedbackIcon = document.getElementById('feedback-icon') as HTMLElement;
        this.feedbackText = document.getElementById('feedback-text') as HTMLElement;
        this.quizContinueBtn = document.getElementById('quiz-continue-btn') as HTMLButtonElement;
        this.quizRetryCloseBtn = document.getElementById('quiz-retry-close-btn') as HTMLButtonElement;
        this.quizParticlesContainer = document.getElementById('quiz-particles-container');

        this.victoryModal = document.getElementById('victory-modal') as HTMLElement;
        this.victoryCloseBtn = document.getElementById('victory-close-btn') as HTMLButtonElement;
        this.victoryTitle = document.getElementById('victory-title');
        this.celebrationCanvas = document.getElementById('celebration-canvas') as HTMLCanvasElement;

        this.pauseModal = document.getElementById('pause-modal') as HTMLElement;
        this.resumeBtn = document.getElementById('resume-btn') as HTMLButtonElement;
        this.pauseMuteBtn = document.getElementById('pause-mute-btn') as HTMLButtonElement | null;

        this.muteBtn = document.getElementById('mute-btn') as HTMLButtonElement | null;
        this.journalBtn = document.getElementById('journal-btn') as HTMLButtonElement | null;
        this.journalModal = document.getElementById('journal-modal') as HTMLElement | null;
        this.journalCloseBtn = document.getElementById('journal-close-btn') as HTMLButtonElement | null;

        this.achievementToast = document.getElementById('achievement-toast') as HTMLElement | null;
        this.achTitle = document.getElementById('ach-title') as HTMLElement | null;
        this.achDesc = document.getElementById('ach-desc') as HTMLElement | null;

        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.quizContinueBtn.onclick = () => {
            this.closeQuiz();
            if (this.completedMissions.size === 6 && !this.celebrationTriggered) {
                this.triggerGrandCelebration();
            }
        };

        if (this.quizRetryCloseBtn) {
            this.quizRetryCloseBtn.onclick = () => {
                this.closeQuiz();
            };
        }

        if (this.victoryCloseBtn) {
            this.victoryCloseBtn.onclick = () => {
                this.victoryModal.classList.add('hidden');
                this.isModalOpen = false;
                this.onCloseModal?.();
            };
        }

        // Atajos de teclado en el Quiz para evitar frustración (1, 2, 3, Enter, Escape)
        window.addEventListener('keydown', (e) => {
            const target = e.target as HTMLElement | null;
            if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
            if (this.quizOverlay.classList.contains('hidden')) return;

            // Salir o cerrar con Escape
            if (e.code === 'Escape') {
                e.preventDefault();
                this.closeQuiz();
                return;
            }

            // Continuar con Enter, Space o R si ya acertó
            if (!this.quizContinueBtn.classList.contains('hidden')) {
                if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyR' || e.code === 'KeyE') {
                    e.preventDefault();
                    this.quizContinueBtn.click();
                    return;
                }
            }

            // Responder inmediatamente con teclas numéricas [1, 2, 3] o letras [A, B, C]
            const keyMap: Record<string, number> = {
                'Digit1': 0, 'Numpad1': 0, 'KeyA': 0,
                'Digit2': 1, 'Numpad2': 1, 'KeyB': 1,
                'Digit3': 2, 'Numpad3': 2, 'KeyC': 2
            };

            if (keyMap[e.code] !== undefined) {
                const optIdx = keyMap[e.code];
                if (this.activeQuizOptions[optIdx] && !this.activeQuizOptions[optIdx].disabled) {
                    e.preventDefault();
                    this.activeQuizOptions[optIdx].click();
                }
            }
        });

        // Alternar Misiones (Especial para móviles)
        if (this.missionToggleBtn && this.missionBody) {
            this.missionToggleBtn.onclick = (e) => {
                e.stopPropagation();
                this.isMissionCollapsed = !this.isMissionCollapsed;
                if (this.isMissionCollapsed) {
                    this.missionBody!.classList.add('collapsed');
                } else {
                    this.missionBody!.classList.remove('collapsed');
                }
            };
        }

        // Toggle Sonido / Silenciar desde Pausa
        if (this.pauseMuteBtn) {
            this.pauseMuteBtn.onclick = (e) => {
                e.stopPropagation();
                const isMuted = SoundSynthesizer.getInstance().toggleMute();
                this.updatePauseMuteBtn(isMuted);
            };
        }

        // Toggle Sonido / Silenciar (si existe botón superior)
        if (this.muteBtn) {
            this.muteBtn.onclick = (e) => {
                e.stopPropagation();
                const isMuted = SoundSynthesizer.getInstance().toggleMute();
                this.muteBtn!.innerText = isMuted ? '🔇 AUDIO OFF' : '🔊 AUDIO ON';
                this.muteBtn!.style.background = isMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(253, 224, 71, 0.12)';
                this.muteBtn!.style.borderColor = isMuted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(253, 224, 71, 0.4)';
            };
        }

        // Diario de Campo Científico
        if (this.journalBtn) {
            this.journalBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleJournal();
            };
        }

        if (this.journalCloseBtn) {
            this.journalCloseBtn.onclick = () => {
                this.closeJournal();
            };
        }

        // Navegación de pestañas en el Diario con soporte táctil inmediato
        const journalTabs = document.querySelectorAll<HTMLButtonElement>('.journal-tab');
        const switchTab = (tabBtn: HTMLButtonElement) => {
            const targetTabId = tabBtn.getAttribute('data-tab');
            if (!targetTabId) return;

            journalTabs.forEach(t => t.classList.remove('active'));
            tabBtn.classList.add('active');

            const contentTabs = document.querySelectorAll<HTMLElement>('.journal-content-tab');
            contentTabs.forEach(content => {
                if (content.id === targetTabId) {
                    content.classList.remove('hidden');
                    content.style.display = 'block';
                } else {
                    content.classList.add('hidden');
                    content.style.display = 'none';
                }
            });
        };

        journalTabs.forEach(tabBtn => {
            tabBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                switchTab(tabBtn);
            });
            tabBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                switchTab(tabBtn);
            });
        });
    }

    public setStudentName(name: string) {
        if (name && name.trim()) {
            this.studentName = name.trim();
        }
    }

    public getStudentName(): string {
        return this.studentName;
    }

    // --- EXHIBIT CARD CON PÍLDORAS MODULARES ---
    public showExhibitCard(
        title: string,
        tag: string,
        desc: string,
        badge: string,
        modeText?: string,
        actionEText?: string,
        actionRText?: string,
        isDone?: boolean,
        isRobot?: boolean
    ) {
        if (this.isModalOpen) return;
        this.cardTag.innerText = tag;
        this.cardTitle.innerText = title;
        this.cardDesc.innerText = desc;
        this.cardBadge.innerText = badge;

        if (this.cardActionE && actionEText) {
            this.cardActionE.innerText = actionEText;
        }

        if (this.cardActionR && actionRText) {
            this.cardActionR.innerText = actionRText;
            if (isDone) {
                this.cardActionR.classList.remove('challenge-glow-pill');
                this.cardActionR.classList.add('done-pill');
            } else {
                this.cardActionR.classList.add('challenge-glow-pill');
                this.cardActionR.classList.remove('done-pill');
            }
        }
        
        if (modeText && this.cardMode) {
            this.cardMode.innerText = modeText;
            this.cardMode.style.display = 'inline-flex';
        } else if (this.cardMode) {
            this.cardMode.style.display = 'none';
        }

        this.updateMobileActions(true, isDone, isRobot);
        this.exhibitCard.classList.remove('hidden');
    }

    public updateMobileActions(show: boolean, isDone?: boolean, isRobot?: boolean) {
        if (!this.touchExhibitActions) return;
        if (!show) {
            this.touchExhibitActions.classList.add('hidden');
            return;
        }

        this.touchExhibitActions.classList.remove('hidden');

        if (this.touchInteractLabel) {
            this.touchInteractLabel.textContent = isRobot ? 'HABLAR' : (isDone ? 'MANIPULAR' : 'INTERACTUAR');
        }

        if (this.touchChallengeBtn && this.touchChallengeLabel) {
            const xpChip = this.touchChallengeBtn.querySelector('.touch-xp-chip') as HTMLElement | null;
            if (isRobot) {
                this.touchChallengeLabel.textContent = 'Pedir Consejo';
                this.touchChallengeBtn.classList.remove('challenge-glow-pill');
                this.touchChallengeBtn.classList.remove('done-pill');
                if (xpChip) xpChip.style.display = 'none';
            } else if (isDone) {
                this.touchChallengeLabel.textContent = 'Desafío Aprobado ⭐';
                this.touchChallengeBtn.classList.remove('challenge-glow-pill');
                this.touchChallengeBtn.classList.add('done-pill');
                if (xpChip) xpChip.style.display = 'none';
            } else {
                this.touchChallengeLabel.textContent = 'Responder Desafío';
                this.touchChallengeBtn.classList.add('challenge-glow-pill');
                this.touchChallengeBtn.classList.remove('done-pill');
                if (xpChip) xpChip.style.display = 'inline-block';
            }
        }
    }

    public setCardModePill(modeText: string) {
        if (this.cardMode) {
            this.cardMode.innerText = modeText;
            this.cardMode.style.display = 'inline-flex';
        }
    }

    public hideExhibitCard() {
        this.updateMobileActions(false);
        this.exhibitCard.classList.add('hidden');
    }

    // --- QUIZ & GAMIFICACIÓN EDUCATIVA ---
    public openQuiz(quiz: QuizData, onComplete: (success: boolean) => void) {
        this.isModalOpen = true;
        this.currentQuizCallback = onComplete;
        this.hideExhibitCard();
        this.onOpenModal?.();

        // Liberar cursor de mouse inmediatamente para que los chicos no se traben
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }

        this.quizQuestion.innerText = quiz.question;
        this.quizOptions.innerHTML = '';
        this.quizFeedback.classList.add('hidden');
        this.quizContinueBtn.classList.add('hidden');
        if (this.quizRetryCloseBtn) {
            this.quizRetryCloseBtn.classList.remove('hidden');
        }

        this.activeQuizOptions = [];
        const letters = ['A', 'B', 'C', 'D'];
        quiz.options.forEach((optText, index) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt';
            const letter = letters[index] || String(index + 1);
            btn.innerHTML = `<span class="opt-badge">${letter}</span><span class="opt-text">${optText}</span>`;
            btn.onclick = () => {
                this.handleQuizAnswer(index, quiz.correctIndex, quiz.explanation, btn);
            };
            this.quizOptions.appendChild(btn);
            this.activeQuizOptions.push(btn);
        });

        this.quizOverlay.classList.remove('hidden');
    }

    private handleQuizAnswer(selectedIndex: number, correctIndex: number, explanation: string, clickedBtn: HTMLButtonElement) {
        const optionButtons = this.quizOptions.querySelectorAll<HTMLButtonElement>('.quiz-opt');
        const sfx = SoundSynthesizer.getInstance();

        if (selectedIndex === correctIndex) {
            sfx.playSuccess();
            clickedBtn.classList.add('correct');
            optionButtons.forEach(b => b.disabled = true);

            this.quizFeedback.className = 'quiz-feedback';
            this.feedbackIcon.innerText = '🌟';
            this.feedbackText.innerText = `¡Excelente, ${this.studentName}! ${explanation}`;
            this.quizFeedback.classList.remove('hidden');
            this.quizContinueBtn.classList.remove('hidden');
            if (this.quizRetryCloseBtn) {
                this.quizRetryCloseBtn.classList.add('hidden');
            }

            this.launchAnswerDopamineParticles();

            if (this.currentQuizCallback) {
                this.currentQuizCallback(true);
            }
        } else {
            sfx.playWrong();
            clickedBtn.classList.add('wrong');
            this.quizFeedback.className = 'quiz-feedback error';
            this.feedbackIcon.innerText = '🤔';
            this.feedbackText.innerText = '¡Casi! Pensalo de nuevo o cerrá para mirar el experimento de nuevo.';
            this.quizFeedback.classList.remove('hidden');
        }
    }

    private launchAnswerDopamineParticles() {
        const container = this.quizParticlesContainer || this.quizOverlay;
        if (!container) return;

        const emojis = ['⭐', '✨', '⚡', '🎉', '💡', '🌟'];
        const numParticles = 24;

        for (let i = 0; i < numParticles; i++) {
            const p = document.createElement('div');
            p.className = 'dopamine-particle';
            p.innerText = emojis[Math.floor(Math.random() * emojis.length)];

            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 150;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist - 30;

            p.style.setProperty('--tx', `${x}px`);
            p.style.setProperty('--ty', `${y}px`);
            p.style.left = '50%';
            p.style.top = '50%';

            container.appendChild(p);

            window.setTimeout(() => {
                p.remove();
            }, 1000);
        }
    }

    public closeQuiz() {
        this.quizOverlay.classList.add('hidden');
        this.isModalOpen = false;
        this.currentQuizCallback = null;
        this.activeQuizOptions = [];
        this.onCloseModal?.();
    }

    // --- DIARIO DEL CIENTÍFICO (LIBRETA DE CAMPO) ---
    public openJournal() {
        if (!this.journalModal) return;
        this.isModalOpen = true;
        this.journalModal.classList.remove('hidden');
        this.onOpenModal?.();
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }

    public closeJournal() {
        if (!this.journalModal) return;
        this.journalModal.classList.add('hidden');
        this.isModalOpen = false;
        this.onCloseModal?.();
    }

    public toggleJournal() {
        if (this.journalModal && !this.journalModal.classList.contains('hidden')) {
            this.closeJournal();
        } else {
            this.openJournal();
        }
    }

    // --- LOGROS & TOAST FLOTANTE ---
    public showAchievementToast(title: string, desc: string, icon: string = '🏆') {
        if (!this.achievementToast) return;
        const iconEl = document.getElementById('ach-icon');
        if (iconEl) iconEl.innerText = icon;
        if (this.achTitle) this.achTitle.innerText = title;
        if (this.achDesc) this.achDesc.innerText = desc;

        this.achievementToast.classList.remove('hidden');
        this.achievementToast.classList.remove('fade-out');
        this.achievementToast.classList.add('show');

        if (this.toastTimeout !== null) {
            window.clearTimeout(this.toastTimeout);
        }

        this.toastTimeout = window.setTimeout(() => {
            if (this.achievementToast) {
                this.achievementToast.classList.add('fade-out');
                window.setTimeout(() => {
                    this.achievementToast?.classList.remove('show');
                    this.achievementToast?.classList.add('hidden');
                }, 400);
            }
        }, 4500);
    }

    // --- MISIONES & XP ---
    public completeMission(missionId: number) {
        if (this.completedMissions.has(missionId)) return;
        this.completedMissions.add(missionId);

        const missionEl = document.getElementById(`mission-${missionId}`);
        if (missionEl) {
            missionEl.classList.remove('pending');
            missionEl.classList.add('done');
            const statusSpan = missionEl.querySelector('.task-status');
            if (statusSpan) statusSpan.innerHTML = '¡Completado con éxito! ⭐';
        }

        this.addXP(100);
        this.updateProgressText();

        // Notificación de logro con toast y sonido
        const achievements: Record<number, { title: string; desc: string }> = {
            1: { title: 'Pila de Papa: Reacción Redox', desc: '¡Has cerrado el circuito generando ~1.94V electroquímicos reales!' },
            2: { title: 'Bobina de Tesla: Inducción Inalámbrica', desc: '¡Encendiste el tubo a distancia con ondas electromagnéticas!' },
            3: { title: 'Aerogenerador Faraday: Energía Eólica', desc: '¡Convertiste la fuerza del viento en electricidad para la ciudad!' },
            4: { title: 'Panel Solar: Efecto Fotoeléctrico', desc: '¡Transformaste fotones de luz en rotación mecánica de la hélice!' },
            5: { title: 'Van de Graaff: Repulsión Estática', desc: '¡Acumulaste 150.000V e hiciste levitar las cintas en el aire!' },
            6: { title: 'Cuna de Newton: Choque Elástico', desc: '¡Comprobaste la conservación simultánea de momento y energía!' },
            7: { title: 'Dínamo Manual: Manivela e Inducción', desc: '¡Convertiste tu esfuerzo físico en 24V y luz incandescente!' }
        };

        if (achievements[missionId]) {
            this.showAchievementToast(achievements[missionId].title, achievements[missionId].desc, '🏅');
        }
    }

    public addXP(amount: number) {
        this.xp += amount;
        this.scoreText.innerText = `⭐ ${this.xp} XP`;

        if (this.xp >= 700) {
            this.rankText.innerText = 'Nivel 5: Gran Maestro de la Energía Universal';
        } else if (this.xp >= 500) {
            this.rankText.innerText = 'Nivel 4: Ingeniero de Energías Renovables';
        } else if (this.xp >= 300) {
            this.rankText.innerText = 'Nivel 3: Domador de la Inducción';
        } else if (this.xp >= 100) {
            this.rankText.innerText = 'Nivel 2: Investigador de Circuitos';
        } else {
            this.rankText.innerText = 'Nivel 1: Aprendiz de la Energía';
        }
    }

    public unlockSecretFact(id: number, title: string, desc: string): void {
        const container = document.getElementById('secrets-facts-container');
        if (!container) return;

        if (document.getElementById(`secret-fact-${id}`)) return;

        const emptyNotice = document.getElementById('secrets-empty-notice');
        if (emptyNotice) emptyNotice.style.display = 'none';

        const factEl = document.createElement('div');
        factEl.id = `secret-fact-${id}`;
        factEl.className = 'glass-pill pill-concept-box secret-fact-card';
        factEl.style.marginBottom = '12px';
        factEl.style.border = '1px solid rgba(0, 240, 255, 0.4)';
        factEl.style.background = 'rgba(10, 25, 45, 0.75)';

        factEl.innerHTML = `
            <span class="pill-concept-label" style="color: #fde047; font-size: 11px;">🔮 ${title}</span>
            <p style="font-size: 13px; line-height: 1.5; color: #f1f5f9; margin-top: 4px;">${desc}</p>
        `;
        container.appendChild(factEl);
    }

    private updateProgressText() {
        const count = this.completedMissions.size;
        if (this.progressText) {
            this.progressText.innerText = count === 7 
                ? '🏆 ¡EXPEDICIÓN COMPLETA! Gran Maestro de la Energía' 
                : `Progreso: ${count} de 7 salas completadas`;
        }
        if (this.missionCounterBadge) {
            this.missionCounterBadge.innerText = count === 7 ? '7/7 ⭐' : `${count}/7`;
            if (count === 7) {
                this.missionCounterBadge.parentElement?.classList.add('all-done');
            }
        }
        if (count === 7 && !this.celebrationTriggered) {
            this.triggerGrandCelebration();
        }
    }

    public isMissionCompleted(id: number): boolean {
        return this.completedMissions.has(id);
    }

    // --- GRAN CELEBRACIÓN FINAL (CONFETI & TROFEO) ---
    public triggerGrandCelebration() {
        this.celebrationTriggered = true;
        this.isModalOpen = true;
        this.onOpenModal?.();
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
        if (this.victoryTitle) {
            this.victoryTitle.innerText = `¡Felicitaciones, ${this.studentName}!`;
        }
        SoundSynthesizer.getInstance().playCelebrationFanfare();
        this.launchConfetti();
        if (this.victoryModal) {
            this.victoryModal.classList.remove('hidden');
        }
    }

    private launchConfetti() {
        if (!this.celebrationCanvas) return;
        const canvas = this.celebrationCanvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.display = 'block';

        const colors = ['#00f0ff', '#fde047', '#4ade80', '#d946ef', '#ff7b00', '#ffffff'];
        const confettiCount = 120;
        const confetti: Array<{
            x: number; y: number; r: number; d: number; color: string;
            tilt: number; tiltAngleIncremental: number; tiltAngle: number;
        }> = [];

        for (let i = 0; i < confettiCount; i++) {
            confetti.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                r: Math.random() * 8 + 4,
                d: Math.random() * confettiCount + 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
                tiltAngle: 0
            });
        }

        let animationFrameId: number;
        const startTime = performance.now();

        const render = (time: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let remaining = false;

            for (let i = 0; i < confettiCount; i++) {
                const c = confetti[i];
                c.tiltAngle += c.tiltAngleIncremental;
                c.y += (Math.cos(c.d) + 3 + c.r / 2) / 1.5;
                c.x += Math.sin(c.d);
                c.tilt = Math.sin(c.tiltAngle) * 12;

                if (c.y < canvas.height + 20) {
                    remaining = true;
                }

                ctx.beginPath();
                ctx.lineWidth = c.r / 2;
                ctx.strokeStyle = c.color;
                ctx.moveTo(c.x + c.tilt + c.r / 4, c.y);
                ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 4);
                ctx.stroke();
            }

            if (remaining && time - startTime < 5000) {
                animationFrameId = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.display = 'none';
                cancelAnimationFrame(animationFrameId);
            }
        };

        animationFrameId = requestAnimationFrame(render);
    }

    // --- PAUSE SCREEN ---
    public showPauseModal(onResumeClick: () => void) {
        this.updatePauseMuteBtn(SoundSynthesizer.getInstance().getIsMuted());
        this.pauseModal.classList.remove('hidden');
        this.resumeBtn.onclick = () => {
            this.pauseModal.classList.add('hidden');
            onResumeClick();
        };
    }

    public updatePauseMuteBtn(isMuted: boolean) {
        if (!this.pauseMuteBtn) return;
        this.pauseMuteBtn.innerText = isMuted ? '🔇 Audio: Silenciado' : '🔊 Audio: Activado';
        this.pauseMuteBtn.style.color = isMuted ? '#f87171' : '#fde047';
        this.pauseMuteBtn.style.borderColor = isMuted ? 'rgba(239, 68, 68, 0.5)' : 'rgba(253, 224, 71, 0.4)';
        this.pauseMuteBtn.style.background = isMuted ? 'rgba(239, 68, 68, 0.12)' : 'rgba(253, 224, 71, 0.08)';
    }

    public hidePauseModal() {
        this.pauseModal.classList.add('hidden');
    }

    // --- SQUIRCLE MINIMAP ---
    public updateMinimap(playerX: number, playerZ: number, playerRotationY: number) {
        if (!this.ctx) return;
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;

        this.ctx.clearRect(0, 0, width, height);

        // Fondo oscuro táctico
        this.ctx.fillStyle = '#050c16';
        this.ctx.fillRect(0, 0, width, height);

        // Rejilla táctica
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        this.ctx.lineWidth = 1;
        const step = 20;
        for (let x = 0; x <= width; x += step) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, height); this.ctx.stroke();
        }
        for (let y = 0; y <= height; y += step) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(width, y); this.ctx.stroke();
        }

        // Límites del museo
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(12, 12, width - 24, height - 24);

        // 7 Estaciones de Energía + Prisma Conmemorativo (1:1)
        this.drawExhibitDot(-15, 0, '#4ade80', this.completedMissions.has(1));   // Sala 1: Papa
        this.drawExhibitDot(16, 0, '#38bdf8', this.completedMissions.has(2));    // Sala 2: Tesla
        this.drawExhibitDot(0, -15, '#00f0ff', this.completedMissions.has(3));   // Sala 3: Eólica
        this.drawExhibitDot(12, -12, '#fde047', this.completedMissions.has(4));  // Sala 4: Solar
        this.drawExhibitDot(-12, -12, '#c084fc', this.completedMissions.has(5)); // Sala 5: Van de Graaff
        this.drawExhibitDot(0, 14, '#f59e0b', this.completedMissions.has(6));    // Sala 6: Newton
        this.drawExhibitDot(12, 10, '#f97316', this.completedMissions.has(7));   // Sala 7: Dínamo Manual
        this.drawExhibitDot(0, 24, '#d946ef', true);                             // Galería Especial: Prisma

        // Jugador
        const pX = ((playerX + this.roomWidth / 2) / this.roomWidth) * (width - 24) + 12;
        const pZ = ((playerZ + this.roomDepth / 2) / this.roomDepth) * (height - 24) + 12;

        const clampedX = Math.max(16, Math.min(width - 16, pX));
        const clampedZ = Math.max(16, Math.min(height - 16, pZ));

        this.ctx.save();
        this.ctx.translate(clampedX, clampedZ);
        this.ctx.rotate(-playerRotationY);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -7);
        this.ctx.lineTo(-4, 5);
        this.ctx.lineTo(0, 3);
        this.ctx.lineTo(4, 5);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    private drawExhibitDot(worldX: number, worldZ: number, color: string, isDone: boolean) {
        if (!this.ctx) return;
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;

        const mX = ((worldX + this.roomWidth / 2) / this.roomWidth) * (width - 24) + 12;
        const mZ = ((worldZ + this.roomDepth / 2) / this.roomDepth) * (height - 24) + 12;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(mX, mZ, isDone ? 5 : 6, 0, Math.PI * 2);
        this.ctx.fillStyle = isDone ? '#4ade80' : color;
        this.ctx.shadowColor = isDone ? '#4ade80' : color;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.restore();
    }
}
