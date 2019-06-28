var socket = null;
var game_stats_socket = new WebSocket('ws://localhost:8082');
var ship;
var bullets = [];
var invaders_bullets = [];
var invaders = [[], [], []];
var down = [[], [], []];
var vel = 1;
var xdir = 1;
var ydir = 0;
var time;
var time2;
var wait = 5000;
var invader_hp = 0;
var lastShot = 0;
var playerScore = 0;
var highscore;
var highscoreboard;
var scoreboard;
var angle;
var startGame = false;
var gameState = 'Start Game - Do the ';
var backgroundImage;
var scoreboardImage;
var highscoreImage;
var shipImage;
var invader1Image;
var invader1Animation;
var invader2Image;
var invader2Animation;
var invader3Image;
var invader3Animation;
var invader4Image;
var invaderDeath;
var bullet1Image;
var bullet2Image;
var shipDeathSound;
var bulletSound;
var invaderSound;
var invaderDeathSound;
var going_left = true;
var gesture_name = "";

//current game difficulty
var current_difficulty = -1;
var ended_game = true;

function preload()
{
    //Sprites
    backgroundImage = loadImage('games/assets/spaceInvaders/background.jpg');
    gameOverImage = loadImage('games/assets/spaceInvaders/gameover.png');
    scoreboardImage = loadImage('games/assets/spaceInvaders/scoreboard.png');
    highscoreImage = loadImage('games/assets/spaceInvaders/highscore.png');
    shipImage = loadImage('games/assets/spaceInvaders/spaceship.png');
    invader1Image = loadImage('games/assets/spaceInvaders/invader1.png');
    invader2Image = loadImage('games/assets/spaceInvaders/invader2.png');
    invader3Image = loadImage('games/assets/spaceInvaders/invader3.png');
    invader4Image = loadImage('games/assets/spaceInvaders/invader4.png');
    bullet1Image = loadImage('games/assets/spaceInvaders/bullet.png');
    bullet2Image = loadImage('games/assets/spaceInvaders/bullet2.png');

    shipDeath = loadImage('games/assets/spaceInvaders/spaceship_death_animation.png');
    invader1Animation = loadImage('games/assets/spaceInvaders/invader1_animation.png');
    invader2Animation = loadImage('games/assets/spaceInvaders/invader2_animation.png');
    invader3Animation = loadImage('games/assets/spaceInvaders/invader3_animation.png');
    invaderDeath = loadImage('games/assets/spaceInvaders/invader_death_animation.png');

    //Sounds
    shipDeathSound = loadSound('games/assets/spaceInvaders/explosion.wav');
    bulletSound = loadSound('games/assets/spaceInvaders/shoot.wav');
    invaderSound = loadSound('games/assets/spaceInvaders/fastinvader.wav');
    invaderDeathSound = loadSound('games/assets/spaceInvaders/invaderkilled.wav');
}

function setup()
{
    time = millis();
    time2 = millis();
    createCanvas(innerWidth * 0.995, innerHeight * 0.99);
    shipDeathSound.setVolume(0.2);
    bulletSound.setVolume(0.2);
    invaderDeathSound.setVolume(0.2);
}

