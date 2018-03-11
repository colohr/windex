class Folder extends Map{
	constructor(modules_folder = '/logic/', exporter){
		super()
		const last = modules_folder.charAt(modules_folder.length-1)
		this.modules_folder = last !== '/' ? modules_folder+'/':modules_folder
		if(exporter) this.exporter = exporter
	}
	get create(){ return get_create(this) }
	get exporter_name(){ return 'exporter' in this ? this.exporter.name:null}
	get exporter_template(){ return 'exporter' in this ? this.exporter:null }
	make(...x){ return get_make(this,...x) }
	load(locator,...x){ return load_module(this,locator,...x) }
	load_content(...x){ return load_content(this,...x) }
	locator(name){ return `${this.modules_folder}${name}`}
	get modules(){ return get_modules(this) }
}

//exports
return (...x)=>new Folder(...x)

//shared actions
function default_exporter_template(content,components){
	const exporter_name = components.exporter_name || 'module_exports'
	const has_export = content.includes(exporter_name)
	const modules_names = get_module_names(components)
	const return_value = has_export ? `return ${exporter_name}()`:''
	return `(function export_module({${modules_names.join(',')}},components,window){
		${content}
						
		${return_value}
	})`
}

function get_create(x){
	return new Proxy(x,{
		get(o,field){ return typeof field === 'string' ? (...x)=>o.make(field,...x):null },
		has(o,field){ return o.has(field) }
	})
}

async function get_make(modules, name, ...x){
	const Module = await modules.load(name)
	if(Module) return new Module(...x)
	return null
}

function get_module_names(modules){ return Array.from(modules.keys()) }

function get_modules(modules){
	const data = {}
	for(const [field,value] of modules) {
		if(!(field in data)) Object.defineProperty(data,field,{ get(){ return value } })
	}
	return data
}

async function load_content(components,url,options){
	const locator = get_locator(url)
	const name = get_name()
	options = windex.setting(options)
	options.exporter = get_module
	const response = await windex.http(locator,options)
	response.name = name
	return response
	//shared actions
	function get_locator(url){ return windex.locator(!url.includes('.js') ? `${url}.js`:url) }
	function get_module(content){

		try{
			const exporter_template = components.exporter_template ? components.exporter_template:default_exporter_template
			const exporter = eval(exporter_template(content,components))
			return exporter(components.modules,components,window)
		}
		catch(e){ console.error(e) }
		return null
	}
	function get_name(){
		const parts = url.split('/')
		const file = parts[parts.length-1]
		return file.replace('.js','')
	}
}

async function load_module(modules, name, ...x){
	if(modules.has(name)) return modules.get(name)
	const locator = modules.locator(name)
	try{
		const result = await load_content(modules,locator,...x)
		const exported = result.module
		return modules.set(result.name,exported).get(result.name)
	}
	catch(e){
		console.log(locator)
		console.log(name)
		console.error(e)
		return null
	}
}

