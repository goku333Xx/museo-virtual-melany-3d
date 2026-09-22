import * as THREE from 'three';

export class EnergyCables {
    private group: THREE.Group;
    private curve: THREE.CatmullRomCurve3;
    private electrons: { mesh: THREE.Mesh, offset: number }[] = [];
    private speed: number = 0.2; // Adjust speed of electrons here
    private isSleeping = false;

    constructor(points: THREE.Vector3[], color: number = 0x18181b) {
        this.group = new THREE.Group();

        // Create the CatmullRomCurve3 for the hanging cables
        this.curve = new THREE.CatmullRomCurve3(points, false, 'chordal', 0.5);

        // Create the cable tube with realistic shiny plastic insulation
        const tubeGeometry = new THREE.TubeGeometry(this.curve, 64, 0.008, 16, false);
        const tubeMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.2,
            roughness: 0.3
        });

        const cableMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
        this.group.add(cableMesh);

        // Setup the glowing spheres (electrons) - puro brillo emissivo sin 5 PointLights pesadas
        
        const numElectrons = 6;
        
        // Direction arrows
        const arrowGeo = new THREE.ConeGeometry(0.01, 0.02, 6);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
        [0.25, 0.5, 0.75].forEach(t => {
            const pos = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t);
            const arrow = new THREE.Mesh(arrowGeo, arrowMat);
            arrow.position.copy(pos);
            const up = new THREE.Vector3(0, 1, 0);
            const axis = new THREE.Vector3().crossVectors(up, tangent).normalize();
            const radians = Math.acos(up.dot(tangent));
            if (radians > 0) arrow.quaternion.setFromAxisAngle(axis, radians);
            this.group.add(arrow);
        });

        for (let i = 0; i < numElectrons; i++) {
            const eGroup = new THREE.Group();
            
            const sizes = [0.016, 0.012, 0.008];
            const opacities = [1.0, 0.6, 0.3];
            const offsets = [0, -0.02, -0.04];
            
            sizes.forEach((size, idx) => {
                const mat = new THREE.MeshBasicMaterial({ 
                    color: 0x67e8f9, 
                    transparent: true, 
                    opacity: opacities[idx] 
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

    /**
     * Returns the THREE.Group containing the cable and electrons.
     */
    public getMesh(): THREE.Group {
        return this.group;
    }

    /**
     * Updates the position of the electrons along the cable.
     * @param time The elapsed time (can be from requestAnimationFrame or a clock in seconds).
     * @param isOn Whether the energy flow is active.
     */
    public setSleep(sleep: boolean): void {
        this.isSleeping = sleep;
    }

    public update(time: number, isOn: boolean): void {
        if (this.isSleeping) return;
        this.electrons.forEach((electron) => {
            // Hide the electrons if the machine is off
            electron.mesh.visible = isOn;

            if (isOn) {
                // Calculate position along the curve based on time and the electron's offset
                let progress = (time * this.speed + electron.offset) % 1;
                if (progress < 0) progress += 1; // Ensure progress stays positive if time happens to be negative

                // Update position
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
