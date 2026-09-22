import * as THREE from 'three';

export class PotatoBattery {
    private group: THREE.Group;

    constructor() {
        this.group = new THREE.Group();
        this.createPotato();
        this.createElectrodes();
    }

    private createPotato(): void {
        // High-poly icosahedron for an organic shape
        const geometry = new THREE.IcosahedronGeometry(0.15, 64);
        const positionAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();

        // Procedural vertex displacement for potato bumps and irregularities
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            
            // Base elongation (potatoes are generally oblong)
            vertex.x *= 1.4;
            vertex.y *= 0.9;
            vertex.z *= 0.9;

            // Simple noise using sine/cosine for displacement
            const noise = 
                Math.sin(vertex.x * 25.0) * 0.01 +
                Math.cos(vertex.y * 30.0) * 0.01 +
                Math.sin(vertex.z * 20.0) * 0.01 +
                Math.sin(vertex.x * 50.0 + vertex.y * 50.0) * 0.005;
            
            vertex.add(vertex.clone().normalize().multiplyScalar(noise));

            // Indentations (eyes of the potato)
            const eyeNoise = Math.pow(Math.abs(Math.sin(vertex.x * 30) * Math.cos(vertex.z * 30)), 4);
            vertex.add(vertex.clone().normalize().multiplyScalar(-eyeNoise * 0.015));

            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        geometry.computeVertexNormals();

        // Realistic potato material
        const material = new THREE.MeshStandardMaterial({
            color: 0x8b6d43, // earthy brown
            roughness: 0.85,
            metalness: 0.05,
            bumpScale: 0.02
        });
        
        const potatoMesh = new THREE.Mesh(geometry, material);
        potatoMesh.castShadow = true;
        potatoMesh.receiveShadow = true;

        this.group.add(potatoMesh);
    }

    private createElectrodes(): void {
        // Copper Electrode (Anode)
        const copperGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.2, 16);
        const copperMat = new THREE.MeshStandardMaterial({
            color: 0xb87333,
            roughness: 0.3,
            metalness: 0.9
        });
        const copperElectrode = new THREE.Mesh(copperGeo, copperMat);
        // Insert into the potato
        copperElectrode.position.set(0.1, 0.08, 0);
        copperElectrode.rotation.z = Math.PI / 8;
        copperElectrode.castShadow = true;

        // Zinc Electrode (Cathode) - Galvanized nail look
        const zincGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.2, 16);
        const zincMat = new THREE.MeshStandardMaterial({
            color: 0xa9a9a9,
            roughness: 0.4,
            metalness: 0.8
        });
        const zincElectrode = new THREE.Mesh(zincGeo, zincMat);
        // Insert into the potato
        zincElectrode.position.set(-0.1, 0.08, 0);
        zincElectrode.rotation.z = -Math.PI / 8;
        zincElectrode.castShadow = true;
        
        // Add top head to zinc electrode for realism (like a nail head)
        const zincHeadGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.01, 16);
        const zincHead = new THREE.Mesh(zincHeadGeo, zincMat);
        zincHead.position.y = 0.1;
        zincElectrode.add(zincHead);

        this.group.add(copperElectrode);
        this.group.add(zincElectrode);
    }

    public getMesh(): THREE.Group {
        return this.group;
    }
}
