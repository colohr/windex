const {is,dot} = windex
const limit = 100000
const whens = new Map()

//exports
return when

//shared actions
function create(notation){
	const data = { id:windex.uid(), count:0, notation }
	return whens.set(data.id,data).get(data.id)
}

function get_values(waiter){
	const list = []
	try{
		for(const notation of waiter.notation){
			const value = dot.get(window,notation)
			if(!is.nothing(value)) list.push(value)
		}
	}
	catch(e){}
	return list
}

function get_when(promise){
	return new Proxy(promise,{
		get(o,field){
			let value = null
			if(field in o){
				value = o[field]
				if(is.function(value)) value = value.bind(o)
			}
			else switch(field){
				case 'ready':
				case 'done':
				case 'loaded':
					value = on_when=>o.then(results=>on_when(...results))
					break
			}
			return value
		},
		has(o,field){ return field in o }
	})
}

function remove(waiter){
	window.clearInterval(waiter.timer)
	whens.delete(waiter.id)
	return true
}

function wait(waiter,success,error){
	const count = waiter.notation.length
	const values = get_values(waiter)
	if(count === values.length){
		remove(waiter)
		success(values)
	}
	else if(waiter.count >= limit){
		remove(waiter)
		error(new Error(`Waiter for ${waiter.notation.join('\n')} reached limit.`))
	}
	waiter.count++
}

function when(...notation){
	const waiter = create(notation)
	return get_when(new Promise((success,error)=>{
		return waiter.timer = window.setInterval(on_timer,500)
		//shared actions
		function on_timer(){ wait(waiter,success,error) }
	}))
}
