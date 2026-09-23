import * as THREE from 'three';

export class PotatoBattery {
    private group: THREE.Group;
    private isSleeping = false;
    private bubbles: { mesh: THREE.Mesh, basePos: THREE.Vector3, speed: number, offset: number }[] = [];

    constructor() {
        this.group = new THREE.Group();
        this.createPotato();
        this.createElectrodes();
    }

    private createPotato(): void {
        const geometry = new THREE.SphereGeometry(0.15, 12, 12);

        // Realistic potato material
        const material = new THREE.MeshStandardMaterial({
            color: 0x8b6d43, // earthy brown
            roughness: 0.85,
            metalness: 0.05,
            bumpScale: 0.02
        });
        
        const potatoMesh = new THREE.Mesh(geometry, material);
        potatoMesh.scale.set(1, 0.8, 1.2);
        potatoMesh.castShadow = true;
        potatoMesh.receiveShadow = true;

        this.group.add(potatoMesh);

        // Laboratory Tray
        const trayGeo = new THREE.BoxGeometry(0.6, 0.05, 0.4);
        const trayMat = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            metalness: 0.8,
            roughness: 0.2
        });
        const tray = new THREE.Mesh(trayGeo, trayMat);
        tray.position.set(0, -0.145, 0);
        tray.receiveShadow = true;
        tray.castShadow = true;
        this.group.add(tray);

        // Dramatic mad scientist base glow
        const glowGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.02, 32);
        const glowMat = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.6
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(0, -0.12, 0);
        this.group.add(glow);

        const sproutGeo = new THREE.ConeGeometry(0.015, 0.04, 8);
        const sproutMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.8 });
        const sprout = new THREE.Mesh(sproutGeo, sproutMat);
        sprout.position.set(0, 0.15, 0);
        this.group.add(sprout);
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

        const createLabel = (text: string, color: string, pos: THREE.Vector3) => {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 32;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.fillStyle = color;
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(text, 32, 24);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }));
            sprite.scale.set(0.08, 0.04, 1);
            sprite.position.copy(pos);
            this.group.add(sprite);
        };
        createLabel('+ Cu', '#d4af37', new THREE.Vector3(0.1, 0.2, 0));
        createLabel('- Zn', '#a9a9a9', new THREE.Vector3(-0.1, 0.2, 0));

        const bubbleGeo = new THREE.SphereGeometry(0.005, 8, 8);
        const bubbleMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const addBubbles = (basePos: THREE.Vector3) => {
            for(let i=0; i<3; i++) {
                const b = new THREE.Mesh(bubbleGeo, bubbleMat);
                b.visible = false;
                this.group.add(b);
                this.bubbles.push({ mesh: b, basePos: basePos.clone(), speed: 0.5 + Math.random()*0.5, offset: Math.random() });
            }
        };
        addBubbles(new THREE.Vector3(0.1, 0.08, 0));
        addBubbles(new THREE.Vector3(-0.1, 0.08, 0));

    }

    
    public setSleep(sleep: boolean): void {
        this.isSleeping = sleep;
    }

    public update(time: number, isOn: boolean): void {
        if (this.isSleeping) return;
        this.bubbles.forEach(b => {
            b.mesh.visible = isOn;
            if (isOn) {
                let p = ((time * b.speed) + b.offset) % 1;
                b.mesh.position.copy(b.basePos);
                b.mesh.position.y += p * 0.15;
                b.mesh.position.x += Math.sin(time * 10 + b.offset * 10) * 0.01;
            }
        });
    }

    public getMesh(): THREE.Group {
        return this.group;
    }
}
