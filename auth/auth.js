var rpi = new Rp();
var db = new PouchDB('rpiweb');

var here = (new URL(location.href)).searchParams;
//stage 1

//functions
function giveredirecturl() {
	if(window.navigator.userAgent.match(/Android/i) {
		var redirectu = '&redirect_uri=https://' + location.hostname + '/rpi/auth/main2.html';
	} else {
		var redirectu = '&redirect_uri=https://' + location.hostname + '/rpi/auth/dummy.html';
	}
	return redirectu
}
//https://medium.com/@jonnykalambay/progressive-web-apps-with-oauth-dont-repeat-my-mistake-16a4063ce113
var popup;
function login(loginurl) {
	var setup = document.querySelector('#setup');
	setup.parentNode.removeChild(setup);
	var openlink = document.createElement('a'); //('#openlink');
	openlink.innerText = 'Click here to login';
	openlink.style = 'text-decoration: underline; cursor: pointer;';
	openlink.addEventListener('click', function(e){
		if(window.navigator.userAgent.match(/Android/i) {
			openlink.href = loginurl;
			console.log('link')
		} else {
			popup = window.open(loginurl);//, 'mywindow', 'width=800,height=600');
			console.log('popup', popup)
		}
		console.log('clicked');
	});
	document.body.appendChild(openlink);
}
window.addEventListener('message', updateAuthInfo)
function updateAuthInfo () {
	afterlogin();
	popup.close();
}
	
//get request token
var url = 'https://getpocket.com/v3/oauth/request?consumer_key=80283-89c786c75d89a44f28562aeb' + giveredirecturl();

rpi.makeRequest('POST', url)
.then(function (etext) {
	var requestToken = etext.split('=')[1];
	var consumerKey = '80283-89c786c75d89a44f28562aeb';
	var li = [];
	li.push({_id: 'meta_reqToken', value: requestToken, type: 'meta'});
	li.push({_id: 'meta_conKey', value: consumerKey, type: 'meta'})
	return rpi.sset(db, li);
}).then(function() {
	return rpi.sget(db, 'meta_reqToken');
}).then(function(reqToken) {
	var authurl = 'https://getpocket.com/auth/authorize?request_token=' + reqToken.value + giveredirecturl();
	login(authurl);
}).catch(function(e){
	console.warn(e);
});

//stage 2
function afterlogin() {
	return rpi.sget(db, ['meta_conKey', 'meta_reqToken'])
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
		return rpi.sset(db, li)
	}).then(function(){
		location.href = '/rpi/index.html';
	});
}