import * as THREE from 'three';
import type { TipoSimulacion } from '../salas.config';
import { PotatoBattery } from './Potato';
import { EnergyCables } from './Cables';
import { SwitchExhibit } from './SwitchAndLED';
import { TeslaCoil } from './TeslaCoil';
import { WindTurbineExhibit } from './WindTurbineExhibit';
import { SolarPanelExhibit } from './SolarPanelExhibit';
import { VanDeGraaffExhibit } from './VanDeGraaffExhibit';
import { NewtonsCradle } from './NewtonsCradle';
import { DynamoExhibit } from './DynamoExhibit';
import { SoundSynthesizer } from '../SoundSynthesizer';

/** Simulación que ocupa el centro de una sala, con una interfaz común. */
export interface Simulacion {
    /** Mallas que responden a la mira del visitante */
    meshes: THREE.Object3D[];
    /** Texto de estado para la tarjeta ("MODO: ...") o undefined */
    modeText(): string | undefined;
    /** Acción [E]; devuelve el nuevo texto de estado */
    interact(): string | undefined;
    update(time: number, delta: number, playerPos?: THREE.Vector3): void;
    setSleep(sleep: boolean): void;
}

const PEDESTAL_TOP = 1.2;

/**
 * Crea la simulación del tipo pedido sobre el pedestal ubicado en (x, z).
 * 'pendiente' es una vitrina con el cartel "Simulación en preparación".
 */
export function crearSimulacion(
    tipo: TipoSimulacion,
    scene: THREE.Scene,
    x: number,
    z: number,
    titulo: string,
    icono: string
): Simulacion {
    const sfx = SoundSynthesizer.getInstance();
    const y = PEDESTAL_TOP;

    switch (tipo) {
        case 'papa': {
            const offsets: [number, number][] = [[-0.82, -0.20], [-0.62, 0.22], [0.68, 0.15], [0.85, -0.22]];
            const potatoes = offsets.map(([dx, dz]) => {
                const p = new PotatoBattery();
                p.getMesh().position.set(x + dx, y + 0.12, z + dz);
                scene.add(p.getMesh());
                return p;
            });
            const sw = new SwitchExhibit();
            sw.getMesh().position.set(x - 0.05, y, z + 0.08);
            scene.add(sw.getMesh());
            const pts = [
                [-0.76, 0.16, -0.18], [-0.72, 0.08, 0.02], [-0.62, 0.16, 0.18], [-0.56, 0.16, 0.24],
                [-0.40, 0.06, 0.20], [-0.29, 0.05, 0.18], [-0.05, 0.05, 0.18], [0.19, 0.05, 0.18],
                [0.42, 0.06, 0.18], [0.64, 0.16, 0.12], [0.72, 0.16, 0.18], [0.78, 0.08, -0.04],
                [0.85, 0.16, -0.18], [0.0, 0.04, -0.42], [-0.85, 0.16, -0.22]
            ].map(([dx, dy, dz]) => new THREE.Vector3(x + dx, y + dy, z + dz));
            const cables = new EnergyCables(pts);
            scene.add(cables.getMesh());
            const state = () => sw.getState() ? 'ESTADO: CIRCUITO CERRADO (LED ENCENDIDO)' : 'ESTADO: CIRCUITO ABIERTO (APAGADO)';
            const meshes: THREE.Object3D[] = [...sw.getInteractables()];
            potatoes.forEach(p => p.getMesh().traverse(ch => { if ((ch as THREE.Mesh).isMesh) meshes.push(ch); }));
            return {
                meshes,
                modeText: state,
                interact: () => { const on = sw.toggle(); sfx.playSwitchClick(on); return state(); },
                update: (time, delta) => { sw.update(delta, true); cables.update(time, sw.getState()); },
                setSleep: (s) => { sw.setSleep(s); cables.setSleep(s); potatoes.forEach(p => p.setSleep(s)); }
            };
        }
        case 'tesla': {
            const m = new TeslaCoil();
            m.getMesh().position.set(x, y, z);
            scene.add(m.getMesh());
            const pos = new THREE.Vector3(x, y, z);
            return {
                meshes: m.getInteractables(),
                modeText: () => `MODO: ${m.getCurrentModeInfo().name.toUpperCase()}`,
                interact: () => { const n = m.cycleMode(); sfx.playTeslaZap(n.id === 0 ? 0.6 : n.id === 1 ? 1.0 : 0.8); return `MODO: ${n.name.toUpperCase()}`; },
                update: (time, _d, p) => m.update(time, p ? p.distanceTo(pos) : undefined),
                setSleep: (s) => m.setSleep(s)
            };
        }
        case 'eolico': {
            const m = new WindTurbineExhibit();
            m.getMesh().position.set(x, y, z);
            scene.add(m.getMesh());
            return {
                meshes: m.getInteractables(),
                modeText: () => `POTENCIA: ${m.getCurrentModeInfo().name.toUpperCase()}`,
                interact: () => { const n = m.cycleMode(); sfx.playWindTurbine(n.windSpeed / 8.0); return `POTENCIA: ${n.name.toUpperCase()}`; },
                update: (time, delta) => m.update(time, delta),
                setSleep: (s) => m.setSleep(s)
            };
        }
        case 'solar': {
            const m = new SolarPanelExhibit();
            m.getMesh().position.set(x, y, z);
            scene.add(m.getMesh());
            return {
                meshes: m.getInteractables(),
                modeText: () => `INCIDENCIA: ${m.getCurrentModeInfo().name.toUpperCase()}`,
                interact: () => { const n = m.cycleMode(); sfx.playSolarPhotons(n.efficiency); return `INCIDENCIA: ${n.name.toUpperCase()}`; },
                update: (time, delta) => m.update(time, delta),
                setSleep: (s) => m.setSleep(s)
            };
        }
        case 'vandegraaff': {
            const m = new VanDeGraaffExhibit();
            m.getMesh().position.set(x, y, z);
            scene.add(m.getMesh());
            return {
                meshes: m.getInteractables(),
                modeText: () => `ESTADO: ${m.getCurrentModeInfo().name.toUpperCase()}`,
                interact: () => {
                    const n = m.cycleMode();
                    if (n.id === 1) sfx.playElectrostaticSpark(); else sfx.playTeslaZap(0.5);
                    return `ESTADO: ${n.name.toUpperCase()}`;
                },
                update: (time, delta) => m.update(time, delta),
                setSleep: (s) => m.setSleep(s)
            };
        }
        case 'newton': {
            const m = new NewtonsCradle();
            m.getMesh().position.set(x, y, z);
            m.getMesh().scale.set(0.18, 0.18, 0.18);
            scene.add(m.getMesh());
            const pos = new THREE.Vector3(x, y, z);
            return {
                meshes: m.getInteractables(),
                modeText: () => `MODO: ${m.getCurrentModeInfo().name.toUpperCase()}`,
                interact: () => { const n = m.cycleMode(); sfx.playNewtonClack(1.0); return `MODO: ${n.name.toUpperCase()}`; },
                update: (time, _d, p) => m.update(time, p ? p.distanceTo(pos) : undefined),
                setSleep: (s) => m.setSleep(s)
            };
        }
        case 'dinamo': {
            const m = new DynamoExhibit();
            m.getMesh().position.set(x, y, z);
            scene.add(m.getMesh());
            return {
                meshes: m.getInteractables(),
                modeText: () => `POTENCIA: ${m.getCurrentModeInfo().name.toUpperCase()}`,
                interact: () => { const n = m.crankKick(); sfx.playDynamoCrank(n.voltage / 24.0); return `POTENCIA: ${n.name.toUpperCase()}`; },
                update: (time, delta) => m.update(time, delta),
                setSleep: (s) => m.setSleep(s)
            };
        }
        case 'pendiente':
        default:
            return crearVitrinaPendiente(scene, x, z, titulo, icono);
    }
}

