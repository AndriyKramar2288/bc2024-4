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

function getPicture(cashe_way, code) {
    const way = path.normalize(`${cashe_way}${code}.png`);

    return fsp.readFile(way, "binary");
}


function requestListener(req, res) {
    const code_number = req.url;

    switch (req.method) {
    case "GET":
        getPicture(options.cashe, code_number)
        .then(
            (result) => {
                res.writeHead(200, {"Content-Type": "image/jpeg"});
                res.end(result);
            })
        .catch((error) => {
                res.writeHead(404);
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