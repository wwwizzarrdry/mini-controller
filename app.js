const windowStateKeeper = require('electron-window-state');
const {app, ipcMain, BrowserWindow} = require('electron');
const { Router } = require('electron-routes');
const _app = new Router('roonapi');


  // Splash screen
  let splash 
  function createSplash() {
      // Show the splash screen
      splash = new BrowserWindow({
          'node-integration': true,
          position: "center",
          width: 150, 
          height: 150, 
          show: false,
          frame: false,  
          movable: false,
          alwaysOnTop: true,
          transparent: true,
          resizeable: false,
          skipTaskbar: true,
          maximizable: false,
          minimizable: false
        });
        splash.loadFile('splash.html')
        splash.show();
        //splash.webContents.openDevTools()
        //--enable-transparent-visuals --disable-gpu
        setTimeout(function(){
            createWindow()
        },2500)
  }

  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  let win
  function createWindow () {
    // Load the previous state with fallback to defaults
    let mainWindowState = windowStateKeeper({
        defaultWidth: 415,
        defaultHeight: 415
    });

    // Create the window using the state information
    win = new BrowserWindow({
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': 415, //mainWindowState.width,
        'height': 415, //mainWindowState.height,
        'node-integration': true,
        overlayScrollbars: true,
        show: false,
        transparent: true,
        frame: false
    });

    // Let us register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state
    mainWindowState.manage(win);

    // Close the splash screen
    splash.close();

    // and load the index.html of the app.
    win.loadFile('fab.html')
    win.show();
    init();
  
    // Open the DevTools.
    win.webContents.openDevTools();
  
    // Emitted when the window is closed.
    win.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win = null
    });
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', function(){
      createSplash();

        // Listen for async message from renderer process
        var socket = ipcMain;
        socket.on('connection', (event, arg) => {

            // Send async message to renderer process
            win.webContents.send('hello', arg);

            // Send Data to Client
            sendData("pairStatus", JSON.parse('{"pairEnabled": ' + pairStatus + '}'));

            socket.on('getZone', function(){
                sendData("zoneStatus", zoneStatus);
            });

            socket.on('changeVolume', function(event, data) {
                transport.change_volume(data.output_id, "absolute", data.volume);
            });

            socket.on('changeSetting', function(event, data) {
                var settings = [];

                if (msg.setting == "shuffle") {
                    settings.shuffle = msg.value;
                } else if (msg.setting == "auto_radio") {
                    settings.auto_radio = msg.value;
                } else if (msg.setting == "loop") {
                    settings.loop = msg.value;
                }

                transport.change_settings(msg.zone_id, settings, function(error){
                });
            });

            socket.on('goPrev', function(event, data) {
                console.log("goPrev(msg): ", data) 
                transport.control(data, 'previous');
            });

            socket.on('goNext', function(event, data) {
                console.log("goNext(msg): ", data)
                transport.control(data, 'next');
            });

            socket.on('goPlayPause', function(event, data) {
                transport.control(data, 'playpause');
            });

            socket.on('goPlay', function(event, data) {
                console.log("goPlay(msg): ", data)
                transport.control(data, 'play');
            });

            socket.on('goPause', function(event, data) {
                console.log("goPause(msg): ", data)
                transport.control(data, 'pause');
            });

            socket.on('goStop', function(event, data) {
                transport.control(data, 'stop');
            });
        });

        // Make method externaly visible
        exports.ping = arg => {  
            console.log("ping", arg);
        }
  })

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow()
    }
  })
  
// Send data to browser window
function sendData(event_name, data){
    event_name = (typeof event_name !== "undefined" && event_name.length) ? event_name : 'message';
    data.event = event_name;
    win.webContents.send("send-data", data);
};


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Read config file
//var config = require('config');
//var configPort = config.get('server.port');

var RoonApi, RoonApiStatus, RoonApiTransport, RoonApiImage, RoonApiBrowse; 
var roon, core, transport;
var pairStatus = 0;
var zoneStatus = [];
var zoneList = [];

