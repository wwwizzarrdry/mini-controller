// Electron
var remote = require('electron').remote;
var win = remote.getCurrentWindow();
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

// Socket.io
var socket = require('socket.io-client')('http://localhost:3000');
function showNotify(msg, style, pos, timeout, cb){
	UIkit.notify({
		message: msg || "showNotify(msg, style, pos, timeout, cb)",
		style: style || "danger",
		pos: pos || "bottom-right", 
		timeout: timeout || 3000,
		onClose: (typeof cb !== "undefined") ? cb() : false
	})
	//new Notification(options[0].title,options[0]);
}
socket.on('new message',function(data){
	UIkit.notify('<table><tr class="active"><td><strong>'+data.user+'</strong>: '+data.msg+'</td></tr></table>');
})
socket.on('get users',function(data){
	var html ='';
	for(i=0;i<data.length;i++){
		html += '<li><div id="pic"></div><div id="username">'+data[i]+'</div></li>';
	}
	html = '<ul>' + html + '</ul>';
	showNotify();
})

// Focus Blure
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


/* Media Controls */
$(".transport-pause").click( function() {
	$("#main_icon").removeClass("timer").addClass("material-icons").html("play_arrow");
	$audio[0].pause();
	$pauseBtn.addClass("uk-hidden");
	$playBtn.removeClass("uk-hidden");
});

$(".transport-play").click( function() {
	$("#main_icon").removeClass("material-icons").addClass("timer").html("...");
	$audio[0].play();
	$playBtn.addClass("uk-hidden");
	$pauseBtn.removeClass("uk-hidden");
});

$(".transport-prev").click( function() {
	$audio[0].currentTime = 0;
	$pauseBtn.addClass("uk-hidden");
	$playBtn.removeClass("uk-hidden");
});

$(".transport-next").click( function() {
	$audio[0].currentTime = $audio[0].duration;
	$pauseBtn.addClass("uk-hidden");
	$playBtn.removeClass("uk-hidden");
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