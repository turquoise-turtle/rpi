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
		//this.dbWorker = new Worker('web-worker.js');
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
		
		this.updateList = function (db, sinceBoolean) {
			return that.sget(db, ['meta_conKey', 'meta_accToken', 'meta_since'])
			.then(function(state){
				var conKey = that.obtain(state, 'meta_conKey');
				//var conKeyId = state[0]['meta_conKey'];
				//var conKey = state[1][conKeyId]['value'];
				var accToken = that.obtain(state, 'meta_accToken');
				//var accTokenId = state[0]['meta_accToken'];
				//var accToken = state[1][accTokenId]['value'];
				var since = that.obtain(state, 'meta_since');
				//var sinceId = state[0]['meta_since'];
				//var since = state[1][sinceId]['value'];
				
				var url = 'https://getpocket.com/v3/get?consumer_key=' + conKey + '&access_token=' + accToken;
				sinceBoolean = sinceBoolean || true;
				if (since != '' && sinceBoolean) {
					url = url + '&since=' + since;
				}
				return Promise.all([that.makeRequest('POST', url), that.sget(db, ['meta_since', 'meta_list_cache', 'meta_list_unseen'])]);
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
				var strg = list[1];
				var sinceDoc = that.obtain(strg, 'meta_since', true);
				//var sinceId = og[0]['meta_since'];
				//var since = og[1][sinceId];
				var listCacheDoc = that.obtain(strg, 'meta_list_cache', true);
				//var listCacheId = og[0]['meta_list_cache'];
				//var listCache = og[1][listCacheId];
				var listUnseenDoc = that.obtain(strg, 'meta_list_unseen', true);
				//var listUnseenId = og[0][
				
				var sincetime = obj.since;
				sinceDoc['value'] = sincetime;
				
				var li = that.objToList(obj.list);
				var oldLi = listCacheDoc['value'];
				var newLi = oldLi.concat(li);
				listCacheDoc['value'] = newLi;
				
				var oldUnseen = listUnseenDoc['value'];
				var newUnseen = oldUnseen.concat(li);
				listUnseenDoc['value'] = newUnseen;
				
				var toSet = [];
				toSet.push(sinceDoc);
				toSet.push(listCacheDoc);
				toSet.push(listUnseenDoc);
				
				return that.sset(db, toSet)
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
		this.obtain = function (storage, name, key) {
			key = key || 'value';
			var nameId = storage[0][name];
			if (isBoolean(key)) {
				//return doc instead of an individual key
				var result = storage[1][nameId];
			} else {
				//return the key requested
				var result = storage[1][nameId][key];
			}
			return result;
		}
		function isBoolean (obj) {
			//https://stackoverflow.com/a/43718478/
			return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
		};
		
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
		
		this.newitems = function (list, seenList, number, longtime) {
			number = number || 5;
			longtime = longtime || 0;
			//length of unseen list
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
				while (item.type == 'meta' || item.status == 2 || item.listen_duration_estimate <= longtime)
				
				seenList.push(item);
				list.splice(index,1);
				//updateSeenUnseen()
				that.addElToPage(item);
			}
			return [list, seenList];
		}
		
		this.addElToPage = function(item) {
			var itemcomment = '';
			for (var key in item) {
				if (item.hasOwnProperty(key)) {
					itemcomment = itemcomment + '\n' + key + " -> " + item[key];
				}
			}
			var outerEl = document.createElement('div');
			outerEl.innerHTML = "\t<div><span class=\"bold\" id=\"" + item.sort_id + "\"><a href=\"" + item.resolved_url + "\" target=\"_blank\">" + item.sort_id + ": " + (item.resolved_title || item.given_title) + "</a></span></div>\n\t<div><a class=\"linktext\" href=\"" + item.resolved_url + "\" target=\"_blank\">" + item.resolved_url + "</a></div>\n<!--\n" + that.escapetext(itemcomment) + "\n---></div>";
			//el(that.container).appendChild(outerEl);
			that.containerEl.appendChild(outerEl);
			if (item.hasOwnProperty('tags')) {
				document.body.innerHTML += item.tags;
			}
		}
		this.debounce = function(func, delay) {
			//modified from https://codeburst.io/throttling-and-debouncing-in-javascript-b01cad5c8edf
			let inDebounce
			return function() {
				const args = arguments
				clearTimeout(inDebounce)
				inDebounce = setTimeout(() => func.apply(window, args), delay)
			}
		}

		/*var updateSeenUnseen = that.debounce(function(){
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
		this.escapetext = function(words) {
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