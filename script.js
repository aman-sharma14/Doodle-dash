const canvas = document.getElementById('myCanvas');
const cwidth = canvas.width;
const cheight = canvas.height;
const ctx = canvas.getContext("2d");

const nameEl = document.getElementById('pname');
let name = nameEl.value;

const create = document.getElementById('create');
const join = document.getElementById('join');
const start = document.getElementById('start');
let roomip = document.getElementById('iRoom');
let room_val = roomip.value;


let canDraw = false;


let widthEl = document.getElementById('size')
let colorEl = document.getElementById('colour');
let buttonEl = document.getElementById('clear');

let width = widthEl.value
let color = colorEl.value

let msgSend = document.getElementById('msgSend')
let msgIp = document.getElementById('msgInput')


let drawing = false;


const socket = io();

document.addEventListener('mousedown',(a)=>{
    if (!canDraw) return;
    drawing = true;
    
    const coords = canvas.getBoundingClientRect();
    const x = a.clientX - coords.left;
    const y = a.clientY - coords.top;
    ctx.beginPath();

    socket.emit('startDrawing',{x,y});


})

document.addEventListener('mouseup',()=>{
    if (!canDraw) return;
    drawing = false;
    ctx.beginPath();
    socket.emit('stopDrawing');
    
})

document.addEventListener('mousemove',(a)=>{
    if (!canDraw || !drawing) return;

        const coords = canvas.getBoundingClientRect();
        const x = a.clientX - coords.left;
        const y = a.clientY - coords.top;
        
        socket.emit('draw',{x,y,width,color});

        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';

        ctx.lineTo(x,y);
        ctx.stroke();
        ctx.beginPath(); 
        ctx.moveTo(x,y);
    
})

widthEl.addEventListener('input',()=>{
    width = widthEl.value;
    
})

colorEl.addEventListener('input',()=>{
    color = colorEl.value;
    
})

nameEl.addEventListener('input',()=>{
    name = nameEl.value;
    
})

buttonEl.addEventListener('click',()=>{
    ctx.clearRect(0,0,cwidth,cheight);
    socket.emit('clearCanvas',{cwidth,cheight});
})

socket.on('startDrawing',({x,y})=>{
    ctx.beginPath();
    ctx.moveTo(x,y)
    
})

socket.on('draw',({x,y,width,color})=>{
    ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';

        ctx.lineTo(x,y);
        ctx.stroke();
        ctx.beginPath(); 
        ctx.moveTo(x,y);
})

socket.on('clearCanvas',()=>{
    ctx.clearRect(0,0,cwidth,cheight);
})

socket.on('stopDrawing',()=>{
    ctx.beginPath();
})

roomip.addEventListener('input',()=>{
    room_val = roomip.value;
})

create.addEventListener('click',()=>{
    name = nameEl.value
    if(name.trim() === ""){
        alert('Enter a Player Name')
    }
    else{
        console.log(name, "event sent")
        socket.emit('createRoom',name);
    }
    
})

socket.on('roomCreated',(roomID)=>{
    console.log(`Room created ${roomID}`)
    alert(`Room with ID: ${roomID} has been created successfully`);
    document.getElementById('intro').style.display = 'none'
    document.getElementById('roomid').innerText = roomID;
    document.getElementById('header').style.display = 'flex';
    document.getElementById('game').style.display = 'flex';
    document.getElementById('members').innerHTML += `<p class="memberID">${name}</p>`;
    
})




join.addEventListener('click',()=>{

    name = nameEl.value

    if(name.trim() === ""){

    alert('Enter a Player Name')

    }

    else{

    let roomID = document.getElementById('iRoom').value.trim();

    if (!roomID) {

        alert('Enter a Room ID');

        return;

    }

    socket.emit('joinRoom',{name, roomID});

    roomip.value = '';

    }

})

socket.on('roomJoined',(roomID)=>{
    alert(`You successfully joined Room: ${roomID}`);
    document.getElementById('intro').style.display = 'none'
    document.getElementById('roomid').innerText = roomID;
    document.getElementById('header').style.display = 'flex';
    document.getElementById('start').style.display = 'none';
    document.getElementById('game').style.display = 'flex';
    
    
})

socket.on('PlayerJoins',(sids)=>{
    document.getElementById('members').innerHTML = ``;
    sids.forEach(sid => {
        document.getElementById('members').innerHTML += `<p class="memberID">${sid}</p>`;
    });
})

socket.on('roomEr',()=>{
    alert('No such room exists')
})


document.getElementById('start').addEventListener('click',()=>{
    let roomID = document.getElementById('roomid').innerText;
    console.log(roomID);
    socket.emit('startGame');
    
})



let bclick = true;
function f1() {
    document.getElementById('msg').style.display = 'none';
    
    
}

let countdownInterval; // Declare the interval variable in the appropriate scope

function startCountdown() {
    let c = 10;
    document.getElementById('count').innerText = c;

    countdownInterval = setInterval(() => {
        c--;
        document.getElementById('count').innerText = c;

        if (c <= 0) {
            clearInterval(countdownInterval); // Clear the interval when it reaches zero
            f1(); // Call the f1 function to hide the message
            
        }
    }, 1000);
}

function blisten(flag) {
    const buttons = document.getElementsByClassName('word');

    Array.from(buttons).forEach((b) => {
        b.addEventListener('click', () => {
            clearInterval(countdownInterval);
            blick = false;
            b.style.color = 'red';
            let word  = b.innerText;
            b.innerHTML = `gdgyqy ${b.innerText} jhdqegy`
            console.log(b.innerText); 
            socket.emit('wordChosen', word);
            f1();
            timer(flag)
            document.getElementById('barWord').innerText = word

        });
    });
}

