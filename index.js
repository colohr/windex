const fxy = require('fxy')
const windex = {
	file:'windex.js',
	map:'windex.js.map',
	get content(){ return load_windex },
	get router(){ return get_router }
}


//exports
module.exports = windex

//shared actions
async function load_windex(origin){
	const file = fxy.join(__dirname,windex.file)
	const map = fxy.join(__dirname,windex.map)
	if(!fxy.exists(file)) return await load_files()
	return await read_files()
	//shared actions
	async function load_files(){
		const load = require('./package/index')
		await load(origin)
		return await read_files()
	}
	async function read_files(){
		return {
			file:await fxy.read_file(file,'utf8'),
			map:await fxy.read_file(map,'utf8')
		}
	}
}

function get_router(){
	return function get_http(request,response,next){
		const target = 'originalUrl' in request ? request.originalUrl:request.url
		if(target && target.includes(windex.file)){
			const host = request.get('host')
			const protocol = request.protocol
			const origin = `${protocol}://${host}/`
			const field = target.includes(windex.map) ? 'map':'file'
			return load_windex(origin).then(content=>{
				switch(field){
					case 'file':
						const map_url = `${origin}${target}.map`
						response.set('SourceMap',`${map_url}`)
						response.send(content.file)
						break
					case 'map':
						response.send(content.map)
						break
				}
			}).catch(e=>response.end())
		}
		return next()
	}
}

