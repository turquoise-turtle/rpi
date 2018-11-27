var rpi = new Rp();
var db = new PouchDB('rpiweb');

var LIST = null;
var seenLIST = null;

var container = rpi.el('.container');
var reloadBar = rpi.el('.reloadBar');
// var searchBar = rpi.el('.searchBar');
var numEl = rpi.el('#num');
// var searchEl = rpi.el('#search');
// var searchForm = rpi.el('#searchForm');
var reloadForm = rpi.el('#reloadForm');

// searchForm.addEventListener('submit', function(event) {
// 	event.preventDefault();
// 	searchClick(event)
// }, false);
reloadForm.addEventListener('submit', function(event) {
	event.preventDefault();
	reloadClick(event)
}, false);
	

function stick() {
	reloadBar.classList.add('sticky');
	var height = reloadBar.offsetHeight;
	container.style.marginBottom = height + 'px';
}
function nonStick() {
	reloadBar.classList.remove('sticky');
	container.style.marginBottom = '';
}

function checkIfStickNeeded() {
// 	var searchHeight = searchBar.offsetHeight;
	var contentHeight = container.offsetHeight;
	var reloadHeight = reloadBar.offsetHeight;
	
	var windowHeight = window.innerHeight;
	var em = parseFloat(getComputedStyle(document.body).fontSize);
// 	var total = searchHeight + contentHeight + reloadHeight + 12 + em;
	var total = contentHeight + reloadHeight + 12 + em;

	console.log(windowHeight, total);

	if (total >= windowHeight) {
		stick();
	} else {
		nonStick();
	}
}


rpi.sget(db, 'meta_logged_in')
.then(function(logged_in){
	if (!logged_in.value){
		location.href = '/rpi/auth/main.html';
	}
	return rpi.sget(db, ['meta_list_unseen', 'meta_list_seen']);
}).then(function(e){
	rpi.containerEl = container;
	LIST = rpi.obtain(e, 'meta_list_unseen');
	seenLIST = rpi.obtain(e, 'meta_list_seen');
	getSomeItems();
}).catch(function(e){
	console.warn(e);
});


var updateSeenUnseen = rpi.debounce(function(){
	rpi.sget(db, ['meta_list_unseen', 'meta_list_seen'])
	.then(function(strg) {
		var unseenDoc = rpi.obtain(strg, 'meta_list_unseen', true);
		unseenDoc['value'] = LIST;
		
		var seenDoc = rpi.obtain(strg, 'meta_list_seen', true);
		seenDoc['value'] = seenLIST;
		
		return rpi.sset(db, [unseenDoc, seenDoc]);
	}).then(function(e){
		console.log('seenUnseen was updated');
	});
}, 250);



var reloadClick = rpi.debounce(function() {
	container.innerHTML = '';
	getSomeItems()
}, 50);

rpi.el('#reload').addEventListener('click', reloadClick);

// var searchClick = rpi.debounce(function () {
// 	rpi.goSearch(searchEl.value)
// 	.then(function(e){
// 		console.log(e);
// 		container.innerHTML = '';
// 		for (var i of e) {
// 			rpi.addElToPage(i.doc);
// 		}
// 		checkIfStickNeeded();
// 	});
// }, 50);

// rpi.el('#searchbutton').addEventListener('click', searchClick);

function getSomeItems() {
	var val = rpi.newitems(LIST, seenLIST, numEl.value);
	LIST = val[0];
	seenLIST = val[1];
	
	checkIfStickNeeded();
	updateSeenUnseen();
}