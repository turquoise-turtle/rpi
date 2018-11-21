var rpi = new Rp();
var db = new PouchDB('rpiweb');

db.info().then(function (info) {
	console.log(info);
	return rpi.sget(db, 'initial');
}).then(function(e){
	console.log(e);
}).catch(function(e){
	if (e.reason == 'missing') {
		if (e.docId == 'initial') {
			blankslate();
		}
	} else {
		console.warn(e);
	}
});

function blankslate() {
	var initialdoc = {_id: 'initial', date: new Date()};
	return sset(initialdoc).then(function (){
		location.href = '/auth/main.html'
	})
}


var testingli = [
	{excerpt: 'waitbut why asdfjlk ', resolved_url: 'http://waitbutwhy.com', resolved_title: 'WaitButWhy'},
	{excerpt: 'asdf waitbutwhy asdfjlk', resolved_url: 'https://wAitbutwhy.com', resolved_title: 'asdf WAITBUTWHY asd'},
	{excerpt: 'asdf WAITBUTWHYdfjlk', resolved_url: 'https://wAitbutwhy.com', resolved_title: 'asdf WajsdITBUTWHY asd'}
];

//db.bulkDocs(testingli)
// db.createIndex({
// 	index: {
// 		fields: ['excerpt', 'resolved_url']
// 	}
// }).then(function () {
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
	if (stuff === null) {
		return db.allDocs({include_docs: true})
	}
	return db.allDocs(stuff)
}

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


/*	return db.find({
		selector: {
			'_id': {$gt: null},
			'$or': [
				{
					excerpt: {$regex: RegExp(query, 'i')},
				},
				{
					resolved_title: {$regex: RegExp(query, 'i')}
				},
				{
					resolved_url: {$regex: RegExp(query, 'i')}
				}
			]
		}
	}).then(console.log);
}*/