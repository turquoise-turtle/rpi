//webworker

self.importScripts('pouchdb-7.0.0.js', 'pouchdb.quick-search.js');



self.addEventListener('message', function(e){
	console.log(e);
	var rpi = new Rp();
	var db = new PouchDB('rpiweb');
	switch (e.data) {
		case 'index':
			db.info().then(function (info) {
				console.log(info);
				return db.search({
					fields: ['excerpt', 'resolved_url', 'resolved_title'],
					build: true
				})
			}).then(postMessage);
		default:
			db.info().then(function (info) {
				console.log(info);
				return db.search({
					query: querystring,
					fields: ['excerpt', 'resolved_url', 'resolved_title'],
					include_docs: true,
					highlighting: true,
					filter: function (doc) {
						return doc.type !== 'meta';
					}
				});
			}).then(postMessage);
	}
});