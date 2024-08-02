const http = require('http');
const fs = require('fs');

const PORT = 3000;
const FILE_PATH = './book.json';


function readBooksFile(callback) {
  fs.readFile(FILE_PATH, 'utf8', (err, data) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, JSON.parse(data));
    }
  });
}


function writeBooksFile(data, callback) {
  fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), 'utf8', (err) => {
    callback(err);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/books') {
    readBooksFile((err, books) => {
      if (err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'Internal Server Error'}));
      } else {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(books));
      }
    });
  } else if (req.method === 'GET' && req.url.match(/\/books\/\d+/)) {
    const id = parseInt(req.url.split('/')[2]);
    readBooksFile((err, books) => {
      if (err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'Internal Server Error'}));
      } else {
        const book = books.find(b => b.id === id);
        if (book) {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(book));
        } else {
          res.writeHead(404, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({message: 'Book not found'}));
        }
      }
    });
  } else if (req.method === 'POST' && req.url === '/books') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const newBook = JSON.parse(body);
      readBooksFile((err, books) => {
        if (err) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({message: 'Internal Server Error'}));
        } else {
          const exists = books.some(b => b.title === newBook.title);
          if (exists) {
            res.writeHead(400, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({message: 'Book already exists'}));
          } else {
            newBook.id = books.length ? books[books.length - 1].id + 1 : 1;
            books.push(newBook);
            writeBooksFile(books, (err) => {
              if (err) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'Internal Server Error'}));
              } else {
                res.writeHead(201, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(newBook));
              }
            });
          }
        }
      });
    });
  } else if (req.method === 'PUT' && req.url.match(/\/books\/\d+/)) {
    const id = parseInt(req.url.split('/')[2]);
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const updatedBook = JSON.parse(body);
      readBooksFile((err, books) => {
        if (err) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({message: 'Internal Server Error'}));
        } else {
          const index = books.findIndex(b => b.id === id);
          if (index !== -1) {
            books[index] = {...books[index], ...updatedBook};
            writeBooksFile(books, (err) => {
              if (err) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'Internal Server Error'}));
              } else {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(books[index]));
              }
            });
          } else {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({message: 'Book not found'}));
          }
        }
      });
    });
  } else if (req.method === 'DELETE' && req.url.match(/\/books\/\d+/)) {
    const id = parseInt(req.url.split('/')[2]);
    readBooksFile((err, books) => {
      if (err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'Internal Server Error'}));
      } else {
        const index = books.findIndex(b => b.id === id);
        if (index !== -1) {
          books.splice(index, 1);
          writeBooksFile(books, (err) => {
            if (err) {
              res.writeHead(500, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({message: 'Internal Server Error'}));
            } else {
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({message: 'Book deleted successfully'}));
            }
          });
        } else {
          res.writeHead(404, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({message: 'Book not found'}));
        }
      }
    });
  } else {
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: 'Route not found'}));
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
