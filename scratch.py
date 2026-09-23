import re

with open('app/src/models/Environment.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. buildFloorRunwayAndZones
new_runways = """
    private buildFloorRunwayAndZones() {
        const runwayMat = new THREE.MeshStandardMaterial({
            color: 0xcbd5e1,
            roughness: 0.3,
            metalness: 0.12
        });
        const brassMat = new THREE.MeshStandardMaterial({
            color: 0xc49b55,
            roughness: 0.3,
            metalness: 0.8
        });

        // 1. Hallway Eje Norte-Sur (De Z = -40 a Z = 25, longitud 65m)
        const nsRunway = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 65), runwayMat);
        nsRunway.rotation.x = -Math.PI / 2;
        nsRunway.position.set(0, 0.005, -7.5);
        nsRunway.receiveShadow = true;
        this.group.add(nsRunway);

        // Guías de latón
        const nsGuideGeom = new THREE.BoxGeometry(0.04, 0.01, 65);
        const nsLeftGuide = new THREE.Mesh(nsGuideGeom, brassMat);
        nsLeftGuide.position.set(-1.8, 0.008, -7.5);
        const nsRightGuide = new THREE.Mesh(nsGuideGeom, brassMat);
        nsRightGuide.position.set(1.8, 0.008, -7.5);
        this.group.add(nsLeftGuide, nsRightGuide);

        // 4. Círculos de demarcación bajo los 8 pedestales
        const stationZones: [number, number, number][] = [
            [-15, 10, 0x4ade80],   // Sala 1
            [-15, 0, 0x38bdf8],    // Sala 2
            [-15, -10, 0x00f0ff],  // Sala 3
            [-15, -20, 0xfde047],  // Sala 4
            [15, 10, 0xc084fc],    // Sala 5
            [15, 0, 0xf59e0b],     // Sala 6
            [15, -10, 0xf97316],   // Sala 7
            [0, -35, 0xd946ef]     // Galería
        ];

        const ringGeom = new THREE.RingGeometry(2.1, 2.2, 48);
        stationZones.forEach(([zx, zz, colorHex]) => {
            const ringMat = new THREE.MeshBasicMaterial({
                color: colorHex,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.45
            });
            const circle = new THREE.Mesh(ringGeom, ringMat);
            circle.rotation.x = -Math.PI / 2;
            circle.position.set(zx, 0.012, zz);
            this.group.add(circle);
        });
    }
"""
content = re.sub(r'private buildFloorRunwayAndZones\(\) \{.*?(?=\n    // --- NÚCLEO)', new_runways.strip() + "\n", content, flags=re.DOTALL)

# 2. buildCentralAtriumBeacon - removing circular elements
new_beacon = """
    private buildCentralAtriumBeacon() {
        const beaconGroup = new THREE.Group();
        beaconGroup.position.set(0, 0, 15);

        // Base rectangular de madera
        const baseGeom = new THREE.BoxGeometry(2.4, 0.45, 2.4);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x5c4033,
            roughness: 0.8,
            metalness: 0.05
        });
        
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.set(0, 0.225, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        beaconGroup.add(base);
        this.collidables.push(base);

        this.group.add(beaconGroup);
    }
"""
content = re.sub(r'private buildCentralAtriumBeacon\(\) \{.*?(?=\n    // --- ARCOS)', new_beacon.strip() + "\n", content, flags=re.DOTALL)

# 3. buildRoomPortals
new_portals = """
    private buildRoomPortals() {
        const portalConfigs = [
            { pos: [-5, 10], rotY: Math.PI / 2, title: "SALA 01: PILA DE PAPA", sub: "Química a Eléctrica · Jugo Ácido", color: "#4ade80" },
            { pos: [-5, 0], rotY: Math.PI / 2, title: "SALA 02: BOBINA DE TESLA", sub: "Alta Tensión · Electricidad sin Cables", color: "#38bdf8" },
            { pos: [-5, -10], rotY: Math.PI / 2, title: "SALA 03: AEROGENERADOR", sub: "Energía del Viento · Imanes y Mini Ciudad", color: "#00f0ff" },
            { pos: [-5, -20], rotY: Math.PI / 2, title: "SALA 04: ENERGÍA SOLAR", sub: "Fotones y Luz · Motor del Avión", color: "#fde047" },
            { pos: [5, 10], rotY: -Math.PI / 2, title: "SALA 05: GENERADOR ELECTROSTÁTICO", sub: "Fricción y Cargas · Cintas Voladoras", color: "#c084fc" },
            { pos: [5, 0], rotY: -Math.PI / 2, title: "SALA 06: CUNA DE NEWTON", sub: "Energía de Choque · Olas Invisibles", color: "#f59e0b" },
            { pos: [5, -10], rotY: -Math.PI / 2, title: "SALA 07: DÍNAMO MANUAL", sub: "Fuerza Muscular a Luz · Manivela y Bombilla", color: "#f97316" },
            { pos: [0, -25], rotY: 0, title: "GALERÍA ESPECIAL: PRISMA ÓPTICO", sub: "El Secreto del Arcoíris · Newton", color: "#d946ef" }
        ];

        const archMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
        const postGeom = new THREE.BoxGeometry(0.24, 3.8, 0.24);
        const lintelGeom = new THREE.BoxGeometry(3.6, 0.35, 0.35);

        portalConfigs.forEach(cfg => {
            const portal = new THREE.Group();
            portal.position.set(cfg.pos[0], 0, cfg.pos[1]);
            portal.rotation.y = cfg.rotY;

            const postL = new THREE.Mesh(postGeom, archMat);
            postL.position.set(-1.6, 1.9, 0);
            portal.add(postL);

            const postR = new THREE.Mesh(postGeom, archMat);
            postR.position.set(1.6, 1.9, 0);
            portal.add(postR);

            const lintel = new THREE.Mesh(lintelGeom, archMat);
            lintel.position.set(0, 3.8, 0);
            portal.add(lintel);

            const signTex = this.generateSignTexture(cfg.title, cfg.sub, cfg.color);
            const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
            const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), signMat);
            sign.position.set(0, 3.3, 0.05);
            portal.add(sign);

            const signBack = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), signMat);
            signBack.position.set(0, 3.3, -0.05);
            signBack.rotation.y = Math.PI;
            portal.add(signBack);

            this.group.add(portal);
        });
    }
"""
content = re.sub(r'private buildRoomPortals\(\) \{.*?(?=\n    // --- SALAS)', new_portals.strip() + "\n", content, flags=re.DOTALL)

# 4. buildEnclosedRooms
new_rooms = """
    private buildEnclosedRooms() {
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.65,
            metalness: 0.05
        });
        const trimMat = new THREE.MeshStandardMaterial({
            color: 0xc49b55,
            roughness: 0.3,
            metalness: 0.8
        });
        const coveMat = new THREE.MeshStandardMaterial({
            color: 0xffedd5,
            emissive: 0xfbbf24,
            emissiveIntensity: 0.35,
            roughness: 0.5
        });

        const wallHeight = 4.5;

        const createWall = (minX: number, maxX: number, minZ: number, maxZ: number) => {
            const w = Math.max(0.12, maxX - minX);
            const d = Math.max(0.12, maxZ - minZ);
            const posX = (minX + maxX) / 2;
            const posZ = (minZ + maxZ) / 2;

            const wallGeom = new THREE.BoxGeometry(w, wallHeight, d);
            const wallMesh = new THREE.Mesh(wallGeom, wallMat);
            wallMesh.position.set(posX, wallHeight / 2, posZ);
            wallMesh.castShadow = false;
            wallMesh.receiveShadow = true;
            this.group.add(wallMesh);
            this.collidables.push(wallMesh);

            const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.22, d + 0.04), trimMat);
            baseMesh.position.set(posX, 0.11, posZ);
            this.group.add(baseMesh);

            const topMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.18, d + 0.05), coveMat);
            topMesh.position.set(posX, wallHeight - 0.09, posZ);
            this.group.add(topMesh);

            this.internalWallBoxes.push({ minX, maxX, minZ, maxZ });
        };

        const createDoorLintel = (minX: number, maxX: number, minZ: number, maxZ: number) => {
            const w = Math.max(0.12, maxX - minX);
            const d = Math.max(0.12, maxZ - minZ);
            const doorHeight = 3.8;
            const h = wallHeight - doorHeight;
            const posX = (minX + maxX) / 2;
            const posZ = (minZ + maxZ) / 2;
            const posY = doorHeight + h / 2;

            const lintelMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
            lintelMesh.position.set(posX, posY, posZ);
            this.group.add(lintelMesh);

            const topMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.18, d + 0.05), coveMat);
            topMesh.position.set(posX, wallHeight - 0.09, posZ);
            this.group.add(topMesh);
        };

        // Pasillo Central: Muros Este y Oeste, cortados por puertas (Z: -25 a 25)
        // Muro Oeste del Pasillo (X = -5)
        createWall(-5.15, -4.85, 11.6, 25);
        createDoorLintel(-5.15, -4.85, 8.4, 11.6); // Sala 1
        createWall(-5.15, -4.85, 1.6, 8.4);
        createDoorLintel(-5.15, -4.85, -1.6, 1.6); // Sala 2
        createWall(-5.15, -4.85, -8.4, -1.6);
        createDoorLintel(-5.15, -4.85, -11.6, -8.4); // Sala 3
        createWall(-5.15, -4.85, -18.4, -11.6);
        createDoorLintel(-5.15, -4.85, -21.6, -18.4); // Sala 4
        createWall(-5.15, -4.85, -25, -21.6);

        // Muro Este del Pasillo (X = 5)
        createWall(4.85, 5.15, 11.6, 25);
        createDoorLintel(4.85, 5.15, 8.4, 11.6); // Sala 5
        createWall(4.85, 5.15, 1.6, 8.4);
        createDoorLintel(4.85, 5.15, -1.6, 1.6); // Sala 6
        createWall(4.85, 5.15, -8.4, -1.6);
        createDoorLintel(4.85, 5.15, -11.6, -8.4); // Sala 7
        createWall(4.85, 5.15, -25, -11.6);
        
        // Muro Norte del Pasillo (Galeria) (Z = -25)
        createWall(-4.85, -1.6, -25.15, -24.85);
        createDoorLintel(-1.6, 1.6, -25.15, -24.85); // Sala 8 (Galeria)
        createWall(1.6, 4.85, -25.15, -24.85);

        // Paredes separadoras de salas (Lado Izquierdo, X: -25 a -5.15)
        createWall(-25, -5.15, 4.85, 5.15); // Entre Sala 1 y 2
        createWall(-25, -5.15, -5.15, -4.85); // Entre Sala 2 y 3
        createWall(-25, -5.15, -15.15, -14.85); // Entre Sala 3 y 4
        
        // Paredes separadoras de salas (Lado Derecho, X: 5.15 a 25)
        createWall(5.15, 25, 4.85, 5.15); // Entre Sala 5 y 6
        createWall(5.15, 25, -5.15, -4.85); // Entre Sala 6 y 7

        const roomConfigs = [
            { x: -15, z: 10, color: 0x4ade80, name: "Sala 1: Papa" },
            { x: -15, z: 0, color: 0x38bdf8, name: "Sala 2: Tesla" },
            { x: -15, z: -10, color: 0x00f0ff, name: "Sala 3: Eólica" },
            { x: -15, z: -20, color: 0xfde047, name: "Sala 4: Solar" },
            { x: 15, z: 10, color: 0xc084fc, name: "Sala 5: Van de Graaff" },
            { x: 15, z: 0, color: 0xf59e0b, name: "Sala 6: Newton" },
            { x: 15, z: -10, color: 0xf97316, name: "Sala 7: Dínamo" },
            { x: 0, z: -35, color: 0xd946ef, name: "Galería Óptica" }
        ];

        roomConfigs.forEach((rc, idx) => {
            const isActive = idx === 0;
            const roomLight = new THREE.PointLight(0xfff7ed, 1.4, 18.0, 1.2);
            roomLight.position.set(rc.x, 4.2, rc.z);
            roomLight.visible = isActive;
            this.group.add(roomLight);

            const accentLight = new THREE.PointLight(rc.color, 0.8, 8.0, 2.0);
            accentLight.position.set(rc.x, 3.8, rc.z);
            accentLight.visible = isActive;
            this.group.add(accentLight);

            this.roomLights.push({ roomLight, accentLight });

            this.createWallSconce(rc.x - 3.5, 2.4, rc.z - 3.5, rc.color);
            this.createWallSconce(rc.x + 3.5, 2.4, rc.z + 3.5, rc.color);
        });

        const atriumPos = [
            [0, 4.4, 15],
            [0, 4.4, 0],
            [0, 4.4, -15]
        ];
        atriumPos.forEach(pos => {
            const atriumLight = new THREE.PointLight(0xfffbeb, 0.8, 15.0, 1.3);
            atriumLight.position.set(pos[0], pos[1], pos[2]);
            this.group.add(atriumLight);
        });
    }
"""
content = re.sub(r'private buildEnclosedRooms\(\) \{.*?(?=\n    private createWallSconce)', new_rooms.strip() + "\n", content, flags=re.DOTALL)

# 5. buildPedestals
new_pedestals = """
    private buildPedestals() {
        const pedestalHeight = 1.2;
        const pedestalWidth = 2.4;
        const pedestalDepth = 2.4;

        const baseGeom = new THREE.BoxGeometry(pedestalWidth, pedestalHeight, pedestalDepth);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x334155, 
            roughness: 0.5, 
            metalness: 0.25 
        });

        const borderMat = new THREE.MeshStandardMaterial({
            color: 0xc49b55,
            roughness: 0.3,
            metalness: 0.8
        });

        const positions = [
            [-15, 10],   // 1. Pila de Papa
            [-15, 0],    // 2. Bobina de Tesla
            [-15, -10],  // 3. Aerogenerador Faraday
            [-15, -20],  // 4. Panel Solar & Motor
            [15, 10],    // 5. Generador Van de Graaff
            [15, 0],     // 6. Cuna de Newton
            [15, -10],   // 7. Dínamo Manual con Manivela
            [0, -35]     // 8. Alcoba Especial: Prisma Óptico
        ];

        positions.forEach((pos, idx) => {
            const pedestalGroup = new THREE.Group();

            const pedestal = new THREE.Mesh(baseGeom, baseMaterial);
            pedestal.position.set(0, pedestalHeight / 2, 0);
            pedestal.castShadow = false;
            pedestal.receiveShadow = true;
            pedestalGroup.add(pedestal);

            const edgeH = 0.02;
            const edgeW = 0.035;

            const edgeBack = new THREE.Mesh(new THREE.BoxGeometry(pedestalWidth, edgeH, edgeW), borderMat);
            edgeBack.position.set(0, pedestalHeight + edgeH / 2, -pedestalDepth / 2 + edgeW / 2);
            const edgeFront = new THREE.Mesh(new THREE.BoxGeometry(pedestalWidth, edgeH, edgeW), borderMat);
            edgeFront.position.set(0, pedestalHeight + edgeH / 2, pedestalDepth / 2 - edgeW / 2);
            const edgeLeft = new THREE.Mesh(new THREE.BoxGeometry(edgeW, edgeH, pedestalDepth), borderMat);
            edgeLeft.position.set(-pedestalWidth / 2 + edgeW / 2, pedestalHeight + edgeH / 2, 0);
            const edgeRight = new THREE.Mesh(new THREE.BoxGeometry(edgeW, edgeH, pedestalDepth), borderMat);
            edgeRight.position.set(pedestalWidth / 2 - edgeW / 2, pedestalHeight + edgeH / 2, 0);

            pedestalGroup.add(edgeBack, edgeFront, edgeLeft, edgeRight);

            pedestalGroup.position.set(pos[0], 0, pos[1]);
            this.group.add(pedestalGroup);

            this.collidables.push(pedestal);
            this.pedestalMeshes.push(pedestal);

            this.createFloatingHaloLight(pos[0], pos[1], idx * 2.1);
        });
    }
"""
content = re.sub(r'private buildPedestals\(\) \{.*?(?=\n    private createFloatingHaloLight)', new_pedestals.strip() + "\n", content, flags=re.DOTALL)


# 6. buildViewingIndicators
new_indicators = """
    private buildViewingIndicators(): void {
        const roomData = [
            { name: '🥔 PILA DE PAPA', pos: [-15, 10], viewDir: [1, 0], color: '#4ade80' },
            { name: '⚡ BOBINA DE TESLA', pos: [-15, 0], viewDir: [1, 0], color: '#38bdf8' },
            { name: '🌪️ AEROGENERADOR', pos: [-15, -10], viewDir: [1, 0], color: '#00f0ff' },
            { name: '☀️ PANEL SOLAR', pos: [-15, -20], viewDir: [1, 0], color: '#fde047' },
            { name: '⚡ VAN DE GRAAFF', pos: [15, 10], viewDir: [-1, 0], color: '#c084fc' },
            { name: '⚖️ CUNA DE NEWTON', pos: [15, 0], viewDir: [-1, 0], color: '#f59e0b' },
            { name: '⚙️ DÍNAMO MANUAL', pos: [15, -10], viewDir: [-1, 0], color: '#f97316' },
            { name: '🌈 PRISMA ÓPTICO', pos: [0, -35], viewDir: [0, 1], color: '#d946ef' }
        ];

        for (const room of roomData) {
            const arrowCanvas = document.createElement('canvas');
            arrowCanvas.width = 256;
            arrowCanvas.height = 128;
            const ctx = arrowCanvas.getContext('2d')!;
            ctx.clearRect(0, 0, 256, 128);
            ctx.fillStyle = room.color;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(128, 15);
            ctx.lineTo(180, 50);
            ctx.lineTo(145, 50);
            ctx.lineTo(145, 75);
            ctx.lineTo(111, 75);
            ctx.lineTo(111, 50);
            ctx.lineTo(76, 50);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('👀 OBSERVÁ', 128, 95);
            ctx.fillText('DESDE ACÁ', 128, 115);
            const arrowTex = new THREE.CanvasTexture(arrowCanvas);
            const arrow = new THREE.Mesh(
                new THREE.PlaneGeometry(1.6, 0.8),
                new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
            );
            arrow.rotation.x = -Math.PI / 2;
            arrow.position.set(
                room.pos[0] + room.viewDir[0] * 2.5,
                0.02,
                room.pos[1] + room.viewDir[1] * 2.5
            );
            arrow.rotation.z = Math.atan2(-room.viewDir[0], room.viewDir[1]);
            arrow.castShadow = false;
            this.group.add(arrow);

            const plaqueCanvas = document.createElement('canvas');
            plaqueCanvas.width = 512;
            plaqueCanvas.height = 128;
            const pCtx = plaqueCanvas.getContext('2d')!;
            pCtx.fillStyle = '#92400e';
            pCtx.fillRect(0, 0, 512, 128);
            pCtx.fillStyle = '#b45309';
            pCtx.fillRect(4, 4, 504, 120);
            pCtx.strokeStyle = '#d4af37';
            pCtx.lineWidth = 3;
            pCtx.strokeRect(8, 8, 496, 112);
            pCtx.fillStyle = '#fef3c7';
            pCtx.font = 'bold 32px Inter, sans-serif';
            pCtx.textAlign = 'center';
            pCtx.fillText(room.name, 256, 55);
            pCtx.font = '18px Inter, sans-serif';
            pCtx.fillStyle = '#fde68a';
            pCtx.fillText('Tocá [E] para experimentar', 256, 90);
            const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
            const plaque = new THREE.Mesh(
                new THREE.PlaneGeometry(1.6, 0.4),
                new THREE.MeshBasicMaterial({ map: plaqueTex })
            );
            plaque.position.set(
                room.pos[0] + room.viewDir[0] * 1.22,
                0.9,
                room.pos[1] + room.viewDir[1] * 1.22
            );
            plaque.rotation.y = Math.atan2(room.viewDir[0], room.viewDir[1]);
            plaque.castShadow = false;
            this.group.add(plaque);
        }
    }
"""
content = re.sub(r'private buildViewingIndicators\(\): void \{.*?(?=\n    private buildDoorBarriers)', new_indicators.strip() + "\n", content, flags=re.DOTALL)

# 7. buildDoorBarriers
new_barriers = """
    private buildDoorBarriers(): void {
        const doorData = [
            { pos: [-5, 10], rotY: Math.PI / 2, room: 'SALA 01' },
            { pos: [-5, 0], rotY: Math.PI / 2, room: 'SALA 02' },
            { pos: [-5, -10], rotY: Math.PI / 2, room: 'SALA 03' },
            { pos: [-5, -20], rotY: Math.PI / 2, room: 'SALA 04' },
            { pos: [5, 10], rotY: -Math.PI / 2, room: 'SALA 05' },
            { pos: [5, 0], rotY: -Math.PI / 2, room: 'SALA 06' },
            { pos: [5, -10], rotY: -Math.PI / 2, room: 'SALA 07' },
            { pos: [0, -25], rotY: 0, room: 'GALERÍA' }
        ];
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            roughness: 0.6,
            metalness: 0.3,
            transparent: true,
            opacity: 0.85
        });
        for (const d of doorData) {
            const door = new THREE.Mesh(
                new THREE.BoxGeometry(3.0, 3.6, 0.12),
                doorMat.clone()
            );
            door.position.set(d.pos[0], 1.9, d.pos[1]);
            door.rotation.y = d.rotY;
            door.castShadow = false;
            door.receiveShadow = false;
            door.visible = false;
            door.name = `door-barrier-${d.room}`;
            this.group.add(door);
            this.doorBarriers.push(door);

            const signCanvas = document.createElement('canvas');
            signCanvas.width = 256;
            signCanvas.height = 128;
            const sCtx = signCanvas.getContext('2d')!;
            sCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            sCtx.fillRect(0, 0, 256, 128);
            sCtx.strokeStyle = '#f59e0b';
            sCtx.lineWidth = 3;
            sCtx.strokeRect(4, 4, 248, 120);
            sCtx.fillStyle = '#fde047';
            sCtx.font = 'bold 36px Inter, sans-serif';
            sCtx.textAlign = 'center';
            sCtx.fillText('🔒', 128, 50);
            sCtx.font = 'bold 16px Inter, sans-serif';
            sCtx.fillStyle = '#f1f5f9';
            sCtx.fillText('SALA BLOQUEADA', 128, 80);
            sCtx.font = '12px Inter, sans-serif';
            sCtx.fillStyle = '#94a3b8';
            sCtx.fillText('Completá la sala anterior', 128, 105);
            const signTex = new THREE.CanvasTexture(signCanvas);
            const sign = new THREE.Mesh(
                new THREE.PlaneGeometry(1.4, 0.7),
                new THREE.MeshBasicMaterial({ map: signTex, transparent: true, depthWrite: false })
            );
            sign.position.set(0, 0.3, 0.08);
            door.add(sign);
            const signBack = sign.clone();
            signBack.rotation.y = Math.PI;
            signBack.position.z = -0.08;
            door.add(signBack);
        }
    }
"""
content = re.sub(r'private buildDoorBarriers\(\): void \{.*?(?=\n    public getDoorBarriers)', new_barriers.strip() + "\n", content, flags=re.DOTALL)


# 8. buildCeilingTruss (make it simpler rectangular grid)
new_truss = """
    private buildCeilingTruss() {
        const trussMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.4,
            metalness: 0.7
        });

        const width = 72;
        const depth = 72;
        const beamGeomX = new THREE.BoxGeometry(width, 0.4, 0.4);
        const beamGeomZ = new THREE.BoxGeometry(0.4, 0.4, depth);

        for (let x = -24; x <= 24; x += 12) {
            const beam = new THREE.Mesh(beamGeomZ, trussMat);
            beam.position.set(x, 14, 0);
            this.group.add(beam);
        }

        for (let z = -24; z <= 24; z += 12) {
            const beam = new THREE.Mesh(beamGeomX, trussMat);
            beam.position.set(0, 14, z);
            this.group.add(beam);
        }
    }
"""
content = re.sub(r'private buildCeilingTruss\(\) \{.*?(?=\n    // --- PEDESTALES)', new_truss.strip() + "\n", content, flags=re.DOTALL)


# 9. createRealisticSky -> pigeons inside
pigeon_logic = """
        // 4. PIGEONS (Argentine palomas!) - 6 simple sprites
        const pigeonCanvas = document.createElement('canvas');
        pigeonCanvas.width = 64;
        pigeonCanvas.height = 32;
        const pigeonCtx = pigeonCanvas.getContext('2d')!;
        pigeonCtx.clearRect(0, 0, 64, 32);
        pigeonCtx.fillStyle = '#6b7280';
        pigeonCtx.beginPath();
        pigeonCtx.ellipse(32, 18, 8, 5, 0, 0, Math.PI * 2);
        pigeonCtx.fill();
        pigeonCtx.fillStyle = '#9ca3af';
        pigeonCtx.beginPath();
        pigeonCtx.moveTo(24, 16);
        pigeonCtx.quadraticCurveTo(12, 6, 8, 12);
        pigeonCtx.quadraticCurveTo(16, 16, 24, 16);
        pigeonCtx.fill();
        pigeonCtx.beginPath();
        pigeonCtx.moveTo(40, 16);
        pigeonCtx.quadraticCurveTo(52, 6, 56, 12);
        pigeonCtx.quadraticCurveTo(48, 16, 40, 16);
        pigeonCtx.fill();
        const pigeonTexture = new THREE.CanvasTexture(pigeonCanvas);

        this.pigeons = [];
        for (let i = 0; i < 6; i++) {
            const pigeon = new THREE.Sprite(
                new THREE.SpriteMaterial({
                    map: pigeonTexture,
                    transparent: true,
                    depthWrite: false
                })
            );
            const isPerched = i < 3; 
            pigeon.scale.set(1.2, 0.6, 1);
            if (isPerched) {
                // Perched on interior ceiling trusses
                pigeon.position.set(
                    -10 + i * 10 + Math.random() * 4,
                    14.2,
                    -8 + Math.random() * 16
                );
            } else {
                // Flying inside the hallway
                pigeon.position.set(
                    (Math.random() - 0.5) * 8,
                    10 + Math.random() * 3,
                    (Math.random() - 0.5) * 40
                );
            }
            this.group.add(pigeon);
            this.pigeons.push({
                sprite: pigeon,
                isPerched,
                speed: isPerched ? 0 : 1.5 + Math.random() * 2,
                angle: Math.random() * Math.PI * 2,
                radius: 2 + Math.random() * 3, // Smaller radius for inside hallway
                baseY: pigeon.position.y,
                wingPhase: Math.random() * Math.PI * 2
            });
        }
    }
"""
content = re.sub(r'// 4\. PIGEONS \(Argentine palomas!\).*?(?=\n    private buildViewingIndicators)', pigeon_logic.strip() + "\n", content, flags=re.DOTALL)


with open('app/src/models/Environment.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
