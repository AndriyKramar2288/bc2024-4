const { program } = require("commander");
const http = require("http");
//const

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

function requestListener(req, res) {

    res.writeHead("200");
    res.end("Hello!");
}




function main() {
    options = preparing();
    server = http.createServer(requestListener);

    const host = options.host;
    const port = options.port;

    server.listen(port, host, () => {
        console.log(`Server started, url -> ${options.host}:${options.port}`);
    })

}

main();