var rpi = new Rp();
var db = new PouchDB('rpiweb');

db.info().then(function (info) {
	console.log(info);
	return rpi.sget(db, 'meta_logged_in');
}).then(function(e){
	document.querySelector('#setup').innerText = 'All set up';
	console.log('y',e);
}).catch(function(e){
	if (e.reason == 'missing') {
		if (e.docId == 'meta_logged_in') {
			blankslate();
		}
	} else {
		console.warn(e);
	}
});

function blankslate() {
	//var initialdoc = {_id: 'initial', date: new Date()};
	//return rpi.sset(db, initialdoc).then(function (){
		location.href = '/rpi/auth/main.html'
	//});
}


var testingli = [
	{excerpt: 'waitbut why asdfjlk ', resolved_url: 'http://waitbutwhy.com', resolved_title: 'WaitButWhy'},
	{excerpt: 'asdf waitbutwhy asdfjlk', resolved_url: 'https://wAitbutwhy.com', resolved_title: 'asdf WAITBUTWHY asd'},
	{excerpt: 'asdf WAITBUTWHYdfjlk', resolved_url: 'https://wAitbutwhy.com', resolved_title: 'asdf WajsdITBUTWHY asd'}
];

/*db.search({
  fields: ['excerpt', 'resolved_title', 'resolved_url'],
  build: true
}).then(console.log)*/

//db.bulkDocs(testingli)
// db.createIndex({
// 	index: {
// 		fields: ['excerpt', 'resolved_url']
// 	}
// }).then(function () {


function rpifind(querystring) {
	querystring = querystring || '';
	return db.search({
		query: querystring,
		fields: ['excerpt', 'resolved_url', 'resolved_title'],
		include_docs: true,
		highlighting: true,
		filter: function (doc) {
			return doc.type !== 'meta';
		}
	});
}

if ('serviceWorker' in navigator) {
	window.addEventListener('load', function() {
		navigator.serviceWorker.register('/rpi/service-worker.js')
		.then(function (reg){
			console.log('sw registered:', reg);
		}, /*catch*/ function(error) {
			console.log('Service worker registration failed:', error);
		});
	});
}
