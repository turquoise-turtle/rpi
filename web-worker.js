//webworker

self.importScripts('pouchdb-7.0.0.js', 'pouchdb.quick-search.js', 'rpiweb.js');

var rpi = new Rp();
var db = new PouchDB('rpiweb');

self.addEventListener('message', function(e){
	console.log(e);
	//switch (e.data) {
	//	default:
			rpi.indexList(db, ['excerpt', 'resolved_url', 'resolved_title'])
			.then(postMessage);
	//}
});