function init(){
    // Roon Object
    var v = new Object({
        el: "#roon_tab",
        data: { 
            server_ip: 'localhost',
            server_port: 9100,
            status: 'foo',
            zones: [],
            current_zone_id: null,
            listoffset: 0,
            list: null,
            items: []
        },
        computed: {
            zone: function () {
                return this.data.zones[this.data.current_zone_id];
            }
        },
        watch: {
            'current_zone_id': function(val, oldval) {
                roon.save_config("current_zone_id", val);
                refresh_browse();
            }
        },
        methods: {
            to_time: function (s) {
                let r = "";
                if (s >= 3600) {           
                    r += Math.floor(s / 3600).toString() + ":"; s = s % 3600; 
                }

                if (!r || s >= 600)  {          
                    r += Math.floor(s / 60).toString()   + ":"; 
                    s = s % 60;   
                } else { 
                    r += "0"; 
                    r += Math.floor(s / 60).toString()   + ":"; 
                    s = s % 60;  
                }

                if (s >= 10) {
                    r += s.toString();
                    s = -1;       
                } else if (s >= 0) {
                    r += "0"; 
                    r += s.toString(); 
                    s = -1;
                }
                return r;
            },
            transport_playpause: function() {
                core.services.RoonApiTransport.control(this.zone, 'playpause');
            },
            transport_stop: function() {
                core.services.RoonApiTransport.control(this.zone, 'stop');
            },
            transport_previous: function() {
                core.services.RoonApiTransport.control(this.zone, 'previous');
            },
            transport_next: function() {
                core.services.RoonApiTransport.control(this.zone, 'next');
            },
            list_item: function(item) {
                if (!item.input_prompt)
                    refresh_browse({ item_key: item.item_key });
            },
            list_input: function(item) {
                let val = (item.input_prompt.value || "").trim();
                if (val === "")
                    return;
                if (item.input_prompt)
                    refresh_browse({ item_key: item.item_key, input: val });
            },
            list_back: function() {
                refresh_browse({ pop_levels: 1 });
            },
            list_home: function() {
                refresh_browse({ pop_all: true });
            },
            list_refresh: function() {
                refresh_browse({ refresh_list: true } );
            },
            list_next_page: function() {
                load_browse(this.data.listoffset + 100);
            },
            list_prev_page: function() {
                load_browse(this.data.listoffset - 100);
            }
        }
    });

    RoonApi = require("node-roon-api");
    RoonApiStatus = require("node-roon-api-status");
    RoonApiTransport = require('node-roon-api-transport');
    RoonApiImage     = require('node-roon-api-image');
    RoonApiBrowse    = require('node-roon-api-browse');
        
    roon = new RoonApi({
        extension_id:        'com.wwwizzarrdry.mini.controller',
        display_name:        "Mini Controller",
        display_version:     "0.0.1",
        publisher:           'Ian Celing',
        email:               'masked',
        website:             'https://github.com/wwwizzarrdry/mini-controller',
        core_paired: function(core_) {
            core = core_;
            transport = core_.services.RoonApiTransport;
            v.data.current_zone_id = roon.load_config("current_zone_id");
            pairStatus = true;
            
            // Update Client
            sendData("pairStatus", JSON.parse('{"pairEnabled": ' + pairStatus + '}'));
            v.data.status = 'connected';
            sendData("connected", v.data);
            
            transport.subscribe_zones((response, msg) => {
                
                if (response == "Subscribed") {
                    console.log("Subscribed", msg)
                    let zones = msg.zones.reduce((p,e) => (p[e.zone_id] = e) && p, {});
                    v.data.zones = zones;
                    sendData("Subscribed", msg)
                } else if (response == "Changed") {
                    var z;
                    console.log("Changed", msg)
                    if (msg.zones_removed) {
                        msg.zones_removed.forEach(e => delete(v.data.zones[e.zone_id]));
                        sendData("zones_removed", msg.zones_removed)
                    }
                    if (msg.zones_added) {
                        msg.zones_added.forEach(e => v.data.zones[e.zone_id] = e);
                        sendData("zones_added", msg.zones_added)
                    }
                    if (msg.zones_changed) {
                        msg.zones_changed.forEach(e => v.data.zones[e.zone_id] = e);
                        v.data.current_zone_id = msg.zones_changed[0].zone_id;
                        v.data.zones["zid"] = msg.zones_changed[0].zone_id;
                        sendData("zones_changed", v.data.zones)
                        
                    }
                    if(msg.zones_seek_changed) {
                        sendData("zones_seek_changed", v.data.zones)
                        v.data.current_zone_id = msg.zones_seek_changed[0].zone_id;
                    }
                    v.data.zones = v.data.zones;
                }
            });
            
            roon.save_config("current_zone_id", v.data.current_zone_id);
            v.data.listoffset = 0;
            refresh_browse();
        },
        core_unpaired: function(core_) {
            core = undefined;
            v.data.status = 'disconnected';
            pairStatus = false;
            sendData("pairStatus", JSON.parse('{"pairEnabled": ' + pairStatus + '}'));
        }
    });

    // Init Roon Services
    var svc_status = new RoonApiStatus(roon);
    roon.init_services({
        required_services: [ RoonApiBrowse, RoonApiTransport, RoonApiImage ],
        provided_services: [ svc_status ]
    });

    // Update Status text on Roon Extension
    svc_status.set_status("Extenstion enabled", false);

    // Scan for Roon Cores
    roon.start_discovery();

    // Roon functions
    function refresh_browse(opts) {
        opts = Object.assign({
            hierarchy: "browse",
            zone_or_output_id: v.data.current_zone_id,
        }, opts);
        core.services.RoonApiBrowse.browse(opts, (err, r) => {
            if (err) { 
                console.log(err, r);
                return; 
            }
            console.log(err, r);

            if (r.action == 'list') {
                v.data.list = r.list;
                v.data.items = [];
                var listoffset = r.list.display_offset > 0 ? r.list.display_offset : 0;
                load_browse(listoffset);
            } else if (r.action == 'message') {
                alert((r.is_error ? "ERROR: " : "") + r.message);
            } else if (r.action == 'replace_item') {
                var i = 0;
                var l = v.data.items;
                while (i < l.length) {
                    if (l[i].item_key == opts.item_key) {
                        l.splice(i, 1, r.item);
                        break;
                    }
                    i++;
                }
                v.data.items = l;
            } else if (r.action == 'remove_item') {
                var i = 0;
                var l = v.data.items;
                while (i < l.length) {
                    if (l[i].item_key == opts.item_key) {
                        l.splice(i, 1);
                        break;
                    }
                    i++;
                }
                v.data.items = l;
            }
        });
    }

    function load_browse(listoffset) {
        core.services.RoonApiBrowse.load({
            hierarchy: "browse",
            offset: listoffset,
            set_display_offset: listoffset,
        }, (err, r) => {
            v.data.listoffset = listoffset;
            v.data.items = r.items;
            sendData("load_browse", v);
        });
    }

    var go = function() {
        console.log("v", JSON.stringify(v, null, 6));
        v.data.status = 'connecting';
        sendData("connecting", v.data)
        roon.connect_to_host(v.data.server_ip, v.data.server_port, v.data.server_port, () => setTimeout(go, 3000));
    };
    go();
}