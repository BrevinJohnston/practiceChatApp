const { strict } = require('assert');
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
let users = [];
let messageLog = [];
app.use(express.static(__dirname + '/public'));


function generateUserName(id){
  let newUsername = "user" + Math.floor(Math.random() * 100000);
  let newUser = {socketid: id, username: newUsername, color: "ffd700"};
  //users.push(newUser);
  //return newUser.username;
  return newUser;
}

function setUpNewUser(id){
  for(let i = 0; i < users.length; i++){
    io.to(id).emit('addToUserList', users[i].username);
    io.to(id).emit('change user color', users[i].username + '\t' + users[i].color) 
  }

  for(let i = 0; i < messageLog.length; i++){
    io.to(id).emit('chat message', messageLog[i]);
  }
}

function findUser(id){
  for(let i = 0; i < users.length; i++){
    if(users[i].socketid === id){
      return users[i];
    }
  }
}

function removeUser(id){
  for(let i = 0; i < users.length; i++){
    if(users[i].socketid === id){
      let temp = users[i].username;
      users.splice(i, 1);
      return temp;
    }
  }
}

function updateUsers(id, name){
  let found = 0;
  let replace = -1;
  for(let i = 0; i < users.length; i++){
    if(users[i].socketid === id){
      replace = i;
    }
    if(users[i].username === name){
      found += 1;
    }
  }
  
  if(found === 0 && users.length > 0){
    let temp = users[replace].username;
    users[replace].username = name;
    return temp;
  }
  if(found > 0){
    return false;
  }
}

function checkForUser(name){
  for(let i = 0; i < users.length; i++){
    if(users[i].username === name){
      return false;
    }
  }
  return true;
}

function isValidColor(color){
  let testHex = /[0-9A-F]{6}/i;
  return testHex.test(color);
}

function checkForEmoji(msg){
  let words = msg.split(" ");
  for(let i = 0; i < words.length; i++){
    if(words[i] === ":)"){
      words[i] = "<img src='https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/209/grinning-face_1f600.png' width='21' height='21'>";
    }
    else if(words[i] === ":("){
      words[i] = "<img src='https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/209/slightly-frowning-face_1f641.png' width='21' height='21'>";
    }
    else if (words[i] === ":O"){
      words[i] = "<img src='https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/209/astonished-face_1f632.png' width='21' height='21'>";
    }
  }
  return words.join(" ");
}

io.on('connection', (socket) => {
    console.log('a user connected');
    setUpNewUser(socket.id);
    io.to(socket.id).emit('are you new', null);
    //newUsername = generateUserName(socket.id);
    //io.to(socket.id).emit('username', newUsername);
    //socket.broadcast.emit('addToUserList', newUsername);

    socket.on('disconnect', () => {
        console.log('user disconnected');
        let toRemove = removeUser(socket.id);
        io.to(socket.id).emit('make cookie', toRemove);
        io.emit('removeFromUserList', toRemove);
      });

      socket.on('returning user', (msg) => {
        let temp = msg.split("\t");
        let valid = checkForUser(temp[0]);
        if(!valid){
          let newUser = generateUserName(socket.id);
          newUser.color = msg[1];
          users.push(newUser);
          let date = new Date();
          let errmessage = (date.getHours() < 10 ? '0' : '') + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') 
                          + date.getMinutes() + " - " + "SERVER:Username is already taken assigning random username";
          io.to(socket.id).emit('reject', errmessage);
          io.to(socket.id).emit('username', newUser.username);
          socket.broadcast.emit('addToUserList', newUser.username);
          io.emit('change user color', newUser.username + "\t" + newUser.color);
        }
        else{
          let newUser = {socketid: socket.id, username: temp[0], color: temp[1]};
          users.push(newUser);
          io.to(socket.id).emit('username', newUser.username);
          socket.broadcast.emit('addToUserList', newUser.username);
          io.emit('change user color', newUser.username + "\t" + newUser.color);
        }
      });

      socket.on('new user', (msg) => {
        let newUser = generateUserName(socket.id);
        io.to(socket.id).emit('username', newUser.name);
        socket.broadcast.emit('addToUserList', newUser.name);
      });

    socket.on('chat message', (msg) => {
        let temp = msg.split(": ");
        let user = findUser(socket.id);
        if(temp[1].includes("/" + user.username)){
          let newName = temp[1].split(" ");
          let valid = updateUsers(socket.id, newName[1]);
          if(valid){
            let change = valid + "\t" + newName[1];
            io.emit('change username', change);
          }
          else{
            let date = new Date();
            let errmessage = (date.getHours() < 10 ? '0' : '') + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') 
                            + date.getMinutes() + " - " + "SERVER:Username is already taken ";
            io.to(socket.id).emit('reject', errmessage);
          }
        }
        else if(temp[1].includes("/color")){
          let newColor = temp[1].split(" ");
          if(isValidColor(newColor[1])){
            user.color = newColor[1];
            io.emit('change user color', user.username + "\t" + newColor[1]);
          }
          else{
            let date = new Date();
            let errmessage = (date.getHours() < 10 ? '0' : '') + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') 
                            + date.getMinutes() + " - " + "SERVER:Color must be represetned as a hexidecimal number in this format RRGGBB";
            io.to(socket.id).emit('reject', errmessage);
          }
        }
        else if(temp[1].substring(0, 1) === "/"){
          let date = new Date();
          let errmessage = (date.getHours() < 10 ? '0' : '') + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') 
                            + date.getMinutes() + " - " + "SERVER: Invalid comand option";
          io.to(socket.id).emit('reject', errmessage);
        }
        else{
          let date = new Date();
          let emoji = checkForEmoji(msg);
          let message = (date.getHours() < 10 ? '0' : '') + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + " - " + emoji;
          messageLog.push(message);
          if(messageLog.length > 200){
            messageLog.shift();
          }
          io.emit('chat message', message);
        }        
    });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});