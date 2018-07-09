// Electron
const {webFrame} = require('electron')
const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const main = remote.require("./app.js");
const win = remote.getCurrentWindow();
let currentZoomFactor = webFrame.getZoomFactor();


// Receive data from main process
ipcRenderer.on('send-data', function (event, payload) {
	//console.log(payload.event, payload);
	switch(payload.event) {
		case 'pairStatus':
		       //UIkit.modal.alert("<h3><i class='uk-icon-check'></i>" + payload.event  + "</h3><div class='uk-overflow-container'><pre>" + JSON.stringify(payload, null, 6) + "</pre></div>");
			   var pairEnabled = payload.pairEnabled;
			   if (pairEnabled === true ) {
				   showSection('nowPlaying');
			   } else {
	               showSection('pairDisabled');
			   }  
			   break;
		case 'zoneStatus':
		       //UIkit.modal.alert("<h3><i class='uk-icon-check'></i>" + payload.event  + "</h3><div class='uk-overflow-container'><pre>" + JSON.stringify(payload, null, 6) + "</pre></div>");
			  //console.log('zoneStatus', payload)
			   break;
		case 'zoneList':
		       //UIkit.modal.alert("<h3><i class='uk-icon-check'></i>" + payload.event  + "</h3><div class='uk-overflow-container'><pre>" + JSON.stringify(payload, null, 6) + "</pre></div>");
			   $(".zoneList").html("");
			   if (payload !== undefined) {
				   for (var x in payload){
					   $(".zoneList").append("<button type=\"button\" class=\"buttonOverlay buttonZoneId\" id=\"button-" + payload[x].zone_id + "\" onclick=\"selectZone(\'" + payload[x].zone_id + "\', \'" + payload[x].display_name + "\')\">" + payload[x].display_name + "</button>");
					}
			   }
			   break;
		case 'message': 
				UIkit.modal.alert("<h3><i class='material-icons'>chat</i>" + payload.event  + "</h3><div class='uk-overflow-container'><pre>" + JSON.stringify(payload, null, 6) + "</pre></div>");
				break;
		case 'load_browse': 
		        UIkit.modal.alert("<h3><i class='material-icons'>folder</i>" + payload.event  + "</h3><div class='uk-overflow-container'><pre>" + JSON.stringify(payload, null, 6) + "</pre></div>");
				break;
		case 'core-subscribed':
				UIkit.notify({
					message: "<h3><i class='uk-icon-check'></i>" + payload.event  + "</h3><div class='uk-overflow-container'><pre>" + JSON.stringify(payload, null, 6) + "</pre></div>",
					status: "info",
					pos: "bottom-right"
				});
				break;
		case 'core-changed':
				break;
		case 'core-connected':
				UIkit.notify({
					message: "<h3><i class='uk-icon-check'></i>" + payload.event  + "</h3><div class='uk-overflow-container'><pre>" + JSON.stringify(payload, null, 6) + "</pre></div>",
					status: "success",
					pos: "bottom-right"
				});
				break;
		case 'core-disconnected':
				UIkit.notify({
					message: "<h3><i class='uk-icon-check'></i> " + payload.event  + "</h3><div class='uk-overflow-container' style='height: 200px;'><pre>" + JSON.stringify(payload, null, 6) + "</pre></div>",
					status: "danger",
					pos: "bottom-right"
				});
				break;
		default: 
		        //UIkit.notify({message: "<h3><i class='material-icons'>help</i>" + payload.event  + "</h3><div class='uk-overflow-container'><pre>" + JSON.stringify(payload, null, 6) + "</pre></div>", pos: "bottom-right"});
	}
});

var data = new Object();
var io = {
	emit: function(event, data) {
		ipcRenderer.send(event, data);
	}
};
data.id = randID_generator();
io.emit('connection', data);

ipcRenderer.on('hello', (event, arg) => {  
    console.log('hello: ', arg);
});

