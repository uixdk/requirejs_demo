/**
 * css选择器，根据2\8原则，这里只实现最常用的三种
 * 注：当结果集只有一个元素时将直接返回该元素
 *
 * @param {Object} selector
 * @param {Object} context
 *
 * 1, 通过className获取
 * ('.cls')
 * ('.cls', el)
 * ('.cls', 'id')
 * ('span.cls')
 * ('span.cls', el)
 * ('span.cls', 'id')
 *
 * 2, 通过tagName获取
 * ('span')
 * ('span', el)
 * ('span', 'id')
 *
 * 3, 通过attribute获取
 * ('[name]')
 * ('[name]', el)
 * ('[name]', 'id')
 * ('[name=uname]')
 * ('[name=uname]', el)
 * ('[name=uname]', 'id')
 * ('input[name=uname]')
 * ('input[name=uname]', el)
 * ('input[name=uname]', 'id')
 */
define('selector',[],function() {

	function query(selector,context) {
		var s = selector,
			doc = document,
			regId = /^#[\w\-]+/,
			regCls = /^([\w\-]+)?\.([\w\-]+)/,
			regTag = /^([\w\*]+)$/,
			regNodeAttr = /^([\w\-]+)?\[([\w]+)(=(\w+))?\]/;
		
		var context = 
				context == undefined ?
				document :
				typeof context == 'string' ?
				doc.getElementById(context.substr(1,context.length)) :
				context;
				
		if(regId.test(s)) {
			return doc.getElementById(s.substr(1,s.length));
		}
		
		if(context.querySelectorAll) {
			if(context.nodeType == 1) {
				var old = context.id, id = context.id = '__$$__';
				try {
					return context.querySelectorAll( '#' + id + ' ' + s );
				} catch(e){
				} finally {
					old ? context.id = old : context.removeAttribute( 'id' );
				}
			}
			return context.querySelectorAll(s);
		}
		
		if(regCls.test(s)) {
			var ary = s.split('.'),
				tag = ary[0],
				cls = ary[1],
				len,
				all,
				els = [];
				if(context.getElementsByClassName) {
					var res = context.getElementsByClassName(cls);
					if(tag) {
						for(var i=0,len=res.length; i<len; i++) {
							res[i].tagName.toLowerCase()==tag && els.push(res[i]);
						}
						return els;
					}else{
						return res;
					}
				}else {
					all = context.getElementsByTagName(tag || '*');
					return filter(all, 'className', cls);	
				}
				
		}
		
		if(regTag.test(s)) {
			return context.getElementsByTagName(s);
		}
		
		if(regNodeAttr.test(s)) {
			var ary = regNodeAttr.exec(s),
				all = context.getElementsByTagName(ary[1] || '*');
				
			return filter(all, ary[2], ary[4]);	
		}
		
		function filter(all, attr, val) {
			var reg = RegExp('(?:^|\\s+)' + val + '(?:\\s+|$)');
			function test(node) {
				var v = attr == 'className' ? node.className : node.getAttribute(attr);
				if(v) {
					if(val) {
						if(reg.test(v)) return true;
					}else {
						return true;
					}
				}
				return false;
			}
			var i = -1, el, r = -1, res = [];
			while( (el = all[++i]) ) {
				if(test(el)) {
					res[++r] = el;
				}
			}
			return res;
		}
	}
	
	return query;
});

/**
 * @module cache
 *
 * Cache Manager, 数据管理, 通过HTMLElement关联
 */
define('cache',[],function() {

	var idSeed = 0,
		cache = {},
		id = '_ guid _';

	// @private
	function guid(el) {
		return el[id] || (el[id] = ++idSeed);
	}

	return {
		set: function(el, key, val) {

			if (!el) {
				throw new Error('setting failed, invalid element');
			}

			var id = guid(el),
				c = cache[id] || (cache[id] = {});
			if (key) c[key] = val;

			return c;
		},

		get: function(el, key, create) {
			if (!el) {
				throw new Error('getting failed, invalid element');
			}

			var id = guid(el),
				elCache = cache[id] || (create && (cache[id] = {}));

			if (!elCache) return null;

			return key !== undefined ? elCache[key] || null : elCache;
		},

		has: function(el, key) {
			return this.get(el, key) !== null;
		},

		remove: function(el, key) {
			var id = typeof el === 'object' ? guid(el) : el,
				elCache = cache[id];

			if (!elCache) return false;

			if (key !== undefined) {
				delete elCache[key];
			} else {
				delete cache[id];
			}

			return true;
		}
	};
});


