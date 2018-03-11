function export_utilities(){
	const email_regular_expression = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

	//exports
	field('aria').define(windex,aria)
	field('id').define(windex,id)
	field('is').define(windex,is)
	field('setting').define(windex,setting)
	field('dot').define(windex,dot_notation)
	field('field').define(windex,()=>field)
	field('uid').define(windex,()=>uid)

	//shared actions
	function aria(){
		const not_aria_name = ['role','tabindex','outline','state','type','for','name','id']
		function aria_element(element){
			return new Proxy(element, {
				get(o, name){
					name = get_name(name)
					if(!name) return null
					return o.getAttribute(name)
				},
				has(o, name){ return is_text(name) && o.hasAttribute(get_name(name)) },
				set(o, name, value){
					name = get_name(name)
					if(!name) return true
					value = get_value(name,value)
					if(value !== null) o.setAttribute(name, value)
					return true
				}
			})
		}
		aria_element.KeyCode = {
			BACKSPACE: 8,
			TAB: 9,
			RETURN: 13,
			ESC: 27,
			SPACE: 32,
			PAGE_UP: 33,
			PAGE_DOWN: 34,
			END: 35,
			HOME: 36,
			LEFT: 37,
			UP: 38,
			RIGHT: 39,
			DOWN: 40,
			DELETE: 46
		}

		//exports
		return aria_element

		//shared actions
		function get_name(name) {
			if (is_text(name)) {
				if(name.includes('aria')) return name
				else if(not_aria_name.includes(name)) return name
				else return `aria-${name}`
			}
			return null
		}

		function get_value(name,value) {
			if(is_nothing(value)) return null
			return is_nothing(value) ? null:`${value}`
		}
	}

	function dot_notation(dot_notation_value){
		if(!is_nothing(dot_notation_value)) return get_dot_notation(dot_notation_value)
		const lodash = windex.lodash
		return get_dot_proxy()
		//shared actions
		function get_dot_act(target){
			return new Proxy(target,{
				get(o,name){
					let action = lodash.get(target,name)
					let is_action = is_function(action)
					if(is_action) action = action.bind(target)
					return (...x)=>is_action ? action(...x):null
				}
			})
		}

		function get_dot_data(x){
			let object = x
			const type = get_dot_type(object)
			return new Proxy({typename:type, get object(){ return object}},{
				deleteProperty(o,name){ return dot_data_delete(name) },
				get(o,name){ return dot_data_get(name) },
				has(o,name){ return dot_data_has(name) },
				set(o,name,value){ return dot_data_set(name,value) }
			})
			//shared actions
			function dot_data_delete(name){
				if(type !== 'invalid'){
					if(type === 'map') object.delete(name)
					else if(type === 'set') dot_data_update_set('delete',name)
					else delete object[name]
				}
				return true
			}

			function dot_data_get(name){
				if(type === 'invalid') return null
				let value = object[name]
				if(is_function(value)) value = value.bind(object)
				else switch(type){
					case 'map':
						value = is_nothing(value) && object.has(name) ? object.get(name):value
						break
					case 'set':
						value = is_nothing(value) ? Array.from(object)[name]:value
						break
				}
				if(is_nothing(value) && name === 'typename') value = type
				return is_nothing(value) ? null:value
			}

			function dot_data_has(name){
				if(type === 'invalid') return false
				if(name in object) return true
				switch(type){
					case 'set': return name in Array.from(object)
					case 'map': return object.has(name)
				}
				return false
			}

			function dot_data_set(name,value){
				if(type !== 'invalid'){
					if(type === 'map') object.set(name,value)
					else if(type === 'set') dot_data_update_set('set',name,value)
					else object[name] = value
				}
				return true
			}

			function dot_data_update_set(type,name,value){
				let values = Array.from(object)
				if(type === 'delete' && !is_nothing(values[name])) delete values[name]
				else if(type === 'set') values[name] = value
				return object = new Set(values)
			}
		}

		function get_dot_notation(x){
			return  {
				get container(){ return this.parts.slice( 0, this.count-1 ).join('.') },
				get count(){ return this.parts.length },
				origin:is_text(x) ? x:'',
				get parts(){ return 'particles' in this ? this.particles : this.particles = this.origin.split('.').filter(filter_empty_text).map(map_empty_text) },
				get selector(){ return this.parts.join('.') },
				get target(){ return this.parts[ this.count-1 ] },
				value(data){
					if(!is_data(data)) return null
					try { return this.parts.reduce((o, i) => o[i], data) }
					catch (e) { return null }
				},
				toString(){ return this.origin },
				valueOf(){ return this.parts.join('.') }
			}
			//shared actions
			function filter_empty_text(text){ return is_text(text) }
			function map_empty_text(text){ return is_text(text) ? text.trim():null}
		}

		function get_dot_proxy(){
			return new Proxy(get_dot_notation,{ get:get_dot })
			//shared actions
			function get_dot(o,name){
				switch(name){
					case 'act': return get_dot_act
					case 'combine': return (...x)=>lodash.mergeWith(...x)
					case 'data': return get_dot_data
					case 'delete':
					case 'remove':
					case 'unset':
						return (...x)=>lodash.unset(...x)
					case 'get': return (...x)=>lodash.get(...x)
					case 'has': return (...x)=>lodash.has(...x)
					case 'join':
					case 'merge':
						return (...x)=>lodash.merge(...x)
					case 'pointer': return get_dot_pointer
					case 'set': return (...x)=>lodash.set(...x)
					case 'type': return get_dot_type
				}
			}
		}

		function get_dot_pointer(x,notifier){
			const notifies = notification=>is_data(notifier) && notification in notifier
			const dot = get_dot_proxy()
			return new Proxy(get_dot_data(x),{
				deleteProperty(o,field){
					let old = dot.get(o,field)
					dot.delete(o,field)
					if(notifies('change') && !is_nothing(old)) notifier.change(field,old,null,{type:'delete'})
					return true
				},
				get(o,field){
					let value = null
					if(notifies('value')) value = notifier.value(field)
					if(is_nothing(value)) value = dot.get(o,field)
					return is_nothing(value) ? null:value
				},
				has(o,field){
					let has = null
					if(notifies('has')) has = notifier.value(field)
					return !is_TF(has) ? dot.has(o,field):has
				},
				set(o,field,value){
					let old = dot.get(o,field)
					dot.set(o,field,value)
					if(notifies('change') && old !== value) notifier.change(field,old,value,{type:'set'})
					return true
				}
			})
		}

		function get_dot_type(value){
			if(is_array(value)) return 'array'
			else if(is_set(value)) return 'set'
			else if(is_map(value)) return 'map'
			else if(is_data(value)) return 'data'
			else if(is_function(value)) return 'function'
			return 'invalid'
		}
	}



	function id(){
		return {
			get capital(){ return this.capitalize },
			capitalize(value){ return is_text(value) ? windex.lodash.capitalize(value):'' },
			class(value){ return windex.lodash.words(value).map(word=>this.capitalize(word)).join('') },
			dash(value){ return is_text(value) ? windex.lodash.kebabCase(value):'' },
			dot_notation(value){ return this.words(value).join('.') },
			get dots(){ return this.dot_notation },
			medial(value){ return is_text(value) ? windex.lodash.camelCase(value):'' },
			path(value){ return this.words(value).join('/') },
			proper(value){ return this.words(value).map(word=>this.capitalize(word)).join(' ') },
			readable(value){ return this.words(value).join(' ') },
			underscore(value){ return is_text(value) ? windex.lodash.snakeCase(value):'' },
			words(value){ return is_text(value) ? windex.lodash.words(value):[] },
			get _(){ return this.underscore }
		}
	}

	function is(){
		return {
			array:is_array,
			get bool(){ return this.TF },
			count:is_count,
			data:is_data,
			defined:is_defined,
			element:is_element,
			element_data:is_element_data,
			email:is_email,
			empty:is_empty,
			error:is_error,
			function:is_function,
			instance:is_instance,
			json:is_json,
			map:is_map,
			nothing:is_nothing,
			number:is_number,
			numeric:is_numeric,
			object:is_object,
			set:is_set,
			get string(){ return this.text },
			symbol:is_symbol,
			text:is_text,
			TF:is_TF
		}
	}
	function is_array(value){ return is_object(value) && Array.isArray(value) }
	function is_count(value,count = 1){
		if(is_nothing(value)) return false
		if(is_text(value)) value = value.trim()
		if(is_text(value) || is_array(value)) return value.length >= count
		if(is_map(value) || is_set(value)) return value.size >= count
		if(is_object(value)) return Object.keys(value).length >= count
		return false
	}
	function is_data(value){ return is_object(value) && !is_array(value) && !is_error(value) }
	function is_defined(value){ return 'customElements' in window && !is_nothing(window.customElements.get(value)) }
	function is_element(value,type){ return is_instance( value, type || HTMLElement) }
	function is_element_data(value){ return is_object(value) || is_json(value) }
	function is_email(value){ return is_text(value) && email_regular_expression.test(value) }
	function is_empty(value){ return !is_count(value) }
	function is_error(value){ return is_object(value) && value instanceof Error }
	function is_function(value){ return typeof value === 'function' }
	function is_instance(value,type){ return is_object(value) && is_function(type) && value instanceof type }
	function is_json(value){ return is_text(value) && /^[\],:{}\s]*$/.test(value.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, '')) }
	function is_map(value){ return is_object(value) && value instanceof Map }
	function is_nothing(value){ return typeof value === 'undefined' || value === null || (typeof value === 'number' && isNaN(value)) }
	function is_number(value){ return typeof value === 'number' && !isNaN(value) && isFinite(value) }
	function is_numeric(value){ return !is_symbol(value) && is_number(parseFLoat(value)) }
	function is_object(value){ return typeof value === 'object' && value !== null }
	function is_set(value){ return is_object(value) && value instanceof Set }
	function is_symbol(value){ return typeof value === 'symbol'}
	function is_text(value){ return typeof value === 'string' || (is_object(value) && value instanceof String)}
	function is_TF(value){return typeof value === 'boolean'}

	function field(name,field_case='underscore'){
		return {
			action(action){ return ({[this.identifier]:(...x)=>action(...x)})[this.identifier] },
			define(object,getter,setter){
				const definition = {get:getter}
				if(is_function(setter)) definition.set = setter
				return Object.defineProperty(object,this.identifier,definition)
			},
			get identifier(){ return id()[field_case](name) },
			notation(...dots){
				const suffix = dots.map(i=>i.trim()).filter(i=>i.length).join('.')
				const notation = name.includes('.') || name.includes('[') ? name:this.identifier
				return suffix.length ? `${name}.${suffix}}`:notation
			},
			value(object,...dots){
				let value = null
				if(is_object(object)) value = windex.lodash.get(object,this.notation(...dots))
				return is_nothing(value) ? null:value
			}
		}
	}

	function setting(){ return data=>typeof data !== 'object' && data !== null ? {}:data }

	function uid() {
		// I generate the UID from two parts here
		// to ensure the random number provide enough bits.
		var firstPart = (Math.random() * 46656) | 0
		var secondPart = (Math.random() * 46656) | 0
		firstPart = ("000" + firstPart.toString(36)).slice(-3)
		secondPart = ("000" + secondPart.toString(36)).slice(-3)
		return firstPart + secondPart
	}

}