const bound_data = Symbol.for('bound data')
const bound_template = Symbol.for('bound template')

class Binder extends Map{
	constructor(array){
		super(array)
		const templates = Array.from(document.querySelectorAll('template'))
		for(const item of templates) this.set(item.id,item)
	}
	bind(container,...data){
		const type = container.getAttribute('bind')
		if(type === ''){
			if(!(bound_template in container)) container[bound_template] = container.innerHTML
			const html = data.map(item=>set_data(container[bound_template],item))
			container.innerHTML = html.join('')
		}
		else{
			const elements = data.map(item=>this.create(type,item))
			for(const element of elements) {
				if(typeof element === 'string') container.innerHTML += element
				else container.appendChild(element)
			}
		}
		return container
	}
	get content(){ return get_content(this) }
	create(type,data){
		const template = this.get(type)
		if(typeof template === 'string') return set_data(template,data)
		const clone = document.importNode(template.content, true)
		clone[bound_data] = data
		const target = clone.firstElementChild
		set_attributes(target,data).innerHTML = set_data(target.innerHTML,data)
		return clone
	}
	data(element){ return element[bound_data] }
	get element(){ return get_element() }
	get elements(){ return get_elements() }
	html(type,data){
		if(!this.has(type)) return ''
		const template = this.get(type)
		if(typeof template === 'string') return set_data(template,data)
		const clone = document.importNode(template.content, true)
		const target = set_attributes(clone.firstElementChild,data)
		return set_data(target.outerHTML,data)
	}
	get template(){ return get_template() }
	get type(){ return get_type(this) }
	get types(){ return get_type(this,true) }
}

//exports
return (...x) => new Binder(get_binder_map(...x))

//shared actions
function get_binder_map(data,...x){
	if(windex.is.nothing(data)) return []
	if(windex.is.data(data)) return Object.keys(data).map(name=>([name,data[name]]))
	return [data].concat(x)
}

function get_content(binder){
	return new Proxy(binder,{
		get(o,field){ return data=>o.html(field,data) },
		has(o,field){ return o.has(field) },
		ownKeys(o){ return Array.from(o.keys()) }
	})
}

function get_element(){
	return new Proxy(window.document,{
		get:(o,field) => typeof field === 'string' ? o.querySelector(`[bind="${field}"]`):null,
		has:(o,field) => typeof field === 'string' ? o.querySelector(`[bind="${field}"]`) !== null:false,
		ownKeys:get_fields
	})
}

function get_elements(){
	return new Proxy(window.document,{
		get:(o,field) => typeof field === 'string' ? Array.from(o.querySelectorAll(`[bind="${field}"]`)):[],
		has:(o,field) => typeof field === 'string' ? o.querySelectorAll(`[bind="${field}"]`).length > 0:false,
		ownKeys:get_fields
	})
}

function get_fields(o){
	const all = Array.from(o.querySelectorAll('[bind]')).map(element=>element.getAttribute('bind'))
	return new Set(all)
}

function get_template(){
	return new Proxy(window.document,{
		get(o,field){ return typeof field === 'string' ? o.querySelector(`template#${field}`):null },
		has(o,field){ return typeof field === 'string' ? o.querySelector(`template#${field}`) !== null:false },
		ownKeys(o){ return Array.from(o.querySelectorAll('template')).map(element=>element.getAttribute('id')) }
	})
}

function get_type(binder, all=false){
	return new Proxy(binder,{
		get:get_type,
		has(o,field){ return field in o.template },
		set:set_type,
		ownKeys(o){ return Object.getOwnPropertyNames(o.template) }
	})

	//shared actions
	function bind_type(o,elements,...values){
		for(const container of elements) o.bind(container,...values)
		return true
	}

	function get_type(o,field){
		if(field in o.template) return (...values)=>set_type(o,field,values)
		return null
	}

	function set_type(o,field,value){
		const elements = all === true ? o.elements[field]:[o.element[field]]
		if(elements.length && value && typeof value === 'object'){
			if(!Array.isArray(value)) value = [value]
			return bind_type(o,elements,...value)
		}
		return true
	}
}

function set_attributes(target,data){
	const attributes = target.attributes
	const count = attributes.length
	for(let i=0;i<count;i++){
		const attribute = attributes.item(i)
		const value = attribute.value
		if(value){
			const new_value = set_data(value,data)
			if(value !== new_value) target.setAttribute(attribute.name,new_value)
		}
	}
	return target
}


function set_data(text,data){
	let dot_notation = get_data_name(text)
	if(dot_notation === null) return text
	const replacer = ['\$\{',dot_notation,'\}'].join('')
	const evaluation = eval(`(x)=>(x.${dot_notation})`)(data)
	//console.log(evaluation)
	text = text.replace(replacer,evaluation)
	return set_data(text,data)
}

function set_data_text(text,data){
	let dot_notation = get_data_name(text)
	if(dot_notation === null) return text
	let data_value = get_dot_value(data,dot_notation)
	if(data_value === null) data_value = ''
	const replacer = ['\$\{',dot_notation,'\}'].join('')
	text = text.replace(replacer,data_value)
	return set_data(text,data)
}

function get_data_name(text){
	if(text.indexOf('${') === -1) return null
	return text.substring(text.lastIndexOf("${")+2,text.lastIndexOf("}"))
}

function get_dot_value(object, selector){
	try{return selector.split('.').reduce((o, i) => o[i], object)}
	catch(e){return null}
}



