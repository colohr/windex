function export_http(){

	windex.http = get_http()
	//shared actions

	function get_http(){
		return new Proxy(get_source,{
			get(o,name){
				switch(name){
					case 'get':
					case 'post':
					case 'search':
					case 'put': return get_source_method(name)
					case 'data': return get_source_method('post',name, {'Content-Type': 'application/json', 'Accept': 'application/json'})
					case 'url':
					//case 'locator': return get_uniform_resource_locator
					case 'local': return window.location.origin.includes('localhost')
					case 'location': return window.location
					case 'origin': return window.location.origin
					case 'secure': return window.location.protocol === 'https:'
				}
				return null
			}
		})
		//shared actions
		function get_source_method(method,type,preset_headers){
			method=method.toUpperCase()
			return (location,options,headers)=>{
				return get_source(location,get_method_options(options))
				//shared actions
				function get_method_options(input){
					const options = get_options({method,headers:{}})
					if(type === 'data') options.body = input
					else if(typeof input === 'object') Object.assign(options,input)
					if(preset_headers) options.headers = Object.assign(options.headers,preset_headers)
					if(headers) options.headers = Object.assign(options.headers,headers)
					return options
				}
			}
		}
	}

	function get_source(location,options){
		const {is} = windex
		options = windex.setting(options)
		const {body,headers,method,exporter} = options
		return new Promise((success,error)=>{
			const locator = new XMLHttpRequest()
			locator.responseType = 'text'
			locator.open(method || 'GET', location)
			if(headers) for(let name in headers) locator.setRequestHeader(name, headers[name])
			locator.onload = on_load
			locator.onerror = on_error
			//load
			locator.send(get_body())
			//shared actions
			function get_body(){
				if(typeof body === 'object' && body !== null){
					try{ return JSON.stringify(body) }
					catch(e){ console.error(e) }
				}
				return undefined
			}
			function on_error(e){ return error(e) }
			function on_load(){
				return success({
					get content(){ return this.locator.responseText },
					locator,
					get data(){ return get_json() },
					eval:()=>Promise.resolve(get_module()),
					json:()=>Promise.resolve(get_json()),
					get module(){ return get_module(this.content) },
					get response(){ return this.locator.response },
					text:()=>Promise.resolve(this.locator.response)
				})
				//shared actions
				function get_json(){
					try{ return JSON.parse(locator.response) }
					catch(e){ console.error(e) }
					return null
				}
				function get_module(content){ return is.function(exporter) ? exporter(content):eval(content) }
			}
		})
	}



}