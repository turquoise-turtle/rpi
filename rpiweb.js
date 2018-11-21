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
			if (typeof stuff === 'string') {
				return db.get(stuff);
			}
			if (stuff === null) {
				return db.allDocs({include_docs: true})
			}
			return db.allDocs(stuff)
		}
		this.sset = function (stuff, db) {
			if (stuff.constructor === Array) {
				return db.bulkDocs(stuff);
			}
			return db.put(stuff);
		}
		
		this.makeRequest = function (method, url) {
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
		}
		
		this.newitems = function (length) {
			for (var i = 0; i < length; i++) {
				var index = Math.floor(Math.random() * this.notseenLIST.length);
				var item = this.notseenLIST[index];
				this.seenLIST.push(item);
				this.notseenLIST.splice(index,1);
				updateSeenUnseen()
				addElToPage(item);
			}
		}*/
		
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