var rpi = new Rp();
var db = new PouchDB('rpiweb');

var here = (new URL(location.href)).searchParams;


//stage 2
//function afterlogin() {
	//return 
	rpi.sget(db, ['meta_conKey', 'meta_reqToken'])
	.then(function(state){
		//console.log('initial', i[0]['initial'], i[1][i[0]['initial']])
		console.log(state);
		var conKeyId = state[0]['meta_conKey'];
		var conKey = state[1][conKeyId]['value'];
		var reqTokenId = state[0]['meta_reqToken'];
		var reqToken = state[1][reqTokenId]['value'];
		var url = 'https://getpocket.com/v3/oauth/authorize?consumer_key=' + conKey + '&code=' + reqToken;
		return rpi.makeRequest('POST', url);
	}).then(function (etext) {
		console.log(etext);
		var fakeurl = new URL('https://d.dom/?' + etext)
		var access = fakeurl.searchParams.get('access_token');
		var username = fakeurl.searchParams.get('username');
		var li = [];
		li.push({_id: 'meta_accToken', value: access, type: 'meta'});
		li.push({_id: 'meta_user', value: username, type: 'meta'});
		li.push({_id: 'meta_logged_in', value: true, type: 'meta'});
		li.push({_id: 'meta_since', value: '', type: 'meta'});
		
		li.push({_id: 'meta_list_cache', value: [], type: 'meta'});
		li.push({_id: 'meta_list_unseen', value: [], type: 'meta'});
		li.push({_id: 'meta_list_seen', value: [], type: 'meta'});
		return rpi.sset(db, li)
	}).then(function(){
		location.href = '/rpi/index.html';
	});
//}