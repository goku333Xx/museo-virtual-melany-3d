import * as THREE from 'three';

/**
 * Esculturas geométricas abstractas sobre plintos, para las esquinas del museo.
 * Son estáticas (sin animación) y de pocos polígonos.
 */
export type TipoEscultura = 'cubos' | 'nudo' | 'icosaedro' | 'columna' | 'anillos' | 'arco';

export interface Escultura {
    group: THREE.Group;
    /** Medio ancho del plinto, para la colisión */
    half: number;
}

const bronce = new THREE.MeshStandardMaterial({ color: 0xa88450, roughness: 0.38, metalness: 0.55 });
const bronceOscuro = new THREE.MeshStandardMaterial({ color: 0x6f5430, roughness: 0.45, metalness: 0.5 });
const marmol = new THREE.MeshStandardMaterial({ color: 0xf1eee8, roughness: 0.5, metalness: 0.0 });
const grafito = new THREE.MeshStandardMaterial({ color: 0x2b2a2e, roughness: 0.35, metalness: 0.3 });
const plintoMat = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.85, metalness: 0.0 });
const bunaMat = new THREE.MeshStandardMaterial({ color: 0x2b2724, roughness: 0.7, metalness: 0.0 });

export function crearEscultura(tipo: TipoEscultura): Escultura {
    const group = new THREE.Group();
    const ancho = 0.9;
    const alto = 0.9;

    // Plinto blanco con buña oscura, como los pedestales de las salas
    const plinto = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto - 0.05, ancho), plintoMat);
    plinto.position.y = 0.05 + (alto - 0.05) / 2;
    plinto.castShadow = true;
    plinto.receiveShadow = true;
    group.add(plinto);
    const buna = new THREE.Mesh(new THREE.BoxGeometry(ancho - 0.05, 0.05, ancho - 0.05), bunaMat);
    buna.position.y = 0.025;
    group.add(buna);

    const obra = new THREE.Group();
    obra.position.y = alto;
    group.add(obra);
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.rotation.set(rx, ry, rz);
        m.castShadow = true;
        obra.add(m);
        return m;
    };

    switch (tipo) {
        case 'cubos': {
            // Torre de cubos apoyados uno sobre otro, cada uno más chico y girado
            const tam = [0.56, 0.44, 0.33, 0.23];
            let y = 0;
            tam.forEach((s, k) => {
                add(new THREE.BoxGeometry(s, s, s), k % 2 ? grafito : bronce, 0, y + s / 2, 0, 0, k * 0.42, 0);
                y += s;
            });
            break;
        }
        case 'nudo': {
            add(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 12), grafito, 0, 0.175, 0);
            add(new THREE.TorusKnotGeometry(0.32, 0.075, 96, 12, 2, 3), bronce, 0, 0.75, 0, 0.3, 0, 0);
            break;
        }
        case 'icosaedro': {
            add(new THREE.IcosahedronGeometry(0.42, 0), marmol, 0, 0.5, 0, 0.2, 0.4, 0);
            add(new THREE.TorusGeometry(0.58, 0.022, 10, 64), bronce, 0, 0.5, 0, Math.PI / 2.4, 0, 0.3);
            break;
        }
        case 'columna': {
            // Octaedros apilados que giran de a poco hacia arriba
            for (let k = 0; k < 5; k++) {
                const s = 0.22 - k * 0.025;
                add(new THREE.OctahedronGeometry(s, 0), k % 2 ? bronce : grafito, 0, 0.2 + k * 0.33, 0, 0, k * 0.35, 0);
            }
            break;
        }
        case 'anillos': {
            // Esfera armilar: tres anillos cruzados y una esfera
            add(new THREE.CylinderGeometry(0.04, 0.06, 0.25, 12), grafito, 0, 0.125, 0);
            add(new THREE.SphereGeometry(0.14, 24, 16), marmol, 0, 0.62, 0);
            add(new THREE.TorusGeometry(0.38, 0.02, 10, 64), bronce, 0, 0.62, 0, 0, 0, 0);
            add(new THREE.TorusGeometry(0.38, 0.02, 10, 64), bronce, 0, 0.62, 0, Math.PI / 2, 0, 0);
            add(new THREE.TorusGeometry(0.38, 0.02, 10, 64), bronceOscuro, 0, 0.62, 0, Math.PI / 4, Math.PI / 2, 0);
            break;
        }
        case 'arco':
        default: {
            // Arco de semicírculo con un cubo en equilibrio
            add(new THREE.TorusGeometry(0.34, 0.07, 12, 48, Math.PI), grafito, 0, 0.02, 0);
            add(new THREE.BoxGeometry(0.22, 0.22, 0.22), bronce, 0, 0.47, 0, Math.PI / 4, 0, Math.PI / 4);
            break;
        }
    }

    return { group, half: ancho / 2 };
}
