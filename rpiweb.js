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
			this.sget(['meta_conKey', 'meta_accToken'])
			.then(function(state){
				var conKeyId = state[0]['meta_conKey'];
				var conKey = state[1][conKeyId];
				var accTokenId = state[0]['meta_accToken'];
				var accToken = state[1][accTokenId];
				
				var url = 'https://getpocket.com/v3/get?consumer_key=' + conKey + '&access_token=' + accToken;
				//since
				//url = url + '&since=' + state.since;
				return makeRequest('POST', url)
			}).then(function(response){
				var obj = JSON.parse(response);
				console.log(new Date(), this.objToList(obj.list));
				/*var newlist = list[1].list_cache;
				var notseenlist = list[1].not_seen;
				Object.keys(obj.list).forEach(function(key){
					newlist.push(obj.list[key]);
					notseenlist.push(obj.list[key]);
				});*/
				var sincetime = obj.since;
				return this.sset(this.objToList(obj.list))
			}).catch(function(error){
				console.error(error);
			})
		}
		
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
				
				//this.seenLIST.push(item);
				list.splice(index,1);
				//updateSeenUnseen()
				addElToPage(item);
			}
			return list;
		}
		
		function addElToPage(item) {
			var itemcomment = '';
			for (var key in item) {
				if (item.hasOwnProperty(key)) {
					itemcomment = itemcomment + '\n' + key + " -> " + item[key];
				}
			}
			var outerEl = document.createElement('div');
			outerEl.innerHTML = "\t<div><h1 id=\"" + item.index + "\"><a href=\"" + item.resolved_url + "\" target=\"_blank\">" + item.sort_id + ": " + (item.resolved_title || item.given_title) + "</a></h1></div>\n\t<div><a href=\"" + item.resolved_url + "\" target=\"_blank\">" + item.resolved_url + "</a></div>\n<!--" + escapetext(itemcomment) + "---></div>";
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

		var updateSeenUnseen = debounce(function(){
			sset({not_seen: this.notseenLIST, seen: this.seenLIST}).then(function(){
				console.log('seenUnseen was updated');
			});
		}, 250);
		
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