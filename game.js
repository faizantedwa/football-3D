document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    /* =========================================================
       FOOTBALL 3D-STYLE LOCAL GAME
       game.js
       ========================================================= */

    var canvas = document.getElementById("gameCanvas");

    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);
    }

    var ctx = canvas.getContext("2d");

    if (!ctx) {
        return;
    }


    /* =========================================================
       CANVAS / FULL SCREEN
       ========================================================= */

    var W = 1280;
    var H = 720;

    function resizeCanvas() {

        var width =
            window.innerWidth ||
            document.documentElement.clientWidth ||
            1280;

        var height =
            window.innerHeight ||
            document.documentElement.clientHeight ||
            720;

        canvas.width = W;
        canvas.height = H;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        canvas.style.display = "block";
        canvas.style.touchAction = "none";

        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.background = "#071b10";
    }

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    resizeCanvas();


    /* =========================================================
       GAME STATE
       ========================================================= */

    var gameState = "menu";

    var scoreHome = 0;
    var scoreAway = 0;

    var matchTime = 90;
    var matchTimer = 0;

    var lastTime = performance.now();

    var gameRunning = false;

    var winnerMessage = "";


    /* =========================================================
       FIELD
       ========================================================= */

    var field = {
        x: 90,
        y: 85,
        width: 1100,
        height: 550
    };


    /* =========================================================
       BALL
       ========================================================= */

    var ball = {
        x: 640,
        y: 360,
        radius: 13,
        vx: 0,
        vy: 0,
        owner: null,
        lastTouch: "home"
    };


    /* =========================================================
       PLAYER FACTORY
       ========================================================= */

    function createPlayer(
        x,
        y,
        team,
        number,
        name,
        controlled
    ) {

        return {

            x: x,
            y: y,

            homeX: x,
            homeY: y,

            vx: 0,
            vy: 0,

            radius: 21,

            team: team,

            number: number,

            name: name,

            controlled: controlled,

            speed: 230,

            kickCooldown: 0,

            stamina: 100
        };
    }


    /* =========================================================
       TEAMS
       ========================================================= */

    var homeTeam = [

        createPlayer(
            165,
            360,
            "home",
            1,
            "GK",
            false
        ),

        createPlayer(
            300,
            210,
            "home",
            2,
            "DEF",
            false
        ),

        createPlayer(
            300,
            510,
            "home",
            3,
            "DEF",
            false
        ),

        createPlayer(
            465,
            280,
            "home",
            6,
            "MID",
            false
        ),

        createPlayer(
            465,
            440,
            "home",
            8,
            "MID",
            false
        ),

        createPlayer(
            620,
            360,
            "home",
            10,
            "ST",
            true
        )
    ];


    var awayTeam = [

        createPlayer(
            1115,
            360,
            "away",
            1,
            "GK",
            false
        ),

        createPlayer(
            980,
            210,
            "away",
            2,
            "DEF",
            false
        ),

        createPlayer(
            980,
            510,
            "away",
            3,
            "DEF",
            false
        ),

        createPlayer(
            815,
            280,
            "away",
            6,
            "MID",
            false
        ),

        createPlayer(
            815,
            440,
            "away",
            8,
            "MID",
            false
        ),

        createPlayer(
            660,
            360,
            "away",
            9,
            "ST",
            false
        )
    ];


    var allPlayers =
        homeTeam.concat(
            awayTeam
        );


    /* =========================================================
       CONTROLLED PLAYER
       ========================================================= */

    var controlledPlayer =
        homeTeam[5];


    /* =========================================================
       INPUT
       ========================================================= */

    var keys = {};

    var joystick = {
        active: false,
        x: 0,
        y: 0,
        centerX: 115,
        centerY: 600,
        radius: 70
    };

    var actionButtons = {
        shoot: {
            x: 1120,
            y: 545,
            radius: 55
        },

        pass: {
            x: 1015,
            y: 620,
            radius: 43
        },

        sprint: {
            x: 1150,
            y: 650,
            radius: 40
        }
    };


    window.addEventListener(
        "keydown",
        function (event) {

            keys[event.key.toLowerCase()] =
                true;

            if (
                event.key === " "
            ) {

                event.preventDefault();

                kickBall(1.0);
            }

            if (
                event.key.toLowerCase() === "p"
            ) {

                passBall();
            }

            if (
                event.key.toLowerCase() === "r"
            ) {

                resetBall();
            }

            if (
                event.key === "Escape"
            ) {

                togglePause();
            }
        }
    );


    window.addEventListener(
        "keyup",
        function (event) {

            keys[event.key.toLowerCase()] =
                false;
        }
    );


    /* =========================================================
       TOUCH HELPERS
       ========================================================= */

    function canvasPosition(
        event
    ) {

        var rect =
            canvas.getBoundingClientRect();

        var clientX =
            event.clientX;

        var clientY =
            event.clientY;

        return {

            x:
                (clientX - rect.left) *
                (W / rect.width),

            y:
                (clientY - rect.top) *
                (H / rect.height)
        };
    }


    function distance(
        x1,
        y1,
        x2,
        y2
    ) {

        var dx = x2 - x1;
        var dy = y2 - y1;

        return Math.sqrt(
            dx * dx +
            dy * dy
        );
    }


    canvas.addEventListener(
        "pointerdown",
        function (event) {

            event.preventDefault();

            var p =
                canvasPosition(event);

            handlePointerDown(
                p.x,
                p.y
            );
        }
    );


    canvas.addEventListener(
        "pointermove",
        function (event) {

            if (!joystick.active) {
                return;
            }

            event.preventDefault();

            var p =
                canvasPosition(event);

            updateJoystick(
                p.x,
                p.y
            );
        }
    );


    canvas.addEventListener(
        "pointerup",
        function (event) {

            event.preventDefault();

            joystick.active = false;

            joystick.x = 0;
            joystick.y = 0;
        }
    );


    canvas.addEventListener(
        "pointercancel",
        function () {

            joystick.active = false;

            joystick.x = 0;
            joystick.y = 0;
        }
    );


    function handlePointerDown(
        x,
        y
    ) {

        /* MENU */

        if (
            gameState === "menu"
        ) {

            if (
                x > 480 &&
                x < 800 &&
                y > 390 &&
                y < 475
            ) {

                startGame();

                return;
            }

            return;
        }


        /* PAUSE */

        if (
            gameState === "pause"
        ) {

            if (
                x > 480 &&
                x < 800 &&
                y > 390 &&
                y < 475
            ) {

                gameState =
                    "playing";

                return;
            }

            return;
        }


        /* GAME OVER */

        if (
            gameState === "gameover"
        ) {

            if (
                x > 480 &&
                x < 800 &&
                y > 390 &&
                y < 475
            ) {

                resetMatch();

                return;
            }

            return;
        }


        /* JOYSTICK */

        if (
            distance(
                x,
                y,
                joystick.centerX,
                joystick.centerY
            ) <= joystick.radius * 1.5
        ) {

            joystick.active = true;

            updateJoystick(
                x,
                y
            );

            return;
        }


        /* SHOOT */

        if (
            distance(
                x,
                y,
                actionButtons.shoot.x,
                actionButtons.shoot.y
            ) <=
            actionButtons.shoot.radius
        ) {

            kickBall(1.0);

            return;
        }


        /* PASS */

        if (
            distance(
                x,
                y,
                actionButtons.pass.x,
                actionButtons.pass.y
            ) <=
            actionButtons.pass.radius
        ) {

            passBall();

            return;
        }


        /* SPRINT */

        if (
            distance(
                x,
                y,
                actionButtons.sprint.x,
                actionButtons.sprint.y
            ) <=
            actionButtons.sprint.radius
        ) {

            keys["shift"] = true;

            setTimeout(
                function () {

                    keys["shift"] = false;

                },
                500
            );

            return;
        }
    }


    function updateJoystick(
        x,
        y
    ) {

        var dx =
            x -
            joystick.centerX;

        var dy =
            y -
            joystick.centerY;

        var length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        if (
            length >
            joystick.radius
        ) {

            dx =
                dx /
                length *
                joystick.radius;

            dy =
                dy /
                length *
                joystick.radius;
        }

        joystick.x =
            dx /
            joystick.radius;

        joystick.y =
            dy /
            joystick.radius;
    }


    /* =========================================================
       BUTTON CLICK
       ========================================================= */

    function createButton(
        text,
        x,
        y,
        width,
        height,
        callback
    ) {

        var button =
            document.createElement(
                "button"
            );

        button.textContent =
            text;

        button.style.position =
            "fixed";

        button.style.left =
            "50%";

        button.style.top =
            "50%";

        button.style.transform =
            "translate(-50%, -50%)";

        button.style.width =
            width + "px";

        button.style.height =
            height + "px";

        button.style.zIndex =
            "9999";

        button.style.display =
            "none";

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                callback();
            }
        );

        document.body.appendChild(
            button
        );

        return button;
    }


    /* =========================================================
       START GAME
       ========================================================= */

    function startGame() {

        resetMatch();

        gameState =
            "playing";

        gameRunning =
            true;
    }


    function resetMatch() {

        scoreHome = 0;
        scoreAway = 0;

        matchTimer = 0;

        winnerMessage = "";

        resetPlayers();

        resetBall();

        gameState =
            "playing";

        gameRunning =
            true;
    }


    function resetPlayers() {

        for (
            var i = 0;
            i < allPlayers.length;
            i++
        ) {

            var p =
                allPlayers[i];

            p.x =
                p.homeX;

            p.y =
                p.homeY;

            p.vx = 0;
            p.vy = 0;

            p.kickCooldown = 0;
        }
    }


    function resetBall() {

        ball.x = 640;
        ball.y = 360;

        ball.vx = 0;
        ball.vy = 0;

        ball.owner = null;
    }


    function togglePause() {

        if (
            gameState === "playing"
        ) {

            gameState =
                "pause";

        } else if (
            gameState === "pause"
        ) {

            gameState =
                "playing";
        }
    }


    /* =========================================================
       PLAYER MOVEMENT
       ========================================================= */

    function updateControlledPlayer(
        dt
    ) {

        var dx = 0;
        var dy = 0;


        if (keys["arrowleft"] ||
            keys["a"]) {

            dx -= 1;
        }

        if (keys["arrowright"] ||
            keys["d"]) {

            dx += 1;
        }

        if (keys["arrowup"] ||
            keys["w"]) {

            dy -= 1;
        }

        if (keys["arrowdown"] ||
            keys["s"]) {

            dy += 1;
        }


        if (joystick.active) {

            dx =
                joystick.x;

            dy =
                joystick.y;
        }


        var length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (length > 1) {

            dx /= length;
            dy /= length;
        }


        var speed =
            controlledPlayer.speed;


        if (keys["shift"]) {

            speed *= 1.55;
        }


        controlledPlayer.vx =
            dx * speed;

        controlledPlayer.vy =
            dy * speed;


        controlledPlayer.x +=
            controlledPlayer.vx *
            dt;

        controlledPlayer.y +=
            controlledPlayer.vy *
            dt;


        keepPlayerInsideField(
            controlledPlayer
        );


        if (
            controlledPlayer.kickCooldown >
            0
        ) {

            controlledPlayer.kickCooldown -=
                dt;
        }
    }


    function updateAI(
        player,
        dt
    ) {

        if (
            player.controlled
        ) {
            return;
        }


        var targetX =
            player.homeX;

        var targetY =
            player.homeY;


        var ballDistance =
            distance(
                player.x,
                player.y,
                ball.x,
                ball.y
            );


        if (
            ballDistance < 230
        ) {

            targetX =
                ball.x;

            targetY =
                ball.y;
        }


        if (
            player.team === "away"
        ) {

            targetX -= 30;
        }


        var dx =
            targetX -
            player.x;

        var dy =
            targetY -
            player.y;


        var length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            length > 5
        ) {

            dx /= length;
            dy /= length;

            player.vx =
                dx *
                player.speed *
                0.55;

            player.vy =
                dy *
                player.speed *
                0.55;

        } else {

            player.vx = 0;
            player.vy = 0;
        }


        player.x +=
            player.vx *
            dt;

        player.y +=
            player.vy *
            dt;


        keepPlayerInsideField(
            player
        );


        if (
            player.kickCooldown >
            0
        ) {

            player.kickCooldown -=
                dt;
        }


        /* AI kick */

        if (
            ballDistance <
            player.radius +
            ball.radius +
            10
        ) {

            if (
                player.team === "away"
            ) {

                var goalX =
                    field.x;

                var goalY =
                    field.y +
                    field.height / 2;

                shootTowards(
                    player,
                    goalX,
                    goalY,
                    330
                );
            }
        }
    }


    function keepPlayerInsideField(
        player
    ) {

        var minX =
            field.x +
            player.radius;

        var maxX =
            field.x +
            field.width -
            player.radius;

        var minY =
            field.y +
            player.radius;

        var maxY =
            field.y +
            field.height -
            player.radius;


        if (
            player.x <
            minX
        ) {

            player.x =
                minX;
        }

        if (
            player.x >
            maxX
        ) {

            player.x =
                maxX;
        }

        if (
            player.y <
            minY
        ) {

            player.y =
                minY;
        }

        if (
            player.y >
            maxY
        ) {

            player.y =
                maxY;
        }
    }


    /* =========================================================
       BALL PHYSICS
       ========================================================= */

    function updateBall(
        dt
    ) {

        ball.x +=
            ball.vx *
            dt;

        ball.y +=
            ball.vy *
            dt;


        var friction =
            Math.pow(
                0.025,
                dt
            );

        ball.vx *=
            friction;

        ball.vy *=
            friction;


        if (
            Math.abs(ball.vx) <
            1
        ) {

            ball.vx = 0;
        }

        if (
            Math.abs(ball.vy) <
            1
        ) {

            ball.vy = 0;
        }


        /* TOP / BOTTOM */

        var top =
            field.y +
            ball.radius;

        var bottom =
            field.y +
            field.height -
            ball.radius;


        if (
            ball.y < top
        ) {

            ball.y = top;

            ball.vy *= -0.65;
        }


        if (
            ball.y > bottom
        ) {

            ball.y = bottom;

            ball.vy *= -0.65;
        }


        /* GOALS */

        var goalTop =
            field.y +
            field.height * 0.35;

        var goalBottom =
            field.y +
            field.height * 0.65;


        if (
            ball.x <
            field.x -
            ball.radius
        ) {

            if (
                ball.y > goalTop &&
                ball.y < goalBottom
            ) {

                scoreAway++;

                goalScored(
                    "away"
                );

                return;
            }

            ball.x =
                field.x +
                ball.radius;

            ball.vx *= -0.7;
        }


        if (
            ball.x >
            field.x +
            field.width +
            ball.radius
        ) {

            if (
                ball.y > goalTop &&
                ball.y < goalBottom
            ) {

                scoreHome++;

                goalScored(
                    "home"
                );

                return;
            }

            ball.x =
                field.x +
                field.width -
                ball.radius;

            ball.vx *= -0.7;
        }
    }


    function goalScored(
        team
    ) {

        winnerMessage =
            team === "home"
                ? "GOAL! HOME TEAM"
                : "GOAL! AWAY TEAM";


        resetPlayers();

        resetBall();


        setTimeout(
            function () {

                winnerMessage = "";

            },
            1200
        );
    }


    /* =========================================================
       PLAYER / BALL COLLISION
       ========================================================= */

    function updateBallCollisions() {

        for (
            var i = 0;
            i < allPlayers.length;
            i++
        ) {

            var player =
                allPlayers[i];


            var dx =
                ball.x -
                player.x;

            var dy =
                ball.y -
                player.y;


            var dist =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            var minDist =
                player.radius +
                ball.radius;


            if (
                dist < minDist
            ) {

                if (
                    dist === 0
                ) {

                    dist = 0.01;
                }


                dx /= dist;
                dy /= dist;


                ball.x =
                    player.x +
                    dx *
                    minDist;

                ball.y =
                    player.y +
                    dy *
                    minDist;


                /* controlled player owns ball */

                if (
                    player.controlled
                ) {

                    ball.owner =
                        player;

                    ball.lastTouch =
                        player.team;

                } else {

                    ball.owner =
                        null;
                }


                /* AI touch */

                if (
                    player.team ===
                    "away"
                ) {

                    var goalX =
                        field.x;

                    var goalY =
                        field.y +
                        field.height / 2;

                    shootTowards(
                        player,
                        goalX,
                        goalY,
                        250
                    );
                }
            }
        }
    }


    /* =========================================================
       SHOOT
       ========================================================= */

    function kickBall(
        power
    ) {

        if (
            gameState !==
            "playing"
        ) {

            return;
        }


        var p =
            controlledPlayer;


        var dist =
            distance(
                p.x,
                p.y,
                ball.x,
                ball.y
            );


        if (
            dist >
            p.radius +
            ball.radius +
            45
        ) {

            return;
        }


        if (
            p.kickCooldown >
            0
        ) {

            return;
        }


        var targetX =
            field.x +
            field.width;

        var targetY =
            field.y +
            field.height / 2;


        var dx =
            targetX -
            p.x;

        var dy =
            targetY -
            p.y;


        var length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            length === 0
        ) {

            return;
        }


        dx /= length;
        dy /= length;


        ball.owner =
            null;

        ball.lastTouch =
            "home";


        ball.vx =
            dx *
            500 *
            power;

        ball.vy =
            dy *
            500 *
            power;


        p.kickCooldown =
            0.35;
    }


    function shootTowards(
        player,
        targetX,
        targetY,
        speed
    ) {

        if (
            player.kickCooldown >
            0
        ) {

            return;
        }


        var dx =
            targetX -
            player.x;

        var dy =
            targetY -
            player.y;


        var length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            length === 0
        ) {

            return;
        }


        dx /= length;
        dy /= length;


        ball.owner =
            null;

        ball.lastTouch =
            player.team;


        ball.vx =
            dx *
            speed;

        ball.vy =
            dy *
            speed;


        player.kickCooldown =
            0.7;
    }


    /* =========================================================
       PASS
       ========================================================= */

    function passBall() {

        if (
            gameState !==
            "playing"
        ) {

            return;
        }


        var p =
            controlledPlayer;


        var closest =
            null;

        var closestDistance =
            Infinity;


        for (
            var i = 0;
            i < homeTeam.length;
            i++
        ) {

            var teammate =
                homeTeam[i];


            if (
                teammate ===
                p
            ) {

                continue;
            }


            var d =
                distance(
                    p.x,
                    p.y,
                    teammate.x,
                    teammate.y
                );


            if (
                d <
                closestDistance
            ) {

                closestDistance =
                    d;

                closest =
                    teammate;
            }
        }


        if (
            !closest
        ) {

            return;
        }


        var ballDistance =
            distance(
                p.x,
                p.y,
                ball.x,
                ball.y
            );


        if (
            ballDistance >
            90
        ) {

            return;
        }


        var dx =
            closest.x -
            p.x;

        var dy =
            closest.y -
            p.y;


        var length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            length === 0
        ) {

            return;
        }


        dx /= length;
        dy /= length;


        ball.owner =
            null;

        ball.lastTouch =
            "home";


        ball.vx =
            dx *
            360;

        ball.vy =
            dy *
            360;
    }


    /* =========================================================
       MATCH TIMER
       ========================================================= */

    function updateMatchTimer(
        dt
    ) {

        if (
            gameState !==
            "playing"
        ) {

            return;
        }


        matchTimer +=
            dt;


        if (
            matchTimer >=
            matchTime
        ) {

            matchTimer =
                matchTime;

            gameState =
                "gameover";

            gameRunning =
                false;


            if (
                scoreHome >
                scoreAway
            ) {

                winnerMessage =
                    "HOME TEAM WINS";

            } else if (
                scoreAway >
                scoreHome
            ) {

                winnerMessage =
                    "AWAY TEAM WINS";

            } else {

                winnerMessage =
                    "MATCH DRAW";
            }
        }
    }


    /* =========================================================
       DRAW HELPERS
       ========================================================= */

    function roundRect(
        x,
        y,
        width,
        height,
        radius
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x + radius,
            y
        );

        ctx.lineTo(
            x + width - radius,
            y
        );

        ctx.quadraticCurveTo(
            x + width,
            y,
            x + width,
            y + radius
        );

        ctx.lineTo(
            x + width,
            y + height - radius
        );

        ctx.quadraticCurveTo(
            x + width,
            y + height,
            x + width - radius,
            y + height
        );

        ctx.lineTo(
            x + radius,
            y + height
        );

        ctx.quadraticCurveTo(
            x,
            y + height,
            x,
            y + height - radius
        );

        ctx.lineTo(
            x,
            y + radius
        );

        ctx.quadraticCurveTo(
            x,
            y,
            x + radius,
            y
        );

        ctx.closePath();
    }


    /* =========================================================
       DRAW BACKGROUND
       ========================================================= */

    function drawBackground() {

        ctx.fillStyle =
            "#071b10";

        ctx.fillRect(
            0,
            0,
            W,
            H
        );


        var gradient =
            ctx.createLinearGradient(
                0,
                0,
                0,
                H
            );

        gradient.addColorStop(
            0,
            "#123f24"
        );

        gradient.addColorStop(
            1,
            "#06150d"
        );


        ctx.fillStyle =
            gradient;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );
    }


    /* =========================================================
       DRAW FIELD
       ========================================================= */

    function drawField() {

        /* field shadow */

        ctx.fillStyle =
            "rgba(0,0,0,0.35)";

        roundRect(
            field.x - 8,
            field.y - 8,
            field.width + 16,
            field.height + 16,
            18
        );

        ctx.fill();


        /* grass */

        var grass =
            ctx.createLinearGradient(
                field.x,
                field.y,
                field.x +
                field.width,
                field.y +
                field.height
            );

        grass.addColorStop(
            0,
            "#23853e"
        );

        grass.addColorStop(
            1,
            "#11662c"
        );


        ctx.fillStyle =
            grass;

        ctx.fillRect(
            field.x,
            field.y,
            field.width,
            field.height
        );


        /* grass stripes */

        var stripeWidth =
            field.width /
            12;


        for (
            var i = 0;
            i < 12;
            i++
        ) {

            if (
                i % 2 === 0
            ) {

                ctx.fillStyle =
                    "rgba(255,255,255,0.035)";

                ctx.fillRect(
                    field.x +
                    i *
                    stripeWidth,
                    field.y,
                    stripeWidth,
                    field.height
                );
            }
        }


        /* lines */

        ctx.strokeStyle =
            "rgba(255,255,255,0.9)";

        ctx.lineWidth =
            4;

        ctx.strokeRect(
            field.x,
            field.y,
            field.width,
            field.height
        );


        /* centre line */

        ctx.beginPath();

        ctx.moveTo(
            field.x +
            field.width / 2,
            field.y
        );

        ctx.lineTo(
            field.x +
            field.width / 2,
            field.y +
            field.height
        );

        ctx.stroke();


        /* centre circle */

        ctx.beginPath();

        ctx.arc(
            field.x +
            field.width / 2,
            field.y +
            field.height / 2,
            82,
            0,
            Math.PI * 2
        );

        ctx.stroke();


        /* centre dot */

        ctx.beginPath();

        ctx.arc(
            field.x +
            field.width / 2,
            field.y +
            field.height / 2,
            5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#ffffff";

        ctx.fill();


        drawPenaltyArea(
            "left"
        );

        drawPenaltyArea(
            "right"
        );


        /* goals */

        drawGoal(
            "left"
        );

        drawGoal(
            "right"
        );
    }


    function drawPenaltyArea(
        side
    ) {

        var boxWidth =
            150;

        var boxHeight =
            290;

        var x;


        if (
            side ===
            "left"
        ) {

            x =
                field.x;

        } else {

            x =
                field.x +
                field.width -
                boxWidth;
        }


        var y =
            field.y +
            (field.height -
            boxHeight) / 2;


        ctx.strokeStyle =
            "rgba(255,255,255,0.9)";

        ctx.lineWidth =
            4;

        ctx.strokeRect(
            x,
            y,
            boxWidth,
            boxHeight
        );


        var smallWidth =
            55;

        var smallHeight =
            140;


        var sx;


        if (
            side ===
            "left"
        ) {

            sx =
                field.x;

        } else {

            sx =
                field.x +
                field.width -
                smallWidth;
        }


        var sy =
            field.y +
            (field.height -
            smallHeight) / 2;


        ctx.strokeRect(
            sx,
            sy,
            smallWidth,
            smallHeight
        );
    }


    function drawGoal(
        side
    ) {

        var goalWidth =
            32;

        var goalHeight =
            140;

        var x;

        var y =
            field.y +
            (field.height -
            goalHeight) / 2;


        if (
            side ===
            "left"
        ) {

            x =
                field.x -
                goalWidth;

        } else {

            x =
                field.x +
                field.width;
        }


        ctx.fillStyle =
            "rgba(230,230,230,0.25)";

        ctx.fillRect(
            x,
            y,
            goalWidth,
            goalHeight
        );


        ctx.strokeStyle =
            "#ffffff";

        ctx.lineWidth =
            4;

        ctx.strokeRect(
            x,
            y,
            goalWidth,
            goalHeight
        );
    }


    /* =========================================================
       DRAW PLAYERS
       ========================================================= */

    function drawPlayer(
        player
    ) {

        /* shadow */

        ctx.beginPath();

        ctx.ellipse(
            player.x,
            player.y +
            player.radius *
            0.85,
            player.radius *
            0.9,
            player.radius *
            0.35,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.35)";

        ctx.fill();


        /* player body */

        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            player.radius,
            0,
            Math.PI * 2
        );


        if (
            player.team ===
            "home"
        ) {

            ctx.fillStyle =
                "#1976ff";

        } else {

            ctx.fillStyle =
                "#e52b35";
        }


        ctx.fill();


        /* outline */

        ctx.strokeStyle =
            player.controlled
                ? "#ffd83d"
                : "#ffffff";

        ctx.lineWidth =
            player.controlled
                ? 5
                : 2;

        ctx.stroke();


        /* number */

        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 13px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            String(player.number),
            player.x,
            player.y
        );


        /* controlled indicator */

        if (
            player.controlled
        ) {

            ctx.beginPath();

            ctx.arc(
                player.x,
                player.y -
                player.radius -
                10,
                5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "#ffe000";

            ctx.fill();
        }
    }


    /* =========================================================
       DRAW BALL
       ========================================================= */

    function drawBall() {

        ctx.beginPath();

        ctx.arc(
            ball.x + 3,
            ball.y + 5,
            ball.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.35)";

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            ball.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#ffffff";

        ctx.fill();


        ctx.strokeStyle =
            "#222222";

        ctx.lineWidth =
            2;

        ctx.stroke();


        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#222222";

        ctx.fill();
    }


    /* =========================================================
       SCOREBOARD
       ========================================================= */

    function drawScoreboard() {

        ctx.fillStyle =
            "rgba(0,0,0,0.75)";

        roundRect(
            500,
            18,
            280,
            58,
            15
        );

        ctx.fill();


        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 26px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.fillText(
            scoreHome +
            "  -  " +
            scoreAway,
            640,
            47
        );


        ctx.font =
            "bold 13px Arial";

        ctx.fillStyle =
            "#dddddd";


        var remaining =
            Math.max(
                0,
                matchTime -
                matchTimer
            );


        var seconds =
            Math.floor(
                remaining
            );


        ctx.fillText(
            "MATCH  " +
            seconds +
            "s",
            640,
            68
        );
    }


    /* =========================================================
       CONTROLS
       ========================================================= */

    function drawControls() {

        /* joystick */

        ctx.beginPath();

        ctx.arc(
            joystick.centerX,
            joystick.centerY,
            joystick.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.38)";

        ctx.fill();


        ctx.strokeStyle =
            "rgba(255,255,255,0.35)";

        ctx.lineWidth =
            3;

        ctx.stroke();


        var knobX =
            joystick.centerX +
            joystick.x *
            42;

        var knobY =
            joystick.centerY +
            joystick.y *
            42;


        ctx.beginPath();

        ctx.arc(
            knobX,
            knobY,
            27,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(255,255,255,0.55)";

        ctx.fill();


        drawActionButton(
            actionButtons.shoot,
            "SHOOT"
        );

        drawActionButton(
            actionButtons.pass,
            "PASS"
        );

        drawActionButton(
            actionButtons.sprint,
            "RUN"
        );


        /* pause */

        ctx.fillStyle =
            "rgba(0,0,0,0.5)";

        roundRect(
            1160,
            25,
            70,
            45,
            10
        );

        ctx.fill();


        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 16px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            "Ⅱ",
            1195,
            48
        );
    }


    function drawActionButton(
        button,
        text
    ) {

        ctx.beginPath();

        ctx.arc(
            button.x,
            button.y,
            button.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.5)";

        ctx.fill();


        ctx.strokeStyle =
            "rgba(255,255,255,0.45)";

        ctx.lineWidth =
            3;

        ctx.stroke();


        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 13px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            text,
            button.x,
            button.y
        );
    }


    /* =========================================================
       MENU
       ========================================================= */

    function drawMenu() {

        drawBackground();


        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 64px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.fillText(
            "FOOTBALL 3D",
            640,
            180
        );


        ctx.font =
            "22px Arial";

        ctx.fillStyle =
            "#b9e7c7";


        ctx.fillText(
            "LOCAL FOOTBALL GAME",
            640,
            225
        );


        ctx.fillStyle =
            "#159447";

        roundRect(
            480,
            390,
            320,
            85,
            18
        );

        ctx.fill();


        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 28px Arial";

        ctx.fillText(
            "PLAY MATCH",
            640,
            433
        );


        ctx.font =
            "16px Arial";

        ctx.fillStyle =
            "#cccccc";

        ctx.fillText(
            "Touch joystick + SHOOT / PASS",
            640,
            510
        );


        ctx.fillText(
            "Keyboard: WASD / Arrow Keys",
            640,
            540
        );
    }


    /* =========================================================
       PAUSE
       ========================================================= */

    function drawPause() {

        drawGameScene();


        ctx.fillStyle =
            "rgba(0,0,0,0.65)";

        ctx.fillRect(
            0,
            0,
            W,
            H
        );


        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 58px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "PAUSED",
            640,
            270
        );


        ctx.fillStyle =
            "#159447";

        roundRect(
            480,
            390,
            320,
            85,
            18
        );

        ctx.fill();


        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 26px Arial";

        ctx.fillText(
            "RESUME",
            640,
            433
        );
    }


    /* =========================================================
       GAME OVER
       ========================================================= */

    function drawGameOver() {

        drawGameScene();


        ctx.fillStyle =
            "rgba(0,0,0,0.72)";

        ctx.fillRect(
            0,
            0,
            W,
            H
        );


        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 54px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            winnerMessage,
            640,
            270
        );


        ctx.font =
            "bold 42px Arial";

        ctx.fillText(
            scoreHome +
            "  -  " +
            scoreAway,
            640,
            330
        );


        ctx.fillStyle =
            "#159447";

        roundRect(
            480,
            390,
            320,
            85,
            18
        );

        ctx.fill();


        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 26px Arial";

        ctx.fillText(
            "PLAY AGAIN",
            640,
            433
        );
    }


    /* =========================================================
       GAME SCENE
       ========================================================= */

    function drawGameScene() {

        drawBackground();

        drawField();


        for (
            var i = 0;
            i < allPlayers.length;
            i++
        ) {

            drawPlayer(
                allPlayers[i]
            );
        }


        drawBall();

        drawScoreboard();

        drawControls();


        if (
            winnerMessage !== ""
        ) {

            ctx.fillStyle =
                "rgba(0,0,0,0.7)";

            roundRect(
                425,
                300,
                430,
                90,
                20
            );

            ctx.fill();


            ctx.fillStyle =
                "#ffffff";

            ctx.font =
                "bold 30px Arial";

            ctx.textAlign =
                "center";

            ctx.textBaseline =
                "middle";

            ctx.fillText(
                winnerMessage,
                640,
                345
            );
        }
    }


    /* =========================================================
       UPDATE
       ========================================================= */

    function update(
        dt
    ) {

        if (
            gameState !==
            "playing"
        ) {

            return;
        }


        updateControlledPlayer(
            dt
        );


        for (
            var i = 0;
            i < allPlayers.length;
            i++
        ) {

            updateAI(
                allPlayers[i],
                dt
            );
        }


        updateBallCollisions();

        updateBall(
            dt
        );


        /* keep ball near controlled player */

        if (
            ball.owner ===
            controlledPlayer
        ) {

            var dx =
                controlledPlayer.x -
                ball.x;

            var dy =
                controlledPlayer.y -
                ball.y;


            var d =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                d > 35
            ) {

                dx /= d;
                dy /= d;


                ball.x =
                    controlledPlayer.x -
                    dx * 20;

                ball.y =
                    controlledPlayer.y -
                    dy * 20;
            }
        }


        updateMatchTimer(
            dt
        );
    }


    /* =========================================================
       RENDER
       ========================================================= */

    function render() {

        if (
            gameState ===
            "menu"
        ) {

            drawMenu();

        } else if (
            gameState ===
            "playing"
        ) {

            drawGameScene();

        } else if (
            gameState ===
            "pause"
        ) {

            drawPause();

        } else if (
            gameState ===
            "gameover"
        ) {

            drawGameOver();
        }
    }


    /* =========================================================
       MAIN LOOP
       ========================================================= */

    function gameLoop(
        now
    ) {

        var dt =
            (now - lastTime) /
            1000;


        lastTime =
            now;


        if (
            dt > 0.05
        ) {

            dt = 0.05;
        }


        update(
            dt
        );

        render();


        requestAnimationFrame(
            gameLoop
        );
    }


    /* =========================================================
       ORIENTATION
       ========================================================= */

    function forceLandscapeMessage() {

        var old =
            document.getElementById(
                "orientation-message"
            );


        if (!old) {

            old =
                document.createElement(
                    "div"
                );

            old.id =
                "orientation-message";

            old.style.position =
                "fixed";

            old.style.left =
                "0";

            old.style.top =
                "0";

            old.style.right =
                "0";

            old.style.bottom =
                "0";

            old.style.zIndex =
                "10000";

            old.style.display =
                "none";

            old.style.alignItems =
                "center";

            old.style.justifyContent =
                "center";

            old.style.textAlign =
                "center";

            old.style.background =
                "#071b10";

            old.style.color =
                "#ffffff";

            old.style.font =
                "bold 24px Arial";

            old.textContent =
                "Please turn your phone sideways.";

            document.body.appendChild(
                old
            );
        }


        if (
            window.innerHeight >
            window.innerWidth
        ) {

            old.style.display =
                "flex";

        } else {

            old.style.display =
                "none";
        }
    }


    window.addEventListener(
        "resize",
        forceLandscapeMessage
    );

    window.addEventListener(
        "orientationchange",
        function () {

            setTimeout(
                forceLandscapeMessage,
                300
            );
        }
    );


    /* =========================================================
       INITIALIZE
       ========================================================= */

    forceLandscapeMessage();

    resetMatch();

    gameState =
        "menu";

    gameRunning =
        false;

    render();


    requestAnimationFrame(
        gameLoop
    );

});
