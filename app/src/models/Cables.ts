import * as THREE from 'three';

export class EnergyCables {
    private group: THREE.Group;
    private curve: THREE.CatmullRomCurve3;
    private electrons: { mesh: THREE.Mesh, offset: number }[] = [];
    private speed: number = 0.4; // Faster educational speed
    private isSleeping = false;

    constructor(points: THREE.Vector3[], color: number = 0x18181b) {
        this.group = new THREE.Group();

        // Prevent clipping through the table (Y minimum ~0.08)
        const adjustedPoints = points.map(p => new THREE.Vector3(p.x, Math.max(p.y, 0.08), p.z));

        // Create the CatmullRomCurve3 for the hanging cables
        this.curve = new THREE.CatmullRomCurve3(adjustedPoints, false, 'chordal', 0.5);

        // Make them realistically thin: radius 0.004 instead of 0.02
        const tubeGeometry = new THREE.TubeGeometry(this.curve, 64, 0.004, 8, false);
        const tubeMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.2,
            emissive: color,
            emissiveIntensity: 0.1
        });

        const cableMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
        this.group.add(cableMesh);

        // Setup the glowing spheres (electrons)
        const numElectrons = 12;
        
        for (let i = 0; i < numElectrons; i++) {
            const eGroup = new THREE.Group();
            
            const sizes = [0.010, 0.007, 0.004];
            const opacities = [1.0, 0.8, 0.4];
            const offsets = [0, -0.015, -0.03];
            
            sizes.forEach((size, idx) => {
                const mat = new THREE.MeshBasicMaterial({ 
                    color: 0xffffff, 
                    transparent: true, 
                    opacity: opacities[idx],
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), mat);
                mesh.userData.curveOffset = offsets[idx];
                eGroup.add(mesh);
            });
            
            this.group.add(eGroup);
            this.electrons.push({
                mesh: eGroup as any,
                offset: i / numElectrons
            });
        }
    }

    public getMesh(): THREE.Group {
        return this.group;
    }

    public setSleep(sleep: boolean): void {
        this.isSleeping = sleep;
    }

    public update(time: number, isOn: boolean): void {
        if (this.isSleeping) return;
        this.electrons.forEach((electron) => {
            electron.mesh.visible = isOn;
            if (isOn) {
                let progress = (time * this.speed + electron.offset) % 1;
                if (progress < 0) progress += 1;

                electron.mesh.children.forEach(child => {
                    let o = child.userData.curveOffset || 0;
                    let p = progress + o;
                    if (p < 0) p += 1;
                    if (p > 1) p -= 1;
                    child.position.copy(this.curve.getPointAt(p));
                });
            }
        });
    }
}
