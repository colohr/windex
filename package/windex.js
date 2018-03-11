function export_windex(windex,window){
	Object.defineProperty(windex,'gui',{get(){ return windex.html.gui }})
	windex.loading = get_loading
	windex.binds = binds

	//load
	load()

	//exports
	return windex

	//shared actions
	function binds(value){
		if(typeof value === 'function') return typeof value.bind === 'function'
		return false
	}
	function get_loading(...elements){
		return {
			elements,
			show(){
				document.body.style.cursor = ''
				this.elements.forEach(hidden=>{
					hidden.style.opacity=1
					setTimeout(()=>{
						hidden.style.transition = ''
						hidden.style.willChange = ''
					},350)
					return this
				})
			},
			hide(){
				document.body.style.cursor = 'wait'
				this.elements.forEach(hidden=>{
					hidden.style.opacity=0
					window.requestAnimationFrame(()=>{
						setTimeout(()=>{
							hidden.style.transition = 'opacity 300ms ease-in-out 100ms'
							hidden.style.willChange = 'opacity'
						},40)
					})


				})
				return this
			}
		}.hide()
	}
	function load(){
		document.addEventListener('DOMContentLoaded', content_loaded,false)
		//shared actions
		function content_loaded(){
			window.dispatchEvent(new CustomEvent('windex',{bubbles:true,detail:windex}))
		}
	}

}