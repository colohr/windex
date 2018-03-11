function export_locator(){
	const Locator = {
		get hash(){ return get_hash },
		get join(){ return get_joiner },
		get matcher(){ return get_matcher },
		protocols:['http','https','ws','wss']
	}
	//exports
	windex.locator = new Proxy(get_locator,{
		get(o,field){
			if(field in Locator) return Locator[field]
			else if(field in o) return o[field]
			return null
		},
		has(o,field){ return field in o || field in Locator }
	})

	//shared actions
	function get_hash(){
		let hash = window.location.hash
		if(hash) hash = hash.substr(1,hash.length)
		return hash
	}

	function get_joiner(...x){
		const parts = (has_origin() ? []:[window.location.origin]).concat(x)
		const url = new URL(parts.join('/'))
		url.pathname = fix_paths(url.pathname)
		return `${url}`
		//shared actions
		function fix_paths(paths){ return paths.split('/').map(p=>p.trim()).filter(i=>i.length).join('/') }
		function has_origin(){ return x.filter(i=>Locator.protocols.filter(p=>i.includes(p)).length > 0).length }
	}

	function get_locator(url){ return url.indexOf('http') === 0 ? url:new URL(!url.includes('.js') ? `${url}.js`:url,window.location) }

	function get_matcher(source){
		const url = get_locator(source)
		const expression = new RegExp(url.pathname,'i')
		return element=>expression.test(element.getAttribute(get_attribute(element)))
		//shared actions
		function get_attribute(element){ return element.localName === 'script' ? 'src':'href' }
	}


}