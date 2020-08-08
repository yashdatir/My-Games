var chance = 0;
$(document).ready(function(){
    $("#rst").click(function(){
        reset();
    });
    $("#b1").click(function(){
        if($("#b1").val() === 'X' ||$("#b1").val() === 'O'){
            alert('Tile once choosen, cannot be manipulated!')
        }
        else{
            if(chance%2===0){
                $("#b1").val('O');
            }
            else{
                $("#b1").val('X');
            }
            chance++;
        }
        check();
    });
    $("#b2").click(function(){
        if($("#b2").val() === 'X' ||$("#b2").val() === 'O'){
            alert('Tile once choosen, cannot be manipulated!')
        }
        else{
            if(chance%2===0){
                $("#b2").val('O');
            }
            else{
                $("#b2").val('X');
            }
            chance++;
        }
        check();
    });
    $("#b3").click(function(){
        if($("#b3").val() === 'X' ||$("#b3").val() === 'O'){
            alert('Tile once choosen, cannot be manipulated!')
        }
        else{
            if(chance%2===0){
                $("#b3").val('O');
            }
            else{
                $("#b3").val('X');
            }
            chance++;
        }
        check();
    });
    $("#b4").click(function(){
        if($("#b4").val() === 'X' ||$("#b4").val() === 'O'){
            alert('Tile once choosen, cannot be manipulated!')
        }
        else{
            if(chance%2===0){
                $("#b4").val('O');
            }
            else{
                $("#b4").val('X');
            }
            chance++;
        }
        check();
    });
    $("#b5").click(function(){
        if($("#b5").val() === 'X' ||$("#b5").val() === 'O'){
            alert('Tile once choosen, cannot be manipulated!')
        }
        else{
            if(chance%2===0){
                $("#b5").val('O');
            }
            else{
                $("#b5").val('X');
            }
            chance++;
        }
        check();
    });
    $("#b6").click(function(){
        if($("#b6").val() === 'X' ||$("#b6").val() === 'O'){
            alert('Tile once choosen, cannot be manipulated!')
        }
        else{
            if(chance%2===0){
                $("#b6").val('O');
            }
            else{
                $("#b6").val('X');
            }
            chance++;
        }
        check();
    });
    $("#b7").click(function(){
        if($("#b7").val() === 'X' ||$("#b7").val() === 'O'){
            alert('Tile once choosen, cannot be manipulated!')
        }
        else{
            if(chance%2===0){
                $("#b7").val('O');
            }
            else{
                $("#b7").val('X');
            }
            chance++;
        }
        check();
    });
    $("#b8").click(function(){
        if($("#b8").val() === 'X' ||$("#b8").val() === 'O'){
            alert('Tile once choosen, cannot be manipulated!')
        }
        else{
            if(chance%2===0){
                $("#b8").val('O');
            }
            else{
                $("#b8").val('X');
            }
            chance++;
        }
        check();
    });
    $("#b9").click(function(){
        if($("#b9").val() === 'X' ||$("#b9").val() === 'O'){
            alert('Tile once choosen, cannot be manipulated!')
        }
        else{
            if(chance%2===0){
                $("#b9").val('O');
            }
            else{
                $("#b9").val('X');
            }
            chance++;
        }
        check();
    });
});
function check(){
if(chance%2){
    $("#chance").text('Player X plays next');
}
else{
    $("#chance").text('Player O plays next');
}
if($("#b1").val() === 'O' && $("#b2").val() === 'O' && $("#b3").val() === 'O' ||
   $("#b1").val() === 'O' && $("#b4").val() === 'O' && $("#b7").val() === 'O' ||
   $("#b1").val() === 'O' && $("#b5").val() === 'O' && $("#b9").val() === 'O' ||
   $("#b2").val() === 'O' && $("#b5").val() === 'O' && $("#b8").val() === 'O' ||
   $("#b3").val() === 'O' && $("#b6").val() === 'O' && $("#b9").val() === 'O' ||
   $("#b3").val() === 'O' && $("#b5").val() === 'O' && $("#b7").val() === 'O' ||
   $("#b4").val() === 'O' && $("#b5").val() === 'O' && $("#b6").val() === 'O' ||
   $("#b7").val() === 'O' && $("#b8").val() === 'O' && $("#b9").val() === 'O'){
           alert('O wins the game');
    }
else if($("#b1").val() === 'X' && $("#b2").val() === 'X' && $("#b3").val() === 'X' ||
    $("#b1").val() === 'X' && $("#b4").val() === 'X' && $("#b7").val() === 'X' ||
    $("#b1").val() === 'X' && $("#b5").val() === 'X' && $("#b9").val() === 'X' ||
    $("#b2").val() === 'X' && $("#b5").val() === 'X' && $("#b8").val() === 'X' ||
    $("#b3").val() === 'X' && $("#b6").val() === 'X' && $("#b9").val() === 'X' ||
    $("#b3").val() === 'X' && $("#b5").val() === 'X' && $("#b7").val() === 'X' ||
    $("#b4").val() === 'X' && $("#b5").val() === 'X' && $("#b6").val() === 'X' ||
    $("#b7").val() === 'X' && $("#b8").val() === 'X' && $("#b9").val() === 'X'){
            alert('X wins the game');
    }
else if($("#b1").val() !== '-' && $("#b2").val() !== '-' && $("#b3").val() !== '-' &&
        $("#b4").val() !== '-' && $("#b5").val() !== '-' && $("#b6").val() !== '-' &&
        $("#b7").val() !== '-' && $("#b8").val() !== '-' && $("#b9").val() !== '-'){
            alert('Match ends with no winner!');
}
}
function reset(){
    $("#chance").text('O starts the Game... Lets Play!');
    $("#b1").val('-');
    $("#b2").val('-');
    $("#b3").val('-');
    $("#b4").val('-');
    $("#b5").val('-');
    $("#b6").val('-');
    $("#b7").val('-');
    $("#b8").val('-');
    $("#b9").val('-');
    chance = 0;
}