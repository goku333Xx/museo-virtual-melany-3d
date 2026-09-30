import * as THREE from 'three';
import type { SalaParts } from './models/Environment';
import type { HUD } from './HUD';
import { SoundSynthesizer } from './SoundSynthesizer';

/** Extrae el id de un enlace de YouTube (watch, youtu.be, shorts, embed) */
export function youtubeId(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
}

const ONEDRIVE_HOSTS = /(^|\.)(onedrive\.live\.com|1drv\.ms|sharepoint\.com|onedrive\.com)$/i;

/**
 * Convierte un video compartido de OneDrive / SharePoint en una dirección para
 * mostrarlo dentro del museo. Acepta el código "Insertar" completo (<iframe ...>)
 * o el enlace para compartir. Devuelve null si no es de OneDrive.
 */
export function oneDriveEmbed(src: string): { embed: string; open: string } | null {
    const iframe = src.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
    const raw = (iframe ? iframe[1] : src).replace(/&amp;/g, '&').trim();
    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        return null;
    }
    if (!ONEDRIVE_HOSTS.test(url.hostname)) return null;

    const open = raw;
    const host = url.hostname.toLowerCase();
    if (host.endsWith('onedrive.live.com')) {
        if (url.pathname.startsWith('/embed')) return { embed: raw, open };
        const resid = url.searchParams.get('resid') ?? url.searchParams.get('id');
        const authkey = url.searchParams.get('authkey');
        if (resid) {
            const e = new URL('https://onedrive.live.com/embed');
            e.searchParams.set('resid', resid);
            if (authkey) e.searchParams.set('authkey', authkey);
            return { embed: e.toString(), open };
        }
        return { embed: raw, open };
    }
    if (host.endsWith('sharepoint.com')) {
        // Cuentas de la escuela (OneDrive para educación / empresas)
        if (url.pathname.includes('/_layouts/15/embed.aspx') || url.searchParams.get('action') === 'embedview') {
            return { embed: raw, open };
        }
        url.searchParams.set('action', 'embedview');
        return { embed: url.toString(), open };
    }
    // 1drv.ms u otros: se intenta mostrar tal cual (siempre queda el enlace para abrirlo aparte)
    if (host.endsWith('1drv.ms') && !url.searchParams.has('embed')) url.searchParams.set('embed', '1');
    return { embed: url.toString(), open };
}

/**
 * Video de una sala.
 * - Archivo propio (MP4): se reproduce en la pantalla de la pared con [E];
 *   [R] lo abre en grande con controles de volumen y pantalla completa.
 * - OneDrive / SharePoint (o YouTube): [E] o [R] lo abren en grande con el
 *   reproductor del servicio (no permiten mostrarlo dentro de la escena 3D).
 * Mientras suena, los efectos del museo se silencian para que se escuche bien.
 */
export class SalaVideo {
    readonly kind: 'none' | 'archivo' | 'embed';
    private video: HTMLVideoElement | null = null;
    private videoTex: THREE.VideoTexture | null = null;
    private embed: { embed: string; open: string } | null = null;
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
        if (this.src) {
            const yt = youtubeId(this.src);
            this.embed = yt
                ? { embed: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1`, open: this.src }
                : oneDriveEmbed(this.src);
        }
        this.kind = !this.src ? 'none' : this.embed ? 'embed' : 'archivo';
    }

    public isPlaying(): boolean {
        return !!this.video && !this.video.paused && !this.video.ended;
    }

    public statusText(): string {
        if (this.kind === 'none') return 'VIDEO PRÓXIMAMENTE';
        if (this.kind === 'embed') return 'VIDEO COMPARTIDO · SE ABRE EN GRANDE';
        return this.isPlaying() ? '▶ REPRODUCIENDO' : '⏸ EN PAUSA';
    }

    /** Acción [E] */
    public toggle(): string {
        if (this.kind === 'none') {
            this.hud.showAchievementToast('Video próximamente', 'Este grupo todavía no subió el video de su experimento.', '🎬');
        } else if (this.kind === 'embed') {
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
        if (this.kind === 'embed' && this.embed) {
            const box = document.createElement('div');
            const wrap = document.createElement('div');
            wrap.className = 'sala-video-wrap';
            const iframe = document.createElement('iframe');
            iframe.src = this.embed.embed;
            iframe.title = this.titulo;
            iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            wrap.appendChild(iframe);
            box.appendChild(wrap);

            // Por si el servicio no deja mostrarlo acá (por ejemplo, si pide iniciar sesión)
            const alt = document.createElement('p');
            alt.className = 'sala-video-alt';
            const a = document.createElement('a');
            a.href = this.embed.open;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = '¿No se ve? Abrir el video en una pestaña nueva ↗';
            alt.appendChild(a);
            box.appendChild(alt);

            this.setDucked(true);
            this.hud.openSalaModal(this.kicker, this.titulo, box, () => {
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