// To-Do
function showSection(sectionName) {
    switch (sectionName) {
        case "nowPlaying":
            $("#buttonMenu").show();
            // Show Now Playing screen
            $("#nowPlaying").show();
            // Hide inactive sections
            $("#pairDisabled").hide();
            $("#libraryBrowser").hide();
            $('#overlayMainMenu').hide();
            break;
        case "libraryBrowser":
            $("#buttonMenu").show();
            // Show libraryBrowser
            $("#libraryBrowser").show();
            // Hide inactive sections
            $("#pairDisabled").hide();
            $("#nowPlaying").hide();
            $('#overlayMainMenu').hide();
            break;
        case "pairDisabled":
            // Show pairDisabled section
            $("#pairDisabled").show();
            // Hide everthing else
            $("#buttonMenu").hide();
            $("#libraryBrowser").hide();
            $("#nowPlaying").hide();
            $("#pageLoading").hide();
            break;
        default:
            break;
        }
    var t = setTimeout(function (){
        $("#pageLoading").hide();
    }, 250);
}

// Shadow Box on Move
win.on("move", function( event ) {
	console.log("move", event.sender.getBounds() );
	clearTimeout(movetimer);
	$("html").css("background", "rgba(0,0,0,0.15)");
	movetimer();
});
var movetimer = function() {
	setTimeout(function(){
		$("html").css("background", "rgba(0,0,0,0)")
	},1000);
};

// Focus Blur
window.addEventListener("blur",  function(){ 
	console.log("blur"); 
	//collapse();
});
window.addEventListener("focus", function(){ 
	console.log("focus");
});

var $audio = $("#player"),
    $app = $("#app_bubble"),
	$drag = $("#drag_handle_container"),
	$bottomBar  = $("#bottom_bar_nav"),
	$playBtn = $(".transport-play"),
	$pauseBtn = $(".transport-pause"),
	$prevBtn = $(".transport-prev"),
	$nextBtn = $(".transport-next"),
	$volumeBtn = $(".transport-volume");

function collapse() { 
	var $fab_toolbar = $('.md-fab-toolbar');
	var $fab_speeddial = $('.md-fab-speed-dial');
	var $fab_sheet = $('.md-fab-sheet');
	var $popup_info = $('#popup_info');

	$popup_info.addClass("no-height");
	setTimeout(function(){
		// Sheet
		if( $fab_sheet.hasClass('md-fab-active') ) {
			$fab_sheet.css({'height':'','width':''}).removeClass('md-fab-active');
			setTimeout(function() {
				$fab_sheet.removeClass('md-fab-animated');
			},140);
		};
		// App
		if( $fab_toolbar.hasClass('md-fab-active') ) {
			$fab_toolbar.css('width','').removeClass('md-fab-active');
			setTimeout(function() {
				$fab_toolbar.removeClass('md-fab-animated');
			},140);
		};
    }, 140);
};

/* window controls*/
var dragTimer;
$document.on("mouseenter", "#app_bubble", function(){
	clearTimeout(dragTimer);
	$drag.removeClass("uk-hidden");
	dragTimer = setTimeout(function(){
		$drag.addClass("uk-hidden");
	},5000);
	
});
$document.on("mouseenter", "#drag_handle_container, #drag_handle", function(){
	clearTimeout(dragTimer);
	$drag.removeClass("uk-hidden");
}).on("mouseleave", "#drag_handle_container, #drag_handle", function(){
	clearTimeout(dragTimer);
	dragTimer = setTimeout(function(){
		$drag.addClass("uk-hidden");
	},1000);
});

$("#reload-button").click( function() {
	UIkit.notify("reload")
	win.reload();
});

$("#exit-button").click( function() {
	win.close(); 
	nw.App.quit();
});

$("#minimize-button").click( function() {
	win.minimize();
});

$("#restore-button").click( function() {
	win.restore();
});

$("#maximize-button").click( function() {
	win.maximize();
	$("#maximize-button, #unmaximize-button").toggleClass("uk-hidden");
});

$("#unmaximize-button").click( function() {
	win.unmaximize();
	$("#maximize-button, #unmaximize-button").toggleClass("uk-hidden");
});

$("#hide-button").click( function() {
	win.hide();
});

$("#show-button").click( function() {
	win.show();
});

