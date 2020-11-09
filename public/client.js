let userName = '';
let myColour = 'ffd700';
let myStorage = window.localStorage;
window.addEventListener('load', main)
function updateScroll(){
    $("#messageArea").scrollTop($("#messageArea")[0].scrollHeight);
}

$(function () {
    var socket = io();
    $('#chatForm').submit(function(e){
        e.preventDefault(); // prevents page reloading
        let theMessage = userName + ": " + $('#m').val();
        socket.emit('chat message', theMessage);
        $('#m').val('');
        return false;
    });

    socket.on('are you new', function(msg){
        if(myStorage.getItem('username') === null){
            socket.emit('new user', null);
        }
        else{
            socket.emit('returning user', myStorage.getItem('username') + '\t' + myStorage.getItem('color'));
        }
    });

    socket.on('chat message', function(msg){
        let tempString = msg.split(": ");
        let data = tempString[0].split(" - ");
        let color = myColour;
        if(tempString[0].includes(userName) && userName != ''){
            //$('#messages').append($('<li>').html(`<b>${msg}</b>`));
            let newEntry = `<li class=${data[1]} style='background: #${color}'><b>${msg}</b></li>`
            $('#messages').append(newEntry);
        }
        else{
            if(data[1] !== "SERVER"){
                color = $(`#${data[1]}`).attr("data-color");
            } 
            //$('#messages').append($('<li>').html(msg));
            let newEntry = `<li class=${data[1]} style='background: #${color}'>${msg}</li>`
            $('#messages').append(newEntry);
        }

        while($('#messages li').length > 200){
            $('#messages li').first().remove();
        }
        updateScroll();
    });

    socket.on('username', function(name){
        userName = name;
        $('#user').html(userName);
    });

    socket.on('addToUserList', function(name){
        //const newEntry = document.createElement("li");
        let newEntry = `<li id=${name} data-color='ffd700'>${name}</li>`
        $('#usersList').append(newEntry);
    });

    socket.on('removeFromUserList', function(name){
        $(`#${name}`).remove();
    });

    socket.on('change username', function(msg){
        let change = msg.split("\t");
        if(change[0] != userName){
            let usersColor = $(`#${change[0]}`).attr('data-color');
            $(`#${change[0]}`).remove();
            let newEntry = `<li id=${change[1]} data-color='${usersColor}'>${change[1]}</li>`
            $('#usersList').append(newEntry);
        }
        else{
            userName = change[1];
            myStorage.setItem('username', change[1]);
            $('#user').html(userName);
        }
        
    });

    socket.on('change user color', function(msg){
        let change = msg.split("\t");
        if(change[0] === userName){
            myColour = change[1];
            if(change[0] === myStorage.getItem('username')){
                myStorage.setItem('color', change[1]);
            }
        }
        else{
            $(`#${change[0]}`).attr('data-color', change[1]);
        }
        $(`.${change[0]}`).css('background', `#${change[1]}`);
        
    });

    socket.on('reject', function(msg){
        $('#messages').append($('<li>').html(`<b><u>${msg}</u></b>`));
        updateScroll();
    });

});


function main(){
    
}