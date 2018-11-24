var rpi = new Rp();
var db = new PouchDB('rpiweb');
var container = rpi.el('.container');
var numEl = rpi.el('#num')


var LIST = null;

//sget({meta_logged_in: false, list_cache:[]})
rpi.sget(db, 'meta_logged_in')
.then(function(logged_in){
	if (!logged_in.value){
		location.href = '/rpi/auth/main.html';
	}
	return rpi.sget(db);
}).then(function(e){
	rpi.containerEl = container;
	LIST = e.rows;
	LIST = rpi.newitems(LIST, numEl.value);
	
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

rpi.el('#reload').addEventListener('click', function(e){
	//location.reload();
	//https://stackoverflow.com/questions/13555785/remove-all-child-from-node-with-the-same-class-pure-js/13555954#13555954
	container.innerHTML = '';
	LIST = rpi.newitems(LIST, numEl.value);
})