const fxy = require('fxy')
const ES = require('uglify-es')
const skip_sources = ['lodash.js','utilities.js','windex.js','index.js']
const sources_list = fxy.tree(__dirname,'js').items.only.filter(item=>!skip_sources.includes(item.name)).map(item=>item.name)
const Loader = {
	sources:sources_list.map(get_file),
	utilities:[
		{
			file:'lodash.js',
			calls:true,
			mini:false
		},
		'utilities.js'
	].map(get_file)
}

//exports
module.exports = async function build_windex(host='',source_map,rename=false){
	const mini_setting = {mangle:rename === true, sourceMap:{}}
	if(host){
		//const map_url = fxy.source.url(host,'windex.js.map')
		//mini_setting.sourceMap = {filename:'windex.js',url:map_url}
	}

	const source = await load_windex()
	const mini = ES.minify(source,mini_setting)
	const file_name = fxy.join(__dirname,'../logic/windex.js')
	const map_file_name = fxy.join(__dirname,'../logic/windex.js.map')
	await fxy.write_file(map_file_name,mini.map,'utf8')
	await fxy.write_file(file_name,mini.code,'utf8')
	return source
	//shared actions
	async function load_windex(){
		const windex = await windex_file()
		const exporter = await windex_exporter()
		return `((...x)=>x[0].windex = x[1](x[2]({}),x[0]))(this,${windex},${exporter})`
	}

}



//shared actions
function file_locator(name){ return fxy.join(__dirname,name) }

function get_file(file){
	const data = fxy.is.data(file) ? file:{file}
	const locator = file_locator(data.file)
	const item = fxy.read_item(locator)
	return Object.assign(item,data)
}

function get_source(item){
	const name = get_name()
	const content = item.content.trim()
	//const content = item.mini === false ? item.content.trim():mini.minify(item.content.trim(),{}).code
	const exporter = `function export_${name}`
	return {
		name,
		content,
		get source(){ return get_source() },
		toString(){ return this.source }
	}
	//shared actions

	function get_called_export(){
		const caller = `${name}_caller`
		return `${exporter}(){ return (function ${caller}(exports,module){ ${content}; return exports.${name}; }).call(this,{},{exports:{}}) }`
	}
	function has_export(){ return content.indexOf(exporter) === 0 }
	function get_export(){
		if(item.calls) return get_called_export()
		else if(has_export()) return content
		return `${exporter}(){ ${content} }`
	}
	function get_name(){
		let item_name = item.name
		const extension = fxy.extname(item_name)
		item_name = item_name.replace(`${extension}`,'')
		item_name = item_name.replace('.min','')
		return fxy.id.underscore(item_name)
	}
	function get_source(){ return `{ export:${get_export()}, name:'${name}' }` }
}

function get_reducer(...sources){
	return `[${sources.join(',')}].reduce(function(modules,item){ const value = item.export(); return (modules[item.name]=value || modules[item.name],modules) },windex)`
}

function load_source(name){ return Loader[name].map(get_source) }


async function windex_exporter(){
	const utilities = await windex_utilities()
	const sources = await windex_sources()
	return `function windex_scope(windex){ return ((...x)=>x[0](x[1](x[2])))(${sources},${utilities},windex) }`
}

async function windex_file(){ return await fxy.read_file(file_locator('windex.js'),'utf8') }

async function windex_sources(){
	const sources = load_source('sources')
	const scope = get_reducer(...sources)
	return `function sources_scope(windex){ return ${scope} }`
}

async function windex_utilities(){
	const utilities = load_source('utilities')
	const scope = get_reducer(...utilities)
	return `function utilities_scope(windex){ return ${scope} }`
}