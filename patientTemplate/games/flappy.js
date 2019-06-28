var socket = null;
var game_stats_socket = new WebSocket('ws://localhost:8082');

//Game ticks (Time)
var ticks = 0;

//Window_size
var window_size_x;
var window_size_y;

//Pipes size
var pipe_size;

//X and Y position of the bird
var bird_x;
var bird_y;

//Position of the diferent pipes (top and bottom)
var pipes_x;

//Starting Y position of the top pipes
var top_pipe_y;

//Disntace between pipes
var pipes_distance;

//Starting Y position of the bottom pipes
var bot_pipe_y;

//Y position of the multiple pipes on the top of the screen
var top_pipes_y;

//Y position of the multiple pipes on the bottom of the screen
var bot_pipes_y;

//Flag that sinalizes the end of the game
var hit = false;

//Flag that sinalizes the begining of a game
var start = true;

//Flag that sinalizes the ending of a game
var end = false;

//Down Force (Base Movement no Acellaration)
var down_force;

//Score Count Images
var score_images = [];

//Background Image
var bg;

//Bird Sprites
var bird = [];

//Bird Image to choose
var bird_state = 0;

//Pipe-Up Sprite
var pipe_up;

//Pipe-Down Sprite
var pipe_down;

//Starting Game Image
var start_menu;

//Game Over Image
var game_over;

//Score Counter
var score = 0;

//Angle of the bird
var angle = 0;

//X Velocity
var velocity_x;

//Y Velocity
var velocity_y;

//Jump Sound Effect
var jump_sound;

//Point Sound Effect
var point_sound;

//Crash Sound Effect
var crash_sound;

var jump = false;

//current game difficulty
var current_difficulty = -1;
var ended_game = false;

var highscore = -1;

function bird_Drawing()
{
    //Losing animation
    if (hit)
    {
        if (bird_y + 15 <= window_size_y)
        {
            bird_y += velocity_y;
            
            if (angle < 90)
                angle += 5;
        }
        else
            end = true;
        
        bird_state = 1;
    }
    //Falling Down Animation
    else if (ticks <= -10)
    {
        //Bird Falling
        bird_y += down_force;
        down_force += down_force/40;
        
        if (ticks <= -10 && angle < 45)
            angle += 3;
        
        bird_state += 0.2;
        jump = false;
    }
    //Going Up
    else if (ticks >= 5)
    {
        //Bird Going Up
        if (bird_y > 0)
            bird_y -= velocity_y*3/8;
        
        if (angle > -45)
            angle -= 5;
        
        bird_state += 0.2;
    }
    //Inertia
    else
    {
        down_force = 1;
        
        //Momentum
        if (angle < 0)
            angle += 3;
        
        bird_state += 0.2;
    }
    
    push();
    angleMode(DEGREES);
    translate(bird_x, bird_y);
    imageMode(CENTER);
    rotate(angle);
    image(bird[Math.floor(bird_state % 3)], 0, 0, window_size_y/15.5, window_size_y/16.6);
    pop()
    ticks -= 1;
}

function pipesDrawing()
{
    //Pipes Drawing
    for (var i = 0; i < pipes_x.length; i++)
    {
        image(pipe_up, pipes_x[i], bot_pipe_y - bot_pipes_y[i] + window_size_y/2.7, window_size_y/6.6, pipe_size);
        image(pipe_down, pipes_x[i], top_pipes_y[i], window_size_y/6.6, pipe_size);
        
        if (!hit)
            pipes_x[i] -= velocity_x;
    }

    //Delete non showing pipes
    if (pipes_x[0] + window_size_y/6.6 < 0)
    {
        pipes_x.shift();
        bot_pipes_y.shift();
        top_pipes_y.shift();
    }

    //New Pipes Drawing
    if (window_size_x-pipes_x[pipes_x.length-1] > pipes_distance)
    {
        //Oscillation of the gap between pipes
        variation = Math.random()*window_size_y/5 - 50;
    
        //Place images on screen
        image(pipe_down, window_size_x, top_pipe_y + variation, window_size_y/6.6, pipe_size);
        image(pipe_up, window_size_x, bot_pipe_y - window_size_y/2.7 - variation + window_size_y/2.7, window_size_y/6.6, pipe_size);
    
        //Store the Oscillation
        top_pipes_y.push(top_pipe_y + variation);
        bot_pipes_y.push( window_size_y/2.7 - variation);

        pipes_x.push(window_size_x);
    }
}

