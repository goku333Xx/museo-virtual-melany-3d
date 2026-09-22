import * as THREE from 'three';

interface FloatingHaloData {
    group: THREE.Group;
    spotLight: THREE.SpotLight;
    ringMesh: THREE.Mesh;
    baseY: number;
    phase: number;
}

export class MuseumRoom {
    private group: THREE.Group;
    private collidables: THREE.Mesh[] = [];
    private pedestalMeshes: THREE.Object3D[] = [];
    private floatingHalos: FloatingHaloData[] = [];

    constructor() {
        this.group = new THREE.Group();
        this.buildRoom();
        this.buildPilasters();
        this.buildFloorRunwayAndZones();
        this.buildCentralAtriumBeacon();
        this.buildRoomPortals();
        this.buildCeilingTruss();
        this.buildPedestals();
        this.buildLightingAndDecor();
        this.createGalaxy();
    }

    private buildRoom() {
        const width = 72;
        const height = 14; 
        const depth = 72;
        const wallThickness = 1.5;

        // Suelo de galería de ciencias moderna: Mármol grafito mate premium
        const floorGeom = new THREE.PlaneGeometry(width, depth);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x111620,
            roughness: 0.8,
            metalness: 0.15
        });
        const floor = new THREE.Mesh(floorGeom, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);
        this.collidables.push(floor);

        // Paredes de galería arquitectónica sobria (piedra pizarra oscura)
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x181f2c,
            roughness: 0.85,
            metalness: 0.1
        });

        const wallGeomX = new THREE.BoxGeometry(width, height, wallThickness);
        const wallGeomZ = new THREE.BoxGeometry(wallThickness, height, depth);

        const backWall = new THREE.Mesh(wallGeomX, wallMaterial);
        backWall.position.set(0, height / 2, -depth / 2 - wallThickness / 2);
        backWall.receiveShadow = true;
        this.group.add(backWall);
        this.collidables.push(backWall);

        const frontWall = new THREE.Mesh(wallGeomX, wallMaterial);
        frontWall.position.set(0, height / 2, depth / 2 + wallThickness / 2);
        frontWall.receiveShadow = true;
        this.group.add(frontWall);
        this.collidables.push(frontWall);

        const leftWall = new THREE.Mesh(wallGeomZ, wallMaterial);
        leftWall.position.set(-width / 2 - wallThickness / 2, height / 2, 0);
        leftWall.receiveShadow = true;
        this.group.add(leftWall);
        this.collidables.push(leftWall);

        const rightWall = new THREE.Mesh(wallGeomZ, wallMaterial);
        rightWall.position.set(width / 2 + wallThickness / 2, height / 2, 0);
        rightWall.receiveShadow = true;
        this.group.add(rightWall);
        this.collidables.push(rightWall);

        this.buildArchitecturalTrims(width, height, depth);
    }

    private buildArchitecturalTrims(width: number, height: number, depth: number) {
        // Molduras arquitectónicas con iluminación cálida indirecta (3000K estilo museo contemporáneo)
        const warmCoveLightMat = new THREE.MeshStandardMaterial({
            color: 0xfff2e0,
            emissive: 0xffd8a8,
            emissiveIntensity: 0.45,
            roughness: 0.4,
            metalness: 0.2
        });

        const bronzeTrimMat = new THREE.MeshStandardMaterial({
            color: 0x856638,
            roughness: 0.35,
            metalness: 0.8
        });

        const trimThickness = 0.2;
        const trimGeomX = new THREE.BoxGeometry(width, trimThickness, 0.45);
        const trimGeomZ = new THREE.BoxGeometry(0.45, trimThickness, depth);

        // Cornisa superior con iluminación arquitectónica suave
        const topBack = new THREE.Mesh(trimGeomX, warmCoveLightMat);
        topBack.position.set(0, height, -depth / 2);
        this.group.add(topBack);

        const topFront = new THREE.Mesh(trimGeomX, warmCoveLightMat);
        topFront.position.set(0, height, depth / 2);
        this.group.add(topFront);

        const topLeft = new THREE.Mesh(trimGeomZ, warmCoveLightMat);
        topLeft.position.set(-width / 2, height, 0);
        this.group.add(topLeft);

        const topRight = new THREE.Mesh(trimGeomZ, warmCoveLightMat);
        topRight.position.set(width / 2, height, 0);
        this.group.add(topRight);

        // Zócalos de bronce arquitectónico en el suelo
        const botBack = new THREE.Mesh(trimGeomX, bronzeTrimMat);
        botBack.position.set(0, 0.1, -depth / 2 + 0.3);
        this.group.add(botBack);

        const botFront = new THREE.Mesh(trimGeomX, bronzeTrimMat);
        botFront.position.set(0, 0.1, depth / 2 - 0.3);
        this.group.add(botFront);

        const botLeft = new THREE.Mesh(trimGeomZ, bronzeTrimMat);
        botLeft.position.set(-width / 2 + 0.3, 0.1, 0);
        this.group.add(botLeft);

        const botRight = new THREE.Mesh(trimGeomZ, bronzeTrimMat);
        botRight.position.set(width / 2 - 0.3, 0.1, 0);
        this.group.add(botRight);
    }

    // --- PILASTRAS ARQUITECTÓNICAS ELEGANTES (ESTILO MUSEO MODERNO) ---
    private buildPilasters() {
        const pillarMat = new THREE.MeshStandardMaterial({
            color: 0x1d2535,
            roughness: 0.65,
            metalness: 0.25
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: 0xc49b55,
            roughness: 0.3,
            metalness: 0.8
        });

        const pHeight = 14;
        const pWidth = 1.4;
        const pDepth = 0.5;

        const pillarGeom = new THREE.BoxGeometry(pWidth, pHeight, pDepth);
        const capGeom = new THREE.BoxGeometry(pWidth + 0.12, 0.35, pDepth + 0.12);

        // Acentos de iluminación rasante vertical cálida
        const verticalAccentGeom = new THREE.BoxGeometry(0.08, pHeight - 2.0, 0.04);
        const verticalLightMat = new THREE.MeshStandardMaterial({
            color: 0xffedd5,
            emissive: 0xfbbf24,
            emissiveIntensity: 0.3,
            roughness: 0.5
        });

        const wallOffset = 35.75;
        const offsets = [-24, -12, 12, 24];

        // Columnas en Pared Trasera y Delantera
        offsets.forEach(x => {
            this.createPilaster(x, -wallOffset, 0, pillarGeom, capGeom, verticalAccentGeom, pillarMat, accentMat, verticalLightMat);
            this.createPilaster(x, wallOffset, Math.PI, pillarGeom, capGeom, verticalAccentGeom, pillarMat, accentMat, verticalLightMat);
        });

        // Columnas en Pared Izquierda y Derecha
        offsets.forEach(z => {
            this.createPilaster(-wallOffset, z, Math.PI / 2, pillarGeom, capGeom, verticalAccentGeom, pillarMat, accentMat, verticalLightMat);
            this.createPilaster(wallOffset, z, -Math.PI / 2, pillarGeom, capGeom, verticalAccentGeom, pillarMat, accentMat, verticalLightMat);
        });

        // Columnas de esquina monumentales
        const cornerCorners = [
            [-wallOffset + 0.35, -wallOffset + 0.35],
            [wallOffset - 0.35, -wallOffset + 0.35],
            [-wallOffset + 0.35, wallOffset - 0.35],
            [wallOffset - 0.35, wallOffset - 0.35]
        ];

        const cornerGeom = new THREE.BoxGeometry(2.0, pHeight, 2.0);
        cornerCorners.forEach(([cx, cz]) => {
            const cornerMesh = new THREE.Mesh(cornerGeom, pillarMat);
            cornerMesh.position.set(cx, pHeight / 2, cz);
            this.group.add(cornerMesh);
        });
    }

    private createPilaster(
        x: number, 
        z: number, 
        rotY: number, 
        pillarGeom: THREE.BoxGeometry, 
        capGeom: THREE.BoxGeometry,
        verticalAccentGeom: THREE.BoxGeometry,
        pillarMat: THREE.Material,
        accentMat: THREE.Material,
        verticalLightMat: THREE.Material
    ) {
        const pillarGroup = new THREE.Group();
        pillarGroup.position.set(x, 7, z);
        pillarGroup.rotation.y = rotY;

        const mainPillar = new THREE.Mesh(pillarGeom, pillarMat);
        pillarGroup.add(mainPillar);

        const topCap = new THREE.Mesh(capGeom, accentMat);
        topCap.position.set(0, 6.82, 0);
        pillarGroup.add(topCap);

        const botCap = new THREE.Mesh(capGeom, accentMat);
        botCap.position.set(0, -6.82, 0);
        pillarGroup.add(botCap);

        // Acento arquitectónico vertical sobrio
        const lightStrip = new THREE.Mesh(verticalAccentGeom, verticalLightMat);
        lightStrip.position.set(0, 0, 0.26);
        pillarGroup.add(lightStrip);

        this.group.add(pillarGroup);
    }

    // --- PISTA CENTRAL DE VISITA Y ZONAS DE PEDESTAL ---
    private buildFloorRunwayAndZones() {
        const runwayMat = new THREE.MeshStandardMaterial({
            color: 0x161c28,
            roughness: 0.5,
            metalness: 0.2
        });
        const brassMat = new THREE.MeshStandardMaterial({
            color: 0xc49b55,
            roughness: 0.3,
            metalness: 0.8
        });

        // 1. Pasarela Eje Norte-Sur (De Z = -16 a Z = +26, longitud 44m)
        const nsRunway = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 44), runwayMat);
        nsRunway.rotation.x = -Math.PI / 2;
        nsRunway.position.set(0, 0.005, 5);
        nsRunway.receiveShadow = true;
        this.group.add(nsRunway);

        // Guías de latón eje Norte-Sur
        const nsGuideGeom = new THREE.BoxGeometry(0.04, 0.01, 44);
        const nsLeftGuide = new THREE.Mesh(nsGuideGeom, brassMat);
        nsLeftGuide.position.set(-1.2, 0.008, 5);
        const nsRightGuide = new THREE.Mesh(nsGuideGeom, brassMat);
        nsRightGuide.position.set(1.2, 0.008, 5);
        this.group.add(nsLeftGuide, nsRightGuide);

        // 2. Pasarela Eje Este-Oeste (De X = -16 a X = +16, longitud 34m)
        const ewRunway = new THREE.Mesh(new THREE.PlaneGeometry(34, 2.4), runwayMat);
        ewRunway.rotation.x = -Math.PI / 2;
        ewRunway.position.set(0, 0.005, 0);
        ewRunway.receiveShadow = true;
        this.group.add(ewRunway);

        // Guías de latón eje Este-Oeste
        const ewGuideGeom = new THREE.BoxGeometry(34, 0.01, 0.04);
        const ewTopGuide = new THREE.Mesh(ewGuideGeom, brassMat);
        ewTopGuide.position.set(0, 0.008, -1.2);
        const ewBotGuide = new THREE.Mesh(ewGuideGeom, brassMat);
        ewBotGuide.position.set(0, 0.008, 1.2);
        this.group.add(ewTopGuide, ewBotGuide);

        // 3. Pasarelas Diagonales hacia Noreste (Solar) y Noroeste (Van de Graaff)
        const diagLen = 17;
        const diagGeom = new THREE.PlaneGeometry(2.0, diagLen);

        // Hacia Noreste (Solar: 12, -12)
        const neRunway = new THREE.Mesh(diagGeom, runwayMat);
        neRunway.rotation.x = -Math.PI / 2;
        neRunway.rotation.z = -Math.PI / 4;
        neRunway.position.set(6, 0.005, -6);
        neRunway.receiveShadow = true;
        this.group.add(neRunway);

        // Hacia Noroeste (Van de Graaff: -12, -12)
        const nwRunway = new THREE.Mesh(diagGeom, runwayMat);
        nwRunway.rotation.x = -Math.PI / 2;
        nwRunway.rotation.z = Math.PI / 4;
        nwRunway.position.set(-6, 0.005, -6);
        nwRunway.receiveShadow = true;
        this.group.add(nwRunway);

        // Hacia Sureste (Dínamo Manual: 12, 10)
        const seRunway = new THREE.Mesh(diagGeom, runwayMat);
        seRunway.rotation.x = -Math.PI / 2;
        seRunway.rotation.z = Math.PI / 4;
        seRunway.position.set(6, 0.005, 5);
        seRunway.receiveShadow = true;
        this.group.add(seRunway);

        // 4. Círculos de demarcación bajo los 8 pedestales
        const stationZones: [number, number, number][] = [
            [-15, 0, 0x4ade80],   // Sala 1: Pila de Papa (Verde)
            [16, 0, 0x38bdf8],    // Sala 2: Bobina de Tesla (Azul/Cian)
            [0, -15, 0x00f0ff],   // Sala 3: Aerogenerador (Cian)
            [12, -12, 0xfde047],  // Sala 4: Panel Solar (Dorado)
            [-12, -12, 0xc084fc], // Sala 5: Van de Graaff (Violeta)
            [0, 14, 0xf59e0b],    // Sala 6: Cuna de Newton (Ámbar)
            [12, 10, 0xf97316],   // Sala 7: Dínamo Manual con Manivela (Naranja)
            [0, 24, 0xd946ef]     // Galería: Prisma Óptico (Magenta)
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

    // --- NÚCLEO HOLOGRÁFICO DEL ATRIO CENTRAL ---
    private buildCentralAtriumBeacon() {
        const beaconGroup = new THREE.Group();
        beaconGroup.position.set(0, 0, 0);

        // Medallón central en mármol con estrella de los vientos en latón
        const centerDisc = new THREE.Mesh(
            new THREE.CylinderGeometry(2.4, 2.4, 0.015, 48),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 })
        );
        centerDisc.position.y = 0.008;
        beaconGroup.add(centerDisc);

        const brassRing = new THREE.Mesh(
            new THREE.TorusGeometry(2.3, 0.03, 16, 48),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
        );
        brassRing.rotation.x = Math.PI / 2;
        brassRing.position.y = 0.018;
        beaconGroup.add(brassRing);

        // Estrella de orientación náutica/científica en el piso
        const starMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
        for (let i = 0; i < 4; i++) {
            const starPoint = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.8, 4), starMat);
            starPoint.rotation.x = Math.PI / 2;
            starPoint.rotation.z = (i * Math.PI) / 2;
            starPoint.position.y = 0.019;
            beaconGroup.add(starPoint);
        }

        // Anillos giroscópicos holográficos flotando en el centro
        const gyroGeo = new THREE.TorusGeometry(0.85, 0.015, 12, 36);
        const gyro1 = new THREE.Mesh(gyroGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.75 }));
        gyro1.position.y = 1.8;
        gyro1.rotation.x = Math.PI / 4;
        beaconGroup.add(gyro1);

        const gyro2 = new THREE.Mesh(gyroGeo, new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.6 }));
        gyro2.position.y = 1.8;
        gyro2.rotation.y = Math.PI / 3;
        beaconGroup.add(gyro2);

        this.group.add(beaconGroup);
    }

    // --- ARCOS ARQUITECTÓNICOS Y LETREROS DE LAS SALAS ---
    private buildRoomPortals() {
        const portalConfigs = [
            { pos: [-7.5, 0], rotY: Math.PI / 2, title: "SALA 01: ELECTROQUÍMICA", sub: "Pila de Papa · Reacción Redox", color: "#4ade80" },
            { pos: [7.5, 0], rotY: -Math.PI / 2, title: "SALA 02: ALTA TENSIÓN Y TESLA", sub: "Transformador Resonante · Inducción", color: "#38bdf8" },
            { pos: [0, -7.5], rotY: 0, title: "SALA 03: ENERGÍA EÓLICA & FARADAY", sub: "Cinética a Eléctrica · Mini Ciudad", color: "#00f0ff" },
            { pos: [5.5, -5.5], rotY: -Math.PI / 4, title: "SALA 04: ENERGÍA SOLAR", sub: "Efecto Fotovoltaico · Celdas de Silicio", color: "#fde047" },
            { pos: [-5.5, -5.5], rotY: Math.PI / 4, title: "SALA 05: GENERADOR ELECTROSTÁTICO", sub: "Fricción y Cargas · 150.000V", color: "#c084fc" },
            { pos: [0, 7.5], rotY: Math.PI, title: "SALA 06: ENERGÍA MECÁNICA", sub: "Conservación de Momento · Choques", color: "#f59e0b" },
            { pos: [5.5, 4.8], rotY: -3 * Math.PI / 4, title: "SALA 07: DÍNAMO MECÁNICO", sub: "Inducción y Manivela · Efecto Joule", color: "#f97316" },
            { pos: [0, 19.0], rotY: Math.PI, title: "GALERÍA ESPECIAL: PRISMA ÓPTICO", sub: "Dispersión Espectral · Calibración", color: "#d946ef" }
        ];

        const archMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
        const postGeom = new THREE.BoxGeometry(0.24, 3.8, 0.24);
        const lintelGeom = new THREE.BoxGeometry(3.6, 0.35, 0.35);

        portalConfigs.forEach(cfg => {
            const portal = new THREE.Group();
            portal.position.set(cfg.pos[0], 0, cfg.pos[1]);
            portal.rotation.y = cfg.rotY;

            // Poste Izquierdo
            const postL = new THREE.Mesh(postGeom, archMat);
            postL.position.set(-1.6, 1.9, 0);
            portal.add(postL);

            // Poste Derecho
            const postR = new THREE.Mesh(postGeom, archMat);
            postR.position.set(1.6, 1.9, 0);
            portal.add(postR);

            // Dintel superior
            const lintel = new THREE.Mesh(lintelGeom, archMat);
            lintel.position.set(0, 3.8, 0);
            portal.add(lintel);

            // Cartel luminoso con letrero de la sala
            const signTex = this.generateSignTexture(cfg.title, cfg.sub, cfg.color);
            const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
            const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), signMat);
            sign.position.set(0, 3.3, 0.05);
            portal.add(sign);

            // Respaldo del cartel para verse también al volver
            const signBack = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), signMat);
            signBack.position.set(0, 3.3, -0.05);
            signBack.rotation.y = Math.PI;
            portal.add(signBack);

            this.group.add(portal);
        });
    }

    private generateSignTexture(title: string, subtitle: string, hexColor: string): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;

        // Fondo oscuro estilo HUD de museo
        ctx.fillStyle = '#060d1a';
        ctx.fillRect(0, 0, 512, 128);

        // Borde con brillo neón
        ctx.strokeStyle = hexColor;
        ctx.lineWidth = 5;
        ctx.strokeRect(6, 6, 500, 116);

        // Acentos angulares en esquinas
        ctx.fillStyle = hexColor;
        ctx.fillRect(6, 6, 24, 5);
        ctx.fillRect(6, 6, 5, 24);
        ctx.fillRect(506 - 24, 6, 24, 5);
        ctx.fillRect(506 - 5, 6, 5, 24);
        ctx.fillRect(6, 122 - 5, 24, 5);
        ctx.fillRect(6, 122 - 24, 5, 24);
        ctx.fillRect(506 - 24, 122 - 5, 24, 5);
        ctx.fillRect(506 - 5, 122 - 24, 5, 24);

        // Título de la sala
        ctx.font = 'bold 25px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, 256, 48);

        // Subtítulo pedagógico
        ctx.font = 'bold 15px "Inter", system-ui, sans-serif';
        ctx.fillStyle = hexColor;
        ctx.fillText(subtitle, 256, 86);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // --- ESTRUCTURA RETICULAR DEL TECHO (OBSERVATORIO DE CIENCIAS) ---
    private buildCeilingTruss() {
        const trussMat = new THREE.MeshStandardMaterial({
            color: 0x181f2a,
            roughness: 0.45,
            metalness: 0.75
        });

        const width = 72;
        const depth = 72;
        const beamGeomX = new THREE.BoxGeometry(width, 0.4, 0.4);
        const beamGeomZ = new THREE.BoxGeometry(0.4, 0.4, depth);

        // Vigas transversales
        for (let x = -24; x <= 24; x += 12) {
            const beam = new THREE.Mesh(beamGeomZ, trussMat);
            beam.position.set(x, 14, 0);
            this.group.add(beam);
        }

        // Vigas longitudinales
        for (let z = -24; z <= 24; z += 12) {
            const beam = new THREE.Mesh(beamGeomX, trussMat);
            beam.position.set(0, 14, z);
            this.group.add(beam);
        }
    }

    // --- PEDESTALES DE EXHIBICIÓN ---
    private buildPedestals() {
        const pedestalHeight = 1.2;
        const pedestalWidth = 2.4;
        const pedestalDepth = 2.4;

        // Base de pedestal de granito oscuro pulido
        const baseGeom = new THREE.BoxGeometry(pedestalWidth, pedestalHeight, pedestalDepth);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1c2331, 
            roughness: 0.6, 
            metalness: 0.2 
        });

        // Ribete de latón arquitectónico en los bordes
        const borderMat = new THREE.MeshStandardMaterial({
            color: 0xc49b55,
            roughness: 0.3,
            metalness: 0.8
        });

        const positions = [
            [-15, 0],   // 1. Pila de Papa (Oeste)
            [16, 0],    // 2. Bobina de Tesla (Este)
            [0, -15],   // 3. Aerogenerador Faraday (Norte)
            [12, -12],  // 4. Panel Solar & Motor (Noreste)
            [-12, -12], // 5. Generador Van de Graaff (Noroeste)
            [0, 14],    // 6. Cuna de Newton (Sur)
            [12, 10],   // 7. Dínamo Manual con Manivela (Sureste)
            [0, 24]     // 8. Alcoba Especial: Prisma Óptico (Sur Profundo)
        ];

        positions.forEach((pos, idx) => {
            const pedestalGroup = new THREE.Group();

            const pedestal = new THREE.Mesh(baseGeom, baseMaterial);
            pedestal.position.set(0, pedestalHeight / 2, 0);
            pedestal.castShadow = true;
            pedestal.receiveShadow = true;
            pedestalGroup.add(pedestal);

            // Borde superior de latón fino
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

            // Halo suspendido de iluminación focal
            this.createFloatingHaloLight(pos[0], pos[1], idx * 2.1);
        });
    }

    private createFloatingHaloLight(x: number, z: number, phase: number) {
        const haloGroup = new THREE.Group();
        const baseY = 4.0;
        haloGroup.position.set(x, baseY, z);

        // Anillo con acabado en latón y luz suave
        const ringGeom = new THREE.TorusGeometry(1.2, 0.03, 16, 48);
        ringGeom.rotateX(Math.PI / 2);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xc49b55,
            emissive: 0x38bdf8,
            emissiveIntensity: 0.35,
            roughness: 0.3,
            metalness: 0.7
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        haloGroup.add(ringMesh);

        // Foco de museo descendente sobre el experimento
        const spot = new THREE.SpotLight(0xfff5eb, 35, 12, Math.PI / 4, 0.5, 1.5);
        spot.position.set(0, 0, 0);
        spot.target.position.set(0, -3.0, 0);
        haloGroup.add(spot);
        haloGroup.add(spot.target);

        this.group.add(haloGroup);

        this.floatingHalos.push({
            group: haloGroup,
            spotLight: spot,
            ringMesh: ringMesh,
            baseY,
            phase
        });
    }

    public update(time: number): void {
        for (let i = 0; i < this.floatingHalos.length; i++) {
            const halo = this.floatingHalos[i];
            const t = time * 1.2 + halo.phase;
            
            // Levitación suave del halo
            halo.group.position.y = halo.baseY + Math.sin(t) * 0.08;
            halo.group.rotation.y = time * 0.08 + halo.phase;
        }
    }

    private buildLightingAndDecor() {
        // 1. Luz hemisférica natural y cálida de museo (5200K estilo galería de ciencias)
        const hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x1e293b, 1.25);
        hemiLight.position.set(0, 32, 0);
        this.group.add(hemiLight);

        // 2. Luz solar direccional cálida (proyectada desde el Sol Celestial)
        const sunPos = new THREE.Vector3(24, 38, -26);
        const sunLight = new THREE.DirectionalLight(0xfffaea, 2.2);
        sunLight.position.copy(sunPos);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 100;
        sunLight.shadow.camera.left = -38;
        sunLight.shadow.camera.right = 38;
        sunLight.shadow.camera.top = 38;
        sunLight.shadow.camera.bottom = -38;
        sunLight.shadow.bias = -0.0004;
        this.group.add(sunLight);

        // 3. SOL CELESTIAL REALISTA 3D EN LA CÚPULA CÓSMICA
        const sunGroup = new THREE.Group();
        sunGroup.position.copy(sunPos);

        // Núcleo solar incandescente
        const sunCoreGeom = new THREE.SphereGeometry(3.6, 32, 32);
        const sunCoreMat = new THREE.MeshBasicMaterial({
            color: 0xfffbeb,
            transparent: false
        });
        const sunCore = new THREE.Mesh(sunCoreGeom, sunCoreMat);
        sunGroup.add(sunCore);

        // Corona solar atmosférica difusa (gradiente procedural de alta fidelidad)
        const coronaCanvas = document.createElement('canvas');
        coronaCanvas.width = 256;
        coronaCanvas.height = 256;
        const cCtx = coronaCanvas.getContext('2d')!;
        const grad = cCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.18, 'rgba(254, 240, 138, 0.85)');
        grad.addColorStop(0.45, 'rgba(251, 146, 60, 0.4)');
        grad.addColorStop(0.8, 'rgba(234, 88, 12, 0.1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, 256, 256);
        const coronaTex = new THREE.CanvasTexture(coronaCanvas);

        const coronaGeom = new THREE.PlaneGeometry(28, 28);
        const coronaMat = new THREE.MeshBasicMaterial({
            map: coronaTex,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
        coronaMesh.lookAt(0, 0, 0); // Orientado hacia el centro del museo
        sunGroup.add(coronaMesh);

        // Corona exterior ultra amplia
        const outerCoronaGeom = new THREE.PlaneGeometry(54, 54);
        const outerCoronaMat = new THREE.MeshBasicMaterial({
            map: coronaTex,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const outerCorona = new THREE.Mesh(outerCoronaGeom, outerCoronaMat);
        outerCorona.lookAt(0, 0, 0);
        sunGroup.add(outerCorona);

        this.group.add(sunGroup);
    }

    private createGalaxy() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.25, 'rgba(200, 230, 255, 0.7)');
        gradient.addColorStop(0.55, 'rgba(190, 140, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const starTexture = new THREE.CanvasTexture(canvas);

        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 4000;
        const posArray = new Float32Array(starsCount * 3);
        const colorsArray = new Float32Array(starsCount * 3);

        const softCyan = new THREE.Color(0xa5f3fc);
        const softViolet = new THREE.Color(0xe9d5ff);
        const softWarm = new THREE.Color(0xfef08a);
        const whiteColor = new THREE.Color(0xffffff);

        for (let i = 0; i < starsCount * 3; i += 3) {
            const radius = 120 + Math.random() * 180;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(Math.random());
            
            posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
            posArray[i + 1] = Math.abs(radius * Math.cos(phi)) + 12;
            posArray[i + 2] = radius * Math.sin(phi) * Math.sin(theta);

            const rand = Math.random();
            let col = whiteColor;
            if (rand < 0.25) col = softCyan;
            else if (rand < 0.45) col = softViolet;
            else if (rand < 0.6) col = softWarm;

            colorsArray[i] = col.r;
            colorsArray[i + 1] = col.g;
            colorsArray[i + 2] = col.b;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

        const starsMaterial = new THREE.PointsMaterial({
            size: 2.0,
            map: starTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
            sizeAttenuation: true
        });

        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.group.add(starField);

        const nebulaGeom = new THREE.BufferGeometry();
        const nebulaCount = 450;
        const nebPos = new Float32Array(nebulaCount * 3);
        const nebCol = new Float32Array(nebulaCount * 3);

        for (let i = 0; i < nebulaCount * 3; i += 3) {
            nebPos[i] = (Math.random() - 0.5) * 180;
            nebPos[i + 1] = 30 + Math.random() * 50;
            nebPos[i + 2] = (Math.random() - 0.5) * 180;

            const isViolet = Math.random() > 0.5;
            const c = isViolet ? softViolet : softCyan;
            nebCol[i] = c.r;
            nebCol[i + 1] = c.g;
            nebCol[i + 2] = c.b;
        }

        nebulaGeom.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
        nebulaGeom.setAttribute('color', new THREE.BufferAttribute(nebCol, 3));

        const nebulaMat = new THREE.PointsMaterial({
            size: 14.0,
            map: starTexture,
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
            sizeAttenuation: true
        });

        const nebulaMesh = new THREE.Points(nebulaGeom, nebulaMat);
        this.group.add(nebulaMesh);
    }

    public getMesh(): THREE.Group {
        return this.group;
    }
    
    public getCollidables(): THREE.Mesh[] {
        return this.collidables;
    }

    public getPedestalMeshes(): THREE.Object3D[] {
        return this.pedestalMeshes;
    }
}
