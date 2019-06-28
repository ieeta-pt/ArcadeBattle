var ship;
var bullets = [];
var invaders_bullets = [];
var invaders = [[], [], []];
var down = [[], [], []];
var vel = 1;
var xdir = 1;
var ydir = 0;
var time;
var wait = 5000;
var dmg = 1;
var lastShot = 0;
var playerScore = 0;
var highscore = 0;
var highscoreboard;
var scoreboard;
var angle;
var startGame = false;
var gameState = 'Start Game - Press ENTER';
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


function preload() {
    //Sprites
    scoreboardImage = loadImage('sprites/scoreboard.png');
    highscoreImage = loadImage('sprites/highscore.png');
    shipImage = loadImage('sprites/spaceship.png');
    invader1Image = loadImage('sprites/invader1.png');
    invader2Image = loadImage('sprites/invader2.png');
    invader3Image = loadImage('sprites/invader3.png');
    invader4Image = loadImage('sprites/invader4.png');
    bullet1Image = loadImage('sprites/bullet.png');
    bullet2Image = loadImage('sprites/bullet2.png');
    
    shipDeath = loadImage('sprites/spaceship_death_animation.png');
    invader1Animation = loadImage('sprites/invader1_animation.png');
    invader2Animation = loadImage('sprites/invader2_animation.png');
    invader3Animation = loadImage('sprites/invader3_animation.png');
    invaderDeath = loadImage('sprites/invader_death_animation.png');
    
    //Sounds
    shipDeathSound = loadSound('sounds/explosion.wav');
    bulletSound = loadSound('sounds/shoot.wav');
    invaderSound = loadSound('sounds/fastinvader.wav');
    invaderDeathSound = loadSound('sounds/invaderkilled.wav');
}

function setup() {
    time = millis();
    createCanvas(innerWidth * 0.995, innerHeight * 0.99);
    shipDeathSound.setVolume(0.2);
    bulletSound.setVolume(0.2);
    invaderDeathSound.setVolume(0.2);
}

