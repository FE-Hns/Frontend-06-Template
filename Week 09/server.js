const http = require('http')

http.createServer((request,response) => {
    let body = []
    request.on('error', (err) => {
        console.error(err)
    }).on('data', (chunk) => {
        body.push(chunk.toString())
    }).on('end',() => {
        body = Buffer.concat(body).toString()
        console.log('body', body)
        response.writeHead(200, {'Content-Type': 'text/html'})
        response.end(`
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <body>
            <div>
                test
            </div>
        </body>
        </html>
        
        `)
    })
}).listen(8088)

console.log('server started')