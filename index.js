import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import { promises as fs } from 'fs';


let wordList = [];
let points = []; //each round's points
let total = [];
let guessed=[];

let temp=""

const processWordList = async () => {
  try {
    const data = await fs.readFile('words.txt', 'utf8');
    wordList = data
      .split(/[,\n]+/)
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    console.log('Word list processed');
  } catch (err) {
    console.error('Error reading the file:', err);
  }
};

await processWordList();
console.log(wordList[1], wordList.length);
let len = wordList.length

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

let socket_rooms = {};
let db = {};
let chosenWord;
let orders = [];
let p = 0

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'canvas.html'));
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}


function roomMembers(roomID){
    let ids = Array.from(io.sockets.adapter.rooms.get(roomID));
    let names = [];

    ids.forEach((id)=>{
      names.push((db[id].name));
    })

    return names;
 }

const roomList = () => {
  const rooms = io.sockets.adapter.rooms; // Get all rooms (which includes socket IDs)
  const sids = io.sockets.adapter.sids;   // Get all individual socket IDs
  const roomsList = [];

  // Iterate over all rooms
  rooms.forEach((_, roomID) => {
    // Check if the roomID is not in the sids (i.e., it's not a socket ID)
    if (!sids.has(roomID)) {
      roomsList.push(roomID);  // Add actual room IDs to roomsList
    }
  });
  console.log(roomsList);
  return roomsList;  // Return only room IDs, not socket IDs
};




io.on('connection', (socket) => {

    console.log(`a user connected with id ${socket.id}`);

    //create room
      socket.on('createRoom',(name)=>{
        const room_ID = Math.random().toString(36).substring(2, 7);
  
        socket.join(room_ID);

        socket_rooms[socket.id]= room_ID;
        db[socket.id] = {'name':name, 'room': room_ID};
        points[room_ID] = []
        total[room_ID] = []
        

        console.log(socket_rooms)
        console.log(db);
  
        socket.emit('roomCreated',room_ID);
  
      })
  
  
      //join room
      socket.on('joinRoom',({name,roomID})=>{
        let rooms = roomList();
        console.log(typeof rooms[0]);
        console.log(typeof String(roomID));
        console.log(rooms[0]);
        console.log(rooms[0]===roomID, rooms[0]==roomID)
        console.log(rooms.includes(roomID));
        
        if(rooms.map(room => room.toLowerCase()).includes(roomID.toLowerCase())){
          socket.emit('roomJoined',roomID);
          socket.join(roomID)
          socket_rooms[socket.id] = roomID;
          db[socket.id] = {'name':name, 'room': roomID};
          

          console.log(socket_rooms)
          io.to(roomID).emit('PlayerJoins',roomMembers(roomID));
        }
        else{
          socket.emit('roomEr');
        }
      })


    socket.on('startDrawing', ({x, y}) => {
        const roomID = socket_rooms[socket.id];
        
        
        socket.to(roomID).emit('startDrawing', {x, y});
        
    });
    

    socket.on('stopDrawing', () => {
        const roomID = socket_rooms[socket.id];
        socket.to(roomID).emit('stopDrawing');
        
    });
    
    socket.on('draw', ({x, y, width, color}) => {
            const roomID = socket_rooms[socket.id];
        
        
            socket.to(roomID).emit('draw', {x, y, width, color});
        
    });
    
    socket.on('clearCanvas', () => {
        const roomID = socket_rooms[socket.id];
       
        
            socket.to(roomID).emit('clearCanvas');
        
    });
    

    socket.on('startGame',()=>{
        const roomID = socket_rooms[socket.id];
        orders[roomID]  =  shuffle(Array.from(io.sockets.adapter.rooms.get(roomID)))
        let drawe = orders[roomID][p]
        console.log(drawe);
        let nam = db[drawe].name;
        console.log(nam)

        let words = [];
        for(let i=0; i<3;i++){
          words.push(wordList[Math.floor(Math.random() * (len+1))])
        }

        Array.from(io.sockets.adapter.rooms.get(roomID)).forEach((sid)=>{
          points[roomID][sid] = 0
          total[roomID][sid] = 0
          
        })
        


        
        

        io.to(roomID).emit('enableDraw', { drawe, nam ,words});

        
        
      
        
        
    })



    socket.on('wordChosen',(word)=>{
      const roomID = socket_rooms[socket.id];
      chosenWord = word;
      temp = word
        console.log(chosenWord);
        let s = ""

        for(let i = 0; i<word.length; i++){
          s += '_ '
        }

        s+= ` <sub><small>${word.length}</small></sub>`;

        socket.to(roomID).emit('server_word',s);



        
    })

    socket.on('msgInput',(msg)=>{
      let s =""
      console.log(msg,msg == chosenWord)
      const roomID = socket_rooms[socket.id];
      let nam = db[socket.id].name;
      let flag
      let point=0;
      let members = Array.from(io.sockets.adapter.rooms.get(roomID))
      if(msg == chosenWord){
        flag = true;
        if(!guessed.includes(socket.id)){
          guessed.push(socket.id);
          console.log(guessed)
          if(guessed.indexOf(String(socket.id))<3){
            console.log(guessed.indexOf(socket.id))
            point = 200 - (guessed.indexOf(socket.id)*50)
            console.log(point)
            points[roomID][socket.id] = point
            total[roomID][socket.id] += point
            console.log(points[roomID][socket.id] , total[roomID][socket.id])
            
            
          }
          else{
            point = 50;
            points[socket.id] = 50;
            total[roomID][socket.id] += point
          }

          members.forEach((sid)=>{
            s+= `<p class="memberID">${db[sid].name}    ${total[roomID][sid]}</p>`
            console.log(points[roomID][sid], total[roomID][sid])
          })
        }
        
      }
      else{
        flag=false
      }
      io.to(roomID).emit('chat', { nam, msg, flag, s});
      
    })
    
    socket.on('display',(c1)=>{
      let s = ""
      let roomID = socket_rooms[socket.id]
      if(c1==60){
        for(let i = 0; i<chosenWord.length; i++){
          if(i==0){
            s = s+chosenWord.charAt(i)+" "
          }
          else{
            s += '_ '
          }
        }

        s+= ` <sub><small>${chosenWord.length}</small></sub>`;
        temp = s
      }

      socket.to(roomID).emit('displayy',{s})
    })

    socket.on('over',()=>{
          let s= ""
          let roomID = socket_rooms[socket.id];
          const sorted= Object.entries(total[roomID]).sort(([, pointsA], [, pointsB]) => pointsB - pointsA);

          sorted.forEach(([sid, points]) => {
                if (db[sid]) {
                  s += `<p>${db[sid].name} ${points}</p>`;
                }

              socket.emit('final',s)


          })
      });



})



server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});