function draw()
{
    if (startGame)
    {
        background(0);
        
        vel = getVelocityFromDifficulty(current_difficulty);
        wait = getShootingSpaceIntervalFromDifficulty(current_difficulty);
        
        //Caso não haja mais invasores, acrescenta novos.
        if (invaders[0].length === 0 && invaders[1].length === 0 && invaders[2].length === 0)
            resetGame();

        //De 1000ms em 1000ms, um invasor é escolhido para disparar.
        if (millis() - time >= wait)
        {
            var idx = int(random(0, invaders.length));
            var idxs = randIdx(idx);

            if (idxs[0] != -1)
            {
                idx = idxs[0];
                var i = idxs[1];
                var b = createSprite(invaders[idx][i].position.x, invaders[idx][i].position.y);

                b.addImage(bullet2Image);
                b.setSpeed(5, 90);
                invaders_bullets.push(b);
                time = millis();
            }
        }

        //Movimentação automática da nave.
        if (millis() - time2 >= 50)
        {
            if (lastShot === 0)
            {
                var bullet = createSprite(ship.position.x, ship.position.y);

                lastShot = 50;
                bullet.addImage(bullet1Image);
                bullet.setSpeed(5, 270);
                bulletSound.play();
                bullets.push(bullet);
            }

            if (ship.position.x + width * 0.015 <= width && going_left === false)
                ship.position.x += width * 0.015;
            else if (ship.position.x - width * 0.015 >= 0 && going_left === true)
                ship.position.x -= width * 0.015;

            time2 = millis();
        }

        /*
        Verifica alguma bala da nave acertou num dos invasores.
        Se acertar, verifica se era a última vida do invasor.
        */
        for (var k = 0; k < invaders.length; k++)
            for (var j = 0; j < invaders[k].length; j++)
                for (var i = 0; i < bullets.length; i++)
                    if (bullets[i].collide(invaders[k][j]))
                    {
                        if (invaders[k][j].score === 0)
                        {
                            if (current_difficulty <= 98) current_difficulty += 2;

                            vel += 0.05;
                            playerScore += 15;
                            invaders[k][j].changeAnimation('death');
                            invaderDeathSound.play();
                        }

                        invaders[k][j].score--;
                        bullets[i].remove();
                        bullets.splice(i, 1);
                    }

        if (lastShot > 0)
            lastShot--;
        
        /*
        Verifica se alguma bala dos invasores acertou a nave.
        Se acertar, verifica se era a última vida da nave.
        */
        for (var i = 0; i < invaders_bullets.length; i++)
            if (invaders_bullets[i].collide(ship))
            {
                if (current_difficulty >= 5) current_difficulty -= 5;

                if (ship.score === 0)
                {
                    ship.changeAnimation('death');
                    invaderSound.stop();
                    shipDeathSound.play();

                    startGame = false;
                    ended_game = false;

                    gameState = 'GAME OVER!';
                }
                else
                {
                    ship.score--;
                    invaders_bullets[i].remove();
                    invaders_bullets.splice(i, 1);
                }
            }

        //Realiza o movimento e escolhe a direção dos invasores, e verifica se um deles colidiu com a nave.
        for (var j = 0; j < invaders.length; j++)
            for (var i = 0; i < invaders[j].length; i++)
            {
                if (invaders[j][i].position.x + invaders[j][i].width >= width)
                {
                    angle = 180;
                    ydir = invaders[j][i].height;
                }
                else if (invaders[j][i].position.x - invaders[j][i].width <= 0)
                {
                    angle = 0;
                    ydir = invaders[j][i].height;
                }

                if (down[j][i])
                {
                    down[j][i] = false;
                    ydir = 0;
                }

                if (ydir != 0)
                    down[j][i] = true;

                if (invaders[j][i].collide(ship))
                {
                    ship.changeAnimation('death');
                    invaderSound.stop();
                    shipDeathSound.play();

                    startGame = false;
                    ended_game = false;

                    gameState = 'GAME OVER!';
                }

                invaders[j][i].setSpeed(vel, angle);
                invaders[j][i].position.y += ydir;

                if (invaders[j][i].score != -1)
                    invaders[j][i].changeAnimation('movement');
                else
                {
                    invaders[j][i].remove();
                    invaders[j].splice(i, 1);
                }
            }

        noStroke();
        fill(255);
        textSize(25);

        text(playerScore, width * 0.09, scoreboard.position.y + height * 0.012);
        text(highscore, width * 0.31, highscoreboard.position.y + height * 0.012);
        text(ship.score, width * 0.05, height * 0.97);
        
        drawSprites();
        newDifficulty();
    }
    else
    {
        gameEnd(gameState);
        
        if (!ended_game)
        {
            sendScore();
            if (current_difficulty >= 15) current_difficulty -= 15;
            ended_game = true;
            playerScore = 0;
        }
    }
}

//Função que retorna a imagem/animação de cada tipo de invasor.
function invaderType(num)
{
    if (num === 0)
        return [invader1Image, invader1Animation];
    else if (num === 1)
        return [invader2Image, invader2Animation];
    else
        return [invader3Image, invader3Animation];
}

//Função que retorna dois números aleatórios de forma a escolher um invasor aleatório para disparar.
function randIdx(idx)
{
    if (invaders[idx].length != 0)
        return [idx, int(random(0, invaders[idx].length))];
    else
    {
        idx = int(random(0, invaders.length));
        
        return randIdx(idx);
    }
}

