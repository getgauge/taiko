var app = require('the-internet-express');
var server;

beforeSuite(async () => {
    server = app.listen(3001, () => {
        console.log('starting internet-express server at 3001');
    })
})

afterSuite(async () => {
    server.close(() => console.log('internet-express server closed'));
})