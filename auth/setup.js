var db = new PouchDB('rpiweb');

function sset(stuff) {
	if (stuff.constructor === Array) {
		return db.bulkDocs(stuff);
	}
	return db.put(stuff);
}

function sget(stuff) {
	stuff = stuff || null;
	//not yet: if (something.constructor === Array) {
	if (typeof stuff === 'string') {
		return db.get(stuff);
	}
	return db.allDocs({include_docs: true})
}


function makeRequest (method, url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.responseText);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}



function giveredirecturl(stage) {
	var redirectu = '&redirect_uri=' + location.hostname + '/auth/step2' + '?stage=' + stage); //https://techniko.ml' // 
	return redirectu
}


var url = 'https://getpocket.com/v3/oauth/request?consumer_key=80283-89c786c75d89a44f28562aeb' + giveredirecturl();

makeRequest('POST', url)
.then(function(etext){
	var code = etext.split('=')[1];
	var li = [];
	li.push({_id: 'reqToken', value: code});
	li.push({_id: 'conKey', value: '80283-89c786c75d89a44f28562aeb'})
	return sset(li);
	//return ...set({reqToken: code, conKey: '80283-89c786c75d89a44f28562aeb', since: ''})
}).then(function(){
	return sget('reqToken')
}).then(function(reqToken){
	var authobj = {interactive: true};
	authobj.url = 'https://getpocket.com/auth/authorize?request_token=' + reqToken.value + giveredirecturl(2);
	return chromep.identity.launchWebAuthFlow(authobj)
	//then to stage2
}).then(function(redirect){
	//var (new URL(document.location)).searchParams
	console.log(redirect);
	return chromep.storage.local.get(['conKey', 'reqToken']);
}).then(function(state){
	var url = 'https://getpocket.com/v3/oauth/authorize?consumer_key=' + state.conKey + '&code=' + state.reqToken;
	return makeRequest('POST', url);
}).then(function(etext){
	console.log(etext);
	var fakeurl = new URL('https://d.dom/?' + etext)
	var access = fakeurl.searchParams.get('access_token');
	var username = fakeurl.searchParams.get('username');
	return chromep.storage.local.set({accToken: access, user: username, meta_logged_in: true});
}).then(function(){
	var p = document.createElement('p');
	p.innerText = 'Initialising...';
	document.body.appendChild(p)
	chrome.alarms.create('updatelist', {periodInMinutes:720})
	setTimeout(function(){
		location.href = chrome.runtime.getURL('newtab/newtab.html');
	}, 1000);
}).catch(function(error){
	console.warn(error);
})