// Vitrina de vidrio con un cartel mientras se arma la simulación del grupo
function crearVitrinaPendiente(scene: THREE.Scene, x: number, z: number, titulo: string, icono: string): Simulacion {
    const group = new THREE.Group();
    group.position.set(x, PEDESTAL_TOP, z);

    const glass = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.1, 1.6),
        new THREE.MeshStandardMaterial({ color: 0xdfeef0, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1, depthWrite: false })
    );
    glass.position.y = 0.55;
    group.add(glass);

    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x2b2724, roughness: 0.5, metalness: 0.4 });
    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(1.6, 1.1, 1.6)),
        new THREE.LineBasicMaterial({ color: 0x4a4540 })
    );
    edges.position.y = 0.55;
    group.add(edges);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.04, 1.66), edgeMat);
    base.position.y = 0.02;
    group.add(base);

    // Cartel doble cara dentro de la vitrina
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f7f4ee';
    ctx.fillRect(0, 0, 512, 384);
    ctx.strokeStyle = '#cfc6b8';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 492, 364);
    ctx.textAlign = 'center';
    ctx.font = '72px serif';
    ctx.fillText(icono, 256, 110);
    ctx.fillStyle = '#231f1c';
    ctx.font = '500 34px Georgia, "Times New Roman", serif';
    let t = titulo;
    while (t.length > 1 && ctx.measureText(t).width > 460) t = t.slice(0, -1);
    ctx.fillText(t === titulo ? t : t + '…', 256, 190);
    ctx.fillStyle = '#7a6f64';
    ctx.font = '600 22px Inter, system-ui, sans-serif';
    ctx.fillText('SIMULACIÓN EN PREPARACIÓN', 256, 260);
    ctx.font = '400 20px Inter, system-ui, sans-serif';
    ctx.fillText('Mientras tanto, mirá el video y los paneles', 256, 305);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const card = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.825), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    card.position.y = 0.52;
    group.add(card);

    scene.add(group);
    let sleeping = false;
    return {
        meshes: [glass],
        modeText: () => 'SIMULACIÓN EN PREPARACIÓN',
        interact: () => 'SIMULACIÓN EN PREPARACIÓN',
        update: (time) => { if (!sleeping) card.rotation.y = Math.sin(time * 0.4) * 0.6; },
        setSleep: (s) => { sleeping = s; }
    };
}
