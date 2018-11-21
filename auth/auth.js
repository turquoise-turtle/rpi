var rpi = new Rp();
var db = new PouchDB('rpiweb');

var here = (new URL(location.href)).searchParams;
//stage 1

//functions
function giveredirecturl() {
	var redirectu = '&redirect_uri=' + location.hostname + '/rpi/auth/dummy.html';
	return redirectu
}
//https://medium.com/@jonnykalambay/progressive-web-apps-with-oauth-dont-repeat-my-mistake-16a4063ce113
var popup;
function login(e) {
	popup = window.open(e, 'mywindow', 'width=350,height=250');
}
window.addEventListener('message', updateAuthInfo)
function updateAuthInfo () {
	afterlogin();
	popup.close();
}
	
//get request token
var url = 'https://getpocket.com/v3/oauth/request?consumer_key=80283-89c786c75d89a44f28562aeb' + giveredirecturl(2);

rpi.makeRequest('POST', url)
.then(function (etext) {
	var requestToken = etext.split('=')[1];
	var consumerKey = '80283-89c786c75d89a44f28562aeb';
	var li = [];
	li.push({_id: 'reqToken', value: requestToken});
	li.push({_id: 'conKey', value: consumerKey})
	return rpi.sset(db, li);
}).then(function() {
	return rpi.sget(db, 'reqToken');
}).then(function(reqToken) {
	var authurl = 'https://getpocket.com/auth/authorize?request_token=' + reqToken.value + giveredirecturl();
	login(authurl);
}).catch(function(e){
	console.warn(e);
});

//stage 2
function afterlogin() {
	return rpi.sget(db, {startkey: 'meta_conKey', endkey: 'meta_reqToken', include_docs: true})
	.then(function(state){
		var conKey = state.rows[0].doc.value;
		var reqToken = state.rows[2].doc.value;
		var url = 'https://getpocket.com/v3/oauth/authorize?consumer_key=' + conKey + '&code=' + reqToken;
		return rpi.makeRequest('POST', url);
	}).then(function (etext) {
		console.log(etext);
		var fakeurl = new URL('https://d.dom/?' + etext)
		var access = fakeurl.searchParams.get('access_token');
		var username = fakeurl.searchParams.get('username');
		var li = [];
		li.push({_id: 'meta_accToken', value: access});
		li.push({_id: 'meta_user', value: username});
		li.push({_id: 'meta_logged_in', value: true});
		return rpi.sset(db, li)
	}).then(function(){
		location.href = '/rpi/index.html';
	});
}