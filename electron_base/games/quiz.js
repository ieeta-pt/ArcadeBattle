var socket = new WebSocket('ws://localhost:8081');
var w = 700
var h = 500
var font_size = 20
var all_questions = []
var current_question = -1
var flag = -1
var check_val = ""
var score = 0;

function setup()
{
    createCanvas(w,h);
    textSize(font_size);
    background(224, 236, 255);
    img = loadImage("images/quiz_initial.png");
    start_btn = loadImage('images/start_button.png');
    a_btn = loadImage('images/A_option.png');
    b_btn = loadImage('images/B_option.png');
    x_btn = loadImage('images/X_option.png');
    y_btn = loadImage('images/Y_option.png');
    thank_you = loadImage('images/thank_you.png');
    reset();
}

function draw()
{
    if (flag == -1)
    {
        background(224, 236, 255);
        imageMode(CENTER);
        image(img,w/2,h/3);
        image(start_btn, w/2, h*5/7, 300,100);
        textAlign(CENTER);
        text("[PRESS SPACE]", w*0.5, h*14/15);
    }
    else if (flag == 0)
    {
        background(224, 236, 255);
        all_questions[current_question].display_question();
    }
    else if (flag == 1)
    {
        fill(65, 219, 78);
        rect((w-400)/2, (h-200)/2, 400, 200);
        fill(0,0,0);
        textAlign(CENTER,CENTER);
        textSize(20);
        text(check_val, w*0.5, h*0.5);
        text("[PRESS SPACE]", w*0.5, 325);
    }
    else if (flag == 2)
    {
        fill(249, 47, 57);
        rect((w-400)/2, (h-200)/2, 400, 200);
        fill(0,0,0);
        textAlign(CENTER,CENTER);
        textSize(20);
        text(check_val, w*0.5, h*0.5);
        text("[PRESS SPACE]", w*0.5, 325);
    }
    else
    {
        var msg = {
            score: score
        }
        
        socket.send(JSON.stringify(msg));
        
        background(224, 236, 255);
        imageMode(CENTER);
        image(thank_you, w/2, h/2, 700, 500);
    }
}

function reset()
{
    var q1 = new Question("Biggest number ?", ["10" , "20"], "20")
    var q2 = new Question("1+1 ?", ["1", "2", "3"], "2")
    var q3 = new Question("4*2 ?", ["16" , "8", "6", "2"], "8")
    
    all_questions.push(q1)
    all_questions.push(q2)
    all_questions.push(q3)
}

function keyReceived()
{
	socket.onmessage = function(event)
    {
        key = JSON.parse(event.data).key;
        
        switch (key)
        {
            case "SPACE":
                keyCode = 32;
                break;
            case "A":
                keyCode = 65;
                break;
            case "B":
                keyCode = 66;
                break;
            case "X":
                keyCode = 88;
                break;
            case "Y":
                keyCode = 89;
                break;
        }
        
        simulateKey(keyCode)
    }
}

function simulateKey(keyCode)
{
    if ((flag == -1 || flag == 1 || flag == 2) && keyCode == 32)
    {
        flag = 0;
        current_question++;
    }
    
    if (flag == 3 && keyCode == 32)
    {
        all_questions = []
        current_question = -1
        reset();
        flag = -1;
        
        return;
    }

    if (current_question >= all_questions.length)
        flag = 3;

    if (flag == 0 && (keyCode == 65 || keyCode == 66 || keyCode == 88 || keyCode == 89)) //A,B,X,Y
    {
        q = all_questions[current_question];
        
        if (keyCode == 65 && q.answers.length >= 1)
            checkAnswer(0,q);
        else if (keyCode == 66 && q.answers.length >= 2)
            checkAnswer(1,q);
        else if (keyCode == 88 && q.answers.length >= 3)
            checkAnswer(2,q);
        else
            if (q.answers.length >= 4)
                checkAnswer(3,q);
    }
}

function checkAnswer(position, question)
{
    if (question.answers[position] == question.correct_one)
    {
        //correct answer
        check_val = "CORRRECT :)";
        flag = 1;
        score++;
    }
    else
    {
        //incorrect answer
        check_val = "INCORRECT! :(\nThe correct answer is : \""+ question.correct_one +"\"";
        flag = 2;
    }
}

class Question
{
    constructor(q, answers, correct_one)
    {
        this.q = q;
        this.answers = shuffle(answers);
        this.correct_one = correct_one;
    }

    //random shuffle of given answers
    shuffle(a)
    {
        var j, x, i;
        
        for (i = a.length - 1; i > 0; i--)
        {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        
        return a;
    }

    //display question and answers on screen
    display_question()
    {
        height = 80
        textSize(40);
        textAlign(CENTER);
        text(this.q, w*0.5, height);
        
        for (var i = 0; i < this.answers.length; i++)
        {
            if (i == 0)
            {
                imageMode(CENTER);
                image(a_btn, w/2, height * (i+2), 50, 50);
                text(this.answers[i], w/2 + 60, height * (i+2) + 15);
            }
            else if(i == 1)
            {
                imageMode(CENTER);
                image(b_btn, w/2, height * (i+2), 50, 50);
                text(this.answers[i], w/2 + 60, height * (i+2) + 15);
            }
            else if(i == 2)
            {
                imageMode(CENTER);
                image(x_btn, w/2, height * (i+2), 50, 50);
                text(this.answers[i], w/2 + 60, height * (i+2) + 15);
            }
            else if(i == 3)
            {
                imageMode(CENTER);
                image(y_btn, w/2, height * (i+2), 50, 50);
                text(this.answers[i], w/2 + 60, height * (i+2) + 15);
            }
        }
    }
  
}