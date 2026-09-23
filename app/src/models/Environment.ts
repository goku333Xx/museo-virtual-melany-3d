import * as THREE from 'three';
import { SALAS, GALERIA, NOMBRE_MUSEO, numeroSala } from '../salas.config';

// Geometría de las salas (debe coincidir con los muros de buildEnclosedRooms)
// side: -1 = ala oeste, 1 = ala este. exhibitZ = centro del pedestal.
const SALA_LAYOUT = [
    { side: -1, zMin: 5.15, zMax: 24.85, exhibitZ: 10 },
    { side: -1, zMin: -4.85, zMax: 4.85, exhibitZ: 0 },
    { side: -1, zMin: -14.85, zMax: -5.15, exhibitZ: -10 },
    { side: -1, zMin: -24.85, zMax: -15.15, exhibitZ: -20 },
    { side: 1, zMin: 5.15, zMax: 24.85, exhibitZ: 10 },
    { side: 1, zMin: -4.85, zMax: 4.85, exhibitZ: 0 },
    { side: 1, zMin: -24.85, zMax: -5.15, exhibitZ: -10 }
];
const WALL_HEIGHT = 6.0;
const DOOR_HEIGHT = 3.8;

export interface WallBox {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
}

export class MuseumRoom {
    private group: THREE.Group;
    private collidables: THREE.Mesh[] = [];
    private pedestalMeshes: THREE.Object3D[] = [];
    private exhibitSpots: THREE.SpotLight[] = [];
    private internalWallBoxes: WallBox[] = [];
    private roomLights: { roomLight: THREE.PointLight, accentLight: THREE.PointLight }[] = [];
    private activeRoomIndex: number = 0;
    private clouds: Array<{sprite: THREE.Sprite; speed: number; originalX: number}> = [];
    private pigeons: Array<{sprite: THREE.Sprite; isPerched: boolean; speed: number; angle: number; radius: number; baseY: number; wingPhase: number}> = [];
    private doorBarriers: THREE.Mesh[] = [];

    constructor() {
        this.group = new THREE.Group();
        this.buildRoom();
        this.buildPilasters();
        this.buildFloorRunwayAndZones();
        this.buildCentralAtriumBeacon();
        this.buildRoomPortals();
        this.buildEnclosedRooms();
        this.buildCeilingTruss();
        this.buildPedestals();
        this.buildViewingIndicators();
        this.buildDoorBarriers();
        this.buildLightingAndDecor();
        this.createRealisticSky();
    }