function draw() {
    background(0);
    
    if (startGame) {
        //Caso não haja mais invasores, acrescenta novos.
        if (invaders[0].length === 0 && invaders[1].length === 0 && invaders[2].length === 0)
            resetGame();
        
        //De 1000ms em 1000ms, um invasor é escolhido para disparar.
        if (millis() - time >= wait) {
            var idx = int(random(0, invaders.length));
            var idxs = randIdx(idx);
            
            if (idxs[0] != -1) {
                idx = idxs[0];
                var i = idxs[1];
                var b = createSprite(invaders[idx][i].position.x, invaders[idx][i].position.y);
                b.addImage(bullet2Image);
                b.setSpeed(5, 90);
                invaders_bullets.push(b);
                time = millis();
            }
        }
        
        /*
        Verifica se alguma bala dos invasores acertou a nave.
        Se acertar, verifica se era a última vida da nave.
        */
        for (var i = 0; i < invaders_bullets.length; i++)
            if (invaders_bullets[i].collide(ship)) {
                if (ship.score === 0) {
                    ship.changeAnimation('death');
                    invaderSound.stop();
                    shipDeathSound.play();

                    if (playerScore > highscore)
                        highscore = playerScore;

                    startGame = false;
                    gameState = 'GAME OVER!';
                }
                else {
                    ship.score--;
                    invaders_bullets[i].remove();
                    invaders_bullets.splice(i, 1);
                }
            }
        
        //Realiza o movimento e escolhe a direção dos invasores, e verifica se um deles colidiu com a nave.
        for (var j = 0; j < invaders.length; j++)
            for (var i = 0; i < invaders[j].length; i++) {
                if (invaders[j][i].position.x + invaders[j][i].width >= width) {
                    angle = 180;
                    ydir = invaders[j][i].height;
                }
                else if (invaders[j][i].position.x - invaders[j][i].width <= 0) {
                    angle = 0;
                    ydir = invaders[j][i].height;
                }

                if (down[j][i]) {
                    down[j][i] = false;
                    ydir = 0;
                }

                if (ydir != 0)
                    down[j][i] = true;

                if (invaders[j][i].collide(ship)) {
                    ship.changeAnimation('death');
                    invaderSound.stop();
                    shipDeathSound.play();

                    if (playerScore > highscore)
                        highscore = playerScore;

                    startGame = false;
                    gameState = 'GAME OVER!';
                }

                invaders[j][i].setSpeed(vel, angle);
                invaders[j][i].position.y += ydir;

                if (invaders[j][i].score != -1)
                    invaders[j][i].changeAnimation('movement');
                else {
                    invaders[j][i].remove();
                    invaders[j].splice(i, 1);
                }
            }
        
        /*
        Verifica alguma bala da nave acertou num dos invasores.
        Se acertar, verifica se era a última vida do invasor.
        */
        for (var k = 0; k < invaders.length; k++)
            for (var j = 0; j < invaders[k].length; j++)
                for (var i = 0; i < bullets.length; i++)
                    if (bullets[i].collide(invaders[k][j])) {
                        if (invaders[k][j].score === 0) {
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

        noStroke();
        fill(255);
        textSize(25);

        text(playerScore, width * 0.09, scoreboard.position.y + height * 0.012);
        text(highscore, width * 0.31, highscoreboard.position.y + height * 0.012);
        text(ship.score, width * 0.05, height * 0.97);
        
        drawSprites();
    }
    else
        gameEnd(gameState);
}

/*
Função responsável por recomeçar o jogo, criando a nave, os invasores, etc. (eliminando todos os objetos, caso existam).
Ativada quando o jogador pressiona a tecla ENTER, no ínicio ou quando perde.
*/
function resetGame() {
    if (ship != undefined)
        ship.remove();
    
    for (var j = 0; j < invaders.length; j++)
         for (var i = 0; i < invaders[j].length; i++)
             invaders[j][i].remove();

    for (var i = 0; i < bullets.length; i++)
        bullets[i].remove();

    for (var i = 0; i < invaders_bullets.length; i++)
        invaders_bullets[i].remove();
    
    ship = createSprite(width * 0.5, height * 0.90);
    ship.addImage(shipImage);
    ship.addAnimation('death', shipDeath);
    ship.score = 3;
    var lives = createSprite(width * 0.025, height * 0.96);
    lives.addImage(shipImage);
    scoreboard = createSprite(width * 0.05, height * 0.05);
    scoreboard.addImage(scoreboardImage);
    highscoreboard = createSprite(width * 0.25, height * 0.05);
    highscoreboard.addImage(highscoreImage);
    
    for (var j = 0; j < 3; j++)
        for (var i = 0; i < 6; i++) {
            invaders[j][i] = createSprite(i * (width * 0.065) + (width * 0.065), (j * height * 0.1) + (height * 0.15));
            invaders[j][i].addImage(invaderType(j)[0]);
            invaders[j][i].addAnimation('movement', invaderType(j)[0], invaderType(j)[1]);
            invaders[j][i].addAnimation('death', invaderDeath);
            invaders[j][i].score = dmg;
            down[j][i] = false;
        }
}

//Função que retorna a imagem/animação de cada tipo de invasor.
function invaderType(num) {
    if (num === 0)
        return [invader1Image, invader1Animation];
    else if (num === 1)
        return [invader2Image, invader2Animation];
    else
        return [invader3Image, invader3Animation];
}

//Função que retorna dois números aleatórios de forma a escolher um invasor aleatório para disparar.
function randIdx(idx) {
    if (invaders[idx].length != 0)
        return [idx, int(random(0, invaders[idx].length))];
    else {
        idx = int(random(0, invaders.length));
        return randIdx(idx);
    }
}

//Função que quando o jogador perde, verifica se a sua pontuação do jogador é a pontuação mais elevada, e apresenta o respetivo texto.
function gameEnd(gameState) {
    if (playerScore > highscore)
        highscore = playerScore;
    
    playerScore = 0;
    
    noStroke();
    fill(255);
    textSize(40);
    var w = width * 0.5 - gameState.length * 10;
    var h = height * 0.5;
    
    text(gameState, w, h);
}

function keyPressed() {
    if (startGame === true) {
        if (keyCode === 32 && lastShot === 0) {
            var bullet = createSprite(ship.position.x, ship.position.y);
            lastShot = 50;
            bullet.addImage(bullet1Image);
            bullet.setSpeed(5, 270);
            bulletSound.play();
            bullets.push(bullet);
        }
        
        if (keyCode === 39 && ship.position.x + width * 0.075 <= width)
            ship.position.x += width * 0.075;
        else if (keyCode === 37 && ship.position.x - width * 0.075 >= 0)
            ship.position.x -= width * 0.075;
    }
    else {
        if (keyCode === 13) {
            startGame = true;
            resetGame();
            invaderSound.loop(0, 1, 0.2);
        }
    }
}