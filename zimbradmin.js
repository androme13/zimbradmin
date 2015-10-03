'use strict';
// Chargement des modules de Node.js
global.bcrypt = require('bcrypt-nodejs');
var nconf = require('nconf');
nconf.env().file({file: 'server-config.json'});
var bunyan = require('bunyan');
global.log = bunyan.createLogger({name: 'ZM'});
var monitor = require('./ZMModules/monitor.js')
var ServerConfig = nconf.get("ServerConfig");
var ExtDirectConfig = nconf.get("ExtDirectConfig");
global.MySQLConfig = nconf.get("MySQLConfig");
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser')
var compression = require('compression');
var bodyParser = require('body-parser');
var extdirect = require('extdirect');
global.mysql = require('mysql');
var async = require('async');
var server; // serveur web

monitor.init(nconf.get("Monitor"));
var notFound = function (req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable !');
    console.log('page introuvable:');
    console.log(req);
    console.log('------------------------------------');
    //next();
};

var startPage = function (req, res) {
    res.sendFile('/client/desktop.html', {root: __dirname});
};
// définition des variables d'intialisation

var port = 8080; // port d'ecoute
// création d'une application Express
var app = express();
// Configurations de l'application Express

// on lance les middleware de facon async afin d'accelerer
// le traitement fait par le serveur node.
function parallel(middlewares) {
  return function (req, res, next) {
    async.each(middlewares, function (mw, cb) {
      mw(req, res, cb);
    }, next);
  };
};
//app.use('/static', express.static('public'));
app.use(parallel([
//    '/client',
//express.static('client'),
express.static(__dirname + '/client'),
        //compression(),
        bodyParser.json(),
        cookieParser(),
        session({
            secret: ServerConfig.sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {maxAge: ServerConfig.sessionMaxAge, secret: ServerConfig.sessionSecret}
        }),
        /*function (req, res, next) {
            if (!req.session) {
                console.log(req._parsedOriginalUrl);
                console.log("pas de session");
               
            }
            next(); // otherwise continue 
        }*/
]));

// on charge la page par defaut
app.get('/', startPage);

app.get(ExtDirectConfig.apiPath, function (request, response) {
    try {
        var api = extdirect.getAPI(ExtDirectConfig);
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(api);
    } catch (e) {
        console.log(e);
    }
});

// on ignore les GET requests sur le class path de extdirect
app.get(ExtDirectConfig.classPath, function (request, response) {
    response.writeHead(400, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({success: false, msg: 'Unsupported method. Use POST instead.'}));
});

// POST request process route and calls class
app.post(ExtDirectConfig.classPath, function (request, response) {
    if (request.session.userinfo || request.body.action==="DXLogin"){
        extdirect.processRoute(request, response, ExtDirectConfig);
    } else
    {
    response.writeHead(401, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({success: false, msg: 'Please Login before'}));
    }
});

server = app.listen(
        ServerConfig.port,
        function () {
            log.info('ZimbradminNG server listening on port %d in %s mode', port, app.settings.env);
        }
);
// Écoute du signal SIGINT

process.on('SIGINT', function () {
    server.close();
    log.info('Stopping Zimbradmin...');
});