function scoreBoard()
{
    if (pipes_x[0] >=  bird_x - velocity_x/2 && pipes_x[0] <=  bird_x + velocity_x/2 && score < 999)
    {
        score +=1;
        point_sound.play();
    }
    
    //Score board Drawing
    if (score < 10)
    {
        //Units
        image(score_images[score % 10], window_size_x*5/11, window_size_y/7, window_size_x/20, window_size_y/8);
    }
    else if (score < 100)
    {
        //Decimal Point
        image(score_images[Math.floor(score/10)], window_size_x*9/20, window_size_y/7, window_size_x/20, window_size_y/8);
        //Units
        image(score_images[score % 10], window_size_x*10/20, window_size_y/7, window_size_x/20, window_size_y/8);
    }
    else if (score < 1000)
    {
        //Hundredths
        image(score_images[Math.floor(score/100)], window_size_x*8/20, window_size_y/7, window_size_x/20, window_size_y/8);
        //Decimals
        image(score_images[Math.floor(score/10)%10], window_size_x*9/20, window_size_y/7, window_size_x/20, window_size_y/8);
        //Units
        image(score_images[score % 10], window_size_x*10/20, window_size_y/7, window_size_x/20, window_size_y/8);
    }
}

function colisionDetection()
{
    for (var i = 0; i < pipes_x.length; i++)
    {
        //Searches for colision on the ground, top and bot pipe
        if(collideRectCircle(pipes_x[i], top_pipes_y[i],  window_size_y/6.6, pipe_size, bird_x, bird_y, window_size_y/16.6) || 
            collideRectCircle(pipes_x[i], bot_pipe_y - bot_pipes_y[i] + window_size_y/2.7, window_size_y/6.6, pipe_size, bird_x, bird_y, window_size_y/16.6) || 
            bird_y + window_size_y/16.6 >= window_size_y)
        {
            hit = true;
            crash_sound.play();
            break;
        }
        //Only needs to search the closest pipes
        if(i > 2)
            break;
    }
}

function getVelocityFromDifficulty(user_difficulty)
{
    if (user_difficulty >= 0 && user_difficulty <= 20) return 1.5;
    if (user_difficulty >= 20 && user_difficulty <= 40) return 2.5;
    if (user_difficulty >= 40 && user_difficulty <= 60) return 3.5;
    if (user_difficulty >= 60 && user_difficulty <= 80) return 4.5;
    
    return 5.5;
}

