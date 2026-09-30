import * as THREE from 'three';
import type { SalaParts } from './models/Environment';
import type { HUD } from './HUD';
import { SoundSynthesizer } from './SoundSynthesizer';

/** Extrae el id de un enlace de YouTube (watch, youtu.be, shorts, embed) */
export function youtubeId(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
}

/**
 * Video de una sala.
 * - Archivo propio (MP4): se reproduce en la pantalla de la pared con [E];
 *   [R] lo abre en grande con controles de volumen y pantalla completa.
 * - YouTube: [E] o [R] lo abren en grande (YouTube no permite mostrarlo en 3D).
 * Mientras suena, los efectos del museo se silencian para que se escuche bien.
 */
export class SalaVideo {
    readonly kind: 'none' | 'archivo' | 'youtube';
    private video: HTMLVideoElement | null = null;
    private videoTex: THREE.VideoTexture | null = null;
    private ytId: string | null = null;
    private titulo: string;
    private kicker: string;
    private parts: SalaParts;
    private hud: HUD;
    private src: string;

    private static playingCount = 0;

    constructor(src: string, parts: SalaParts, hud: HUD, titulo: string, kicker: string) {
        this.src = src.trim();
        this.parts = parts;
        this.hud = hud;
        this.titulo = titulo;
        this.kicker = kicker;
        this.ytId = this.src ? youtubeId(this.src) : null;
        this.kind = !this.src ? 'none' : this.ytId ? 'youtube' : 'archivo';
    }

    public isPlaying(): boolean {
        return !!this.video && !this.video.paused && !this.video.ended;
    }

    public statusText(): string {
        if (this.kind === 'none') return 'VIDEO PRÓXIMAMENTE';
        if (this.kind === 'youtube') return 'VIDEO DE YOUTUBE';
        return this.isPlaying() ? '▶ REPRODUCIENDO' : '⏸ EN PAUSA';
    }

    /** Acción [E] */
    public toggle(): string {
        if (this.kind === 'none') {
            this.hud.showAchievementToast('Video próximamente', 'Este grupo todavía no subió el video de su experimento.', '🎬');
        } else if (this.kind === 'youtube') {
            this.openLarge();
        } else {
            const v = this.ensureVideo();
            if (v.paused || v.ended) this.play(); else v.pause();
        }
        return this.statusText();
    }

    /** Acción [R]: ver en grande con controles */
    public openLarge(): void {
        if (this.kind === 'none') {
            this.toggle();
            return;
        }
        if (this.kind === 'youtube') {
            const wrap = document.createElement('div');
            wrap.className = 'sala-video-wrap';
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${this.ytId}?autoplay=1&rel=0&modestbranding=1`;
            iframe.title = this.titulo;
            iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
            iframe.allowFullscreen = true;
            wrap.appendChild(iframe);
            this.setDucked(true);
            this.hud.openSalaModal(this.kicker, this.titulo, wrap, () => {
                iframe.src = 'about:blank'; // corta el audio al cerrar
                this.setDucked(false);
            });
            return;
        }
        const v = this.ensureVideo();
        const wrap = document.createElement('div');
        wrap.className = 'sala-video-wrap';
        v.controls = true;
        wrap.appendChild(v);
        this.hud.openSalaModal(this.kicker, this.titulo, wrap, () => {
            v.controls = false;
            wrap.removeChild(v);
        });
        if (v.paused) this.play();
    }

    public pause(): void {
        if (this.video && !this.video.paused) this.video.pause();
    }

    private play(): void {
        const v = this.ensureVideo();
        v.muted = false;
        v.volume = 1.0;
        v.play().catch(() => {
            this.hud.showAchievementToast('No se pudo reproducir', 'Revisá que el archivo de video exista y sea MP4 (H.264 + AAC).', '⚠️');
        });
    }

    private ensureVideo(): HTMLVideoElement {
        if (this.video) return this.video;
        const v = document.createElement('video');
        const isExternal = /^https?:\/\//i.test(this.src);
        if (isExternal) v.crossOrigin = 'anonymous';
        v.src = isExternal ? this.src : `${import.meta.env.BASE_URL}${this.src.replace(/^\/+/, '')}`;
        v.preload = 'metadata';
        v.playsInline = true;
        v.setAttribute('playsinline', '');

        const tex = new THREE.VideoTexture(v);
        tex.colorSpace = THREE.SRGBColorSpace;
        this.videoTex = tex;

        v.addEventListener('play', () => {
            this.parts.screenMat.map = tex;
            this.parts.screenMat.needsUpdate = true;
            this.setDucked(true);
        });
        v.addEventListener('pause', () => this.setDucked(false));
        v.addEventListener('ended', () => {
            this.setDucked(false);
            this.parts.screenMat.map = this.parts.poster;
            this.parts.screenMat.needsUpdate = true;
            v.currentTime = 0;
        });
        this.video = v;
        return v;
    }

    private ducked = false;
    private setDucked(on: boolean): void {
        if (on === this.ducked) return;
        this.ducked = on;
        SalaVideo.playingCount += on ? 1 : -1;
        SoundSynthesizer.getInstance().setDucked(SalaVideo.playingCount > 0);
    }

    public dispose(): void {
        this.pause();
        this.videoTex?.dispose();
    }
}
