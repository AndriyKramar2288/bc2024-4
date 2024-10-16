const { program } = require("commander");
const http = require("http");
const fsp = require("node:fs/promises");
const path = require('node:path');


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
    console.log(way);
    return fsp.readFile(way);
}

function makePicture(way, data) {
    return fsp.writeFile(way, data);
}

function requestListener(req, res) {
    const way = path.normalize(path.join(__dirname, options.cashe,`${req.url}.png`));

    switch (req.method) {
    case "GET":
        getPicture(way)
        .then(
            (result) => {
                res.writeHead(200, {"Content-Type": "image/png"});
                res.end(result);
            })
        .catch((error) => {
                res.writeHead(404);
                res.end();
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
            });
        });
        break;

    default:
        res.writeHead(405);
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