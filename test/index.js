const windex = require('../index')
const express = require('express')
const app = express()
app.use(express.static(__dirname))
app.use(windex.router(false,true))


start().then(()=>{
	console.log('Windex test:')
	console.log(`http://localhost:8181`)
}).catch(console.error)

async function start(){
	//await windex()
	return new Promise(success=>{
		return app.listen(8181,()=>{
			return success()
		})
	})
}
