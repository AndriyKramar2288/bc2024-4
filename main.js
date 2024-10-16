// модулі
const { program } = require("commander");
const http = require("http");
const fsp = require("node:fs/promises");
const path = require('node:path');
const superagent = require('superagent');

// функція повністю займається параметрами, повертає об'єкт з ними
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

// глобальна(фу) змінна з параметрами
const options = preparing();

// повертає проміс з читанням картинки
function getPicture(way) {
    return fsp.readFile(way);
}

// повертає проміс з створенням картинки
function makePicture(way, data) {
    return fsp.writeFile(way, data);
}

// повертає проміс з видаленням картинки
function deletePicture(way) {
    return fsp.unlink(way);
}
// повертає проміс з скачуванням картинки
function downloadPicture(code) {
    const agent = superagent.get(`https://http.cat/${code.toString().substring(1)}`);
    return agent;
}
// для дебагу: виводить метод запиту та код відповіді
function debug(req, code) {
    console.log(`Request method: ${req.method}\tResponse code: ${code}`);
}
// слухач, параметри зі запитом request та відповідю response
function requestListener(req, res) {
    // шлях розмізщення картинок саме у файловій системі
    const way = path.normalize(path.join(__dirname, options.cashe,`${req.url}.jpg`));
    // залежно від отриманого запиту . . .
    switch (req.method) {
    case "GET":     // передаєм клієнтові картинку
        getPicture(way) 
        .then(                  // для випадку, коли фото вже скачане у кеш
            (result) => {
                res.writeHead(200, {"Content-Type": "image/jpg"}); // повертає беззаперечне ОК
                res.end(result); 
                debug(req, 200);
            })
        .catch((error_of_getting) => {  // якщо при спробі дістати з кешу сталась біда, тоді це
                downloadPicture(req.url)        
                    .then((result_of_download) => {    // якщо вдало дістало картинку з інтернету
                        makePicture(way, result_of_download.body) // скачує дістану картинку
                            .then((result_of_making_picture) => {});

                        res.writeHead(200, {"Content-Type": "image/jpg"}); // абсолютне ОК
                        res.end(result_of_download.body); // в тілі відповіді результат скачування з інтернету
                        debug(req, 200);
                    })
                    .catch((error_of_downloading) => { // якщо в процесі скачування з інтернету помилка
                        res.writeHead(404);            // (умовно, нема такого ресурсу), то 404
                        res.end();
                        debug(req, 404);
                    });
            });
        break;

    case "PUT":   // отримаємо від клієнта картинку
        let data = []; // список для кусочків картинки
        req.on("data", (chunk) => { // почастково
            data.push(chunk);       // додає несчасну картинку в список
        });

        req.on("end", () => {                    // коли додавання завершено,
            makePicture(way, Buffer.concat(data))// утворює буфер зі списку (інакше ніяк)
            .then((result) => {
                res.writeHead("201");   // завантажено
                res.end();
                debug(req, 201);
            });
        });
        break;

    case "DELETE":   // клієнт видаляє картинку з кеша сервера
        deletePicture(way)
            .then((result) => {  // всьо добре
                res.writeHead("200");
                res.end();
                debug(req, 200);
            })
            .catch((error) => {  // всьо зле (нема шо видаляти, в процесі видалення виняток)
                res.writeHead("404");
                res.end();
                debug(req, 404);
            });
        break;

    default:
        res.writeHead(405); // якщо клієнт зробив запит з невідомим методом
        debug(req, 405);
    }
}


function main() {  // головна функція
    server = http.createServer(requestListener); // сервер з нашим слухачем

    const host = options.host; // надані користувачем параметри
    const port = options.port;

    server.listen(port, host, () => { // почало працювати
        console.log(`Server started, url -> ${options.host}:${options.port}`);
    })
}

main(); // let's go!