    private buildRoom() {
        const width = 72;
        const height = 14; 
        const depth = 72;
        const wallThickness = 1.5;

        // Suelo de piedra caliza en losas (hall y circulaciones)
        const floorGeom = new THREE.PlaneGeometry(width, depth);
        const stoneTex = this.createStoneTileTexture();
        stoneTex.repeat.set(width / 4, depth / 4);
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: stoneTex,
            color: 0xffffff,
            roughness: 0.55,
            metalness: 0.0
        });
        const floor = new THREE.Mesh(floorGeom, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);
        this.collidables.push(floor);

        // Paredes perimetrales en blanco cálido de galería
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xf3f0ea,
            roughness: 0.9,
            metalness: 0.05
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
        // Cornisa de yeso y zócalo oscuro, como en una galería clásica
        const warmCoveLightMat = new THREE.MeshStandardMaterial({
            color: 0xe9e4da,
            roughness: 0.85,
            metalness: 0.0
        });

        const bronzeTrimMat = new THREE.MeshStandardMaterial({
            color: 0x3b3531,
            roughness: 0.6,
            metalness: 0.0
        });

        const trimThickness = 0.22;
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
            color: 0xe6e1d7,
            roughness: 0.85,
            metalness: 0.0
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: 0xd6cfc2,
            roughness: 0.8,
            metalness: 0.0
        });

        const pHeight = 14;
        const pWidth = 1.4;
        const pDepth = 0.5;

        const pillarGeom = new THREE.BoxGeometry(pWidth, pHeight, pDepth);
        const capGeom = new THREE.BoxGeometry(pWidth + 0.12, 0.35, pDepth + 0.12);

        const wallOffset = 35.75;
        const offsets = [-24, -12, 12, 24];

        // Columnas solo en la pared de entrada: las demás quedan dentro de las salas pintadas
        offsets.forEach(x => {
            this.createPilaster(x, wallOffset, Math.PI, pillarGeom, capGeom, pillarMat, accentMat);
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
        pillarMat: THREE.Material,
        accentMat: THREE.Material
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

        this.group.add(pillarGroup);
    }

    // --- PISOS DE MADERA EN LAS SALAS Y RECEPCIÓN ---
    private buildFloorRunwayAndZones() {
        const parquet = this.createParquetTexture();
        const addWoodFloor = (minX: number, maxX: number, minZ: number, maxZ: number) => {
            const w = maxX - minX;
            const d = maxZ - minZ;
            const tex = parquet.clone();
            tex.needsUpdate = true;
            tex.repeat.set(w / 1.6, d / 1.6);
            const mat = new THREE.MeshStandardMaterial({
                map: tex,
                roughness: 0.6,
                metalness: 0.0,
                polygonOffset: true,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -1
            });
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set((minX + maxX) / 2, 0.005, (minZ + maxZ) / 2);
            floor.receiveShadow = true;
            this.group.add(floor);
        };

        SALA_LAYOUT.forEach(s => {
            if (s.side < 0) addWoodFloor(-36, -5.15, s.zMin, s.zMax);
            else addWoodFloor(5.15, 36, s.zMin, s.zMax);
        });
        addWoodFloor(-36, 36, -36, -25.15); // Galería especial
    }

    // --- MOSTRADOR DE INFORMACIÓN EN EL HALL ---
    private buildCentralAtriumBeacon() {
        const beaconGroup = new THREE.Group();
        beaconGroup.position.set(0, 0, 15);

        const baseGeom = new THREE.BoxGeometry(2.4, 0.47, 2.4);
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

    // --- CARTELES DE ENTRADA SOBRE CADA PUERTA ---
    private buildRoomPortals() {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x2f2a26, roughness: 0.55, metalness: 0.1 });
        const jambGeom = new THREE.BoxGeometry(0.12, DOOR_HEIGHT, 0.42);
        const headGeom = new THREE.BoxGeometry(3.44, 0.12, 0.42);

        const portals: { x: number; z: number; rotY: number; kicker: string; title: string; sub: string; accent: string }[] = [];
        SALA_LAYOUT.forEach((s, i) => {
            const sala = SALAS[i];
            portals.push({
                x: s.side * 5,
                z: s.exhibitZ,
                rotY: s.side < 0 ? Math.PI / 2 : -Math.PI / 2,
                kicker: `${numeroSala(i).toUpperCase()} · ${sala.grupo.toUpperCase()}`,
                title: sala.titulo,
                sub: sala.transformacion,
                accent: sala.colorAcento
            });
        });
        portals.push({ x: 0, z: -25, rotY: 0, kicker: 'GALERÍA ESPECIAL', title: GALERIA.titulo, sub: GALERIA.subtitulo, accent: GALERIA.colorAcento });

        portals.forEach(p => {
            const portal = new THREE.Group();
            portal.position.set(p.x, 0, p.z);
            portal.rotation.y = p.rotY;

            // Marco de puerta oscuro, fino
            const jambL = new THREE.Mesh(jambGeom, frameMat);
            jambL.position.set(-1.66, DOOR_HEIGHT / 2, 0);
            const jambR = new THREE.Mesh(jambGeom, frameMat);
            jambR.position.set(1.66, DOOR_HEIGHT / 2, 0);
            const head = new THREE.Mesh(headGeom, frameMat);
            head.position.set(0, DOOR_HEIGHT + 0.06, 0);
            portal.add(jambL, jambR, head);

            // Rótulo en vinilo sobre el dintel (se ve desde ambos lados)
            const tex = this.generateSignTexture(p.kicker, p.title, p.sub, p.accent);
            const signMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
            const signGeom = new THREE.PlaneGeometry(4.0, 1.25);
            const front = new THREE.Mesh(signGeom, signMat);
            front.position.set(0, DOOR_HEIGHT + 0.95, 0.17);
            const back = new THREE.Mesh(signGeom, signMat);
            back.position.set(0, DOOR_HEIGHT + 0.95, -0.17);
            back.rotation.y = Math.PI;
            portal.add(front, back);

            this.group.add(portal);
        });

        // Nombre del museo en lo alto del muro norte, visible desde el hall
        const titleTex = this.generateMuseumTitleTexture();
        const title = new THREE.Mesh(
            new THREE.PlaneGeometry(16, 2.84),
            new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, depthWrite: false })
        );
        title.position.set(0, 9.5, -35.97);
        this.group.add(title);
    }

    // --- SALAS CERRADAS CON CIELORRASO, PINTURA POR GRUPO Y CARTELAS ---
    private buildEnclosedRooms() {
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xf5f3ef,
            roughness: 0.9,
            metalness: 0.0
        });
        const baseboardMat = new THREE.MeshStandardMaterial({
            color: 0x3b3531,
            roughness: 0.6,
            metalness: 0.0
        });

        const wallHeight = WALL_HEIGHT;

        const createWall = (minX: number, maxX: number, minZ: number, maxZ: number) => {
            const w = Math.max(0.12, maxX - minX);
            const d = Math.max(0.12, maxZ - minZ);
            const posX = (minX + maxX) / 2;
            const posZ = (minZ + maxZ) / 2;

            const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(w, wallHeight, d), wallMat);
            wallMesh.position.set(posX, wallHeight / 2, posZ);
            wallMesh.castShadow = false;
            wallMesh.receiveShadow = true;
            this.group.add(wallMesh);
            this.collidables.push(wallMesh);

            const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.14, d + 0.04), baseboardMat);
            baseMesh.position.set(posX, 0.07, posZ);
            this.group.add(baseMesh);

            this.internalWallBoxes.push({ minX, maxX, minZ, maxZ });
        };

        const createDoorLintel = (minX: number, maxX: number, minZ: number, maxZ: number) => {
            const w = Math.max(0.12, maxX - minX);
            const d = Math.max(0.12, maxZ - minZ);
            const h = wallHeight - DOOR_HEIGHT;
            const lintelMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
            lintelMesh.position.set((minX + maxX) / 2, DOOR_HEIGHT + h / 2, (minZ + maxZ) / 2);
            this.group.add(lintelMesh);
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
        createWall(-36, -1.6, -25.15, -24.85);
        createDoorLintel(-1.6, 1.6, -25.15, -24.85); // Sala 8 (Galeria)
        createWall(1.6, 36, -25.15, -24.85);

        // Paredes separadoras de salas (Lado Izquierdo, X: -36 a -5.15)
        createWall(-36, -5.15, 24.85, 25.15); // Pared frontal de Sala 1
        createWall(-36, -5.15, 4.85, 5.15); // Entre Sala 1 y 2
        createWall(-36, -5.15, -5.15, -4.85); // Entre Sala 2 y 3
        createWall(-36, -5.15, -15.15, -14.85); // Entre Sala 3 y 4

        // Paredes separadoras de salas (Lado Derecho, X: 5.15 a 36)
        createWall(5.15, 36, 24.85, 25.15); // Pared frontal de Sala 5
        createWall(5.15, 36, 4.85, 5.15); // Entre Sala 5 y 6
        createWall(5.15, 36, -5.15, -4.85); // Entre Sala 6 y 7

        // Cielorrasos: salas y galería cerradas; el hall central queda abierto al lucernario
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xf2f0ec, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide });
        const addCeiling = (minX: number, maxX: number, minZ: number, maxZ: number) => {
            const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(maxX - minX, maxZ - minZ), ceilingMat);
            ceiling.rotation.x = Math.PI / 2;
            ceiling.position.set((minX + maxX) / 2, wallHeight, (minZ + maxZ) / 2);
            this.group.add(ceiling);
        };
        addCeiling(-36, -4.85, -25.15, 25.15);
        addCeiling(4.85, 36, -25.15, 25.15);
        addCeiling(-36, 36, -36, -24.85);

        // Pintura, cartela, banco y rieles de luz de cada sala (datos de salas.config.ts)
        SALA_LAYOUT.forEach((s, i) => this.decorateSala(i, s.side, s.zMin, s.zMax, s.exhibitZ));
        this.decorateGaleria();

        // Luces de sala: solo la activa se enciende (ver setActiveRoom)
        const roomConfigs = [
            ...SALA_LAYOUT.map(s => ({ x: s.side * 15, z: s.exhibitZ })),
            { x: 0, z: -35 }
        ];

        roomConfigs.forEach((rc, idx) => {
            const isActive = idx === 0;
            const roomLight = new THREE.PointLight(0xfff4e5, 1.5, 20.0, 1.2);
            roomLight.position.set(rc.x, wallHeight - 0.4, rc.z);
            roomLight.visible = isActive;
            this.group.add(roomLight);

            const accentLight = new THREE.PointLight(0xffe2bf, 0.6, 9.0, 2.0);
            accentLight.position.set(rc.x, 3.2, rc.z);
            accentLight.visible = isActive;
            this.group.add(accentLight);

            this.roomLights.push({ roomLight, accentLight });
        });

        const atriumPos = [
            [0, 5.4, 15],
            [0, 5.4, 0],
            [0, 5.4, -15]
        ];
        atriumPos.forEach(pos => {
            const atriumLight = new THREE.PointLight(0xfff8ee, 0.8, 15.0, 1.3);
            atriumLight.position.set(pos[0], pos[1], pos[2]);
            this.group.add(atriumLight);
        });
    }

    private decorateSala(i: number, side: number, zMin: number, zMax: number, exhibitZ: number) {
        const sala = SALAS[i];
        const paintMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(sala.colorPared),
            roughness: 0.92,
            metalness: 0.0,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const depth = zMax - zMin;
        const zMid = (zMin + zMax) / 2;
        const innerX = side * 5.15;   // cara interior del muro del pasillo
        const outerX = side * 36;     // cara interior del muro perimetral
        const width = Math.abs(outerX - innerX);
        const xMid = (innerX + outerX) / 2;
        const paintH = WALL_HEIGHT - 0.14;
        const paintY = 0.14 + paintH / 2;
        const off = 0.01;

        const paint = (w: number, h: number, x: number, y: number, z: number, rotY: number) => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paintMat);
            m.position.set(x, y, z);
            m.rotation.y = rotY;
            this.group.add(m);
        };

        // Muro del fondo (perimetral) y muros laterales, pintados con el color del grupo
        paint(depth, paintH, outerX - side * off, paintY, zMid, side < 0 ? Math.PI / 2 : -Math.PI / 2);
        paint(width, paintH, xMid, paintY, zMin + off, 0);
        paint(width, paintH, xMid, paintY, zMax - off, Math.PI);

        // Muro de la puerta (dos tramos + dintel)
        const faceRot = side < 0 ? -Math.PI / 2 : Math.PI / 2;
        const doorMin = exhibitZ - 1.6;
        const doorMax = exhibitZ + 1.6;
        const doorX = innerX + side * off;
        const seg1 = doorMin - zMin;
        const seg2 = zMax - doorMax;
        if (seg1 > 0.05) paint(seg1, paintH, doorX, paintY, zMin + seg1 / 2, faceRot);
        if (seg2 > 0.05) paint(seg2, paintH, doorX, paintY, doorMax + seg2 / 2, faceRot);
        paint(3.2, WALL_HEIGHT - DOOR_HEIGHT, doorX, DOOR_HEIGHT + (WALL_HEIGHT - DOOR_HEIGHT) / 2, exhibitZ, faceRot);

        // Título grande en vinilo sobre el muro del fondo
        const titleTex = this.generateWallTitleTexture(sala.titulo, sala.transformacion, sala.colorAcento);
        const title = new THREE.Mesh(
            new THREE.PlaneGeometry(9, 2.25),
            new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, depthWrite: false })
        );
        title.position.set(outerX - side * 0.03, 3.9, exhibitZ);
        title.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        this.group.add(title);

        // Cartela del grupo, junto a la entrada, en el muro lateral
        const panelTex = this.generateCartelaTexture(i);
        const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(2.4, 1.8),
            new THREE.MeshBasicMaterial({ map: panelTex })
        );
        panel.position.set(side * 9.2, 1.75, zMin + 0.03);
        this.group.add(panel);

        // Banco de museo mirando al experimento
        this.createBench(side * 23, exhibitZ, Math.PI / 2);

        // Riel de iluminación en el cielorraso con proyectores
        this.createTrackLight(side * 15, exhibitZ, 10);
    }

    private decorateGaleria() {
        const paintMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(GALERIA.colorPared),
            roughness: 0.92,
            metalness: 0.0,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const paintH = WALL_HEIGHT - 0.14;
        const back = new THREE.Mesh(new THREE.PlaneGeometry(72, paintH), paintMat);
        back.position.set(0, 0.14 + paintH / 2, -35.99);
        this.group.add(back);

        const titleTex = this.generateWallTitleTexture(GALERIA.titulo, GALERIA.subtitulo, GALERIA.colorAcento);
        const title = new THREE.Mesh(
            new THREE.PlaneGeometry(9, 2.25),
            new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, depthWrite: false })
        );
        title.position.set(0, 3.9, -35.96);
        this.group.add(title);

        this.createBench(0, -30, 0);
        this.createTrackLight(0, -35, 10);
    }

    private createBench(x: number, z: number, rotY: number) {
        const bench = new THREE.Group();
        bench.position.set(x, 0, z);
        bench.rotation.y = rotY;

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.55, metalness: 0.0 });
        const legMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.6 });

        const seat = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.6), woodMat);
        seat.position.y = 0.45;
        seat.castShadow = true;
        bench.add(seat);

        const legGeom = new THREE.BoxGeometry(0.06, 0.41, 0.5);
        [-1.1, 1.1].forEach(lx => {
            const leg = new THREE.Mesh(legGeom, legMat);
            leg.position.set(lx, 0.205, 0);
            bench.add(leg);
        });
        this.group.add(bench);

        // Colisión del banco (caja alineada a los ejes)
        const alongX = Math.abs(Math.sin(rotY)) < 0.5;
        const hx = alongX ? 1.3 : 0.3;
        const hz = alongX ? 0.3 : 1.3;
        this.internalWallBoxes.push({ minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz });
    }

    // Riel negro con proyectores orientables (solo geometría: la luz real es el SpotLight de la sala)
    private createTrackLight(x: number, z: number, length: number) {
        const railMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.5, metalness: 0.5 });
        const lensMat = new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xfff1d0, emissiveIntensity: 1.2 });
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, length), railMat);
        rail.position.set(x, WALL_HEIGHT - 0.03, z);
        this.group.add(rail);

        const headGeom = new THREE.CylinderGeometry(0.07, 0.09, 0.26, 12);
        const lensGeom = new THREE.CircleGeometry(0.07, 12);
        const stemGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6);
        const n = 5;
        for (let k = 0; k < n; k++) {
            const hz = z - length / 2 + (k + 0.5) * (length / n);
            const fixture = new THREE.Group();
            fixture.position.set(x, WALL_HEIGHT - 0.06, hz);

            const stem = new THREE.Mesh(stemGeom, railMat);
            stem.position.y = -0.09;
            fixture.add(stem);

            // Inclinado hacia el pedestal
            const aim = new THREE.Group();
            aim.position.y = -0.2;
            aim.rotation.x = THREE.MathUtils.clamp((z - hz) * 0.12, -0.7, 0.7);
            const head = new THREE.Mesh(headGeom, railMat);
            aim.add(head);
            const lens = new THREE.Mesh(lensGeom, lensMat);
            lens.rotation.x = Math.PI / 2;
            lens.position.y = -0.131;
            aim.add(lens);
            fixture.add(aim);

            this.group.add(fixture);
        }
    }

    private createStoneTileTexture(): THREE.CanvasTexture {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext('2d')!;
        // 2x2 losas por textura, con leve variación de tono y veteado
        const tiles = [[0, 0], [256, 0], [0, 256], [256, 256]];
        const tones = ['#d9d3c7', '#d4cec2', '#dcd6cb', '#d6d0c4'];
        tiles.forEach(([tx, ty], k) => {
            ctx.fillStyle = tones[k];
            ctx.fillRect(tx, ty, 256, 256);
            for (let v = 0; v < 40; v++) {
                ctx.fillStyle = `rgba(120, 110, 95, ${0.03 + Math.random() * 0.04})`;
                ctx.beginPath();
                ctx.ellipse(tx + Math.random() * 256, ty + Math.random() * 256, 4 + Math.random() * 30, 1 + Math.random() * 3, Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.strokeStyle = 'rgba(90, 82, 70, 0.55)';
        ctx.lineWidth = 2;
        [0, 256, 512].forEach(p => {
            ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 512); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(512, p); ctx.stroke();
        });
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        return tex;
    }

    private createParquetTexture(): THREE.CanvasTexture {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext('2d')!;
        const plankW = 64;
        const plankL = 256;
        for (let col = 0; col < 512 / plankW; col++) {
            const shift = (col % 2) * (plankL / 2);
            for (let row = -1; row < 512 / plankL + 1; row++) {
                const y = row * plankL + shift;
                const l = 120 + Math.floor(Math.random() * 26);
                ctx.fillStyle = `rgb(${l + 34}, ${l - 2}, ${l - 44})`;
                ctx.fillRect(col * plankW, y, plankW, plankL);
                // Vetas
                for (let g = 0; g < 7; g++) {
                    ctx.strokeStyle = `rgba(90, 60, 30, ${0.08 + Math.random() * 0.1})`;
                    ctx.lineWidth = 1;
                    const gx = col * plankW + 4 + Math.random() * (plankW - 8);
                    ctx.beginPath();
                    ctx.moveTo(gx, y);
                    ctx.bezierCurveTo(gx + 6, y + plankL * 0.3, gx - 6, y + plankL * 0.7, gx + 2, y + plankL);
                    ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(60, 40, 20, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(col * plankW, y, plankW, plankL);
            }
        }
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        return tex;
    }

    // Rótulo de puerta: letras oscuras sobre la pared clara, estilo vinilo de museo
    private generateSignTexture(kicker: string, title: string, subtitle: string, accent: string): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 320;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, 1024, 320);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = '600 34px "Inter", system-ui, sans-serif';
        ctx.fillStyle = this.darken(accent);
        ctx.fillText(this.spaced(kicker), 512, 60);

        ctx.font = '500 92px Georgia, "Times New Roman", serif';
        ctx.fillStyle = '#2b2622';
        ctx.fillText(this.fitText(ctx, title, 980), 512, 160);

        ctx.fillStyle = this.darken(accent);
        ctx.fillRect(472, 222, 80, 3);

        ctx.font = 'italic 40px Georgia, "Times New Roman", serif';
        ctx.fillStyle = '#5a524b';
        ctx.fillText(this.fitText(ctx, subtitle, 980), 512, 272);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        return tex;
    }

    private generateMuseumTitleTexture(): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 182;
        const ctx = canvas.getContext('2d')!;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const name = this.spaced(NOMBRE_MUSEO.toUpperCase());
        let size = 104;
        ctx.font = `500 ${size}px Georgia, "Times New Roman", serif`;
        while (size > 40 && ctx.measureText(name).width > 980) {
            size -= 4;
            ctx.font = `500 ${size}px Georgia, "Times New Roman", serif`;
        }
        ctx.fillStyle = '#2b2622';
        ctx.fillText(name, 512, 80);
        ctx.font = '600 26px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#7a6f64';
        ctx.fillText(this.spaced('TRANSFORMACIONES DE LA ENERGÍA'), 512, 158);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    // Título grande del muro de fondo: letras claras sobre la pintura de la sala
    private generateWallTitleTexture(title: string, subtitle: string, accent: string): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d')!;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '500 104px Georgia, "Times New Roman", serif';
        ctx.fillStyle = '#f7f3ec';
        ctx.fillText(this.fitText(ctx, title, 1000), 512, 100);
        ctx.font = 'italic 44px Georgia, "Times New Roman", serif';
        ctx.fillStyle = accent;
        ctx.fillText(this.fitText(ctx, subtitle, 1000), 512, 200);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        return tex;
    }

    // Cartela de sala: texto curatorial + grupo e integrantes
    private generateCartelaTexture(i: number): THREE.CanvasTexture {
        const sala = SALAS[i];
        const W = 960;
        const H = 720;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#f7f4ee';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = sala.colorPared;
        ctx.fillRect(0, 0, 14, H);

        const left = 64;
        const maxW = W - left - 56;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        ctx.font = '600 24px "Inter", system-ui, sans-serif';
        ctx.fillStyle = this.darken(sala.colorAcento);
        ctx.fillText(this.spaced(`${numeroSala(i).toUpperCase()} · ${sala.grupo.toUpperCase()}`), left, 78);

        ctx.font = '500 60px Georgia, "Times New Roman", serif';
        ctx.fillStyle = '#231f1c';
        ctx.fillText(`${sala.icono} ${this.fitText(ctx, sala.titulo, maxW - 70)}`, left, 150);

        ctx.font = 'italic 30px Georgia, "Times New Roman", serif';
        ctx.fillStyle = '#5a524b';
        ctx.fillText(this.fitText(ctx, sala.transformacion, maxW), left, 198);

        ctx.fillStyle = '#cfc6b8';
        ctx.fillRect(left, 226, 120, 2);

        ctx.font = '400 29px Georgia, "Times New Roman", serif';
        ctx.fillStyle = '#3a342f';
        let y = 282;
        for (const line of this.wrapText(ctx, sala.texto, maxW).slice(0, 7)) {
            ctx.fillText(line, left, y);
            y += 42;
        }

        ctx.font = '600 20px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#7a6f64';
        ctx.fillText(this.spaced('INTEGRANTES'), left, H - 110);
        ctx.font = '400 26px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#3a342f';
        const names = this.wrapText(ctx, sala.integrantes.join(' · '), maxW).slice(0, 2);
        names.forEach((line, k) => ctx.fillText(line, left, H - 72 + k * 34));

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        return tex;
    }

    private wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let line = '';
        for (const w of words) {
            const test = line ? `${line} ${w}` : w;
            if (ctx.measureText(test).width > maxW && line) {
                lines.push(line);
                line = w;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        return lines;
    }

    private fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
        if (ctx.measureText(text).width <= maxW) return text;
        let t = text;
        while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
        return t + '…';
    }

    private spaced(text: string): string {
        return text.split('').join(' ');
    }

    private darken(hex: string): string {
        const c = new THREE.Color(hex);
        const hsl = { h: 0, s: 0, l: 0 };
        c.getHSL(hsl);
        c.setHSL(hsl.h, Math.min(1, hsl.s * 1.1), Math.min(hsl.l, 0.38));
        return `#${c.getHexString()}`;
    }

    // --- ESTRUCTURA RETICULAR DEL TECHO (OBSERVATORIO DE CIENCIAS) ---
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

    // --- PEDESTALES DE EXHIBICIÓN (plinto blanco mate de museo) ---
    private buildPedestals() {
        const pedestalHeight = 1.2;
        const pedestalWidth = 2.4;
        const pedestalDepth = 2.4;

        const baseGeom = new THREE.BoxGeometry(pedestalWidth, pedestalHeight - 0.06, pedestalDepth);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xf4f2ee,
            roughness: 0.85,
            metalness: 0.0
        });
        // Buña oscura al pie del plinto
        const revealMat = new THREE.MeshStandardMaterial({ color: 0x2b2724, roughness: 0.7, metalness: 0.0 });
        const revealGeom = new THREE.BoxGeometry(pedestalWidth - 0.06, 0.06, pedestalDepth - 0.06);

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

        positions.forEach(pos => {
            const pedestalGroup = new THREE.Group();

            const pedestal = new THREE.Mesh(baseGeom, baseMaterial);
            pedestal.position.set(0, 0.06 + (pedestalHeight - 0.06) / 2, 0);
            pedestal.castShadow = false;
            pedestal.receiveShadow = true;
            pedestalGroup.add(pedestal);

            const reveal = new THREE.Mesh(revealGeom, revealMat);
            reveal.position.set(0, 0.03, 0);
            pedestalGroup.add(reveal);

            // Fake Ambient Occlusion Shadow
            const dropShadow = this.createDropShadow(1.9, 0.45);
            dropShadow.position.set(0, 0.012, 0);
            pedestalGroup.add(dropShadow);

            pedestalGroup.position.set(pos[0], 0, pos[1]);
            this.group.add(pedestalGroup);

            this.collidables.push(pedestal);
            this.pedestalMeshes.push(pedestal);

            this.createExhibitSpot(pos[0], pos[1]);
        });
    }

    private createDropShadow(radius: number, opacity: number): THREE.Mesh {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;

        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        const tex = new THREE.CanvasTexture(canvas);
        const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: opacity,
            depthWrite: false, // Previene el z-fighting
            color: 0xffffff
        });

        const plane = new THREE.Mesh(geo, mat);
        plane.rotation.x = -Math.PI / 2;
        return plane;
    }

    // Foco cenital del riel sobre el experimento (activo solo en la sala actual)
    private createExhibitSpot(x: number, z: number) {
        const isActive = this.exhibitSpots.length === 0;
        const spot = new THREE.SpotLight(0xfff3e2, 14, 12, Math.PI / 5, 0.55, 1.5);
        spot.position.set(x, WALL_HEIGHT - 0.3, z);
        spot.target.position.set(x, 0, z);
        spot.visible = isActive;
        this.group.add(spot);
        this.group.add(spot.target);
        this.exhibitSpots.push(spot);
    }

    public setActiveRoom(index: number | null): void {
        const targetIdx = index !== null ? index : -1;
        if (this.activeRoomIndex === targetIdx) return;
        this.activeRoomIndex = targetIdx;

        for (let i = 0; i < this.roomLights.length; i++) {
            const rl = this.roomLights[i];
            const isActive = i === targetIdx;

            rl.roomLight.visible = isActive;
            rl.accentLight.visible = isActive;
            if (this.exhibitSpots[i]) {
                this.exhibitSpots[i].visible = isActive;
            }
        }
    }

    public update(time: number): void {
        // Clouds drift
        for (const cloud of this.clouds) {
            cloud.sprite.position.x += cloud.speed * 0.016; // ~60fps
            if (cloud.sprite.position.x > 130) cloud.sprite.position.x = -130;
        }
        // Flying pigeons circle
        for (const p of this.pigeons) {
            if (!p.isPerched) {
                p.angle += p.speed * 0.003;
                p.sprite.position.x = Math.cos(p.angle) * p.radius;
                p.sprite.position.z = Math.sin(p.angle) * p.radius;
                p.sprite.position.y = p.baseY + Math.sin(time * 2 + p.wingPhase) * 1.5;
                // Wing flap via scale pulsing
                p.sprite.scale.y = 0.6 + Math.sin(time * 8 + p.wingPhase) * 0.15;
            }
        }
    }

    private buildLightingAndDecor() {
        // 1. Luz hemisférica natural y cálida de museo (ilumina uniformemente sin costo de sombras)
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 1.2);
        hemiLight.position.set(0, 32, 0);
        this.group.add(hemiLight);

        // 2. Luz solar direccional cálida (proyectada desde el Sol Celestial)
        const sunPos = new THREE.Vector3(24, 38, -26);
        const sunLight = new THREE.DirectionalLight(0xfffaea, 1.6);
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
    }

    private createRealisticSky(): void {
        // NOTE: scene.background must be changed to 0x87CEEB in main.ts
        // 1. SKY DOME - Simple gradient sphere
        const skyGeo = new THREE.SphereGeometry(180, 24, 12);
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 512;
        skyCanvas.height = 256;
        const skyCtx = skyCanvas.getContext('2d')!;
        // Beautiful midday gradient: deep blue zenith → light blue → white horizon
        const grad = skyCtx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#4A90D9');      // Deep sky blue zenith
        grad.addColorStop(0.3, '#87CEEB');    // Classic sky blue
        grad.addColorStop(0.6, '#B8DCF0');    // Light blue
        grad.addColorStop(0.85, '#E8F4F8');   // Very pale blue
        grad.addColorStop(1.0, '#FFFFFF');    // White horizon
        skyCtx.fillStyle = grad;
        skyCtx.fillRect(0, 0, 512, 256);
        const skyTexture = new THREE.CanvasTexture(skyCanvas);
        const skyMat = new THREE.MeshBasicMaterial({
            map: skyTexture,
            side: THREE.BackSide,
            fog: false
        });
        const skyDome = new THREE.Mesh(skyGeo, skyMat);
        skyDome.position.y = 10;
        this.group.add(skyDome);

        // 2. SUN - Large, beautiful, warm
        const sunGroup = new THREE.Group();
        const sunGeo = new THREE.SphereGeometry(5, 24, 24);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFF8E1 });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        sunGroup.add(sunMesh);
        // Sun corona glow sprite
        const coronaCanvas = document.createElement('canvas');
        coronaCanvas.width = 128;
        coronaCanvas.height = 128;
        const coronaCtx = coronaCanvas.getContext('2d')!;
        const coronaGrad = coronaCtx.createRadialGradient(64, 64, 8, 64, 64, 64);
        coronaGrad.addColorStop(0, 'rgba(255, 248, 225, 1.0)');
        coronaGrad.addColorStop(0.15, 'rgba(255, 236, 179, 0.8)');
        coronaGrad.addColorStop(0.4, 'rgba(255, 213, 79, 0.3)');
        coronaGrad.addColorStop(0.7, 'rgba(255, 183, 77, 0.08)');
        coronaGrad.addColorStop(1.0, 'rgba(255, 183, 77, 0.0)');
        coronaCtx.fillStyle = coronaGrad;
        coronaCtx.fillRect(0, 0, 128, 128);
        const coronaTexture = new THREE.CanvasTexture(coronaCanvas);
        const coronaSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: coronaTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        coronaSprite.scale.set(40, 40, 1);
        sunGroup.add(coronaSprite);
        sunGroup.position.set(30, 55, -35);
        this.group.add(sunGroup);

        // 3. CLOUDS - 14 lightweight sprites with slow movement
        const cloudCanvas = document.createElement('canvas');
        cloudCanvas.width = 128;
        cloudCanvas.height = 64;
        const cloudCtx = cloudCanvas.getContext('2d')!;
        // Soft fluffy cloud shape
        cloudCtx.fillStyle = 'rgba(0,0,0,0)';
        cloudCtx.clearRect(0, 0, 128, 64);
        const drawCloudBlob = (cx: number, cy: number, rx: number, ry: number, opacity: number) => {
            const g = cloudCtx.createRadialGradient(cx, cy, 0, cx, cy, rx);
            g.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            g.addColorStop(0.6, `rgba(245, 248, 255, ${opacity * 0.6})`);
            g.addColorStop(1, 'rgba(240, 245, 255, 0)');
            cloudCtx.fillStyle = g;
            cloudCtx.beginPath();
            cloudCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            cloudCtx.fill();
        };
        drawCloudBlob(40, 35, 35, 20, 0.9);
        drawCloudBlob(70, 30, 30, 22, 0.85);
        drawCloudBlob(55, 28, 28, 18, 0.95);
        drawCloudBlob(85, 35, 25, 16, 0.8);
        drawCloudBlob(25, 32, 22, 15, 0.75);
        const cloudTexture = new THREE.CanvasTexture(cloudCanvas);

        this.clouds = [];
        for (let i = 0; i < 14; i++) {
            const cloud = new THREE.Sprite(
                new THREE.SpriteMaterial({
                    map: cloudTexture,
                    transparent: true,
                    opacity: 0.55 + Math.random() * 0.3,
                    depthWrite: false,
                    fog: false
                })
            );
            const scale = 18 + Math.random() * 28;
            cloud.scale.set(scale, scale * 0.45, 1);
            cloud.position.set(
                (Math.random() - 0.5) * 240,
                42 + Math.random() * 30,
                (Math.random() - 0.5) * 240
            );
            this.group.add(cloud);
            this.clouds.push({
                sprite: cloud,
                speed: 0.15 + Math.random() * 0.4,
                originalX: cloud.position.x
            });
        }

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

    private buildViewingIndicators(): void {
        const roomData = [
            ...SALA_LAYOUT.map((s, i) => ({
                name: `${SALAS[i].icono} ${SALAS[i].titulo}`,
                sub: `${numeroSala(i)} · ${SALAS[i].grupo}`,
                pos: [s.side * 15, s.exhibitZ],
                viewDir: [-s.side, 0]
            })),
            { name: `${GALERIA.icono} ${GALERIA.titulo}`, sub: 'Galería especial', pos: [0, -35], viewDir: [0, 1] }
        ];

        for (const room of roomData) {
            // Marca de piso discreta, como las de vinilo de un museo
            const arrowCanvas = document.createElement('canvas');
            arrowCanvas.width = 256;
            arrowCanvas.height = 128;
            const ctx = arrowCanvas.getContext('2d')!;
            ctx.clearRect(0, 0, 256, 128);
            ctx.fillStyle = 'rgba(43, 38, 34, 0.55)';
            ctx.beginPath();
            ctx.moveTo(128, 18);
            ctx.lineTo(168, 48);
            ctx.lineTo(140, 48);
            ctx.lineTo(140, 70);
            ctx.lineTo(116, 70);
            ctx.lineTo(116, 48);
            ctx.lineTo(88, 48);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(43, 38, 34, 0.7)';
            ctx.font = '600 15px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('OBSERVÁ DESDE ACÁ', 128, 100);
            const arrowTex = new THREE.CanvasTexture(arrowCanvas);
            const arrow = new THREE.Mesh(
                new THREE.PlaneGeometry(1.6, 0.8),
                new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
            );
            arrow.rotation.x = -Math.PI / 2;
            arrow.position.set(
                room.pos[0] + room.viewDir[0] * 2.5,
                0.03,
                room.pos[1] + room.viewDir[1] * 2.5
            );
            arrow.rotation.z = Math.atan2(-room.viewDir[0], room.viewDir[1]);
            arrow.castShadow = false;
            this.group.add(arrow);

            // Etiqueta del objeto en el frente del plinto
            const plaqueCanvas = document.createElement('canvas');
            plaqueCanvas.width = 512;
            plaqueCanvas.height = 128;
            const pCtx = plaqueCanvas.getContext('2d')!;
            pCtx.fillStyle = '#fbfaf7';
            pCtx.fillRect(0, 0, 512, 128);
            pCtx.textAlign = 'left';
            pCtx.fillStyle = '#231f1c';
            pCtx.font = '500 34px Georgia, "Times New Roman", serif';
            pCtx.fillText(this.fitText(pCtx, room.name, 470), 22, 50);
            pCtx.font = '400 19px Inter, sans-serif';
            pCtx.fillStyle = '#6b625a';
            pCtx.fillText(room.sub, 22, 84);
            pCtx.fillText('Tocá [E] para experimentar', 22, 110);
            const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
            plaqueTex.colorSpace = THREE.SRGBColorSpace;
            const plaque = new THREE.Mesh(
                new THREE.PlaneGeometry(1.2, 0.3),
                new THREE.MeshBasicMaterial({ map: plaqueTex })
            );
            plaque.position.set(
                room.pos[0] + room.viewDir[0] * 1.21,
                0.95,
                room.pos[1] + room.viewDir[1] * 1.21
            );
            plaque.rotation.y = Math.atan2(room.viewDir[0], room.viewDir[1]);
            plaque.castShadow = false;
            this.group.add(plaque);
        }
    }

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
            sign.position.set(0, 0.3, 0.09);
            door.add(sign);
            const signBack = sign.clone();
            signBack.rotation.y = Math.PI;
            signBack.position.z = -0.09;
            door.add(signBack);
        }
    }

    public getDoorBarriers(): THREE.Mesh[] {
        return this.doorBarriers;
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

    public getInternalWallBoxes(): WallBox[] {
        return this.internalWallBoxes;
    }
}
