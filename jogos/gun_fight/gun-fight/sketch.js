var player1;
var p1_score = 0;
var p1_bullets = [];
var p1_remain_bullets = [];
var p1_last_bullet = false;
var player2;
var p2_score = 0;
var p2_bullets = [];
var p2_remain_bullets = [];
var p2_last_bullet = false;
var carriage;
var show_carriage = false;
var cactus = [];
var trees = [];
var timer;
var startGame = false;
var gameState = 'Start Game - Press ENTER';
var n_cactus = 0;
var n_trees = 0;
var titleImage;
var got_me;
var gotMeImage;
var player1Animation;
var player1DeathAnimation;
var player2Animation;
var player2DeathAnimation;
var bullet1Image;
var bullet2Image;
var carriageImage;
var cactusImage;
var treeImage;
var gunshotSound;
var hitSound;
var deathSound;

function preload() {
    //Sprites
    gotMeImage = loadImage('sprites/got-me.png');
    
    player1Animation = loadImage('sprites/player1.png');
    player1DeathAnimation = loadImage('sprites/player1deathAnimation.png');
    
    player2Animation = loadImage('sprites/player2.png');
    player2DeathAnimation = loadImage('sprites/player2deathAnimation.png');
    
    bullet1Image = loadImage('sprites/bullet.png');
    bullet2Image = loadImage('sprites/bullet2.png');
    
    carriageImage = loadImage('sprites/carriage.png');
    cactusImage = loadImage('sprites/cactus.png');
    treeImage = loadImage('sprites/tree.png');
    
    //Sounds
    gunshotSound = loadSound('sounds/gunshot.wav');
    hitSound = loadSound('sounds/hit.wav');
    deathSound = loadSound('sounds/death.wav');
}

function setup() {
    createCanvas(innerWidth * 0.995, innerHeight * 0.99);
    gunshotSound.setVolume(0.2);
    hitSound.setVolume(0.2);
    deathSound.setVolume(0.2);
}

function draw() {
    background(0);
    
    if (startGame) {
        if (millis() - timer >= 60000)
            startGame = false;
        
        if (player1.getAnimationLabel() === 'death' && !deathSound.isPlaying())
            resetGame();
        else if (player2.getAnimationLabel() === 'death' && !deathSound.isPlaying())
            resetGame();
        
        if (!deathSound.isPlaying()) {
            /*

            */
            for (var i = 0; i < p1_bullets.length; i++) {
                if (p1_bullets[i].collide(player2)) {
                    p1_score++;

                    for (var j = 0; j < p1_bullets.length; j++)
                        p1_bullets[j].remove();

                    hitSound.play();
                    deathSound.play();
                    player2.score = -1;
                    player2.changeAnimation('death');
                    got_me = createSprite(player2.position.x, player2.position.y - 50);
                    got_me.addImage(gotMeImage);
                }
                else if (show_carriage && p1_bullets[i].collide(carriage)) {
                    p1_bullets[i].remove();
                    hitSound.play();
                }

                for (var j = n_trees; j < cactus.length; j++)
                    if (p1_bullets[i].collide(cactus[j])) {
                        p1_bullets[i].remove();
                        cactus[j].remove();
                        cactus.splice(j, 1);
                        hitSound.play();

                        if (i === p1_bullets.length - 1)
                            p1_last_bullet = true;
                    }

                for (var j = 0; j < trees.length; j++) {
                    if (p1_bullets[i].collide(trees[j])) {
                        p1_bullets[i].remove();
                        hitSound.play();

                        if (trees[j].score === 0) {
                            trees[j].remove();
                            trees.splice(j, 1);
                        }
                        else
                            trees[j].score--;

                        if (i === p1_bullets.length - 1)
                            p1_last_bullet = true;
                    }
                }
            }

            /*

            */
            for (var i = 0; i < p2_bullets.length; i++) {
                if (p2_bullets[i].collide(player1)) {
                    p2_score++;

                    for (var j = 0; j < p2_bullets.length; j++)
                        p2_bullets[j].remove();

                    hitSound.play();
                    deathSound.play();
                    player1.score = -1;
                    player1.changeAnimation('death');
                    got_me = createSprite(player1.position.x, player1.position.y - 50);
                    got_me.addImage(gotMeImage);
                }
                else if (show_carriage && p2_bullets[i].collide(carriage)) {
                    p2_bullets[i].remove();
                    hitSound.play();
                }

                for (var j = n_trees; j < cactus.length; j++)
                    if (p2_bullets[i].collide(cactus[j])) {
                        p2_bullets[i].remove();
                        cactus[j].remove();
                        cactus.splice(j, 1);
                        hitSound.play();

                        if (i === p2_bullets.length - 1)
                            p2_last_bullet = true;
                    }

                for (var j = 0; j < trees.length; j++) {
                    if (p2_bullets[i].collide(trees[j])) {
                        p2_bullets[i].remove();
                        hitSound.play();

                        if (trees[j].score === 0) {
                            trees[j].remove();
                            trees.splice(j, 1);
                        }
                        else
                            trees.score--;

                        if (i === p2_bullets.length - 1)
                            p2_last_bullet = true;
                    }
                }
            }
        }
        
        if (p1_remain_bullets.length === 0 && p2_remain_bullets.length === 0) {
            if (p1_bullets[p1_bullets.length - 1].position.x > width && p2_bullets[p2_bullets.length - 1].position.x < 0)
                resetGame();
            else if (p1_last_bullet && p2_last_bullet)
                resetGame();
        }
        
        if (show_carriage && carriage.position.y >= height * 0.9)
            carriage.setSpeed(2, 270);
        else if (show_carriage && carriage.position.y <= height * 0.2)
            carriage.setSpeed(2, 90);

        noStroke();
        fill(255, 255, 0);
        textSize(40);
        t = 60 - int((millis() - timer) * 0.001);

        text(p1_score, width * 0.35 - p1_score.toString().length * 10, height * 0.06);
        text(t, width * 0.5 - t.toString().length * 10, height * 0.06);
        text(p2_score, width * 0.65 - p2_score.toString().length * 10, height * 0.06);
        
        drawSprites();
    }
    else
        gameEnd(gameState);
}

