document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    /* =========================================================
       LOCAL FOOTBALL 3D
       game.js
       ========================================================= */


    /* =========================================================
       HELPERS
       ========================================================= */

    function get(id) {
        return document.getElementById(id);
    }

    function show(id) {
        var el = get(id);

        if (el) {
            el.classList.remove("hidden");
        }
    }

    function hide(id) {
        var el = get(id);

        if (el) {
            el.classList.add("hidden");
        }
    }


    /* =========================================================
       SCREENS
       ========================================================= */

    var screens = [
        "screen-menu",
        "screen-mode",
        "screen-lobby",
        "screen-game",
        "screen-training",
        "screen-settings"
    ];


    function showScreen(screenId) {

        for (var i = 0; i < screens.length; i++) {

            var screen = get(screens[i]);

            if (!screen) {
                continue;
            }

            if (screens[i] === screenId) {
                screen.classList.remove("hidden");
            } else {
                screen.classList.add("hidden");
            }
        }
    }


    /* =========================================================
       GAME STATE
       ========================================================= */

    var gameRunning = false;

    var trainingMode = false;

    var multiplayerMode = false;

    var hostMode = false;

    var matchStarted = false;

    var animationFrame = null;


    var scoreBlue = 0;

    var scoreRed = 0;


    var fieldWidth = 0;

    var fieldHeight = 0;


    /* =========================================================
       PLAYER OBJECTS
       ========================================================= */

    var player1 = {
        x: 22,
        y: 50,
        speed: 0.45,
        radius: 4,
        color: "blue"
    };


    var player2 = {
        x: 78,
        y: 50,
        speed: 0.45,
        radius: 4,
        color: "red"
    };


    var ball = {
        x: 50,
        y: 50,
        vx: 0,
        vy: 0,
        radius: 2.2,
        friction: 0.96
    };


    /* =========================================================
       INPUT STATE
       ========================================================= */

    var keys = {};

    var touchControls = {
        p1up: false,
        p1down: false,
        p1left: false,
        p1right: false,

        p2up: false,
        p2down: false,
        p2left: false,
        p2right: false
    };


    /* =========================================================
       SCORE
       ========================================================= */

    function updateScore() {

        var score = get("score");

        if (!score) {
            return;
        }

        score.textContent =
            scoreBlue + " - " + scoreRed;
    }


    /* =========================================================
       MESSAGE
       ========================================================= */

    var messageTimer = null;


    function showMessage(text, duration) {

        var message = get("game-message");

        if (!message) {
            return;
        }

        message.textContent = text;

        message.classList.remove("hidden");


        if (messageTimer) {
            clearTimeout(messageTimer);
        }


        messageTimer = setTimeout(
            function () {

                message.classList.add("hidden");

            },
            duration || 1800
        );
    }


    /* =========================================================
       FIELD SIZE
       ========================================================= */

    function updateFieldSize() {

        var field = get("field");

        if (!field) {
            return;
        }

        fieldWidth = field.clientWidth;

        fieldHeight = field.clientHeight;
    }


    /* =========================================================
       POSITION PLAYER
       ========================================================= */

    function drawPlayer(elementId, player) {

        var element = get(elementId);

        if (!element) {
            return;
        }

        element.style.left =
            player.x + "%";

        element.style.top =
            player.y + "%";

        element.style.transform =
            "translate(-50%, -50%)";
    }


    /* =========================================================
       POSITION BALL
       ========================================================= */

    function drawBall() {

        var element = get("ball");

        if (!element) {
            return;
        }

        element.style.left =
            ball.x + "%";

        element.style.top =
            ball.y + "%";

        element.style.transform =
            "translate(-50%, -50%)";
    }


    /* =========================================================
       DRAW EVERYTHING
       ========================================================= */

    function drawGame() {

        drawPlayer(
            "player1",
            player1
        );

        drawPlayer(
            "player2",
            player2
        );

        drawBall();
    }


    /* =========================================================
       CLAMP PLAYER
       ========================================================= */

    function clampPlayer(player) {

        if (player.x < 4) {
            player.x = 4;
        }

        if (player.x > 96) {
            player.x = 96;
        }

        if (player.y < 6) {
            player.y = 6;
        }

        if (player.y > 94) {
            player.y = 94;
        }
    }


    /* =========================================================
       MOVE PLAYER
       ========================================================= */

    function movePlayer(
        player,
        up,
        down,
        left,
        right
    ) {

        if (up) {
            player.y -= player.speed;
        }

        if (down) {
            player.y += player.speed;
        }

        if (left) {
            player.x -= player.speed;
        }

        if (right) {
            player.x += player.speed;
        }

        clampPlayer(player);
    }


    /* =========================================================
       DISTANCE
       ========================================================= */

    function distance(a, b) {

        var dx =
            a.x - b.x;

        var dy =
            a.y - b.y;

        return Math.sqrt(
            dx * dx +
            dy * dy
        );
    }


    /* =========================================================
       PLAYER-BALL CONTACT
       ========================================================= */

    function playerTouchesBall(player) {

        return (
            distance(
                player,
                ball
            ) <
            player.radius +
            ball.radius +
            1
        );
    }


    /* =========================================================
       KICK BALL
       ========================================================= */

    function kickBall(player, power) {

        if (!playerTouchesBall(player)) {

            showMessage(
                "Move closer to the ball",
                700
            );

            return;
        }


        var dx =
            ball.x - player.x;

        var dy =
            ball.y - player.y;


        var length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (length === 0) {

            if (player.color === "blue") {
                dx = 1;
            } else {
                dx = -1;
            }

            dy = 0;

            length = 1;
        }


        dx /= length;
        dy /= length;


        ball.vx =
            dx * power;

        ball.vy =
            dy * power;
    }


    /* =========================================================
       PASS
       ========================================================= */

    function passBall(player) {

        kickBall(
            player,
            1.6
        );
    }


    /* =========================================================
       SHOOT
       ========================================================= */

    function shootBall(player) {

        if (!playerTouchesBall(player)) {

            showMessage(
                "Move closer to the ball",
                700
            );

            return;
        }


        var targetX;


        if (player.color === "blue") {

            targetX = 100;

        } else {

            targetX = 0;
        }


        var dx =
            targetX - ball.x;

        var dy =
            50 - ball.y;


        var length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (length === 0) {
            length = 1;
        }


        ball.vx =
            (dx / length) * 3.2;

        ball.vy =
            (dy / length) * 3.2;
    }


    /* =========================================================
       BALL PHYSICS
       ========================================================= */

    function updateBall() {

        ball.x += ball.vx;

        ball.y += ball.vy;


        ball.vx *= ball.friction;

        ball.vy *= ball.friction;


        /*
         * Top / bottom wall
         */

        if (ball.y < 3) {

            ball.y = 3;

            ball.vy =
                Math.abs(
                    ball.vy
                ) * 0.75;
        }


        if (ball.y > 97) {

            ball.y = 97;

            ball.vy =
                -Math.abs(
                    ball.vy
                ) * 0.75;
        }


        /*
         * Left / right field
         */

        if (ball.x < 1) {

            /*
             * Goal area
             */

            if (
                ball.y > 35 &&
                ball.y < 65
            ) {

                scoreBlue++;

                goalScored(
                    "BLUE"
                );

                return;
            }


            ball.x = 1;

            ball.vx =
                Math.abs(
                    ball.vx
                ) * 0.75;
        }


        if (ball.x > 99) {

            /*
             * Goal area
             */

            if (
                ball.y > 35 &&
                ball.y < 65
            ) {

                scoreRed++;

                goalScored(
                    "RED"
                );

                return;
            }


            ball.x = 99;

            ball.vx =
                -Math.abs(
                    ball.vx
                ) * 0.75;
        }
    }


    /* =========================================================
       GOAL
       ========================================================= */

    function goalScored(team) {

        updateScore();

        showMessage(
            team + " GOAL!",
            1600
        );


        /*
         * Reset ball
         */

        ball.x = 50;

        ball.y = 50;

        ball.vx = 0;

        ball.vy = 0;


        /*
         * Reset players
         */

        player1.x = 22;
        player1.y = 50;

        player2.x = 78;
        player2.y = 50;
    }


    /* =========================================================
       GAME LOOP
       ========================================================= */

    function gameLoop() {

        if (!gameRunning) {
            return;
        }


        updateFieldSize();


        /*
         * PLAYER 1
         */

        movePlayer(
            player1,

            keys["w"] ||
            keys["ArrowUp"] ||
            touchControls.p1up,

            keys["s"] ||
            keys["ArrowDown"] ||
            touchControls.p1down,

            keys["a"] ||
            keys["ArrowLeft"] ||
            touchControls.p1left,

            keys["d"] ||
            keys["ArrowRight"] ||
            touchControls.p1right
        );


        /*
         * PLAYER 2
         */

        movePlayer(
            player2,

            keys["i"] ||
            touchControls.p2up,

            keys["k"] ||
            touchControls.p2down,

            keys["j"] ||
            touchControls.p2left,

            keys["l"] ||
            touchControls.p2right
        );


        updateBall();

        drawGame();


        animationFrame =
            requestAnimationFrame(
                gameLoop
            );
    }


    /* =========================================================
       START GAME
       ========================================================= */

    function startGame() {

        gameRunning = true;

        matchStarted = true;


        scoreBlue = 0;

        scoreRed = 0;


        player1.x = 22;
        player1.y = 50;

        player2.x = 78;
        player2.y = 50;


        ball.x = 50;
        ball.y = 50;

        ball.vx = 0;
        ball.vy = 0;


        updateScore();

        showScreen(
            "screen-game"
        );


        drawGame();


        if (animationFrame) {

            cancelAnimationFrame(
                animationFrame
            );
        }


        animationFrame =
            requestAnimationFrame(
                gameLoop
            );
    }


    /* =========================================================
       STOP GAME
       ========================================================= */

    function stopGame() {

        gameRunning = false;

        matchStarted = false;


        if (animationFrame) {

            cancelAnimationFrame(
                animationFrame
            );

            animationFrame = null;
        }
    }


    /* =========================================================
       MAIN MENU
       ========================================================= */

    var localButton =
        get("btn-local");


    if (localButton) {

        localButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                multiplayerMode = true;

                trainingMode = false;

                showScreen(
                    "screen-mode"
                );
            }
        );
    }


    /* =========================================================
       TRAINING BUTTON
       ========================================================= */

    var trainingButton =
        get("btn-training");


    if (trainingButton) {

        trainingButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                multiplayerMode = false;

                trainingMode = true;

                showScreen(
                    "screen-training"
                );
            }
        );
    }


    /* =========================================================
       SETTINGS BUTTON
       ========================================================= */

    var settingsButton =
        get("btn-settings");


    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showScreen(
                    "screen-settings"
                );
            }
        );
    }


    /* =========================================================
       HOST
       ========================================================= */

    var hostButton =
        get("btn-host");


    if (hostButton) {

        hostButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                hostMode = true;

                multiplayerMode = true;

                showScreen(
                    "screen-lobby"
                );


                var title =
                    get("lobby-title");

                var status =
                    get("connection-status");

                var room =
                    get("room-code");


                if (title) {
                    title.textContent =
                        "PLAYER 1 - HOST";
                }


                if (status) {

                    status.textContent =
                        "Waiting for Player 2...";
                }


                if (room) {

                    room.textContent =
                        "ROOM: LOCAL-01";
                }
            }
        );
    }


    /* =========================================================
       JOIN
       ========================================================= */

    var joinButton =
        get("btn-join");


    if (joinButton) {

        joinButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                hostMode = false;

                multiplayerMode = true;

                showScreen(
                    "screen-lobby"
                );


                var title =
                    get("lobby-title");

                var status =
                    get("connection-status");

                var room =
                    get("room-code");


                if (title) {

                    title.textContent =
                        "PLAYER 2 - JOIN";
                }


                if (status) {

                    status.textContent =
                        "Ready for local connection.";
                }


                if (room) {

                    room.textContent =
                        "ROOM: LOCAL-01";
                }
            }
        );
    }


    /* =========================================================
       START MATCH
       ========================================================= */

    var startMatchButton =
        get("btn-start-match");


    if (startMatchButton) {

        startMatchButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                startGame();
            }
        );
    }


    /* =========================================================
       MODE BACK
       ========================================================= */

    var modeBack =
        get("btn-mode-back");


    if (modeBack) {

        modeBack.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showScreen(
                    "screen-menu"
                );
            }
        );
    }


    /* =========================================================
       LOBBY BACK
       ========================================================= */

    var lobbyBack =
        get("btn-lobby-back");


    if (lobbyBack) {

        lobbyBack.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showScreen(
                    "screen-mode"
                );
            }
        );
    }


    /* =========================================================
       TRAINING START
       ========================================================= */

    var trainingStart =
        get("btn-training-start");


    if (trainingStart) {

        trainingStart.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                trainingMode = true;

                multiplayerMode = false;

                startGame();

                showMessage(
                    "TRAINING STARTED",
                    1200
                );
            }
        );
    }


    /* =========================================================
       TRAINING BACK
       ========================================================= */

    var trainingBack =
        get("btn-training-back");


    if (trainingBack) {

        trainingBack.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showScreen(
                    "screen-menu"
                );
            }
        );
    }


    /* =========================================================
       SETTINGS BACK
       ========================================================= */

    var settingsBack =
        get("btn-settings-back");


    if (settingsBack) {

        settingsBack.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showScreen(
                    "screen-menu"
                );
            }
        );
    }


    /* =========================================================
       FULLSCREEN
       ========================================================= */

    var fullscreenButton =
        get("btn-fullscreen");


    function enterFullscreen() {

        var element =
            document.documentElement;


        try {

            if (
                element.requestFullscreen
            ) {

                element.requestFullscreen();

                return true;
            }


            if (
                element.webkitRequestFullscreen
            ) {

                element.webkitRequestFullscreen();

                return true;
            }

        } catch (e) {
        }


        /*
         * Android bridge can handle this later.
         */

        try {

            if (
                window.VaultAndroid &&
                window.VaultAndroid
                    .setLandscape
            ) {

                window.VaultAndroid
                    .setLandscape();

            }

        } catch (e) {
        }


        return false;
    }


    if (fullscreenButton) {

        fullscreenButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                enterFullscreen();

                showMessage(
                    "FULLSCREEN",
                    900
                );
            }
        );
    }


    /* =========================================================
       GAME MENU
       ========================================================= */

    var gameMenu =
        get("btn-game-menu");


    if (gameMenu) {

        gameMenu.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                stopGame();

                showScreen(
                    "screen-menu"
                );
            }
        );
    }


    /* =========================================================
       KEYBOARD INPUT
       ========================================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            var key =
                event.key;


            keys[key] = true;


            /*
             * Prevent browser scrolling
             * during football controls.
             */

            if (
                key === "ArrowUp" ||
                key === "ArrowDown" ||
                key === "ArrowLeft" ||
                key === "ArrowRight" ||
                key === " "
            ) {

                event.preventDefault();
            }


            /*
             * Player 1 actions
             */

            if (
                key === " "
            ) {

                shootBall(
                    player1
                );
            }


            if (
                key === "e" ||
                key === "E"
            ) {

                passBall(
                    player1
                );
            }


            /*
             * Player 2 actions
             */

            if (
                key === "Enter"
            ) {

                shootBall(
                    player2
                );
            }


            if (
                key === "o" ||
                key === "O"
            ) {

                passBall(
                    player2
                );
            }
        }
    );


    document.addEventListener(
        "keyup",
        function (event) {

            keys[event.key] = false;
        }
    );


    /* =========================================================
       TOUCH BUTTON HELPER
       ========================================================= */

    function setupHoldButton(
        id,
        stateName
    ) {

        var button =
            get(id);


        if (!button) {
            return;
        }


        function start(event) {

            event.preventDefault();

            touchControls[stateName] =
                true;
        }


        function end(event) {

            event.preventDefault();

            touchControls[stateName] =
                false;
        }


        button.addEventListener(
            "touchstart",
            start,
            {
                passive: false
            }
        );


        button.addEventListener(
            "touchend",
            end,
            {
                passive: false
            }
        );


        button.addEventListener(
            "touchcancel",
            end,
            {
                passive: false
            }
        );


        /*
         * Mouse support for testing.
         */

        button.addEventListener(
            "mousedown",
            start
        );


        button.addEventListener(
            "mouseup",
            end
        );


        button.addEventListener(
            "mouseleave",
            end
        );
    }


    /* =========================================================
       PLAYER 1 MOVEMENT
       ========================================================= */

    setupHoldButton(
        "control-up",
        "p1up"
    );

    setupHoldButton(
        "control-down",
        "p1down"
    );

    setupHoldButton(
        "control-left",
        "p1left"
    );

    setupHoldButton(
        "control-right",
        "p1right"
    );


    /* =========================================================
       PLAYER 2 MOVEMENT
       ========================================================= */

    setupHoldButton(
        "p2-up",
        "p2up"
    );

    setupHoldButton(
        "p2-down",
        "p2down"
    );

    setupHoldButton(
        "p2-left",
        "p2left"
    );

    setupHoldButton(
        "p2-right",
        "p2right"
    );


    /* =========================================================
       PLAYER 1 ACTION BUTTONS
       ========================================================= */

    var pass1 =
        get("control-pass");


    if (pass1) {

        pass1.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                passBall(
                    player1
                );
            }
        );
    }


    var shoot1 =
        get("control-shoot");


    if (shoot1) {

        shoot1.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                shootBall(
                    player1
                );
            }
        );
    }


    /* =========================================================
       PLAYER 2 ACTION BUTTONS
       ========================================================= */

    var pass2 =
        get("p2-pass");


    if (pass2) {

        pass2.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                passBall(
                    player2
                );
            }
        );
    }


    var shoot2 =
        get("p2-shoot");


    if (shoot2) {

        shoot2.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                shootBall(
                    player2
                );
            }
        );
    }


    /* =========================================================
       PREVENT LONG-PRESS MENU
       ========================================================= */

    document.addEventListener(
        "contextmenu",
        function (event) {

            event.preventDefault();

        }
    );


    /* =========================================================
       ANDROID BACK BUTTON
       ========================================================= */

    window.handleAndroidBack =
        function () {

            var current =
                "screen-menu";


            for (
                var i = 0;
                i < screens.length;
                i++
            ) {

                var screen =
                    get(screens[i]);


                if (
                    screen &&
                    !screen.classList.contains(
                        "hidden"
                    )
                ) {

                    current =
                        screens[i];

                    break;
                }
            }


            if (
                current ===
                "screen-game"
            ) {

                stopGame();

                showScreen(
                    "screen-menu"
                );

                return;
            }


            if (
                current ===
                "screen-lobby"
            ) {

                showScreen(
                    "screen-mode"
                );

                return;
            }


            if (
                current ===
                "screen-mode"
            ) {

                showScreen(
                    "screen-menu"
                );

                return;
            }


            if (
                current ===
                "screen-training"
            ) {

                showScreen(
                    "screen-menu"
                );

                return;
            }


            if (
                current ===
                "screen-settings"
            ) {

                showScreen(
                    "screen-menu"
                );

                return;
            }


            if (
                current ===
                "screen-menu"
            ) {

                /*
                 * Let Android close the Activity.
                 */

                try {

                    if (
                        window.VaultAndroid &&
                        window.VaultAndroid
                            .finishApp
                    ) {

                        window.VaultAndroid
                            .finishApp();

                    }

                } catch (e) {
                }
            }
        };


    /* =========================================================
       RESIZE
       ========================================================= */

    window.addEventListener(
        "resize",
        function () {

            updateFieldSize();

            drawGame();
        }
    );


    window.addEventListener(
        "orientationchange",
        function () {

            setTimeout(
                function () {

                    updateFieldSize();

                    drawGame();

                },
                250
            );
        }
    );


    /* =========================================================
       INITIALIZE
       ========================================================= */

    updateFieldSize();

    updateScore();

    drawGame();

    showScreen(
        "screen-menu"
    );


});
