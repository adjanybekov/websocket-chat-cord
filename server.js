const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const formatMessage = require('./utils/messages');
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require('./utils/users');

const { Socket } = require('dgram');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder

app.use(express.static(path.join(__dirname,'public')));

const botName = 'Chatcord bot';
//Run when client connects
io.on('connection',socket=>{
    socket.on('joinRoom',({username,room})=>{
        const user = userJoin(socket.id, username, room)

        socket.join(user.room);

        //Welcome current user
        socket.emit('message',formatMessage(botName,'Welcome to the ChatCord') );

        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessage(botName,`${user.username} has joined the chat`));

        //Send users and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        })
    });

    // console.log('New WS Cosnnnection');
    
    //Runs when client disconnects
    socket.on('disconnect',()=>{
        const user =userLeave(socket.id);
        //remove user from the array    
        if(user){
            io.to(user.room).emit('message',
            formatMessage(botName,`${user.username} has left a chat`));
            //Send users and room info
            io.to(user.room).emit('roomUsers',{
                room:user.room,
                users:getRoomUsers(user.room)
            })
        }   
              
    });

    //listen for chat message
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message',formatMessage(user.username,msg));
    })
})
const PORT = 3000 || process.env.PORT;
server.listen(PORT,()=>console.log(`Server runnning on port ${PORT}`));