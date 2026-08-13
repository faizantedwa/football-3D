"use strict";


/* =========================================================
   LOCAL FOOTBALL 3D
   Lightweight Canvas Football Engine
========================================================= */


(function () {


    /* =========================
       ELEMENTS
    ========================= */

    var canvas =
        document.getElementById("gameCanvas");

    var ctx =
        canvas.getContext("2d");


    var loadingScreen =
        document.getElementById("loadingScreen");

    var loadingProgress =
        document.getElementById("loadingProgress");

    var loadingPercent =
        document.getElementById("loadingPercent");

    var menuScreen =
        document.getElementById("menuScreen");

    var gameScreen =
        document.getElementById("gameScreen");

    var helpScreen =
        document.getElementById("helpScreen");

    var pauseMenu =
        document.getElementById("pauseMenu");


    var blueScoreElement =
        document.getElementById("blueScore");

    var redScoreElement =
        document.getElementById("redScore");

    var gameMessage =
        document.getElementById("gameMessage");


    /* =========================
       SIZE
    ========================= */

    var W = 0;
    var H = 0;


    function resize() {

        var dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );


        W =
            window.innerWidth;

        H =
            window.innerHeight;


        canvas.width =
            Math.floor(W * dpr);

        canvas.height =
            Math.floor(H * dpr);


        canvas.style.width =
            W + "px";

        canvas.style.height =
            H + "px";


        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );
    }


    window.addEventListener(
        "resize",
        resize
    );


    resize();


    /* =========================
       LOADING
    ========================= */

    var loadValue = 0;


    function loadGame() {

        var timer =
            setInterval(
                function () {

                    loadValue +=
                        Math.floor(
                            Math.random() * 8
                        ) + 4;


                    if (loadValue > 100) {
                        loadValue = 100;
                    }


                    loadingProgress.style.width =
                        loadValue + "%";


                    loadingPercent.textContent =
                        loadValue + "%";


                    if (loadValue >= 100) {

                        clearInterval(timer);


                        setTimeout(
                            function () {

                                loadingScreen
                                    .classList
                                    .add("hidden");

                                menuScreen
                                    .classList
                                    .remove("hidden");

                            },
                            350
                        );
                    }

                },
                100
            );
    }


    /* =========================
       GAME STATE
    ========================= */

    var running = false;

    var paused = false;

    var blueScore = 0;

    var redScore = 0;


    var field = {
        width: 1000,
        height: 600
    };


    var camera = {
        x: 0,
        y: 0,
        scale: 1
    };


    /* =========================
       PLAYER
    ========================= */

    var player = {

        x: 500,
        y: 300,

        radius: 25,

        speed: 260,

        color: "#168cff",

        vx: 0,
        vy: 0
    };


    /* =========================
       OPPONENT
    ========================= */

    var opponent = {

        x: 730,
        y: 300,

        radius: 25,

        speed: 150,

        color: "#ed3b3b"
    };


    /* =========================
       BALL
    ========================= */

    var ball = {

        x: 560,
        y: 300,

        radius: 13,

        vx: 0,
        vy: 0
    };


    /* =========================
       INPUT
    ========================= */

    var input = {

        x: 0,
        y: 0
    };


    var joystickActive =
        false;


    var joystickArea =
        document.getElementById(
            "joystickArea"
        );

    var joystickKnob =
        document.getElementById(
            "joystickKnob"
        );


    function joystickMove(
        clientX,
        clientY
    ) {

        var rect =
            joystickArea
                .getBoundingClientRect();


        var centerX =
            rect.left +
            rect.width / 2;

        var centerY =
            rect.top +
            rect.height / 2;


        var dx =
            clientX -
            centerX;

        var dy =
            clientY -
            centerY;


        var max =
            45;

        var distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (distance > max) {

            dx =
                dx / distance *
                max;

            dy =
                dy / distance *
                max;
        }


        input.x =
            dx / max;

        input.y =
            dy / max;


        joystickKnob.style.transform =
            "translate(" +
            dx +
            "px," +
            dy +
            "px)";
    }


    function joystickEnd() {

        joystickActive =
            false;

        input.x = 0;
        input.y = 0;

        joystickKnob.style.transform =
            "translate(0px,0px)";
    }


    joystickArea.addEventListener(
        "touchstart",
        function (e) {

            e.preventDefault();

            joystickActive =
                true;

            var touch =
                e.touches[0];

            joystickMove(
                touch.clientX,
                touch.clientY
            );

        },
        { passive: false }
    );


    joystickArea.addEventListener(
        "touchmove",
        function (e) {

            e.preventDefault();

            if (!joystickActive) {
                return;
            }

            var touch =
                e.touches[0];

            joystickMove(
                touch.clientX,
                touch.clientY
            );

        },
        { passive: false }
    );


    joystickArea.addEventListener(
        "touchend",
        function (e) {

            e.preventDefault();

            joystickEnd();

        },
        { passive: false }
    );


    /* =========================
       DESKTOP CONTROL
    ========================= */

    var keys = {};


    document.addEventListener(
        "keydown",
        function (e) {

            keys[e.key.toLowerCase()] =
                true;
        }
    );


    document.addEventListener(
        "keyup",
        function (e) {

            keys[e.key.toLowerCase()] =
                false;
        }
    );


    function updateKeyboardInput() {

        var x = 0;
        var y = 0;


        if (keys["a"] ||
            keys["arrowleft"]) {
            x -= 1;
        }

        if (keys["d"] ||
            keys["arrowright"]) {
            x += 1;
        }

        if (keys["w"] ||
            keys["arrowup"]) {
            y -= 1;
        }

        if (keys["s"] ||
            keys["arrowdown"]) {
            y += 1;
        }


        if (x !== 0 || y !== 0) {

            var length =
                Math.sqrt(
                    x * x +
                    y * y
                );

            input.x =
                x / length;

            input.y =
                y / length;
        }
    }


    /* =========================
       BUTTONS
    ========================= */

    document
        .getElementById("startGame")
        .addEventListener(
            "click",
            startGame
        );


    document
        .getElementById("howToPlay")
        .addEventListener(
            "click",
            function () {

                helpScreen
                    .classList
                    .remove("hidden");
            }
        );


    document
        .getElementById("closeHelp")
        .addEventListener(
            "click",
            function () {

                helpScreen
                    .classList
                    .add("hidden");
            }
        );


    document
        .getElementById("pauseButton")
        .addEventListener(
            "click",
            togglePause
        );


    document
        .getElementById("resumeButton")
        .addEventListener(
            "click",
            togglePause
        );


    document
        .getElementById("menuButton")
        .addEventListener(
            "click",
            function () {

                paused = false;
                running = false;

                pauseMenu
                    .classList
                    .add("hidden");

                gameScreen
                    .classList
                    .add("hidden");

                menuScreen
                    .classList
                    .remove("hidden");
            }
        );


    document
        .getElementById("passButton")
        .addEventListener(
            "click",
            passBall
        );


    document
        .getElementById("shootButton")
        .addEventListener(
            "click",
            shootBall
        );


    /* =========================
       START
    ========================= */

    function startGame() {

        menuScreen
            .classList
            .add("hidden");

        gameScreen
            .classList
            .remove("hidden");


        blueScore = 0;
        redScore = 0;


        resetPositions();


        updateScore();


        running = true;

        paused = false;


        showMessage(
            "KICK OFF!"
        );
    }


    function resetPositions() {

        player.x = 300;
        player.y = 300;

        opponent.x = 700;
        opponent.y = 300;

        ball.x = 500;
        ball.y = 300;

        ball.vx = 0;
        ball.vy = 0;
    }


    /* =========================
       PAUSE
    ========================= */

    function togglePause() {

        if (!running) {
            return;
        }


        paused =
            !paused;


        if (paused) {

            pauseMenu
                .classList
                .remove("hidden");

        } else {

            pauseMenu
                .classList
                .add("hidden");
        }
    }


    /* =========================
       BALL ACTIONS
    ========================= */

    function distance(
        a,
        b
    ) {

        var dx =
            a.x - b.x;

        var dy =
            a.y - b.y;


        return Math.sqrt(
            dx * dx +
            dy * dy
        );
    }


    function passBall() {

        if (!running || paused) {
            return;
        }


        if (
            distance(
                player,
                ball
            ) < 100
        ) {

            ball.vx =
                500;

            ball.vy =
                input.y * 180;

        } else {

            showMessage(
                "GET CLOSER TO BALL"
            );
        }
    }


    function shootBall() {

        if (!running || paused) {
            return;
        }


        if (
            distance(
                player,
                ball
            ) < 110
        ) {

            ball.vx =
                800;

            ball.vy =
                input.y * 260;

            showMessage(
                "SHOT!"
            );

        } else {

            showMessage(
                "GET CLOSER TO BALL"
            );
        }
    }


    /* =========================
       GAME UPDATE
    ========================= */

    var lastTime =
        performance.now();


    function update(time) {

        var dt =
            (time - lastTime) /
            1000;


        lastTime = time;


        if (dt > 0.05) {
            dt = 0.05;
        }


        if (running && !paused) {

            updateKeyboardInput();

            updatePlayer(dt);

            updateOpponent(dt);

            updateBall(dt);

            checkGoals();

            updateCamera();
        }


        draw();


        requestAnimationFrame(
            update
        );
    }


    /* =========================
       PLAYER UPDATE
    ========================= */

    function updatePlayer(dt) {

        player.vx =
            input.x *
            player.speed;

        player.vy =
            input.y *
            player.speed;


        player.x +=
            player.vx *
            dt;

        player.y +=
            player.vy *
            dt;


        keepInsideField(
            player
        );


        /*
         * Player touches ball
         */

        var d =
            distance(
                player,
                ball
            );


        if (
            d <
            player.radius +
            ball.radius +
            10
        ) {

            var angle =
                Math.atan2(
                    ball.y -
                    player.y,

                    ball.x -
                    player.x
                );


            if (
                Math.abs(input.x) >
                    0.1 ||
                Math.abs(input.y) >
                    0.1
            ) {

                ball.vx =
                    Math.cos(angle) *
                    130;

                ball.vy =
                    Math.sin(angle) *
                    130;
            }
        }
    }


    /* =========================
       OPPONENT
    ========================= */

    function updateOpponent(dt) {

        var dx =
            ball.x -
            opponent.x;

        var dy =
            ball.y -
            opponent.y;


        var d =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (d > 5) {

            opponent.x +=
                dx / d *
                opponent.speed *
                dt;

            opponent.y +=
                dy / d *
                opponent.speed *
                dt;
        }


        keepInsideField(
            opponent
        );


        if (
            distance(
                opponent,
                ball
            ) <
            opponent.radius +
            ball.radius +
            5
        ) {

            ball.vx =
                -180;

            ball.vy =
                (Math.random() -
                0.5) *
                250;
        }
    }


    /* =========================
       BALL
    ========================= */

    function updateBall(dt) {

        ball.x +=
            ball.vx *
            dt;

        ball.y +=
            ball.vy *
            dt;


        /*
         * Friction
         */

        ball.vx *=
            Math.pow(
                0.15,
                dt
            );

        ball.vy *=
            Math.pow(
                0.15,
                dt
            );


        /*
         * Side walls
         */

        if (
            ball.y <
            40
        ) {

            ball.y = 40;

            ball.vy =
                Math.abs(
                    ball.vy
                ) *
                0.7;
        }


        if (
            ball.y >
            field.height -
            40
        ) {

            ball.y =
                field.height -
                40;

            ball.vy =
                -Math.abs(
                    ball.vy
                ) *
                0.7;
        }
    }


    /* =========================
       FIELD LIMIT
    ========================= */

    function keepInsideField(
        object
    ) {

        object.x =
            Math.max(
                35,
                Math.min(
                    field.width - 35,
                    object.x
                )
            );


        object.y =
            Math.max(
                35,
                Math.min(
                    field.height - 35,
                    object.y
                )
            );
    }


    /* =========================
       GOALS
    ========================= */

    function checkGoals() {

        var goalTop =
            220;

        var goalBottom =
            380;


        /*
         * BLUE scores on right
         */

        if (
            ball.x >
            field.width + 15 &&
            ball.y >
            goalTop &&
            ball.y <
            goalBottom
        ) {

            blueScore++;

            updateScore();

            showMessage(
                "⚽ BLUE GOAL!"
            );

            resetPositions();

            return;
        }


        /*
         * RED scores on left
         */

        if (
            ball.x <
            -15 &&
            ball.y >
            goalTop &&
            ball.y <
            goalBottom
        ) {

            redScore++;

            updateScore();

            showMessage(
                "⚽ RED GOAL!"
            );

            resetPositions();

            return;
        }


        /*
         * Non-goal boundaries
         */

        if (
            ball.x >
            field.width
        ) {

            ball.x =
                field.width;

            ball.vx =
                -Math.abs(
                    ball.vx
                ) * 0.7;
        }


        if (
            ball.x < 0
        ) {

            ball.x = 0;

            ball.vx =
                Math.abs(
                    ball.vx
                ) * 0.7;
        }
    }


    /* =========================
       SCORE
    ========================= */

    function updateScore() {

        blueScoreElement.textContent =
            "BLUE " +
            blueScore;

        redScoreElement.textContent =
            "RED " +
            redScore;
    }


    /* =========================
       MESSAGE
    ========================= */

    var messageTimer = null;


    function showMessage(
        text
    ) {

        gameMessage.textContent =
            text;


        clearTimeout(
            messageTimer
        );


        messageTimer =
            setTimeout(
                function () {

                    gameMessage.textContent =
                        "";

                },
                1300
            );
    }


    /* =========================
       CAMERA
    ========================= */

    function updateCamera() {

        camera.x =
            player.x -
            field.width *
            0.5;

        camera.y =
            player.y -
            field.height *
            0.5;


        camera.x =
            Math.max(
                0,
                Math.min(
                    field.width -
                    W / camera.scale,
                    camera.x
                )
            );


        camera.y =
            Math.max(
                0,
                Math.min(
                    field.height -
                    H / camera.scale,
                    camera.y
                )
            );
    }


    /* =========================
       DRAW
    ========================= */

    function draw() {

        ctx.clearRect(
            0,
            0,
            W,
            H
        );


        drawBackground();

        drawField();

        drawGoals();

        drawPlayers();

        drawBall();
    }


    /* =========================
       BACKGROUND
    ========================= */

    function drawBackground() {

        var gradient =
            ctx.createLinearGradient(
                0,
                0,
                0,
                H
            );


        gradient.addColorStop(
            0,
            "#061020"
        );

        gradient.addColorStop(
            0.45,
            "#083f25"
        );

        gradient.addColorStop(
            1,
            "#021c0d"
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


    /* =========================
       WORLD TRANSFORM
    ========================= */

    function worldToScreen(
        x,
        y
    ) {

        return {

            x:
                x -
                camera.x,

            y:
                y -
                camera.y
        };
    }


    /* =========================
       FIELD
    ========================= */

    function drawField() {

        var p =
            worldToScreen(
                0,
                0
            );


        /*
         * Grass
         */

        ctx.fillStyle =
            "#087b36";


        ctx.fillRect(
            p.x,
            p.y,
            field.width,
            field.height
        );


        /*
         * Stripes
         */

        for (
            var x = 0;
            x < field.width;
            x += 100
        ) {

            if (
                (x / 100) %
                2 === 0
            ) {

                ctx.fillStyle =
                    "rgba(255,255,255,0.035)";


                ctx.fillRect(
                    p.x + x,
                    p.y,
                    100,
                    field.height
                );
            }
        }


        /*
         * Outer lines
         */

        ctx.strokeStyle =
            "rgba(255,255,255,0.9)";

        ctx.lineWidth = 4;


        ctx.strokeRect(
            p.x,
            p.y,
            field.width,
            field.height
        );


        /*
         * Center line
         */

        ctx.beginPath();

        ctx.moveTo(
            p.x +
            field.width / 2,

            p.y
        );

        ctx.lineTo(
            p.x +
            field.width / 2,

            p.y +
            field.height
        );

        ctx.stroke();


        /*
         * Center circle
         */

        ctx.beginPath();

        ctx.arc(
            p.x +
            field.width / 2,

            p.y +
            field.height / 2,

            90,

            0,
            Math.PI * 2
        );

        ctx.stroke();


        /*
         * Center spot
         */

        ctx.fillStyle =
            "white";

        ctx.beginPath();

        ctx.arc(
            p.x +
            field.width / 2,

            p.y +
            field.height / 2,

            5,

            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
         * Penalty boxes
         */

        ctx.strokeRect(
            p.x,
            p.y + 150,
            170,
            300
        );


        ctx.strokeRect(
            p.x +
            field.width -
            170,

            p.y + 150,

            170,
            300
        );


        /*
         * Small boxes
         */

        ctx.strokeRect(
            p.x,
            p.y + 220,
            70,
            160
        );


        ctx.strokeRect(
            p.x +
            field.width -
            70,

            p.y + 220,

            70,
            160
        );
    }


    /* =========================
       GOALS
    ========================= */

    function drawGoals() {

        var left =
            worldToScreen(
                0,
                220
            );

        var right =
            worldToScreen(
                field.width,
                220
            );


        ctx.strokeStyle =
            "white";

        ctx.lineWidth = 8;


        /*
         * Left goal
         */

        ctx.strokeRect(
            left.x - 35,
            left.y,
            35,
            160
        );


        /*
         * Right goal
         */

        ctx.strokeRect(
            right.x,
            right.y,
            35,
            160
        );


        /*
         * Nets
         */

        ctx.strokeStyle =
            "rgba(255,255,255,0.3)";

        ctx.lineWidth = 2;


        for (
            var y = 220;
            y <= 380;
            y += 20
        ) {

            var lp =
                worldToScreen(
                    0,
                    y
                );

            var rp =
                worldToScreen(
                    field.width,
                    y
                );


            ctx.beginPath();

            ctx.moveTo(
                lp.x - 35,
                lp.y
            );

            ctx.lineTo(
                lp.x,
                lp.y
            );

            ctx.stroke();


            ctx.beginPath();

            ctx.moveTo(
                rp.x,
                rp.y
            );

            ctx.lineTo(
                rp.x + 35,
                rp.y
            );

            ctx.stroke();
        }
    }


    /* =========================
       PLAYERS
    ========================= */

    function drawPlayers() {

        drawPlayer(
            player,
            "#168cff",
            "10"
        );


        drawPlayer(
            opponent,
            "#ed3b3b",
            "7"
        );
    }


    function drawPlayer(
        p,
        color,
        number
    ) {

        var s =
            worldToScreen(
                p.x,
                p.y
            );


        /*
         * Shadow
         */

        ctx.fillStyle =
            "rgba(0,0,0,0.35)";


        ctx.beginPath();

        ctx.ellipse(
            s.x,
            s.y + 22,
            28,
            10,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
         * Body
         */

        var gradient =
            ctx.createLinearGradient(
                s.x - 20,
                s.y - 20,
                s.x + 20,
                s.y + 20
            );


        gradient.addColorStop(
            0,
            "#ffffff"
        );

        gradient.addColorStop(
            0.08,
            color
        );

        gradient.addColorStop(
            1,
            "#07101f"
        );


        ctx.fillStyle =
            gradient;


        ctx.beginPath();

        ctx.arc(
            s.x,
            s.y,
            p.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
         * Head
         */

        ctx.fillStyle =
            "#d79b73";


        ctx.beginPath();

        ctx.arc(
            s.x,
            s.y - 32,
            13,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
         * Number
         */

        ctx.fillStyle =
            "white";

        ctx.font =
            "bold 14px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.fillText(
            number,
            s.x,
            s.y
        );
    }


    /* =========================
       BALL
    ========================= */

    function drawBall() {

        var s =
            worldToScreen(
                ball.x,
                ball.y
            );


        /*
         * Shadow
         */

        ctx.fillStyle =
            "rgba(0,0,0,0.4)";


        ctx.beginPath();

        ctx.ellipse(
            s.x,
            s.y + 9,
            14,
            6,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
         * Ball
         */

        var gradient =
            ctx.createRadialGradient(
                s.x - 5,
                s.y - 6,
                2,
                s.x,
                s.y,
                14
            );


        gradient.addColorStop(
            0,
            "white"
        );

        gradient.addColorStop(
            0.7,
            "#dddddd"
        );

        gradient.addColorStop(
            1,
            "#555555"
        );


        ctx.fillStyle =
            gradient;


        ctx.beginPath();

        ctx.arc(
            s.x,
            s.y,
            ball.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
         * Black pattern
         */

        ctx.fillStyle =
            "#111";


        ctx.beginPath();

        ctx.arc(
            s.x,
            s.y,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            s.x - 7,
            s.y - 5,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            s.x + 7,
            s.y + 5,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    /* =========================
       ANDROID BACK BUTTON
    ========================= */

    window.handleAndroidBack =
        function () {

            if (
                !helpScreen
                    .classList
                    .contains("hidden")
            ) {

                helpScreen
                    .classList
                    .add("hidden");

                return;
            }


            if (
                !pauseMenu
                    .classList
                    .contains("hidden")
            ) {

                pauseMenu
                    .classList
                    .add("hidden");

                paused = false;

                return;
            }


            if (running) {

                togglePause();

                return;
            }


            if (
                !menuScreen
                    .classList
                    .contains("hidden")
            ) {

                return;
            }
        };


    /* =========================
       START ENGINE
    ========================= */

    loadGame();

    requestAnimationFrame(
        update
    );


})();
