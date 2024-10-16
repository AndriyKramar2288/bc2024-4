const { program } = require("commander");
const http = require("http");
const fsp = require("node:fs/promises");
const path = require('node:path');
const superagent = require('superagent');

function preparing() {
    // опис параметрів програми
    program
        .option("-h, --host <value>", "Host location")
        .option("-p, --port <value>", "Port location")
        .option("-c, --cashe <value>", "Cashe location");
    // парсинг тих параметрів
    program.parse()


    // отримання об'єкта, для зручного одержання параметрів
	const options = program.opts();


	// перевірка параметрів на правильність
	// перевірка на наявність обов'язкових параметрів
	if (!options.host || !options.port || !options.cashe) {
		throw Error("Please, specify necessary param");
	}

	return options;	
}


const options = preparing();


function getPicture(way) {
    return fsp.readFile(way);
}


function makePicture(way, data) {
    return fsp.writeFile(way, data);
}


function deletePicture(way) {
    return fsp.unlink(way);
}

function downloadPicture(code) {
    const agent = superagent.get(`https://http.cat/${code.toString().substring(1)}`);
    return agent;
}

function debug(req, code) {
    console.log(`Request method: ${req.method}\tResponse code: ${code}`);
}


function requestListener(req, res) {
    const way = path.normalize(path.join(__dirname, options.cashe,`${req.url}.jpg`));

    switch (req.method) {
    case "GET":
        getPicture(way)
        .then(
            (result) => {
                res.writeHead(200, {"Content-Type": "image/jpg"});
                res.end(result);
                debug(req, 200);
            })
        .catch((error_of_getting) => {
                downloadPicture(req.url)
                    .then((result_of_download) => {
                        makePicture(way, result_of_download.body)
                            .then((result_of_making_picture) => {});

                        res.writeHead(200, {"Content-Type": "image/jpg"});
                        res.end(result_of_download.body);
                        debug(req, 200);
                    })
                    .catch((error_of_downloading) => {
                        res.writeHead(404);
                        res.end();
                        debug(req, 404);
                    });
            });
        break;

    case "PUT":
        let data = [];
        req.on("data", (chunk) => {
            data.push(chunk);
        });

        req.on("end", () => {
            makePicture(way, Buffer.concat(data))
            .then((result) => {
                res.writeHead("201");
                res.end();
                debug(req, 201);
            });
        });
        break;

    case "DELETE":
        deletePicture(way)
            .then((result) => {
                res.writeHead("200");
                res.end();
                debug(req, 200);
            })
            .catch((error) => {
                res.writeHead("404");
                res.end();
                debug(req, 404);
            });
        break;

    default:
        res.writeHead(405);
        debug(req, 405);
    }
}


function main() {
    server = http.createServer(requestListener);

    const host = options.host;
    const port = options.port;

    server.listen(port, host, () => {
        console.log(`Server started, url -> ${options.host}:${options.port}`);
    })
}

main();