// socket.on('enableDraw', ({ drawe, nam, words }) => {
//     ctx.clearRect(0, 0, cwidth, cheight);
//     console.log(drawe);
//     console.log(socket.id);
//     console.log(String(socket.id) === String(drawe));
//     document.getElementById('chatMessages').innerHTML += `<div class="chatMsg" style='color: rgb(68, 0, 255);'>${nam} is drawing </div>`;

//     if (String(socket.id) === String(drawe)) {
//         canDraw = true;

//         document.getElementById('els').style.display = 'flex';
//         document.getElementById('msg').innerHTML = `<p>Choose a Word   <span id="count">10</span></p>
//                                                         <div id="msgB">
//                                                             <button class="word">${words[0]}</button>
//                                                             <button class="word">${words[1]}</button>
//                                                             <button class="word">${words[2]}</button>
//                                                         </div>`;
        
//         document.getElementById('msg').style.display = 'flex';
//         startCountdown();
//         blisten();
        

        

//         setTimeout(() => {
//             if(blick){
//                 f1();
//                 timer();
//                 clearInterval(countdownInterval);
//                 let word = words[Math.floor(Math.random()*4)];
//                 alert(word)
//                 socket.emit('wordChosen', word);
//                 document.getElementById('barWord').innerText = word

//             }
//         }, 11000);
//     } else {
//         canDraw = false;
//         document.getElementById('els').style.display = 'none';

//         document.getElementById('msg').innerHTML = `${nam} is drawing`;
//         document.getElementById('msg').style.display = 'flex';
        
//         if(!blick){timer(); f1();}    
//         setTimeout(() => {
//             if(blick){
//                 f1();
//                 timer();
//             }
//         }, 10000);
//     }


//     setTimeout(()=>{
        
//     })
// });


socket.on('enableDraw', ({ drawe, nam, words }) => {
    ctx.clearRect(0, 0, cwidth, cheight);
    console.log(drawe);
    console.log(socket.id);
    console.log(String(socket.id) === String(drawe));
    document.getElementById('chatMessages').innerHTML += `<div class="chatMsg" style='color: rgb(68, 0, 255);'>${nam} is drawing </div>`;

    if (String(socket.id) === String(drawe)) {
        canDraw = true;

        document.getElementById('els').style.display = 'flex';
        document.getElementById('msg').innerHTML = `<p>Choose a Word   <span id="count">10</span></p>
                                                                <div id="msgB">
                                                                    <button class="word">${words[0]}</button>
                                                                    <button class="word">${words[1]}</button>
                                                                    <button class="word">${words[2]}</button>
                                                                </div>`;
    
        document.getElementById('msg').style.display = 'flex';
        startCountdown();
        blisten(true);
        bclick = true; // Reset bclick to true

        setTimeout(() => {
            if(bclick){
                f1();
                timer(true);
                clearInterval(countdownInterval);
                let word = words[Math.floor(Math.random()*3)];
                
                socket.emit('wordChosen', word);
                document.getElementById('barWord').innerText = word
                bclick = false; // Update bclick to false
            }
        }, 11000);
    } else {
        canDraw = false;
        document.getElementById('els').style.display = 'none';

        document.getElementById('msg').innerHTML = `<p style='color: white; font-weight:700'>${nam} is choosing a word</p>`;
        document.getElementById('msg').style.display = 'flex';
        
        if(!bclick){timer(false); f1();}    
        setTimeout(() => {
            if(bclick){
                f1();
                timer(false);
                bclick = false; // Update bclick to false
            }
        }, 10000);
    }
});


socket.on('server_word',(s)=>{
    f1();
    document.getElementById('barWord').innerHTML = s
})



function msg(){
    let msg = msgIp.value
    console.log('sent')
    if(msg.trim()!= ""){
        
        socket.emit('msgInput',msg);
    }
    msgIp.value="";
}

msgSend.addEventListener('click',()=>{
    msg();
})

msgIp.addEventListener('keyup',(e)=>{
    if(e.key==='Enter'){
        msg();
    }
})

socket.on('chat',({nam,msg,flag,s})=>{
    if(flag){
        document.getElementById('chatMessages').innerHTML += `<div class="chatMsg" style='background-color: rgb(92, 255, 0);'>${nam} guessed the word</div>`;
        
        if(s!=""){
            document.getElementById('members').innerHTML = s;
        }
    
        
    }
    else{
        document.getElementById('chatMessages').innerHTML += `<div class="chatMsg">${nam}: ${msg}</div>`;
    }

    
})

function timer(flag){
    let c1 = 100;
    document.getElementById('timer').innerHTML = c1;

    timerInt = setInterval(() => {
        c1--;
        document.getElementById('timer').innerText = c1;

        if(flag){
            if(c1==60 || c1==40 || c1==20){
                
                socket.emit('display',c1);
            }
        }

        if (c1 <= 0) {
            clearInterval(timerInt); 
            document.getElementById('timer').innerHTML = "vdgfvhvrfgvrh fhf";

            console.log('Time up')
            socket.emit('over');
            
            
        }

        
    }, 1000);

}

socket.on('displayy',(s)=>{
    document.getElementById('barWord').innerHTML = s
})

socket.on('final',(s)=>{
    document.getElementById('msg').style.display = 'flex';
    document.getElementById('msg').innerHTML = s
})





