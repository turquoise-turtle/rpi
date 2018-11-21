var rpi = new Rp();

var sget = Rp.sget;
var dlog = Rp.dlog;
function el(elname) {
	return document.querySelector(elname);
}

var LIST = null;

sget({meta_logged_in: false, list_cache:[]})
.then(function(state){
	if (!state.meta_logged_in){
		location.href = chrome.runtime.getURL('auth/setup.html');
	}
	LIST = state.list_cache;
	
	newitems(5);
}).catch(function(e){
	console.warn(e);
});

/*

meta_logged_in: true|false
meta_last_cache: ...
list_cache: []

conKey
reqToken
accToken
user

*/

function newitems(length) {
	for (var i = 0; i < length; i++) {
		var index = Math.floor(Math.random() * LIST.length);
		var item = LIST[index];
		//item.index = index;
		addElToPage(item);
	}
}

el('#reload').addEventListener('click', function(e){
	//location.reload();
	//https://stackoverflow.com/questions/13555785/remove-all-child-from-node-with-the-same-class-pure-js/13555954#13555954
	var container = el('.container');
	container.innerHTML = '';
	newitems(el('#num').value);
})

function addElToPage(item) {
	var outerEl = document.createElement('div');
	outerEl.innerHTML = "\t<div><h1 id=\"" + item.index + "\"><a href=\"" + item.resolved_url + "\" target=\"_blank\">" + item.sort_id + ": " + (item.resolved_title || item.given_title) + "</a></h1></div>\n\t<div><a href=\"" + item.resolved_url + "\" target=\"_blank\">" + item.resolved_url + "</a></div>\n</div>";
	el('.container').appendChild(outerEl);
	if (item.hasOwnProperty('tags')) {
		document.body.innerHTML += item.tags;
	}
}