/*
Função responsável por recomeçar o jogo, criando a nave, os invasores, etc. (eliminando todos os objetos, caso existam).
Ativada quando o jogador pressiona a tecla ENTER, no ínicio ou quando perde.
*/
function resetGame()
{
    if (ship != undefined)
        ship.remove();

    for (var j = 0; j < invaders.length; j++)
        for (var i = 0; i < invaders[j].length; i++)
            invaders[j][i].remove();

    for (var i = 0; i < bullets.length; i++)
        bullets[i].remove();

    for (var i = 0; i < invaders_bullets.length; i++)
        invaders_bullets[i].remove();

    var lives = createSprite(width * 0.025, height * 0.96);
    lives.addImage(shipImage);

    ship = createSprite(width * 0.5, height * 0.90);
    ship.addImage(shipImage);
    ship.addAnimation('death', shipDeath);
    ship.score = 3;
    scoreboard = createSprite(width * 0.05, height * 0.05);
    scoreboard.addImage(scoreboardImage);
    highscoreboard = createSprite(width * 0.25, height * 0.05);
    highscoreboard.addImage(highscoreImage);

    for (var j = 0; j < 3; j++)
        for (var i = 0; i < 6; i++)
        {
            invaders[j][i] = createSprite(i * (width * 0.065) + (width * 0.065), (j * height * 0.1) + (height * 0.15));
            invaders[j][i].addImage(invaderType(j)[0]);
            invaders[j][i].addAnimation('movement', invaderType(j)[0], invaderType(j)[1]);
            invaders[j][i].addAnimation('death', invaderDeath);
            invaders[j][i].score = invader_hp;
            down[j][i] = false;
        }
}

//Função que quando o jogador perde, verifica se a sua pontuação do jogador é a pontuação mais elevada, e apresenta o respetivo texto.
function gameEnd(gameState)
{
    if (playerScore > highscore)
        highscore = playerScore;
    
    if (gameState != "GAME OVER!")
    {
        gameState += "\"" + gesture_name + "\" gesture!\nHighscore: " + highscore;
        background(backgroundImage);
        
        noStroke();
        fill(255);
        textSize(40);
        textAlign(CENTER);
        
        var w = width * 0.5;
        var h = height * 0.8;
        
        text(gameState, w, h);
    }
    else
    {
        background(gameOverImage);
        
        noStroke();
        fill(255);
        textSize(40);
        textAlign(CENTER);
        
        var w = width * 0.5;
        var h = height * 0.8;
        
        text("Highscore: " + highscore, w, h);
    }
}

function getStatistics()
{
    game_stats_socket.onmessage = function (event)
    {
        game_stats_socket.send('{"type" : "get_statistics", "game_name" : "Space Invaders"}');
        
        game_stats_socket.onmessage = function (event)
        {
            highscore = JSON.parse(event.data).highscore;
            current_difficulty = JSON.parse(event.data).difficulty;
            gesture_name = JSON.parse(event.data).gesture_name;
        }
    }
}

function newDifficulty()
{
    game_stats_socket.send('{"type" : "new_difficulty", "difficulty" : ' + current_difficulty + '}');
    
    game_stats_socket.onmessage = function (event)
    {
        current_difficulty = JSON.parse(event.data).difficulty;
    }
}

function sendScore()
{
    game_stats_socket.send('{"type" : "send_score", "game_name" : "Space Invaders", "score" : ' + playerScore + '}');
    
    game_stats_socket.onmessage = function (event)
    {
        highscore = JSON.parse(event.data).highscore;
    }
}

function getVelocityFromDifficulty(user_difficulty)
{
    if (user_difficulty >= 0 && user_difficulty <= 20) return 0.5;
    if (user_difficulty >= 20 && user_difficulty <= 40) return 1.5;
    if (user_difficulty >= 40 && user_difficulty <= 60) return 2.5;
    if (user_difficulty >= 60 && user_difficulty <= 80) return 3.5;

    return 4.5;
}

function getShootingSpaceIntervalFromDifficulty(user_difficulty)
{
    if (user_difficulty >= 0 && user_difficulty <= 20) return 7000;
    if (user_difficulty >= 20 && user_difficulty <= 40) return 5000;
    if (user_difficulty >= 40 && user_difficulty <= 60) return 3000;
    if (user_difficulty >= 60 && user_difficulty <= 80) return 2000;

    return 500;
}

function keyReceived()
{
    socket = new WebSocket('ws://localhost:8081');
    
    socket.onmessage = function (event)
    {
        var key = JSON.parse(event.data).key;

        switch (key)
        {
            case "SPACE":
                keyCode = 32;
                break;
            default:
                keyCode = -1;
                break;
        }
        
        simulateKey(keyCode);
    }
}

function simulateKey(keyCode)
{
    if (startGame === true)
    {
        //Mudança da direção da nave.
        if (keyCode === 32 && going_left === true)
            going_left = false;
        else if (keyCode === 32 && going_left === false)
            going_left = true;
    }
    else
        if (keyCode === 32)
        {
            startGame = true;
            resetGame();
            invaderSound.loop(0, 1, 0.2);
        }
}

function killServer()
{
    socket.send('{"type" : "game_ended"}');
    socket.close();
    
    game_stats_socket.send('{"type" : "game_ended"}');
    game_stats_socket.close();
}
