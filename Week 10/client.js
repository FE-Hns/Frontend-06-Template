const images = require('images');
const net = require('net');
const parser = require('./parser.js');
const render = require('./render');

class Request {
    /**
     * Set the options of the request
     * @param {object} options attribute of one request
     */
    constructor(options) {
        this.method = options.method || "GET";
        this.host = options.host;
        this.port = options.port || 80;
        this.path = options.path || "/";
        this.body = options.body || {};
        this.headers = options.headers || {};
        if (!this.headers["Content-Type"]) {
            this.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        if (this.headers["Content-Type"] === "application/json")
            this.bodyText = JSON.stringify(this.body);
        else if (this.headers["Content-Type"] === "application/x-www-form-urlencoded")
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&');

        this.headers["Content-Length"] = this.bodyText.length;
    }

    /**
     * Build connection and send request
     * @param {net.connection} connection 
     */
    send(connection) {
        return new Promise((resolve, reject) => {
            const parser = new ResponseParser;

            // build connnection
            if (connection) {
                connection.write(this.toString());
            } else {
                try {
                    connection = net.createConnection({
                        host: this.host,
                        port: this.port
                    }, () => {
                        connection.write(this.toString());
                    })
                } catch (err) {
                    reject(err);
                }
            }

            // get data and parse data
            connection.on('data', (data) => {
                parser.receive(data.toString());
                if (parser.isFinished) {
                    resolve(parser.response);
                    connection.end();
                }
            });

            // handle error
            connection.on('error', (err) => {
                reject(err);
                connection.end();
            });
        })
    }

    /**
     * fixed request content
     */
    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r
\r
${this.bodyText}`
    }
}

/**
 * Parse the response data
 */
class ResponseParser {
    constructor() {
        this.WAITING_STATUS_LINE = 0; // version, status code, status text
        this.WAITING_STATUS_LINE_END = 1; // \r\n
        this.WAITING_HEADER_NAME = 2; // name
        this.WAITING_HEADER_SPACE = 3; // :后的空格
        this.WAITING_HEADER_VALUE = 4; // value
        this.WAITING_HEADER_LINE_END = 5; // \r\n
        this.WAITING_HEADER_BLOCK_END = 6; // header 后的空行
        this.WAITING_BODY = 7; // body

        this.current = this.WAITING_STATUS_LINE;
        this.statusLine = "";
        this.headers = {};
        this.headerName = "";
        this.headerValue = "";
        this.bodyParser = null;
    }

    /**
     * get if parse finished
     */
    get isFinished() {
        return this.bodyParser && this.bodyParser.isFinished;
    }

    /**
     * get the formated response
     */
    get response() {
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyParser.content.join('')
        }
    }

    /**
     * Handle the response in string
     * @param {string} string response in string
     */
    receive(string) {
        for (let i = 0; i < string.length; i++) {
            this.receiveChar(string.charAt(i));
        }
    }

    /**
     * Parse the response charactor to charactor
     * @param {string} char one character
     */
    receiveChar(char) {
        if (this.current === this.WAITING_STATUS_LINE) {
            if (char === '\r') {
                this.current = this.WAITING_STATUS_LINE_END;
            } else {
                this.statusLine += char;
            }
        } else if (this.current === this.WAITING_STATUS_LINE_END) {
            if (char === '\n') { // 换行为 \r\n, 上一个状态机已经匹配了 \n
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if (this.current === this.WAITING_HEADER_NAME) {
            if (char === ':') { // 如果是冒号，等后面的空格
                this.current = this.WAITING_HEADER_SPACE;
            } else if (char === '\r') { // 如果是 \r, 说明是空行，header 结束
                this.current = this.WAITING_HEADER_BLOCK_END;
                if (this.headers['Transfer-Encoding'] === 'chunked')
                    // headers 的属性已经集齐，可以根据传输的格式，创建对应的 bodyParser
                    this.bodyParser = new TrunkedBodyParser();
            } else {
                this.headerName += char;
            }
        } else if (this.current === this.WAITING_HEADER_SPACE) {
            if (char === ' ') {
                this.current = this.WAITING_HEADER_VALUE;
            }
        } else if (this.current === this.WAITING_HEADER_VALUE) {
            if (char === '\r') { // headers 的一行结束，KV 对儿存入 headers，清空接收空间
                this.current = this.WAITING_HEADER_LINE_END;
                this.headers[this.headerName] = this.headerValue;
                this.headerName = "";
                this.headerValue = "";
            } else {
                this.headerValue += char;
            }
        } else if (this.current === this.WAITING_HEADER_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if (this.current === this.WAITING_HEADER_BLOCK_END) {
            if (char === '\n') {
                this.current = this.WAITING_BODY;
            }
        } else if (this.current === this.WAITING_BODY) {
            this.bodyParser.receiveChar(char);
        }
    }
}

/**
 * Parse body of response
 */
class TrunkedBodyParser {
    constructor() {
        // chunk 是一个 16 进制长度后接一行内容
        // 遇到长度为 0 的 chunk，body 结束
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_END = 1;
        // 因为 chunk 里可以有任何字符，所以无法标定一个作为结束字符
        // 这里用读回来的长度计数，判断什么时候推出 READING_TRUNK 状态
        this.READING_TRUNK = 2;

        this.WAITING_NEW_LINE = 3;
        this.WAITING_NEW_LINE_END = 4;
        this.length = 0;
        this.content = [];
        this.isFinished = false;
        this.current = this.WAITING_LENGTH;
    }

    /**
     * Aggregate the characters in form of body
     * @param {string} char one character
     */
    receiveChar(char) {
        if (this.current === this.WAITING_LENGTH) {
            // 找到 换行 时，说明已经读完了一个 length
            if (char === '\r') {
                if (this.length === 0) {
                    this.isFinished = true;
                }
                this.current = this.WAITING_LENGTH_LINE_END;
            } else {
                // 因为传进来的是16进制，所以要乘以16。
                // 比如长度是 23，进来第一位 2 时，length 还是 0，所以相当于个位不变，在下一行写入十进制的数 0 + 2 = 2
                // 当下一位 3 传入的时候，原来的先传进来 2 变成了十位数，所以要 * 16，再加上新传的数字 3， 2 * 16 + 3 = 35
                this.length *= 16;
                // 再用 parseInt 写成10进制值
                this.length += parseInt(char, 16);
            }
        } else if (this.current === this.WAITING_LENGTH_LINE_END) {
            if (char === '\n') {
                this.current = this.READING_TRUNK;
            }
        } else if (this.current === this.READING_TRUNK) {
            // 存入字符
            this.content.push(char);
            this.length--;
            // 计数减到0，说明本行所有 char 已经解析完，进入等待换行状态
            if (this.length === 0) {
                this.current = this.WAITING_NEW_LINE;
            }
        } else if (this.current === this.WAITING_NEW_LINE) {
            if (char === '\r') {
                this.current = this.WAITING_NEW_LINE_END;
            }
        } else if (this.current === this.WAITING_NEW_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_LENGTH;
            }
        }
    }
}

/**
 * Send the request and handle the response
 */
void async function () {
    let request = new Request({
        method: "POST",
        host: "127.0.0.1",
        port: "8088",
        path: "/",
        headers: {
            ["X-Foo2"]: "customed"
        },
        body: {
            name: "winter"
        }
    });

    let response = await request.send();

    // 真正的浏览器里，html 是被逐段的取回解析的。为了理解方便，这里一次处理所有 body 内容
    let dom = parser.parseHTML(response.body);

    console.log('dom:');
    console.log(JSON.stringify(dom, null, '    '));
    console.log('');

    let viewport = images(800, 600);

    render(viewport, dom);

    viewport.save('viewport.jpg');

}();