function getStatistics()
{
    game_stats_socket.onmessage = function (event)
    {
        game_stats_socket.send('{"type" : "get_statistics", "game_name" : "Flappy Bird"}');
        
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
    game_stats_socket.send('{"type" : "send_score", "game_name" : "Flappy Bird", "score" : ' + score + '}');
    
    game_stats_socket.onmessage = function (event)
    {
        highscore = JSON.parse(event.data).highscore;
    }
}

function setup()
{
    //Create the game window 
    var cnv = createCanvas(windowWidth -5, windowHeight- 5);
    
    //Window_size
    window_size_x = windowWidth - 5;
    window_size_y = windowHeight - 5;
    //Pipes size
    pipe_size = window_size_y*1.1;
    
    //X and Y position of the bird
    bird_x = window_size_x/8;
    bird_y = window_size_y/2;
    
    //Position of the diferent pipes (top and bottom)
    pipes_x = [window_size_x];
    
    pipes_distance = window_size_x/4.8;
    
    //Starting Y position of the top pipes
    top_pipe_y = -window_size_y*3/4;
    
    //Starting Y position of the bottom pipes
    bot_pipe_y = window_size_y/1.5;
    
    //Y position of the multiple pipes on the top of the screen
    top_pipes_y = [top_pipe_y];
    
    //Y position of the multiple pipes on the bottom of the screen
    bot_pipes_y = [window_size_y/2.7];

    //Y Velocity
    velocity_y = window_size_x/100;
    
    //Down Force (Base Movement no Acellaration)
    down_force = window_size_y/200;
    
    //Load Sound effects
    jump_sound = loadSound('games/assets/flappyBird/jump.mp3');
    jump_sound.setVolume(0.1);
    point_sound = loadSound('games/assets/flappyBird/point.mp3')
    point_sound.setVolume(0.1);
    crash_sound = loadSound('games/assets/flappyBird/crash.mp3');
    crash_sound.setVolume(0.1);
    
    //Define the frame rate
    frameRate(60);
    
    //Load the diferent Images/Sprites
    bg = loadImage('games/assets/flappyBird/background-day.png');
    bird.push(loadImage("games/assets/flappyBird/yellowbird-downflap.png"));
    bird.push(loadImage('games/assets/flappyBird/yellowbird-midflap.png'));
    bird.push(loadImage("games/assets/flappyBird/yellowbird-upflap.png"));
    pipe_up = loadImage('games/assets/flappyBird/pipe-green-up.png');
    pipe_down = loadImage('games/assets/flappyBird/pipe-green-down.png');
    start_menu = loadImage('games/assets/flappyBird/message.png');
    game_over = loadImage('games/assets/flappyBird/gameover.png');
    score_images.push(loadImage('games/assets/flappyBird/0.png'));
    score_images.push(loadImage('games/assets/flappyBird/1.png'));
    score_images.push(loadImage('games/assets/flappyBird/2.png'));
    score_images.push(loadImage('games/assets/flappyBird/3.png'));
    score_images.push(loadImage('games/assets/flappyBird/4.png'));
    score_images.push(loadImage('games/assets/flappyBird/5.png'));
    score_images.push(loadImage('games/assets/flappyBird/6.png'));
    score_images.push(loadImage('games/assets/flappyBird/7.png'));
    score_images.push(loadImage('games/assets/flappyBird/8.png'));
    score_images.push(loadImage('games/assets/flappyBird/9.png'));
}

function draw()
{
    velocity_x = getVelocityFromDifficulty(current_difficulty);

    //On Going Game Screen
    if (start)
    {
        //Background Image
        background(bg);
        //Start Menu Image
        image(start_menu, window_size_x*7/16, window_size_y*1/8, window_size_x/8, window_size_y*6/12);

        var gameState = 'Start Game - Do the "' + localStorage.getItem("gesture_name") + "\" gesture!\nHighscore: " + highscore;

        var w = window_size_x*1/2;
        var h = window_size_y*1/8 + window_size_y*8/12;
        textSize(32);
        textAlign(CENTER);
        text(gameState, w, h);
    }
    //Starting Screen
    else
    {
        //Defines the background
        background(bg);
        
        //Draw Pipes
        pipesDrawing();
        
        //Draw Bird
        bird_Drawing();
        
        //Draw Score Board
        scoreBoard();
        
        if (!hit)
        {
            //Colision Detection
            colisionDetection();
            newDifficulty();
        }
        
        if (end)
        {
            if (!ended_game)
            {
                if (current_difficulty >= 5) current_difficulty -= 5;
                sendScore();
                ended_game = true;
            }
            
            //Game Over Image
            image(game_over, window_size_x*2/5, window_size_y*3/7, window_size_x/5, window_size_y/10);
        }
    }
}

function keyReceived()
{
    socket = new WebSocket('ws://localhost:8081');

	socket.onmessage = function(event)
    {
        key = JSON.parse(event.data).key;
        
        switch (key)
        {
            case "SPACE":
                key = 32;
                break;
            default:
                key = -1;
                break;
        }
        
        keyAction(key)
    }
}

function keyAction(key)
{
    //When game is opened (first time) and we hit space, game starts
    if (key == 32 && start)
    {
        hit = false;
        ticks = 0;
        start = false;
        jump = true;
    }
    //When space is pressed and game is on going, bird goes up)
    else if (key == 32 && !hit & !jump)
    {
        ticks = 20;
        jump = true;
        jump_sound.play();
    }
    //When space hist and game has ended -> restarts the game.
    else if (key == 32 && end)
    {
        ended_game = false;

        bird_x = window_size_x/8;
        bird_y = window_size_y/2;
        
        pipes_x = [window_size_x];
        
        top_pipes_y = [top_pipe_y];
        
        bot_pipes_y = [window_size_y/2.7];
        
        angle = 0;
        score = 0;
        down_force = 2;
        
        hit = false;
        ticks = 0;
        end = false;
    }
}

function killServer()
{
    socket.send('{"type" : "game_ended"}'); 
    socket.close();
    
    game_stats_socket.send('{"type" : "game_ended"}');
    game_stats_socket.close();
}