$("#alwaystop-button").click( function() {
	win.setAlwaysOnTop(((win.isAlwaysOnTop()) ? false : true));
	$(this).find("i.material-icons").text(((win.isAlwaysOnTop()) ? "flip_to_back" : "flip_to_front"))
});

$("#zoomin-button").click( function() {
	currentZoomFactor = currentZoomFactor + 0.05;
	webFrame.setZoomFactor(currentZoomFactor);
});

$("#zoomout-button").click( function() {
	currentZoomFactor = currentZoomFactor - 0.05;
	webFrame.setZoomFactor(currentZoomFactor);
});



/* App Windows */
var appWindowAnimTimer = function(appid, state) {
	clearTimeout(appWindowAnimTimer);
	setTimeout(function(){
		$document.trigger("alert-closeAll");
		$document.trigger(appid+"_"+state, $("#"+appid));
		//ex. ("roon_app", "open");
	},350);
};
$(".roon-app").click( function(e) {
	e.preventDefault();
	e.stopImmediatePropagation();
	$("#popup_info").removeClass("active");

	if ($("#roon_app").hasClass("active")) {
		$("#roon_app,#plex_app,#sonos_app,#lastfm_app").addClass("no-height").removeClass("active");
		appWindowAnimTimer("roon_app","closed");
	} else {
		$("#plex_app,#sonos_app,#lastfm_app").addClass("no-height").removeClass("active");
		$("#roon_app").toggleClass("active no-height");
		appWindowAnimTimer("roon_app","opened");
	}
});

$(".plex-app").click( function(e) {
	e.preventDefault();
	e.stopImmediatePropagation();
	$("#popup_info").removeClass("active");

	if ($("#plex_app").hasClass("active")) {
		$("#roon_app,#plex_app,#sonos_app,#lastfm_app").addClass("no-height").removeClass("active");
		appWindowAnimTimer("plex_app","closed");
	} else {
		$("#roon_app,#sonos_app,#lastfm_app").addClass("no-height").removeClass("active");
		$("#plex_app").toggleClass("active no-height");
		appWindowAnimTimer("plex_app","opened");
	}
});

$(".sonos-app").click( function(e) {
	e.preventDefault();
	e.stopImmediatePropagation();
	$("#popup_info").removeClass("active");

	if ($("#sonos_app").hasClass("active")) {
		$("#roon_app,#plex_app,#sonos_app,#lastfm_app").addClass("no-height").removeClass("active");
		appWindowAnimTimer("sonos_app","closed");
	} else {
		$("#roon_app,#plex_app,#lastfm_app").addClass("no-height").removeClass("active");
		$("#sonos_app").toggleClass("active no-height");
		appWindowAnimTimer("sonos_app","opened");
	}
});

$(".lastfm-app").click( function(e) {
	e.preventDefault();
	e.stopImmediatePropagation();
	$("#popup_info").removeClass("active");

	if ($("#lastfm_app").hasClass("active")) {
		$("#roon_app,#plex_app,#sonos_app,#lastfm_app").addClass("no-height").removeClass("active");
		appWindowAnimTimer("lastfm_app","closed");
	} else {
		$("#roon_app,#plex_app,#sonos_app").addClass("no-height").removeClass("active");
		$("#lastfm_app").toggleClass("active no-height");
		appWindowAnimTimer("lastfm_app","opened");
	}
});

