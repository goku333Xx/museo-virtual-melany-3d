const fs = require('fs');
let world = fs.readFileSync('app/src/World.ts', 'utf-8');

world = world.replace(/const quizPapa: QuizData = {[\s\S]*?explanation: "¡Re bien! El jugo de la papa hace de puente para que los electrones corran de un clavo al otro, armando una corriente eléctrica de verdad."\n        };/, `const quizPapa: QuizData = {
            id: 1,
            title: "Sala 01: Pila de Papa",
            question: "¿Cómo hacen un par de papas comunes para encender la luz?",
            options: [
                "Absorben calor del aire y sacan un humo mágico.",
                "El juguito de la papa empuja a los electrones por el cable, ¡como si corrieran un maratón!",
                "Tienen minipilas escondidas adentro, ¡re obvio!"
            ],
            correctIndex: 1,
            explanation: "¡Zarpado! El juguito de la papa funciona como una autopista para que los electrones corran de un clavo al otro, armando una corriente eléctrica re posta."
        };`);

world = world.replace(/const papaInteractable: Omit<Interactable, 'object'> = {[\s\S]*?tag: "🔋 ENERGÍA QUÍMICA A ELÉCTRICA",\n            description: "¡El jugo ácido de las papas despierta a los electrones! El jugo hace que viajen del clavo de zinc al clavo de cobre como chicos corriendo al recreo, sumando casi 2 Voltios para encender la luz verde.",/, `const papaInteractable: Omit<Interactable, 'object'> = {
            id: 1,
            title: "Sala 01: Pila de Papa",
            tag: "🔋 DE QUÍMICA A ELÉCTRICA",
            description: "¡El jugo ácido de las papas es el secreto! Despierta a los electrones y los empuja por el cable como si fuera la presión del agua en una manguera. Así viajan del clavo de zinc al de cobre y prenden la luz.",`);

world = world.replace(/const quizTesla: QuizData = {[\s\S]*?explanation: "¡Fabuloso! Nikola Tesla inventó la energía inalámbrica: unas ondas invisibles viajan por el aire y 'despiertan' al gas de adentro para que brille."\n        };/, `const quizTesla: QuizData = {
            id: 2,
            title: "Sala 02: Bobina de Tesla",
            question: "¿Por qué el tubo se prende flotando sin estar enchufado a nada?",
            options: [
                "La bobina tira ondas invisibles por el aire que hacen brillar al gas adentro del tubo.",
                "El vidrio tiene minipilas que se calientan y brillan.",
                "El ruido de los rayos asusta a la luz y la hace salir."
            ],
            correctIndex: 0,
            explanation: "¡Tremendo! Como dijo Tesla, la energía viaja sin cables. La bobina manda ondas invisibles que 'despiertan' a los electrones del gas para que hagan alto show de luz."
        };`);

world = world.replace(/const teslaInteractable: Omit<Interactable, 'object'> = {[\s\S]*?tag: "⚡ ALTA TENSIÓN Y ENERGÍA SIN CABLES",\n            description: "Nikola Tesla descubrió cómo enviar energía sin ningún cable. La bobina crea ondas invisibles en el aire que despiertan el gas dentro del tubo fluorescente haciéndolo brillar flotando en el aire.",/, `const teslaInteractable: Omit<Interactable, 'object'> = {
            id: 2,
            title: "Sala 02: Bobina de Tesla",
            tag: "⚡ ENERGÍA INALÁMBRICA",
            description: "¡Mirá cómo fluye la energía por el aire! Nikola Tesla inventó esta máquina para mandar electricidad sin cables. La bobina dispara ondas invisibles que hacen brillar al tubo fluorescente a la distancia. ¡Pura magia científica!",`);

world = world.replace(/const quizWind: QuizData = {[\s\S]*?explanation: "¡Brillante! Al girar por el viento, unos imanes enormes empujan a los electrones por los cables para llevar luz a toda la ciudad."\n        };/, `const quizWind: QuizData = {
            id: 3,
            title: "Sala 03: Aerogenerador",
            question: "¿Cómo hace el molino gigante para que las casitas tengan luz?",
            options: [
                "El viento empuja imanes gigantes que mueven electrones hacia la ciudad.",
                "Las aspas exprimen las nubes para sacarles electricidad.",
                "El viento empuja la luz del sol por los cables."
            ],
            correctIndex: 0,
            explanation: "¡Excelente! Al girar por el viento, unos imanes enormes empujan a los electrones por los cables, ¡como si los estuvieran bombeando para llevar luz a toda la mini ciudad!"
        };`);

world = world.replace(/const windInteractable: Omit<Interactable, 'object'> = {[\s\S]*?tag: "🌪️ ENERGÍA DEL VIENTO A LUZ \(EÓLICA\)",\n            description: "¡El viento hace girar aspas gigantes y mueve imanes dentro de bobinas de alambre de cobre! Ese baile de imanes empuja a millones de electrones por los cables para iluminar toda la maqueta de la ciudad.",/, `const windInteractable: Omit<Interactable, 'object'> = {
            id: 3,
            title: "Sala 03: Aerogenerador & Mini Ciudad",
            tag: "🌪️ VIENTO A ELECTRICIDAD (EÓLICA)",
            description: "¡El viento mueve las aspas gigantes como si fueran un ventilador al revés! Adentro hay imanes enormes bailando cerca de unos cables de cobre. Ese movimiento bombea millones de electrones hacia la ciudad para encender todas las luces.",`);

world = world.replace(/const quizSolar: QuizData = {[\s\S]*?explanation: "¡Excelente! Los paquetitos de luz \(fotones\) chocan contra el silicio azul y ponen en movimiento a los electrones, generando electricidad directa."\n        };/, `const quizSolar: QuizData = {
            id: 4,
            title: "Sala 04: Panel Solar Fotovoltaico",
            question: "¿Qué hace la luz para que gire la hélice del avioncito?",
            options: [
                "Calienta el panel y el humo caliente empuja la hélice.",
                "Unos paquetitos de luz (fotones) chocan contra el panel y ponen a correr a los electrones.",
                "La luz empuja el viento hacia el panel solar."
            ],
            correctIndex: 1,
            explanation: "¡Genial! Los fotones de la luz bombardean la placa azul y le dan un empujón a los electrones para que salgan corriendo y hagan girar el motor."
        };`);

world = world.replace(/const solarInteractable: Omit<Interactable, 'object'> = {[\s\S]*?tag: "☀️ DE LUZ SOLAR A BATERÍAS \(SOLAR\)",\n            description: "¡La luz viaja en paquetitos diminutos llamados fotones! Cuando chocan contra la placa azul de silicio, empujan a los electrones y generan electricidad que carga las baterías de litio.",/, `const solarInteractable: Omit<Interactable, 'object'> = {
            id: 4,
            title: "Sala 04: Panel Solar Fotovoltaico",
            tag: "☀️ LUZ SOLAR A ELECTRICIDAD",
            description: "¡La luz viaja en unos minipaquetitos llamados fotones! Cuando chocan contra la placa azul, empujan a los electrones como si los patearan. ¡Esos electrones corriendo por los cables hacen girar el motor del avión!",`);

world = world.replace(/const quizVanDeGraaff: QuizData = {[\s\S]*?explanation: "¡Exacto! Cargas eléctricas iguales se rechazan con fuerza. Como la esfera y las tiras tienen la misma carga, ¡se empujan entre sí y flotan en el aire!"\n        };/, `const quizVanDeGraaff: QuizData = {
            id: 5,
            title: "Sala 05: Generador Van de Graaff",
            question: "¿Por qué las cintas de colores se paran de punta y flotan en el aire?",
            options: [
                "La bocha de metal sopla viento desde adentro.",
                "Se llenan de la misma carga eléctrica y, como pasa con los imanes iguales, se rechazan.",
                "El aluminio es un material que odia la gravedad."
            ],
            correctIndex: 1,
            explanation: "¡Perfecto! Como la bocha y las tiras se llenan de la misma carga, no se pueden ni ver y se empujan entre sí. ¡Por eso levitan flotando en el aire!"
        };`);

world = world.replace(/const vanDeGraaffInteractable: Omit<Interactable, 'object'> = {[\s\S]*?tag: "⚡ ELECTRICIDAD ESTÁTICA Y FRICCIÓN",\n            description: "¡Como cuando frotás un globo en tu buzo de lana y se te paran los pelos! La cinta junta tanta carga igual en la esfera plateada que las tiras se rechazan entre sí y flotan en el aire desafiando la gravedad.",/, `const vanDeGraaffInteractable: Omit<Interactable, 'object'> = {
            id: 5,
            title: "Sala 05: Generador de Van de Graaff",
            tag: "⚡ ELECTRICIDAD ESTÁTICA",
            description: "¡Es como cuando frotás un globo en la ropa y se te paran los pelos! La bocha junta tanta carga de electricidad estática que las tiritas se rechazan unas a otras porque tienen la misma carga, ¡y terminan flotando como locas!",`);

world = world.replace(/const quizNewton: QuizData = {[\s\S]*?explanation: "¡Magistral! La física demuestra que tanto la masa como la velocidad del golpe deben salir iguales del otro lado en el choque."\n        };/, `const quizNewton: QuizData = {
            id: 6,
            title: "Sala 06: Cuna de Newton",
            question: "Al soltar 2 bolas de acero, ¿por qué del otro lado salen 2 y no 1 sola rapidísimo?",
            options: [
                "Porque las bolas del medio tienen resortes que cuentan los golpes.",
                "Porque la energía y el movimiento viajan exactos como una ola invisible de punta a punta.",
                "Porque el acero solo rebota en números pares."
            ],
            correctIndex: 1,
            explanation: "¡Muuuy bien! La física es justa: la misma cantidad de 'empuje' que entra de un lado tiene que salir del otro sin perderse. ¡Es la regla de oro del universo!"
        };`);

world = world.replace(/const newtonInteractable: Omit<Interactable, 'object'> = {[\s\S]*?tag: "⚖️ LA ENERGÍA VIAJA COMO UNA OLA",\n            description: "¡La energía nunca desaparece, solo viaja! Si levantás y soltás 2 bolas de acero, el golpe viaja como una ola invisible atravesando a las bolas del medio sin moverlas, y hace saltar exactamente a 2 bolas del otro lado.",/, `const newtonInteractable: Omit<Interactable, 'object'> = {
            id: 6,
            title: "Sala 06: Cuna de Newton",
            tag: "⚖️ ENERGÍA EN MOVIMIENTO",
            description: "¡La energía nunca desaparece, solo se pasa de mano en mano! Si soltás 2 bolas, el golpe viaja como un fantasma a través de las del medio sin moverlas y hace saltar justo a 2 del otro lado. ¡Magia de la física pura!",`);

world = world.replace(/const quizDynamo: QuizData = {[\s\S]*?explanation: "¡Excelente! Tu trabajo muscular hace girar bobinas de cobre entre imanes, creando corriente eléctrica. Esa corriente calienta el filamento a más de 2000°C hasta que resplandece."\n        };/, `const quizDynamo: QuizData = {
            id: 7,
            title: "Sala 07: Dínamo Manual con Manivela",
            question: "¿Cómo es que tu fuerza con la manivela termina siendo luz en el foquito?",
            options: [
                "Los engranajes frotan cables calientes hasta que hacen chispas.",
                "Tu movimiento gira imanes que empujan electrones, armando corriente que pone al foquito al rojo vivo.",
                "La manivela sopla viento adentro del vidrio de la lámpara."
            ],
            correctIndex: 1,
            explanation: "¡Re groso! Tu fuerza gira unas bobinas adentro de imanes, y ese baile bombea electrones que calientan el alambrecito de la bombilla hasta que da luz."
        };`);

world = world.replace(/const dynamoInteractable: Omit<Interactable, 'object'> = {[\s\S]*?tag: "⚙️ FUERZA MUSCULAR A LUZ EN LA BOMBILLA",\n            description: "¡Convertí tu propia fuerza física en luz! Al girar la manivela, los engranajes multiplican 5 veces tu velocidad haciendo girar bobinas entre imanes. ¡Esa corriente calienta el filamento de tungsteno hasta brillar con luz dorada!",/, `const dynamoInteractable: Omit<Interactable, 'object'> = {
            id: 7,
            title: "Sala 07: Dínamo Manual con Manivela",
            tag: "⚙️ ENERGÍA MUSCULAR A LUZ",
            description: "¡Usá tus propios músculos para hacer luz! Al girar a toda máquina, unos engranajes hacen dar vueltas a un imán rapidísimo. Esto bombea electrones por el cable que calientan un alambrecito a 2000°C hasta que brilla zarpado.",`);

world = world.replace(/const opticsQuiz: QuizData = {[\s\S]*?explanation: "¡Exacto! La luz blanca es una mezcla de todos los colores. El vidrio frena a cada color a una velocidad distinta, abriendo el abanico del arcoíris."\n        };/, `const opticsQuiz: QuizData = {
            id: 8,
            title: "Galería Especial: Prisma Óptico",
            question: "¿Por qué un vidrio con forma de triángulo te saca un arcoíris de una luz blanca?",
            options: [
                "El vidrio tiene pintura de colores adentro.",
                "La luz blanca tiene todos los colores escondidos, y el prisma frena a cada uno a distinta velocidad.",
                "El láser cambia de color cuando se enfría en el vidrio."
            ],
            correctIndex: 1,
            explanation: "¡Sos un crack! La luz blanca es como una pizza de todos los colores. El prisma frena a cada color diferente, abriendo el abanico para formar el arcoíris."
        };`);

world = world.replace(/const opticsInteractable: Omit<Interactable, 'object'> = {[\s\S]*?tag: "🌈 EL SECRETO DEL ARCOÍRIS",\n            description: "Isaac Newton descubrió en 1666 que la luz blanca contiene mezclados todos los colores del arcoíris. ¡Al entrar al cristal triangular, cada color se separa y crea el arcoíris en la pantalla!",/, `const opticsInteractable: Omit<Interactable, 'object'> = {
            id: 8,
            title: "Galería Especial: Prisma Óptico",
            tag: "🌈 EL SECRETO DE LA LUZ",
            description: "Hace un montón, Isaac Newton descubrió que la luz blanca tiene todos los colores del arcoíris mezclados. ¡Al atravesar este prisma triangular, la luz se frena y cada color sale por su lado como un abanico re flashero!",`);


world = world.replace(/const robotInteractable: Omit<Interactable, 'object'> = {[\s\S]*?explanation: "¡Excelente! Seguí a Mel-Bot hacia cada sala temática."\n            },/, `const robotInteractable: Omit<Interactable, 'object'> = {
            id: 99,
            title: "Mel-Bot: Asistente Robótico",
            tag: "🤖 TU GUÍA CIENTÍFICA",
            description: "¡Buenas! Soy Mel-Bot, tu compañero robot de aventuras. Estoy acá para acompañarte por todo el museo y tirarte la posta sobre cómo funcionan todos estos inventos increíbles. ¡Vamos a explorar juntos!",
            badge: "ℹ️ Asistente de Expedición",
            getModeText: () => this.robotGuide.isGuiding() ? "ESTADO: GUIANDO A SALA 🚀" : "ESTADO: ESPERANDO ÓRDENES",
            quiz: {
                id: 99,
                title: "Guía del Museo",
                question: "¿Arrancamos a explorar las salas a pura ciencia?",
                options: ["¡De una, vamos!", "Bancá que quiero mirar más"],
                correctIndex: 0,
                explanation: "¡Esa es la actitud! Seguime y te muestro cada rincón del museo."
            },`);


world = world.replace(/let btn1Label = '¡Sí, vamos!';/, `let btn1Label = '¡De una, vamos!';`);
world = world.replace(/speech = `🎉 ¡FELICITACIONES, <b>\$\{this.hud.getStudentName\(\)\}<\/b>! 🏆<br><br>¡Ya completaste las 7 salas temáticas y sos un <b>Gran Maestro de la Energía Universal<\/b>!<br><br>¿Querés que volemos juntos a la <b>Galería Óptica<\/b> a ver el prisma de Newton o preferís ver tu diploma en el Diario\? 🌈`;/, `speech = \`🎉 ¡FELICITACIONES, <b>\${this.hud.getStudentName()}</b>! 🏆<br><br>¡Zarpado! Completaste las 7 salas y ya sos un <b>Gran Maestro de la Energía</b> oficial.<br><br>¿Te copás si vamos volando a la <b>Galería Óptica</b> para ver el prisma de Newton o preferís chusmear tu diploma en el Diario? 🌈\`;`);
world = world.replace(/speech = `¡Todavía no completaste esta sala, <b>\$\{this.hud.getStudentName\(\)\}<\/b>! 🔬<br><br>Tu misión es interactuar con el experimento \(tecla \[E\]\) y luego presionar el botón 🏆 <b>\[DESAFÍO CIENTÍFICO\]<\/b> \(tecla \[R\]\) para responder la pregunta y ganar tu medalla. ¡Terminá para avanzar!`;\n                    btn1Label = '¡Quiero investigar!';/, `speech = \`¡Ojo al piojo, <b>\${this.hud.getStudentName()}</b>! 🔬<br><br>Todavía te falta esta sala. Acordate de interactuar (con la tecla [E]) y después mandale click a 🏆 <b>[DESAFÍO CIENTÍFICO]</b> (tecla [R]) para responder la trivia y ganarte la medalla. ¡Vos podés!\`;\n                    btn1Label = '¡A seguir investigando!';`);
world = world.replace(/speech = `¡Ya completaste esta sala! Vamos a la siguiente.`;/, `speech = \`¡Esa sala ya la tenés cocinada! ¡Genial! Vamos para la próxima.\`;`);
world = world.replace(/speech = `Soy Mel-BOT, tu asistente científico de expedición. 🤖<br><br>¿Querés que te guíe volando a la <b>\$\{nextRoom.name\}<\/b> para continuar investigando\? ¡Seguime volando! 🚀`;/, `speech = \`¡Holaaa! Soy Mel-BOT, tu compa robot en esta expedición. 🤖<br><br>¿Querés que vayamos volando a la <b>\${nextRoom.name}</b> para seguir con la aventura? ¡Seguime el ritmo! 🚀\`;`);
world = world.replace(/this.hud.showAchievementToast\('¡Atención! 🛑', `Primero debés completar la \$\{currentRoom.name\}.\`\);/, `this.hud.showAchievementToast('¡Pará un poco! 🛑', \`Primero tenés que resolver la \${currentRoom.name}.\`);`);
world = world.replace(/this.hud.showAchievementToast\('¡SÍGUEME! 🚀', `¡Mel-Bot vuela guiándote a la \$\{nextRoom.name\}!\`, '🚀'\);/, `this.hud.showAchievementToast('¡SEGUIME! 🚀', \`¡Mel-Bot te lleva a la \${nextRoom.name} a toda velocidad!\`, '🚀');`);
world = world.replace(/this.hud.showAchievementToast\('¡Mel-Bot te Guía! 🚀', `Seguí a Mel-Bot volando hacia la \$\{nextRoom.name\}\`, '🤖'\);/, `this.hud.showAchievementToast('¡Mel-Bot te Guía! 🚀', \`Seguí a Mel-Bot a toda velocidad hacia la \${nextRoom.name}\`, '🤖');`);

fs.writeFileSync('app/src/World.ts', world);

let hud = fs.readFileSync('app/src/HUD.ts', 'utf-8');

hud = hud.replace(/this.feedbackText.innerText = `¡Excelente, \$\{this.studentName\}! \$\{explanation\}`;/, `this.feedbackText.innerText = \`¡Zarpado, \${this.studentName}! \${explanation}\`;`);
hud = hud.replace(/this.feedbackText.innerText = '¡Casi! Pensalo de nuevo o cerrá para mirar el experimento de nuevo.';/, `this.feedbackText.innerText = '¡Uy, casi! Pensalo de nuevo o cerrá para investigar el experimento un ratito más.';`);

hud = hud.replace(/private readonly missionsData = \[[\s\S]*?\];/, `private readonly missionsData = [
        { title: "Pila de Papa", desc: "Cerrá el circuito y mirá cómo viajan los electrones (~1.94V)" },
        { title: "Bobina de Tesla", desc: "¡Magia pura! Pasá energía por el aire sin cables" },
        { title: "Aerogenerador Faraday", desc: "Usá el viento para darle luz a toda la mini ciudad" },
        { title: "Panel Solar", desc: "Atrapá fotones y hacé que gire el motor del avión" },
        { title: "Van de Graaff", desc: "Juntá 150.000V y mirá cómo levitan las cintas locas" },
        { title: "Cuna de Newton", desc: "Comprobá cómo la energía rebota de punta a punta" },
        { title: "Dínamo Manual", desc: "¡Transpirá un poco y encendé la lámpara a pura manivela!" }
    ];`);

hud = hud.replace(/const achievements: Record<number, \{ title: string; desc: string \}> = \{[\s\S]*?\};\n\n        if \(achievements\[missionId\]\)/, `const achievements: Record<number, { title: string; desc: string }> = {
            1: { title: 'Pila de Papa: ¡Corriente Zarpada!', desc: '¡Cerraste el circuito y sacaste ~1.94V de unas simples papas!' },
            2: { title: 'Bobina de Tesla: ¡Pura Magia!', desc: '¡Transmitiste energía inalámbrica por el aire como un campeón!' },
            3: { title: 'Aerogenerador: ¡Alto Viento!', desc: '¡Le diste electricidad a la ciudad usando solo la fuerza del viento!' },
            4: { title: 'Panel Solar: ¡Fotones al Ataque!', desc: '¡Transformaste la luz del sol para hacer girar la hélice!' },
            5: { title: 'Van de Graaff: ¡Pelos de Punta!', desc: '¡Acumulaste tanta estática que hiciste levitar las cintas!' },
            6: { title: 'Cuna de Newton: ¡Ping Pong de Energía!', desc: '¡Comprobaste cómo la energía viaja de lado a lado sin perderse!' },
            7: { title: 'Dínamo Manual: ¡A Puro Músculo!', desc: '¡Transformaste tu propio esfuerzo en luz de verdad!' }
        };

        if (achievements[missionId])`);

hud = hud.replace(/if \(this.xp >= 700\) \{[\s\S]*?\} else \{/, `if (this.xp >= 700) {
            this.rankText.innerText = 'Nivel 5: ¡Gran Maestro de la Energía!';
        } else if (this.xp >= 500) {
            this.rankText.innerText = 'Nivel 4: Ingeniero Súper Renovable';
        } else if (this.xp >= 300) {
            this.rankText.innerText = 'Nivel 3: Domador de Electrones';
        } else if (this.xp >= 100) {
            this.rankText.innerText = 'Nivel 2: Investigador Curioso';
        } else {`);

hud = hud.replace(/this.progressText.innerText = count === 7 \n                \? '🏆 ¡EXPEDICIÓN COMPLETA! Gran Maestro de la Energía' /, `this.progressText.innerText = count === 7 
                ? '🏆 ¡EXPEDICIÓN COMPLETA! ¡Gran Maestro de la Energía!' `);

fs.writeFileSync('app/src/HUD.ts', hud);
console.log('Edits completed');
