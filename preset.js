const windex = require('./package/index')
module.exports = windex().then(()=>'ready')