// Open Close event callback
var $appWindow, sonosVolumeSliders = [false,[],"__masterslider__"];
$document.on({
	"roon_app_opened": function(event, data){
		console.log(event, data);
		$appWindow = $(data);
		UIkit.notify({message: "<img class='md-user-image' src='assets/icons/roon.png'> Roon Opened", timeout: 150, pos: "top-center"})	
	},
	"roon_app_closed": function(event, data){
		$appWindow = $(data);
		UIkit.notify({message: "<img class='md-user-image' src='assets/icons/roon.png'> Roon Closed", timeout: 150, pos: "top-center"})
	},
	"plex_app_opened": function(event, data){
		$appWindow = $(data);
		UIkit.notify({message: "<img class='md-user-image' src='assets/icons/plex.png'> Plex Opened", timeout: 150, pos: "top-center"})
	},
	"plex_app_closed": function(event, data){
		$appWindow = $(data);
		UIkit.notify({message: "<img class='md-user-image' src='assets/icons/plex.png'> Plex Closed", timeout: 150, pos: "top-center"})
	},
	"sonos_app_opened": function(event, data){
		UIkit.notify({message: "<img class='md-user-image' src='assets/icons/sonos.png'> Sonos Opened", timeout: 150, pos: "top-center"})
		$appWindow = $(data);

		// Volume Controls
		if(!sonosVolumeSliders[0]){
			$.each($(".sonos-volume"), function(){
				var $this = $(this);
				// Initialize Label
				$("label[for='" + $this.attr("id") + "']").attr("data-sonos-volume", $this.val() || 0);
				
				var $slider = $this.ionRangeSlider({
					type: "single",
					min: 0,
					max: 100,
					from: 0,
					step: 1,
					keyboard: true,
					hide_min_max: true,
					extra_classes: "uk-margin-remove,uk-margin-bottom,uk-padding-remove",
					onChange: function (data) {
						console.log("onChange", $this.prop("value"), data);
						var $self = $(data.input), $label = $("label[for='" + $self.attr("id") + "']");
						$label.attr("data-sonos-volume", data.from);
					},
					onFinish: function(data){
						var $self = $(data.input);
						// Master Volume (link all volumes)
						if($self.attr("id") == "volume_master") {
							$.each(sonosVolumeSliders[1], function(i){
								$("label[for='" + sonosVolumeSliders[1][i].input.id + "']").attr("data-sonos-volume", $self.prop("value"));
								sonosVolumeSliders[1][i].update({from: $self.prop("value")});
							});
						}
					}
				});

				// store all zones (skip the master)
				if($this.attr("id") !== "volume_master") {
					sonosVolumeSliders[1].push($slider.data("ionRangeSlider"));
				} else {
					// Store master volume separately
					sonosVolumeSliders[2] = $slider.data("ionRangeSlider");
				}

			});
			sonosVolumeSliders[0] = true;
		}
	},
	"sonos_app_closed": function(event, data){
		var $this = $(data);
		UIkit.notify({message: "<img class='md-user-image' src='assets/icons/sonos.png'> Sonos Closed", timeout: 150, pos: "top-center"})
	},
	"lastfm_app_opened": function(event, data){
		var $this = $(data);
		UIkit.notify({message: "<img class='md-user-image' src='assets/icons/lastfm.png'> LastFM Opened", timeout: 150, pos: "top-center"})
	},
	"lastfm_app_closed": function(event, data){
		var $this = $(data);
		UIkit.notify({message: "<img class='md-user-image' src='assets/icons/lastfm.png'> LastFM Closed", timeout: 150, pos: "top-center"})
	},
	"alert-closeAll": function(){
		$(".uk-app-window-alert").remove();
		UIkit.notify.closeAll();
	}
});
$document.on("change", "#sonos_locked_master_volume", function(){
	$(".sonos-volume").toggleClass("master-locked");
	if ($(this).is(':checked')) {
		sonosVolumeSliders[2].update({ disable: false});
	} else {
		sonosVolumeSliders[2].update({ disable: true});
	}
	

})
$document.on("click", ".uk-alert-close.uk-close", function(){ $(this).closest(".uk-alert").remove(); })


// Prevent closing the Fab
$("#roon_app,#plex_app,#sonos_app,#lastfm_app").click( function(e) {
	e.preventDefault();
	e.stopImmediatePropagation();
});

$("#popup_info").click( function(e) {
	e.preventDefault();
	e.stopImmediatePropagation();
	if (!$("#popup_info").hasClass("no-height")) {
		$(this).toggleClass("active")
	}
});




/* Media Controls */
$(".popup-info").click( function() {
	//$("#roon_app,#plex_app,#sonos_app,#lastfm_app").addClass("no-height").removeClass("active");
	/*
	if ($("#popup_info").hasClass("no-height")) {
		$("#popup_info").removeClass("active no-height");
	} else {
		$("#popup_info").addClass("active no-height");
	} 
	*/
	$("#popup_info").toggleClass("no-height");
});

