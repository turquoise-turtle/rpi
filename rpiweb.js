/*v2*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Rp = factory();
	}
}(typeof self !== 'undefined' ? self : this, function () {
	//this works	
	var Rp = function() {
		
		var that = this;
		this.dbWorker = new Worker('web-worker.js');
		//that.seenLIST
		//that.notseenLIST
		//that.container = '.container';
		
		this.sget = function (db, stuff) {
			stuff = stuff || null;
			//not yet: if (something.constructor === Array) {
			if (stuff === null) {
				return db.allDocs({include_docs: true})
			}
			if (stuff.constructor === Array) {
				console.log('array')
				var li = [];
				var desc = {};
				for (var i in stuff) {
					li.push(db.get(stuff[i]));
					desc[stuff[i]] = i;
					//console.log('initial', i[0]['initial'], i[1][i[0]['initial']])
				}
				var lip = Promise.all(li);
				return Promise.all([desc, lip])
			}
			if (typeof stuff === 'string') {
				return db.get(stuff);
			}
			return db.allDocs(stuff)
		}
		this.sset = function (db, stuff) {
			if (stuff.constructor === Array) {
				return db.bulkDocs(stuff);
			}
			return db.put(stuff);
		}
		
		this.updateList = function (db) {
			return that.sget(db, ['meta_conKey', 'meta_accToken', 'meta_since'])
			.then(function(state){
				var conKeyId = state[0]['meta_conKey'];
				var conKey = state[1][conKeyId]['value'];
				var accTokenId = state[0]['meta_accToken'];
				var accToken = state[1][accTokenId]['value'];
				var sinceId = state[0]['meta_since'];
				var since = state[1][sinceId]['value'];
				
				var url = 'https://getpocket.com/v3/get?consumer_key=' + conKey + '&access_token=' + accToken;
				if (since != '') {
					url = url + '&since=' + since;
				}
				return Promise.all([that.makeRequest('POST', url), that.sget(db, 'meta_since')]);
			}).then(function(list){
				var response = list[0];
				var obj = JSON.parse(response);
				console.log(obj);
				console.log(new Date(), that.objToList(obj.list));
				/*var newlist = list[1].list_cache;
				var notseenlist = list[1].not_seen;
				Object.keys(obj.list).forEach(function(key){
					newlist.push(obj.list[key]);
					notseenlist.push(obj.list[key]);
				});*/
				var sdoc = list[1];
				var sincetime = obj.since;
				sdoc.value = sincetime;
				var li = that.objToList(obj.list);
				li.push(sdoc);
				return that.sset(db, li)
			}).catch(function(error){
				console.error(error);
			})
		}
		this.indexList = function(db, listToIndex) {
			return db.search({
				fields: listToIndex,
				build: true
			});
		}
		this.goIndex = function() {
			//if (typeof dbWorker == 'undefined') {
			//	var dbWorker = new Worker('web-worker.js');
			//}
			that.dbWorker.postMessage('index');
			console.log('start index', new Date())
			that.dbWorker.onmessage = function(e){
				console.log(e)
				console.log('end index', new Date());
			};
		}
		this.goSearch = function (querystring) {
			return new Promise(function (resolve,reject){
				querystring = querystring || '';
				//if (typeof dbWorker == 'undefined') {
				//	var dbWorker = new Worker('web-worker.js');
				//}
				that.dbWorker.postMessage(querystring);
				console.log('start search', new Date())
				that.dbWorker.onmessage = function(e){
					console.log(e.data)
					console.log('end search', new Date());
					resolve(e.data.rows);
				}
			});
		}
		this.find = function(db, querystring) {
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
		
		
		//utility
		this.makeRequest = function (method, url) {
		  return new Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest();
			var openurl = 'https://new-tab-cors-server.herokuapp.com/' + url;
			xhr.open(method, openurl);
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
		this.el = function (elname) {
			return document.querySelector(elname);
		}
		this.objToList = function(obj) {
			var list = [];
			Object.keys(obj).forEach(function(key){
				list.push(obj[key]);
			});
			return list;
		}
		
		this.dlog = function () {
			return Function.prototype.bind.call(console.log, console);
		} ();
		
		//that.containerEl
		this.containerEl = null;
		
		/*this.setup = function (conquery) {
			return sget(['not_seen', 'meta_logged_in', 'seen']).then(function(state){
				if (!state.meta_logged_in){
					location.href = '/auth/setup.html';
				}
				that.notseenLIST = state.not_seen;
				that.seenLIST = state.seen;
				if (conquery) {
					that.container = conquery;
					console.log(conquery);
				}
				return true;
			});
		}*/
		
		this.newitems = function (list, number) {
			number = number || 5;
			var len = list.length;
			for (var i = 0; i < number; i++) {
				do {
					var index = Math.floor(Math.random() * len);
					var item = list[index];
					if (item == undefined) {
						console.log(index, len, list);
					}
					if (item.doc) {
						item = item.doc
					}
				}
				while (item.type == 'meta' || item.status == 2)
				
				//that.seenLIST.push(item);
				list.splice(index,1);
				//updateSeenUnseen()
				that.addElToPage(item);
			}
			return list;
		}
		
		this.addElToPage = function(item) {
			var itemcomment = '';
			for (var key in item) {
				if (item.hasOwnProperty(key)) {
					itemcomment = itemcomment + '\n' + key + " -> " + item[key];
				}
			}
			var outerEl = document.createElement('div');
			outerEl.innerHTML = "\t<div><span class=\"bold\" id=\"" + item.sort_id + "\"><a href=\"" + item.resolved_url + "\" target=\"_blank\">" + item.sort_id + ": " + (item.resolved_title || item.given_title) + "</a></span></div>\n\t<div><a class=\"linktext\" href=\"" + item.resolved_url + "\" target=\"_blank\">" + item.resolved_url + "</a></div>\n<!--\n" + escapetext(itemcomment) + "\n---></div>";
			//el(that.container).appendChild(outerEl);
			that.containerEl.appendChild(outerEl);
			if (item.hasOwnProperty('tags')) {
				document.body.innerHTML += item.tags;
			}
		}
		var debounce = function(func, delay) {
			//modified from https://codeburst.io/throttling-and-debouncing-in-javascript-b01cad5c8edf
			let inDebounce
			return function() {
				const args = arguments
				clearTimeout(inDebounce)
				inDebounce = setTimeout(() => func.apply(window, args), delay)
			}
		}

		/*var updateSeenUnseen = debounce(function(){
			sset({not_seen: this.notseenLIST, seen: this.seenLIST}).then(function(){
				console.log('seenUnseen was updated');
			});
		}, 250);*/
		
		this.run = function(howmany) {
			if (isNaN(howmany)) {
				howmany = 5;
			}
			that.containerEl.innerHTML = '';
			that.newitems(howmany);
		}
		function escapetext(words) {
			newwords = words.replace('--', '__');
			return newwords;
		}
	}
	
	Rp.prototype = {
		set container(query) {
			this.containerEl = document.querySelector(query);
			console.log(query, this.containerEl);
		}
	}


	//myObject = new MyType(42);
	
	
	return Rp;
}));