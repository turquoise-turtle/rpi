//webworker

self.importScripts('pouchdb-7.0.0.js', 'pouchdb.quick-search.js', 'rpiweb.js');



self.addEventListener('message', function(e){
	console.log(e);
	//switch (e.data) {
	//	default:
			var rpi = new Rp();
			var db = new PouchDB('rpiweb');
			
			db.search({
				fields: ['excerpt', 'resolved_url', 'resolved_title'],
				build: true
			}).then(postMessage);
	//}
});