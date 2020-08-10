console.log('JS');
var canvas;
var canvasContext;
var ballX = 50;
var ballSpeedX = 10;
var ballY = 10;
var ballSpeedY = 4;
var paddle1Y = 50;
var paddle2Y = 50;
const PADDLE_THICKNESS = 10;
const PADDLE_HEIGHT = 100;
const CORRECTION_VALUE = 7;
var player1 = 0;
var player2 = 0;

function calculateMousePosition(event){
    var rect = canvas.getBoundingClientRect();
    var root = document.documentElement;
    var mouseX = event.clientX - rect.left - root.scrollLeft;
    var mouseY = event.clientY - rect.top - root.scrollTop;
    return {
        x: mouseX,
        y: mouseY
    };
}

function computerMovement(){
    var paddle2YCenter = paddle2Y + (PADDLE_HEIGHT/2)
    if(paddle2YCenter < ballY - 35){
        paddle2Y += CORRECTION_VALUE;
    }
    else if(paddle2YCenter > ballY + 35){
        paddle2Y -= CORRECTION_VALUE;
    }
}

function drawNet(){
    for(var i=0; i < canvas.height; i += 40){
        colorRect((canvas.width/2 - 1), i, 2, 20, 'white' )
    }
}

window.onload = function(){
    canvas = document.getElementById('gameCanvas');
    canvasContext = canvas.getContext('2d');
    var frames = 30;
    console.log('here');
    setInterval(function(){
        move();
        drawGame();
        drawNet();
    }, 1000/frames);
    canvas.addEventListener('mousemove', function(event){
        var mousePos = calculateMousePosition(event);
        paddle1Y = mousePos.y - (PADDLE_HEIGHT/2);
    })
}
function ballReset(){
    ballSpeedX = -ballSpeedX;
    ballX = canvas.width/2;
    ballY = canvas.height/2;
}
function move(){
    computerMovement();
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    if(ballX < 0){
        if(ballY > paddle1Y && ballY < (paddle1Y + PADDLE_HEIGHT)){
            var deltaY = ballY - (paddle1Y + PADDLE_HEIGHT/2);
            ballSpeedY = deltaY * 0.35;
            ballSpeedX = -ballSpeedX;
        }
        else{
            ballReset();
            player2 += 1;
        }
    }
    if(ballX > canvas.width){
        if(ballY > paddle2Y && ballY < (paddle2Y + PADDLE_HEIGHT)){
            var deltaY = ballY - (paddle2Y + PADDLE_HEIGHT/2);
            ballSpeedY = deltaY * 0.35;
            ballSpeedX = -ballSpeedX;
        }
        else{
            ballReset();
            player1 += 1;
        }
    }

    if(ballY < 0){
        ballSpeedY = -ballSpeedY;
    }
    if(ballY > canvas.height){
        ballSpeedY = -ballSpeedY;
    }
}
function drawGame(){
    colorRect(0, 0, canvas.width, canvas.height, 'black');
    colorRect(0, paddle1Y, PADDLE_THICKNESS, PADDLE_HEIGHT, 'white');
    colorRect((canvas.width - PADDLE_THICKNESS), paddle2Y, PADDLE_THICKNESS, PADDLE_HEIGHT, 'white');
    colorCircle(ballX, ballY, PADDLE_THICKNESS, 'white');
    canvasContext.fillText(player1, 100, 100);
    canvasContext.fillText(player2, canvas.width - 150, 100);
}
function colorCircle(centerX, centerY, radius, drawColor){
    canvasContext.fillStyle = drawColor;
    canvasContext.beginPath();
    canvasContext.arc(centerX, centerY, radius, 0, Math.PI*2, true);
    canvasContext.fill();
}
function colorRect(LeftX, TopY, width, height, drawColor){
    canvasContext.fillStyle = drawColor;
    canvasContext.fillRect(LeftX, TopY, width, height);
}