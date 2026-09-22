import * as THREE from 'three';

export class EnergyCables {
    private group: THREE.Group;
    private curve: THREE.CatmullRomCurve3;
    private electrons: { mesh: THREE.Mesh, offset: number }[] = [];
    private speed: number = 0.2; // Adjust speed of electrons here

    constructor(points: THREE.Vector3[]) {
        this.group = new THREE.Group();

        // Create the CatmullRomCurve3 for the hanging cables
        this.curve = new THREE.CatmullRomCurve3(points, false, 'chordal', 0.5);

        // Create the cable tube with realistic shiny plastic insulation
        const tubeGeometry = new THREE.TubeGeometry(this.curve, 64, 0.008, 16, false);
        const tubeMaterial = new THREE.MeshStandardMaterial({
            color: 0x18181b,
            metalness: 0.2,
            roughness: 0.3
        });

        const cableMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
        this.group.add(cableMesh);

        // Setup the glowing spheres (electrons) - puro brillo emissivo sin 5 PointLights pesadas
        const numElectrons = 6;
        const electronGeometry = new THREE.SphereGeometry(0.016, 16, 16);
        const electronMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x67e8f9
        });

        for (let i = 0; i < numElectrons; i++) {
            const electronMesh = new THREE.Mesh(electronGeometry, electronMaterial);
            this.group.add(electronMesh);
            this.electrons.push({
                mesh: electronMesh,
                offset: i / numElectrons // Distribute them evenly along the curve
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
    public update(time: number, isOn: boolean): void {
        this.electrons.forEach((electron) => {
            // Hide the electrons if the machine is off
            electron.mesh.visible = isOn;

            if (isOn) {
                // Calculate position along the curve based on time and the electron's offset
                let progress = (time * this.speed + electron.offset) % 1;
                if (progress < 0) progress += 1; // Ensure progress stays positive if time happens to be negative

                // Update position
                const position = this.curve.getPointAt(progress);
                electron.mesh.position.copy(position);
            }
        });
    }
}