/**
 * Event manager
 * 
 * add event : 
 * 
 * E.bind(el, 'click', fn);
 * E.bind(el, 'click.name', fn);
 * E.bind(el, 'click', fn, data);
 * 
 * remove event : 
 * 
 * E.unbind(el, 'click', fn);
 * E.unbind(el, 'click.name');
 * E.unbind(el, 'click');
 * E.unbind(el);
 * 
 * trigger event
 * 
 * E.trigger(el, 'click');
 * E.trigger(el, 'click.name');
 * E.trigger(el, 'click!');
 * 
 */

define('event',['cache'], function(cache) {
	
	var doc = window.document,
		w3c = !!doc.addEventListener,
		expando = 'snandy' + (''+Math.random()).replace(/\D/g, ''),
		triggered,
		addListener = w3c ?
			function(el, type, fn) { el.addEventListener(type, fn, false); } :
			function(el, type, fn) { el.attachEvent('on' + type, fn); },
		removeListener = w3c ?
			function(el, type, fn) { el.removeEventListener(type, fn, false); } :
			function(el, type, fn) { el.detachEvent('on' + type, fn); };
	
	function returnFalse() {
		return false;
	}
	
	function returnTrue() {
		return true;
	}
	
	function now() {
		return (new Date).getTime();
	}
	
	function isEmptyObject(obj){
		for (var i in obj){
			return false;
		}
		return true;
	}
	
	function addEvent (elem, types, handler, data) {
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}
		
		if (handler === false) {
			handler = returnFalse;
		} else if (!handler) {
			return;
		}
		
		var elemData = cache.get(elem, undefined, true),
			events   = elemData.events,
			eventHandle = elemData.handle,
			types = types.split(' ');
	
		if (!events) {
			elemData.events = events = {};
		}
		
		if (!eventHandle) {
			elemData.handle = eventHandle = function (e) {
				return triggered !== e.type ? 
					evtHandle.apply( eventHandle.elem, arguments ) : 
					undefined;
			};
		}
		
		eventHandle.elem = elem;
		
		var type, i = 0, namespaces;
		
		while ( type = types[i++] ) {
			var handleObj = {handler : handler, data : data},
				handlers  = events[type];
		
			// Namespaced event handlers
			if ( type.indexOf('.') > -1 ) {
				namespaces = type.split('.');
				type = namespaces.shift();
				handleObj.namespace = namespaces.slice(0).join('.');
	
			} else {
				handleObj.namespace = '';
			}
			
			if (!handlers) {
				handlers = events[type] = [];
				addListener( elem, type, eventHandle );
			}
			
			handlers.push(handleObj);
		}
		
		elem = null;
	}
	
	function trigger(elem, event, data, onlyHandlers) {
		
		// Event object or event type
		var type = event.type || event,
			namespaces = [],
			exclusive;
	
		if (type.indexOf('!') >= 0) {
			// Exclusive events trigger only for the exact event (no namespaces)
			type = type.slice(0, -1);
			exclusive = true;
		}
	
		if (type.indexOf('.') >= 0) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split('.');
			type = namespaces.shift();
			namespaces.sort();
		}
		
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}
		
		// Caller can pass in an Event, Object, or just an event type string
		event = typeof event === 'object' ?
			// jQuery.Event object
			event[expando] ? event :
			// Object literal
			new Event(type, event) :
			// Just the event type (string)
			new Event(type);
	
		event.type = type;
		event.exclusive = exclusive;
		event.namespace = namespaces.join('.');
		event.namespace_re = new RegExp('(^|\\.)' + namespaces.join('\\.(?:.*\\.)?') + '(\\.|$)');
		
		// triggerHandler() and global events don't bubble or run the default action
		if ( onlyHandlers || !elem ) {
			event.preventDefault();
			event.stopPropagation();
		}
	
		// Clean up the event in case it is being reused
		event.result = undefined;
		event.target = elem;
		
		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data != null ? [data] : [];
		data.unshift(event);
		
		var cur = elem,
			// IE doesn't like method names with a colon (#3533, #8272)
			ontype = type.indexOf(':') < 0 ? 'on' + type : '';
			
		// Fire event on the current element, then bubble up the DOM tree
		do {
			var handle = cache.get(cur, 'handle');
	
			event.currentTarget = cur;
			if (handle) {
				handle.apply(cur, data);
			}
	
			// Trigger an inline bound script
			if ( ontype && cur[ontype] && cur[ontype].apply(cur, data) === false ) {
				event.result = false;
				event.preventDefault();
			}
	
			// Bubble up to document, then to window
			cur = cur.parentNode || cur.ownerDocument || cur === event.target.ownerDocument && window;
		} while ( cur && !event.isPropagationStopped() );
		
		// If nobody prevented the default action, do it now
		if ( !event.isDefaultPrevented() ) {
			var old;
	
			if ( !(type === 'click' && elem.nodeName === 'A') ) {
	
				// Call a native DOM method on the target with the same name name as the event.
				// Can't use an .isFunction)() check here because IE6/7 fails that test.
				// IE<9 dies on focus to hidden element (#1486), may want to revisit a try/catch.
				try {
					if ( ontype && elem[type] ) {
						// Don't re-trigger an onFOO event when we call its FOO() method
						old = elem[ontype];
	
						if (old) {
							elem[ontype] = null;
						}
						triggered = type;
						elem[type]();
					}
				} catch (ieError) {}
	
				if (old) {
					elem[ontype] = old;
				}
				
				triggered = undefined;
			}
		}
		
		return event.result;
	}
	
	function evtHandle (event) {
		event = fixEvent( event || window.event );
		
		var handlers = ( (cache.get(this, 'events') || {} )[event.type] || []).slice(0),
			run_all = !event.exclusive && !event.namespace,
			args = Array.prototype.slice.call( arguments, 0 );
				
		event.currentTarget = this;
		
		for (var j = 0, l = handlers.length; j < l; j++) {
			var handleObj = handlers[j];
	
			// Triggered event must 1) be non-exclusive and have no namespace, or
			// 2) have namespace(s) a subset or equal to those in the bound event.
			if ( run_all || event.namespace_re.test(handleObj.namespace) ) {
				
				event.handler = handleObj.handler;
				event.data = handleObj.data;
				event.handleObj = handleObj;
				
				var ret = handleObj.handler.apply(this, args);
				
				if (ret !== undefined) {
					if (ret === false) {
						event.preventDefault();
						event.stopPropagation();
					}
				}
				
				if ( event.isImmediatePropagationStopped() ) {
					break;
				}
				
			}	
	
		}
		
		return event.result;
	}
	
	function removeEvent( elem, types, handler ) {
		// don't do events on text and comment nodes
		if (elem.nodeType === 3 || elem.nodeType === 8) {
			return;
		}
	
		if (handler === false) {
			handler = returnFalse;
		}
		
		var type, origType, i = 0, j,
			elemData = cache.get(elem),
			events = elemData && elemData.events;
	
		if (!elemData || !events) {
			return;
		}
		
		// Unbind all events for the element
		if (!types) {
			types = types || '';
			for (type in events) {
				removeEvent( elem, type );
			}
			return;
		}
		
		// Handle multiple events separated by a space
		// jQuery(...).unbind('mouseover mouseout', fn);
		types = types.split(' ');
		
		while ( (type = types[i++]) ) {
			origType = type;
			handleObj = null;
	
			eventType = events[type] || [];
	
			if (!eventType) {
				continue;
			}
			
			if (!handler) {
				for (j = 0; j < eventType.length; j++) {
					handleObj = eventType[j];
					removeEvent(elem, origType, handleObj.handler);
					eventType.splice(j--, 1);
				}
				continue;
			}
			
			for (j = 0; j < eventType.length; j++) {
				handleObj = eventType[j];
	
				if (handler === handleObj.handler) {
					// remove the given handler for the given type
					eventType.splice(j--, 1);
				}
			}
	
		}
		
		// remove generic event handler if no more handlers exist
		if (eventType.length === 0) {
			removeListener(elem, origType, elemData.handle);
			delete events[origType];
		}
		
		// Remove the expando if it's no longer used
		if ( isEmptyObject(events) ) {
			var handle = elemData.handle;
			if (handle) {
				handle.elem = null;
			}
	
			delete elemData.events;
			delete elemData.handle;
	
			if ( isEmptyObject(elemData) ) {
				cache.remove(elem, 'events');
			}
		}
		
		
	}
	Event = function(src, props) {
		// Allow instantiation without the 'new' keyword
		if (!this.preventDefault) {
			return new Event( src, props );
		}
	
		// Event object
		if (src && src.type) {
			this.originalEvent = src;
			this.type = src.type;
	
			// Events bubbling up the document may have been marked as prevented
			// by a handler lower down the tree; reflect the correct value.
			this.isDefaultPrevented = (src.defaultPrevented || src.returnValue === false ||
				src.getPreventDefault && src.getPreventDefault()) ? returnTrue : returnFalse;
	
		// Event type
		} else {
			this.type = src;
		}
	
		// Put explicitly provided properties onto the event object
		if ( props ) {
			for (var i in props) {
				this[i] = props[i];
			}
		}
	
		// timeStamp is buggy for some events on Firefox(#3843)
		// So we won't rely on the native value
		this.timeStamp = now();
		
		// Mark it as fixed
		this[expando] = true;	
	
	};
	Event.prototype = {
		preventDefault: function() {
			this.isDefaultPrevented = returnTrue;
			var e = this.originalEvent;
			if (e.preventDefault) {
				e.preventDefault();
			}
			e.returnValue = false;
		},
		stopPropagation: function() {
			this.isPropagationStopped = returnTrue;
			var e = this.originalEvent;
			if (e.stopPropagation) {
				e.stopPropagation();
			}		
			e.cancelBubble = true;
		},
		stopImmediatePropagation: function() {
			this.isImmediatePropagationStopped = returnTrue;
			this.stopPropagation();
		},
		isDefaultPrevented: returnFalse,
		isPropagationStopped: returnFalse,
		isImmediatePropagationStopped: returnFalse
	};	
		
	function fixEvent( evt ) {
		if ( evt[expando] ) {
			return evt;
		}
		
		var props = 'altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode layerX layerY metaKey newValue offsetX offsetY originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which'.split(' '),
			len   = props.length;
		
		var originalEvent = evt;
		evt = new Event(originalEvent);
		
		for (var i = len, prop; i;) {
			prop = props[ --i ];
			evt[ prop ] = originalEvent[ prop ];
		}
		if (!evt.target) {
			evt.target = evt.srcElement || document;
		}
		if ( evt.target.nodeType === 3 ) {
			evt.target = evt.target.parentNode;
		}
		if ( !evt.relatedTarget && evt.fromElement ) {
			evt.relatedTarget = evt.fromElement === evt.target ? evt.toElement : evt.fromElement;
		}
		if ( evt.pageX == null && evt.clientX != null ) {
			var doc = document.documentElement, body = document.body;
			evt.pageX = evt.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
			evt.pageY = evt.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
		}
		if ( !evt.which && ((evt.charCode || evt.charCode === 0) ? evt.charCode : evt.keyCode) ) {
			evt.which = evt.charCode || evt.keyCode;
		}
		if ( !evt.metaKey && evt.ctrlKey ) {
			evt.metaKey = evt.ctrlKey;
		}
		if ( !evt.which && evt.button !== undefined ) {
			evt.which = (evt.button & 1 ? 1 : ( evt.button & 2 ? 3 : ( evt.button & 4 ? 2 : 0 ) ));
		}
		
		return evt;
	}
	
	
	function bind(el, type, handler, data) {
		if (!el) {
			return;
		}
		
		if (typeof type === 'object') {
			for (var key in type) {
				bind(el, key, type[key], data);
			}
			return;
		}
		
		addEvent(el, type, handler, data);
	}
	
	function unbind( el, type, handler ) {
		if (typeof type === 'object') {
			for (var key in type) {
				unbind(el, key, type[key]);
			}
	
		} else {
			removeEvent( el, type, handler );
		}
	}
	
	return {
		bind : bind,
		unbind : unbind,
		trigger : trigger
	};
	
});

require.config({
    baseUrl: 'js',
    paths:{
        jquery: 'jquery-1.7.1'
    }
});

require(['jquery', 'selector','event'], function($, S, E){
    var els = $('p');
    for(var i=0; i<els.length; i++){
        E.bind(els[i], 'click', function(){
            alert(this.innerHTML);
        });
    }
});
define("main", function(){});

