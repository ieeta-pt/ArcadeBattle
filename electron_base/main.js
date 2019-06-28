// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const WebSocket = require('ws')

let gestures_mapping = {
    "closed_hand_left" : "SPACE_left",
    "closed_hand_right" : "SPACE_right"
}

// Estabelece um canal de comunicação com o jogo para lhe enviar qual a key
// escolhida pelo user. No início de um jogo é enviada uma mensagem por parte
// do jogo com o jogo a ser jogado e com um mapa das keys associadas a cada
// gesto
const game_socket = new WebSocket.Server({ port: 8081 })
game_socket.on('connection', game_socket => {
  console.log("Client connected")
  // Estabelece um canal de comunicação com o reconhecimento de gestos para que
  // este, ao reconhecer um gesto por parte do utilizador, possa enviar qual o
  // gesto que reconheceu.
  //setTimeout(function(){  game_socket.send('{"key" : "SPACE"}');}, 3000);
  const gesture_recognition_socket = new WebSocket.Server({ port: 8080 })
  gesture_recognition_socket.on('connection', gesture_recognition_socket => {
    console.log("Client connected")
    gesture_recognition_socket.on('message', message => {
      // mesage of type '{"gesture_recognized" : ""}'
      obj = JSON.parse(message);
      try {
          game_socket.send('{"key" : "'+gestures_mapping[obj["gesture_recognized"]]+'"}');
      } catch(e) {console.log(e)}
      //console.log(obj);
    })
  })
  game_socket.on('message', message => {
    // message of type '{"game" : "", "key2gest" : {"A" : "2 fingers up" , ... }}'
    obj = JSON.parse(message);
    console.log(obj);
  })
  // mesage of type '{"key" : ""}'
  //setTimeout(function(){  game_socket.send('{"key" : "SPACE"}');}, 3000)
  //setTimeout(function(){  game_socket.send('{"key" : "A"}');}, 6000)
  //setTimeout(function(){  game_socket.send('{"key" : "SPACE"}');}, 9000)
  //setTimeout(function(){  game_socket.send('{"key" : "B"}');}, 12000)
  //setTimeout(function(){  game_socket.send('{"key" : "SPACE"}');}, 15000)
  //setTimeout(function(){  game_socket.send('{"key" : "X"}');}, 18000)
  //setTimeout(function(){  game_socket.send('{"key" : "SPACE"}');}, 21000)
  //setTimeout(function(){  game_socket.send('{"key" : "SPACE"}');}, 24000)
})





////////////////////////////////////////////////////////////
////////// FALTA PEDIDO À REST API PARA IR BUSCAR //////////
///////// AS KEYS ASSOCIADAS AO JOGO DESTE USER  /////////// 
////////////////////////////////////////////////////////////
