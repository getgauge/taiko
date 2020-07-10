const fs = require('fs')

module.exports = function(){
    try {
       return JSON.parse(fs.readFileSync('lib/api.json', 'utf-8')) 
    } catch (error) {
       throw new Error('Please run `npm run doc:api` to generate api metadata') 
    }
}