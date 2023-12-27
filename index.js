import { createServer } from "http";
import http from "http"
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "https://choitet.web.app/",
    methods: ["GET", "POST"],
  },
});
const rooms = {};
function generateRoomCode(){
    const randomNumber = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    const randomString = randomNumber.toString();
    return randomString
}



io.on("connection", (socket) => {
  
  console.log("Newconnection", socket.id)
  socket.on('disconnect', () => {
    console.log('🔥: A user disconnected');
  })
  socket.on('create room',(player)=>{
    let roomCode = generateRoomCode()
    while(rooms[roomCode]){
        roomCode = generateRoomCode()
    }
    rooms[roomCode] = { id: '', player: [], messages:[] };
    rooms[roomCode].player.push(player);
    rooms[roomCode].id = roomCode
    console.log(rooms[roomCode])
    socket.join(roomCode);
    socket.emit('room created', rooms[roomCode]);
    console.log('created')
   
  })
  socket.on('join room',({roomCode, player})=>{
    if (rooms[roomCode]) {
        rooms[roomCode].player.push(player);
        socket.emit('joined',rooms[roomCode])
        io.to(roomCode).emit('player joined',rooms[roomCode]);
        socket.join(roomCode);
        console.log("join room ", rooms[roomCode])
      } else {
        console.log(roomCode)
    
        socket.emit('room not found', roomCode);
      }
  })
  socket.on('send message', ({message, roomCode})=>{
    console.log(roomCode)
    console.log(rooms[roomCode])
    rooms[roomCode].messages.push(message)
    io.to(roomCode).emit('get message', rooms[roomCode].messages);

  })
  socket.on('leave room', ({ roomCode, player }) => {
    if (rooms[roomCode]) {
      console.log(rooms[roomCode])
      // Loại bỏ người chơi khỏi mảng players của phòng
  
      rooms[roomCode].player = rooms[roomCode].player.filter((p) => p.id !== player.id);

     
      // Kiểm tra xem phòng còn người chơi hay không
      if (rooms[roomCode].player.length === 0) {
        // Phòng không còn người chơi, xóa phòng khỏi danh sách
        delete rooms[roomCode];
      } else {
        // Còn người chơi, thông báo cho tất cả người chơi khác về việc người chơi đã rời phòng
        socket.broadcast.emit('player left', rooms[roomCode].player);
      }
  
      // Thông báo cho người chơi đã rời phòng
      socket.leave(roomCode);
      socket.emit('room left', roomCode);
      console.log('leave')
      console.log(rooms[roomCode])
    } else {
      // Phòng không tồn tại
      socket.emit('room not found', roomCode);
    }
  });
  
});

io.listen(3000);