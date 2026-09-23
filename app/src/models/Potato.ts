import * as THREE from 'three';

export class PotatoBattery {
    private group: THREE.Group;
    private isSleeping = false;
    private bubbles: { mesh: THREE.Mesh, basePos: THREE.Vector3, speed: number, offset: number }[] = [];
    private sparks: { mesh: THREE.Sprite, basePos: THREE.Vector3, speed: number, offset: number, radius: number }[] = [];

    constructor() {
        this.group = new THREE.Group();
        this.createPotato();
        this.createElectrodes();
    }

    private createPotato(): void {
        const geometry = new THREE.SphereGeometry(0.08, 16, 16);

        // Realistic potato material
        const material = new THREE.MeshStandardMaterial({
            color: 0x8b6d43, // earthy brown
            roughness: 0.9,
            metalness: 0.02,
            bumpScale: 0.03
        });
        
        const potatoMesh1 = new THREE.Mesh(geometry, material);
        potatoMesh1.scale.set(1, 0.8, 1.2);
        potatoMesh1.position.set(-0.12, -0.05, 0);
        potatoMesh1.castShadow = true;
        potatoMesh1.receiveShadow = true;

        const potatoMesh2 = new THREE.Mesh(geometry, material);
        potatoMesh2.scale.set(1.1, 0.7, 1.1);
        potatoMesh2.position.set(0.12, -0.05, 0);
        potatoMesh2.rotation.y = Math.PI / 4;
        potatoMesh2.castShadow = true;
        potatoMesh2.receiveShadow = true;

        this.group.add(potatoMesh1, potatoMesh2);

        // Laboratory Tray
        const trayGeo = new THREE.BoxGeometry(0.6, 0.02, 0.4);
        const trayMat = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            metalness: 0.8,
            roughness: 0.2
        });
        const tray = new THREE.Mesh(trayGeo, trayMat);
        tray.position.set(0, -0.1, 0);
        tray.receiveShadow = true;
        tray.castShadow = true;
        this.group.add(tray);
    }

    private createElectrodes(): void {
        // Copper Electrode (Anode) - highly realistic look
        const copperGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.2, 16);
        const copperMat = new THREE.MeshStandardMaterial({
            color: 0xb87333,
            roughness: 0.2,
            metalness: 1.0
        });
        const copperElectrode = new THREE.Mesh(copperGeo, copperMat);
        copperElectrode.position.set(0.12, 0.08, 0);
        copperElectrode.rotation.z = Math.PI / 8;
        copperElectrode.castShadow = true;

        // Copper head
        const copperHeadGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.01, 16);
        const copperHead = new THREE.Mesh(copperHeadGeo, copperMat);
        copperHead.position.y = 0.1;
        copperElectrode.add(copperHead);

        // Zinc Electrode (Cathode) - Galvanized nail look
        const zincGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.2, 16);
        const zincMat = new THREE.MeshStandardMaterial({
            color: 0x9ca3af,
            roughness: 0.3,
            metalness: 0.85
        });
        const zincElectrode = new THREE.Mesh(zincGeo, zincMat);
        zincElectrode.position.set(-0.12, 0.08, 0);
        zincElectrode.rotation.z = -Math.PI / 8;
        zincElectrode.castShadow = true;
        
        // Add top head to zinc electrode for realism (like a nail head)
        const zincHeadGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.01, 16);
        const zincHead = new THREE.Mesh(zincHeadGeo, zincMat);
        zincHead.position.y = 0.1;
        zincElectrode.add(zincHead);

        this.group.add(copperElectrode);
        this.group.add(zincElectrode);

        const createLabel = (text: string, color: string, pos: THREE.Vector3) => {
            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.fillStyle = color;
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(text, 64, 44);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }));
            sprite.scale.set(0.12, 0.06, 1);
            sprite.position.copy(pos);
            this.group.add(sprite);
        };
        createLabel('+ Cu', '#d4af37', new THREE.Vector3(0.12, 0.22, 0));
        createLabel('- Zn', '#a9a9a9', new THREE.Vector3(-0.12, 0.22, 0));

        const bubbleGeo = new THREE.SphereGeometry(0.005, 8, 8);
        const bubbleMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, roughness: 0.1, transparent: true });
        const addBubbles = (basePos: THREE.Vector3) => {
            for(let i=0; i<3; i++) {
                const b = new THREE.Mesh(bubbleGeo, bubbleMat);
                b.visible = false;
                this.group.add(b);
                this.bubbles.push({ mesh: b, basePos: basePos.clone(), speed: 0.5 + Math.random()*0.5, offset: Math.random() });
            }
        };
        addBubbles(new THREE.Vector3(0.12, 0.08, 0));
        addBubbles(new THREE.Vector3(-0.12, 0.08, 0));

        // Tiny glowing sparks / floating energy motes
        const sparkCanvas = document.createElement('canvas');
        sparkCanvas.width = 16; sparkCanvas.height = 16;
        const sCtx = sparkCanvas.getContext('2d');
        if (sCtx) {
            const grad = sCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
            grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
            grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            sCtx.fillStyle = grad;
            sCtx.fillRect(0, 0, 16, 16);
        }
        const sparkTex = new THREE.CanvasTexture(sparkCanvas);
        
        const addSparks = (basePos: THREE.Vector3, isZinc: boolean) => {
            const color = isZinc ? 0x88ccff : 0xffaa00;
            const mat = new THREE.SpriteMaterial({ 
                map: sparkTex,
                color: color, 
                transparent: true, 
                opacity: 0.8,
                blending: THREE.AdditiveBlending 
            });
            for(let i = 0; i < 6; i++) {
                const s = new THREE.Sprite(mat);
                s.scale.set(0.03, 0.03, 1);
                s.visible = false;
                this.group.add(s);
                this.sparks.push({ 
                    mesh: s, 
                    basePos: basePos.clone(), 
                    speed: 1.5 + Math.random(), 
                    offset: Math.random() * Math.PI * 2,
                    radius: 0.015 + Math.random() * 0.015
                });
            }
        };
        addSparks(new THREE.Vector3(0.12, 0.08, 0), false); // Copper
        addSparks(new THREE.Vector3(-0.12, 0.08, 0), true);  // Zinc
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

        this.sparks.forEach(s => {
            s.mesh.visible = isOn;
            if (isOn) {
                const angle = time * s.speed + s.offset;
                const vertPos = Math.sin(time * s.speed * 0.4 + s.offset) * 0.06;
                s.mesh.position.copy(s.basePos);
                s.mesh.position.x += Math.cos(angle) * s.radius;
                s.mesh.position.z += Math.sin(angle) * s.radius;
                s.mesh.position.y += vertPos;
                
                const mat = s.mesh.material as THREE.Material;
                mat.opacity = 0.8 * (1.0 - Math.abs(vertPos) / 0.06);
            }
        });
    }

    public getMesh(): THREE.Group {
        return this.group;
    }
}
