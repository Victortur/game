        // Inicialización de Kaboom
        kaboom();
        loadSprite("background", "assets/sprites/fondo.png");
        loadSprite("lose1", "assets/sprites/lose1.png");
        loadSprite("albor", "assets/sprites/albor.png");

        // Cargar las imágenes de los nuevos objetos
        loadSprite("pesadilla", "assets/sprites/pesadilla.png");
        loadSprite("recurrente", "assets/sprites/recurrente.png");
        loadSprite("sanador", "assets/sprites/sanador.png");
        // Definición de los nombres de los objetos
        const objs = [
            "pesadilla",
            "recurrente",
            "sanador",
        ];

        // Cargar las imágenes de los objetos
        for (const obj of objs) {
            loadSprite(obj, `assets/sprites/${obj}.png`, {});
        }

        // Cargar los sonidos
        loadBean()


        // Inicializar la lista de objetos colisionados
        let collidedObjects = [];

        // Escena principal del juego
        scene("battle", () => {

            // Definición de constantes para el juego
            const BULLET_SPEED = 1200
            const TRASH_SPEED = 120
            const PLAYER_SPEED = 480
            const STAR_SPEED = 120
            const OBJ_HEALTH = 4

            // Elegir un nombre de jefe al azar
            const bossName = choose(objs);

            // Variable para el modo "insane"
            let insaneMode = true;



            // Ajustar el volumen de la música
            volume(0.5)

            add([
                sprite("background"),

            ]);

            // Función para hacer crecer un objeto
            function grow(rate) {
                return {
                    update() {
                        const n = rate * dt()
                        this.scale.x += n
                        this.scale.y += n
                    },
                }
            }

            // Función para ocultar un objeto después de un tiempo
            function late(t) {
                let timer = 0
                return {
                    add() {
                        this.hidden = true
                    },
                    update() {
                        timer += dt()
                        if (timer >= t) {
                            this.hidden = false
                        }
                    },
                }
            }

            function spawnTrash() {
                let speed = rand(TRASH_SPEED * 1.5, TRASH_SPEED * 2); // velocidad predeterminada
                const name = choose(objs);
                if (collidedObjects.includes("sanador")) {
                    speed -= 80; // reducir la velocidad si hay una colisión con "coin"
                    add([
                        text("Sanando...", { size: 20 }),
                        anchor("center"),
                        pos(width() / 2, height() / 2),
                    ]);
                }
                const enemy = add([
                    sprite(name),
                    area(),
                    pos(rand(0, width()), 0),
                    health(OBJ_HEALTH),
                    anchor("bot"),
                    "trash",
                    "enemy",
                    { speed: speed, name: name },
                ]);
                wait(insaneMode ? 0.1 : 0.3, spawnTrash);
            }



            const player = add([
                sprite("albor"),
                area(),
                pos(width() / 2, height() - 64),
                anchor("center"),
            ])

            // Manejar eventos de teclado para mover al jugador
            onKeyDown("left", () => {
                player.move(-PLAYER_SPEED, 0)
                if (player.pos.x < 0) {
                    player.pos.x = width()
                }
            })

            onKeyDown("right", () => {
                player.move(PLAYER_SPEED, 0)
                if (player.pos.x > width()) {
                    player.pos.x = 0
                }
            })

            // Manejar colisiones entre el jugador y los enemigos
            player.onCollide("enemy", (e) => {
                if (e.name === "pesadilla") {
                    // Si el jugador colisiona con "apple", destruir al jugador
                    destroy(player);
                    // Ir a la escena de derrota
                    go("lose");
                }

                // Destruye el objeto que colisionó con el jugador
                destroy(e);
                collidedObjects.push(e.name); // Agrega el nombre del objeto a la lista de colisiones
            });

            // Función para agregar explosiones
            function addExplode(p, n, rad, size) {
                for (let i = 0; i < n; i++) {
                    wait(rand(n * 0.1), () => {
                        for (let i = 0; i < 2; i++) {
                            add([
                                pos(p.add(rand(vec2(-rad), vec2(rad)))),
                                rect(4, 4),
                                scale(1 * size, 1 * size),
                                lifespan(0.1),
                                grow(rand(48, 72) * size),
                                anchor("center"),
                            ])
                        }
                    })
                }
            }

            // Temporizador para la escena "battle"
            const timer = add([
                text(0),
                pos(20, 32),
                fixed(),
                { time: 0 },
            ])

            // Actualizar el temporizador y cambiar a la escena "win" si el tiempo llega a 10 segundos
            timer.onUpdate(() => {
                timer.time += dt();
                timer.text = timer.time.toFixed(2);

                if (timer.time >= 10) {
                    go("win", { time: timer.time });
                }
            });

            // Actualizar la posición de los objetos "trash"
            onUpdate("trash", (t) => {
                t.move(0, t.speed * (insaneMode ? 5 : 1))
                if (t.pos.y - t.height > height()) {
                    destroy(t)
                }
            })



            // Generar enemigos
            spawnTrash()


        })

        // Escena de victoria
        scene("win", ({ time, boss }) => {

            onClick(() => {
                go("battle"); // Volver a la escena principal
            });

            add([
                sprite("background"),

            ]);


            // Agregar texto de felicitaciones y mostrar los objetos colisionados
            add([
                text("Enhorabuena! Has dormido toda la noche, estos han sido tus sueños:", { size: 20 }),
                anchor("center"),
                pos(width() / 2, height() / 3),
            ])

            // Contar cuántas veces aparece cada sueño en la lista collidedObjects
            const dreamCounts = {};
            collidedObjects.forEach(dream => {
                if (!dreamCounts[dream]) {
                    dreamCounts[dream] = 1;
                } else {
                    dreamCounts[dream]++;
                }
            });

            // Mostrar cuántos de cada sueño se han recogido
            let yOffset = 50;
            for (const dream in dreamCounts) {
                add([
                    text(`${dream}: ${dreamCounts[dream]}`, { size: 18 }),
                    pos(width() / 2, height() / 2.5 + yOffset),
                    anchor("center"),
                ]);
                yOffset += 35; // Incrementar la posición vertical para el siguiente texto
            }


            // Añadir el texto
            const resumeText = add([
                text("CLICK para reanudar la partida ", { size: 30 }),
                anchor("center"),
                pos(width() / 2, height() / 2 + 200),
            ]);

            // Función para hacer que el texto parpadee
            function blinkText() {
                // Hacer visible el texto
                resumeText.hidden = false;
                // Ocultar el texto después de un corto período de tiempo
                wait(0.5, () => {
                    resumeText.hidden = true;
                    // Llamar a la función nuevamente después de un tiempo para continuar el parpadeo
                    wait(0.5, () => {
                        blinkText();
                    });
                });
            }

            // Iniciar el parpadeo del texto
            blinkText();

            // Limpiar la lista de objetos colisionados
            collidedObjects = [];

        })

        scene("lose", () => {

            onClick(() => {
                go("battle"); // Volver a la escena principal
            });

            add([
                sprite("lose1"),

            ]);


            add([
                text("¡Te ha despertado una pesadilla! Estos han sido tus sueños: ", { size: 20 }),
                anchor("center"),
                pos(width() / 2, height() / 3),
            ]);

            // Contar cuántas veces aparece cada sueño en la lista collidedObjects
            const dreamCounts = {};
            collidedObjects.forEach(dream => {
                if (!dreamCounts[dream]) {
                    dreamCounts[dream] = 1;
                } else {
                    dreamCounts[dream]++;
                }
            });

            // Mostrar cuántos de cada sueño se han recogido
            let yOffset = 50;
            for (const dream in dreamCounts) {
                add([
                    text(`${dream}: ${dreamCounts[dream]}`, { size: 18 }),
                    pos(width() / 2, height() / 2.5 + yOffset),
                    anchor("center"),
                ]);
                yOffset += 35; // Incrementar la posición vertical para el siguiente texto
            }

            // Añadir el texto
            const resumeText = add([
                text("CLICK para reanudar la partida ", { size: 30 }),
                anchor("center"),
                pos(width() / 2, height() / 2 + 200),
            ]);

            // Función para hacer que el texto parpadee
            function blinkText() {
                // Hacer visible el texto
                resumeText.hidden = false;
                // Ocultar el texto después de un corto período de tiempo
                wait(0.5, () => {
                    resumeText.hidden = true;
                    // Llamar a la función nuevamente después de un tiempo para continuar el parpadeo
                    wait(0.5, () => {
                        blinkText();
                    });
                });
            }

            // Iniciar el parpadeo del texto
            blinkText();

            // Limpiar la lista de objetos colisionados
            collidedObjects = [];
        });



        // Iniciar la escena principal del juego
        go("battle")