// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow ()
{
    // Create the browser window.
    mainWindow = new BrowserWindow(
    {
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Load the index.html of the app, which is login.html.
    mainWindow.loadFile('login.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function ()
    {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function ()
{
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin')
        app.quit();
})

app.on('activate', function ()
{
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null)
        createWindow();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const WebSocket = require('ws');

let gestures_mapping = {
    "action" : "SPACE"
}

// Estabelece um canal de comunicação com o jogo para lhe enviar qual a key
// escolhida pelo user. No início de um jogo é enviada uma mensagem por parte
// do jogo com o jogo a ser jogado e com um mapa das keys associadas a cada
// gesto
const gesture_recognition_socket = new WebSocket.Server({ port: 8080 });
const game_socket = new WebSocket.Server({ port: 8081 });
const game_stats_socket = new WebSocket.Server({ port: 8082 });
const statistics_socket = new WebSocket.Server({ port: 8083 });

statistics_socket.on('connection', statistics_socket =>
{
    console.log("Client connected on 8083.");
    
    game_stats_socket.on('connection', game_stats_socket =>
    {
        console.log("Client connected on 8082.");
    
        try
        {
            game_stats_socket.send('{"type" : "first_message"}');
        }
        catch(e) { console.log("ERROR: " + e); };
        
        statistics_socket.on('message', message =>
        {
            try
            {
                console.log("FOR GAME STATS SOCKET = " + message.toString());
                game_stats_socket.send(message.toString());
            }
            catch(e) { console.log("ERROR: " + e); };
        });
        
        game_stats_socket.on('message', message =>
        {
            try
            {
                console.log("FOR STATISTICS SOCKET = " + message.toString());
                statistics_socket.send(message.toString());
            }
            catch(e) { console.log("ERROR: " + e); };
        });
    });
});

gesture_recognition_socket.on('connection', gesture_recognition_socket =>
{
    console.log("Client connected on 8080.");

    game_socket.on('connection', game_socket =>
    {
        console.log("Client connected on 8081.");
    
        gesture_recognition_socket.on('message', message => 
        {
            obj = JSON.parse(message);

            try
            {
                var gesture = gestures_mapping[obj["gesture_recognized"]];
                
                console.log('FOR GAME SOCKET = {"type" : "gesture", "key" : "' + gesture + '"}');
                game_socket.send('{"type" : "gesture", "key" : "' + gesture + '"}');
            }
            catch(e) { console.log("ERROR: " + e); }
        });
    });
});
