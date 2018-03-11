function export_html(){
	const {is} = windex
	class HTML{
		static get create(){ return create }
		static get design(){ return design }
		static get set(){ return set_element }
		static get ui(){ return get_ui }
		constructor(target = document){
			this.target = target
			this.gui = get_ui(target)
		}
		all(selector, target=document){ return Array.from((target || this.target || document).querySelectorAll(selector || '*')) }
		get create(){ return this.constructor.create }
		design(...x){ return this.constructor.design(this.target,...x) }
		query(selector, target=document){ return (target || this.target || document).querySelector(selector || '*') }
		set(...x){ return this.constructor.set(this.target,...x) }
		get ui(){ return this.constructor.ui }
	}

	//exports
	return new Proxy(create_html,{
		get(o,field){
			if(field in HTML) return HTML[field]
			const html = get_html()
			return field in html ? html[field]:null
		},
		has(o,field){return field in HTML || field in get_html() }
	})

	//shared actions
	function create(tag,setting){
		const element = document.createElement(tag || 'div')
		return set_element(element,setting)
	}

	function create_html(target=document){ return new HTML(target) }

	function design(element,...x){
		if(!is.element(element)) element = document.body
		if(x.length === 0) return window.getComputedStyle(element)
		const name = x[0]
		const value = x[1]
		let data = null
		if(is.data(name)) data = name
		if(is.nothing(value) === value) data = {[name]:value}
		else if(value === null) data = {[name]:''}
		if(data) Object.assign(element.style,data)
		return is.text(name) ? window.getComputedStyle(element)[name]:window.getComputedStyle(element)
	}

	function get_html(){
		if('document' in HTML) return HTML.document
		return HTML.document = create_html()
	}

	function get_ui(element){
		return new Proxy(element,{
			get(o,field){ return typeof field !== 'string' ? null:o.getElementById(field) },
			has(o,field){ return typeof field !== 'string' ? null:o.getElementById(field) !== null },
			set(o,field,value){
				if(typeof field === 'string'){
					const target = o.getElementById(field)
					if(target){
						if(typeof value === 'string') target.innerHTML = value
						else if(value instanceof HTMLElement) target.appendChild(value)
					}
				}
				return true
			}
		})
	}

	function set_element(element,setting){
		if(!is.element(element)) element = document.body
		setting = windex.setting(setting)
		for(const name in setting){
			const value = setting[name]
			switch(name){
				case 'attribute':
				case 'attributes':
				case 'data':
					for(const name in value) element.setAttribute(name,value[name])
					break
				case 'css':
				case 'design':
				case 'style':
					design(element,value)
					break
				case 'html':
					element.innerHTML = value
					break
				default:
					element[name] = is.function(value) ? value.bind(element):value
					break
			}
		}
		return element
	}
}