/*

*/
function resetGame() {
    var n_bullets = 6;
    p1_last_bullet = false;
    p2_last_bullet = false;
    
    if (n_cactus === 4)
        show_carriage = true;
    
    if (got_me != undefined)
        got_me.remove();
    
    if (player1 != undefined || player2 != undefined) {
        player1.remove();
        player2.remove();
        
        if (n_cactus < 8)
            n_cactus++;
        else
            if (n_trees < 8)
                n_trees++;
    }
    
    for (var i = 0; i < p1_bullets.length; i++)
        p1_bullets[i].remove();
    
    for (var i = 0; i < p2_bullets.length; i++)
        p2_bullets[i].remove();

    for (var i = 0; i < p1_remain_bullets.length; i++)
        p1_remain_bullets[i].remove();
    
    for (var i = 0; i < p2_remain_bullets.length; i++)
        p2_remain_bullets[i].remove();
    
    if (carriage != undefined)
        carriage.remove();
    
    for (var i = 0; i < cactus.length; i++)
        cactus[i].remove();
    
    if (n_trees > 0)
        cactus.splice(0, 1);
    
    for (var i = 0; i < trees.length; i++)
        trees[i].remove();
    
    player1 = createSprite(width * 0.25, height * 0.5);
    player1.addImage(player1Animation);
    player1.addAnimation('death', player1DeathAnimation);
    player1.score = 0;
    
    player2 = createSprite(width * 0.75, height * 0.5);
    player2.addImage(player2Animation);
    player2.addAnimation('death', player2DeathAnimation);
    player2.score = 0;
    
    for (var i = 0; i < n_bullets; i++) {
        p1_remain_bullets[i] = createSprite(width * 0.25 + i + i * width * 0.02, height * 0.96);
        p1_remain_bullets[i].addImage(bullet2Image);
        p2_remain_bullets[i] = createSprite(width * 0.65 + i + i * width * 0.02, height * 0.96);
        p2_remain_bullets[i].addImage(bullet2Image);
    }
    
    if (show_carriage) {
        carriage = createSprite(width * 0.5, height * 0.9);
        carriage.addImage(carriageImage);
        carriage.setSpeed(2, 270);
    }
    
    for (var i = n_trees; i < n_cactus; i++) {
        var pos = position(i);
        cactus[i] = createSprite(pos[0], pos[1]);
        cactus[i].addImage(cactusImage);
    }
    
    for (var i = 0; i < n_trees; i++) {
        var pos = position(i);
        trees[i] = createSprite(pos[0], pos[1]);
        trees[i].addImage(treeImage);
        trees[i].score = 1;
    }
}

//
function gameEnd(gameState) {
    if (player1 != undefined || player2 != undefined) {
        player1.remove();
        player2.remove();
        player1 = undefined;
        player2 = undefined;
        p1_score = 0;
        p2_score = 0;
        got_me.remove();
        timer = millis();
        show_carriage = false;
        n_cactus = 0;
        n_trees = 0;
    }
    
    noStroke();
    fill(255, 255, 0);
    textSize(40);
    var w = width * 0.5 - gameState.length * 10;
    var h = height * 0.5;
    
    text(gameState, w, h);
}

//
function position(idx) {
    switch (idx) {
        case 0:
            return [width * 0.45, height * 0.80];
        case 1:
            return [width * 0.55, height * 0.72];
        case 2:
            return [width * 0.45, height * 0.64];
        case 3:
            return [width * 0.55, height * 0.56];
        case 4:
            return [width * 0.45, height * 0.48];
        case 5:
            return [width * 0.55, height * 0.40];
        case 6:
            return [width * 0.45, height * 0.32];
        case 7:
            return [width * 0.55, height * 0.24];
    }
}

function keyPressed() {
    if (startGame === true && player1.score != -1 && player2.score != -1) {
        if (keyCode === 32 && p1_remain_bullets.length != 0) {
            var bullet = createSprite(player1.position.x + 15, player1.position.y - 15);
            bullet.addImage(bullet1Image);
            bullet.setSpeed(20, 0);
            gunshotSound.play();
            p1_bullets.push(bullet);
            p1_remain_bullets[0].remove();
            p1_remain_bullets.splice(0, 1);
        }
        else if (keyCode === 77 && p2_remain_bullets.length != 0) {
            var bullet = createSprite(player2.position.x + 15, player2.position.y - 15);
            bullet.addImage(bullet1Image);
            bullet.setSpeed(20, 180);
            gunshotSound.play();
            p2_bullets.push(bullet);
            p2_remain_bullets[0].remove();
            p2_remain_bullets.splice(0, 1);
        }
        
        if (keyCode === 83 && player1.position.y + height * 0.075 <= height * 0.9)
            player1.position.y += height * 0.075;
        else if (keyCode === 87 && player1.position.y - height * 0.075 >= height * 0.2)
            player1.position.y -= height * 0.075;
        
        if (keyCode === 40 && player2.position.y + height * 0.075 <= height * 0.9)
            player2.position.y += height * 0.075;
        else if (keyCode === 38 && player2.position.y - height * 0.075 >= height * 0.2)
            player2.position.y -= height * 0.075;
    }
    else if (startGame === false) {
        if (keyCode === 13) {
            startGame = true;
            resetGame();
            cactus = [];
            trees = [];
            timer = millis();
        }
    }
}
