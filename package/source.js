function export_source(){
	const Source = {
		find:find_source,
		load:load_source,
		files:get_source_files
	}

	//exports
	windex.source = Source

	//shared actions
	function find_source(source){
		source = `${source}`
		const matcher = windex.locator.matcher(source)
		const tag = source.includes('.js') ? 'script':'link'
		const scripts = Array.from(document.querySelectorAll(tag))
		return scripts.filter(matcher)[0]
	}

	function load_source(source){
		return new Promise((success,error)=>{
			const tag = source.includes('.css') ? 'link':'script'
			const element = document.createElement(tag)
			const locator = windex.locator(source)
			element.setAttribute('async','')
			element.setAttribute('defer','')
			switch(tag){
				case 'link':
					element.setAttribute('rel','stylesheet')
					element.href = locator
					break
				case 'script':
					element.src = locator
					break
			}
			element.onload = ()=>success()
			element.onerror = e=>error(e)
			return tag === 'script' ? document.body.appendChild(element):document.head.appendChild(element)
		})
	}

	function get_source_files(locator){
		const script_element = find_source(locator)
		if(script_element && script_element.hasAttribute('load')) return script_element.getAttribute('load').split(',').map(x=>x.trim()).filter(x=>x.length)
		return []
	}
}