$(".transport-pause").click( function() {
	$("#main_icon").removeClass("timer").addClass("material-icons").html("play_arrow");
	//$audio[0].pause();
	io.emit('goPause', data);
	$pauseBtn.addClass("uk-hidden");
	$playBtn.removeClass("uk-hidden");

});

$(".transport-play").click( function() {
	$("#main_icon").removeClass("material-icons").addClass("timer").html("...");
	//$audio[0].play();
	$playBtn.addClass("uk-hidden");
	$pauseBtn.removeClass("uk-hidden");
	io.emit('goPlay', data);
});

$(".transport-prev").click( function() {
	$audio[0].currentTime = 0;
	$pauseBtn.addClass("uk-hidden");
	$playBtn.removeClass("uk-hidden");
	io.emit('goPrev', data);
});

$(".transport-next").click( function() {
	$audio[0].currentTime = $audio[0].duration;
	$pauseBtn.addClass("uk-hidden");
	$playBtn.removeClass("uk-hidden");
	io.emit('goNext', data);
});


var volumes = [0, 0.25, 0.5, 0.75, 1];
var curVol = 4;
$(".transport-volume").click( function() {
	if (curVol == 4) {
		curVol = 0;
	} else {
		curVol++;
	}
	$audio[0].volume = volumes[curVol];
});

var $viewToggle = $('#list_grid_toggle').children('a[data-view]'),
    $listGrid = $('#list_grid');

    $viewToggle.each(function() {
        if($(this).hasClass('uk-active')) {
            $listGrid.addClass($viewToggle.attr('data-view'));
        }
    });

    // set view class on init
    $document.on('click', '#list_grid_toggle a[data-view]', function(e) {
        e.preventDefault();
        var $this = $(this),
			isActive = $this.hasClass('uk-active');
			
        if(!isActive) {
            var view = $this.attr('data-view');
            if(view == 'list_view') {
                $listGrid.addClass('list_view').removeClass('grid_view');
            } else {
                $listGrid.addClass('grid_view').removeClass('list_view');
            }
            $this.addClass('uk-active').siblings().removeClass('uk-active');
        }
	});

// Get all the SVG timeline Paths (Meters)
var meters = document.querySelectorAll('svg[data-value] .meter');
var elapsed = 0
var duration = 0;
var durPercent = 0;
var timerDisplay = moment().format("hh:mm:ss A");
setInterval(function(){
	elapsed = $audio[0].currentTime;
	duration = $audio[0].duration;
	durPercent = ((elapsed/duration)*100).toFixed(0);
	timerDisplay = moment.duration(elapsed, 'seconds').format("mm:ss");
	if (durPercent <= 100 && (!$audio[0].paused||$audio[0].currentTime > 0)) {
		updateProgress(durPercent);
		$("#main_icon").html(timerDisplay);
	} else {
		window.clearInterval();
		$("#main_icon").removeClass("timer").addClass("material-icons").html("play_arrow");
	}
}, 1000);
function updateProgress(perc) {
	/*
	UIkit.notify({
		message: "elapsed: " + elapsed + ", duration: " + duration + ", Perc: " + perc+"%",
		status: "info",
		pos: "bottom-center",
		timeout: 300
	});
	*/

	meters.forEach(function (path) {
	// Get the length of the path
	var length = path.getTotalLength();
	// console.log(length) once and hardcode the stroke-dashoffset and stroke-dasharray in the SVG if possible 
	// or uncomment to set it dynamically
	// path.style.strokeDashoffset = length;
	// path.style.strokeDasharray = length;
	// Get the value of the meter
	var value = perc; //parseInt(path.parentNode.getAttribute('data-value'));
	// Calculate the percentage of the total length
	var to = length * ((100 - value) / 100);
	path.getBoundingClientRect();
	// Set the Offset
	path.style.strokeDashoffset = Math.max(0, to);
	});
};