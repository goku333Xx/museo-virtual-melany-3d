export class SoundSynthesizer {
    private static instance: SoundSynthesizer;
    private isMuted: boolean = false;
    private ctx: AudioContext | null = null;

    private constructor() {}

    public static getInstance(): SoundSynthesizer {
        if (!SoundSynthesizer.instance) {
            SoundSynthesizer.instance = new SoundSynthesizer();
        }
        return SoundSynthesizer.instance;
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    public getIsMuted(): boolean {
        return this.isMuted;
    }

    public init(): void {
        if (!this.ctx && (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 1. Clic mecánico de interruptor industrial
    public playSwitchClick(isOn: boolean): void {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isOn ? 1200 : 800, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.start(now);
        osc.stop(now + 0.045);
    }

    // 2. Conmutación láser y pulso electromagnético
    public playLaserCycle(modeId: number): void {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const freqs = [700, 1100, 550];
        const freq = freqs[modeId] || 800;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * 1.5, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.15);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    // 3. Impacto metálico de esferas de Newton
    public playNewtonClack(intensity: number = 1.0): void {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const modes = [2380, 4850];
        const gains = [0.25, 0.12];

        modes.forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(gains[idx] * intensity, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.04);
        });
    }

    // 4. Fanfarria de acierto y éxito en Quiz
    public playSuccess(): void {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];

        notes.forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.18, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.32);
        });
    }

    // 5. Tono suave para reintento de quiz (no punitivo)
    public playWrong(): void {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.16);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.17);
    }

    // 6. Gran Fanfarria Final de Victoria Cósmica
    public playCelebrationFanfare(): void {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];

        chord.forEach((freq, i) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            const t = now + i * 0.1;
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.95);
        });
    }

    // 7. Pasos suaves sobre suelo de mármol del museo
    public playFootstep(): void {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        const baseFreq = 85 + Math.random() * 25;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.045);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.055);
    }

    // 8. Campanita celestial al recolectar un orbe de energía secreto
    public playCollectSparkle(): void {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const chimeNotes = [1046.50, 1318.51, 1567.98, 2093.00]; // C6, E6, G6, C7

        chimeNotes.forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const t = now + idx * 0.05;
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.38);
        });
    }

    // 9. Chirrido cibernético amigable de Mel-Bot (NPC Guía)
    public playRobotChirp(): void {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const chirps = [987.77, 1318.51, 1975.53];

        chirps.forEach((f, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sine';
            const t = now + idx * 0.06;
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 1.3, t + 0.05);

            gain.gain.setValueAtTime(0.09, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

            osc.start(t);
            osc.stop(t + 0.055);
        });
    }

    // 10. Descarga eléctrica de arco de plasma (Bobina de Tesla)
    public playTeslaZap(intensity: number = 1.0): void {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2200 + Math.random() * 900, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.075);

        gain.gain.setValueAtTime(0.16 * intensity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

        osc.start(now);
        osc.stop(now + 0.08);
    }
}
