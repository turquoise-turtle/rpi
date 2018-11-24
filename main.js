var rpi = new Rp();
var db = new PouchDB('rpiweb');
var container = rpi.el('.container');

var sget = rpi.sget;
var dlog = rpi.dlog;


var LIST = null;

//sget({meta_logged_in: false, list_cache:[]})
sget(db, 'meta_logged_in')
.then(function(logged_in){
	if (!logged_in.value){
		location.href = '/rpi/auth/main.html';
	}
	return sget(db);
}).then(function(e){
	rpi.containerEl =
	LIST = e.rows;
	LIST = rpi.newitems(LIST);
	
	//LIST = state.list_cache;
	
	//newitems(5);
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

el('#reload').addEventListener('click', function(e){
	//location.reload();
	//https://stackoverflow.com/questions/13555785/remove-all-child-from-node-with-the-same-class-pure-js/13555954#13555954
	
	container.innerHTML = '';
	//LIST = rpi.newitems(LIST, el('#num').value);
	LIST = rpi.newitems(LIST);
})