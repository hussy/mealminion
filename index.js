var express = require('express');
var app = express();
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var bodyparser = require("body-parser");
var http = require('http')
var io = require('socket.io')
var cors = require("cors");
var path = require("path");
var read = require('fs').readFileSync;
const mysql = require("./controllers/mysqlCluster.js");
var cookieParser = require('cookie-parser')
var passport = require("passport");
const hbs = require("express-handlebars");
var app_port = 21002;
var socket_port = 21000;
const api_route = require("./routes/api/api_router.js");


app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layouotsDir: __dirname + '/views/layouts/', partialsDir: __dirname + '/views/partials/' }));
app.set('view engine', 'hbs');

app.use(cookieParser());
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));

var sessionStore = new MySQLStore({}, mysql.mysqlMain);

app.use(session({
    secret: 'MMDAIUMANDAZTECHMM',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

var compress = require('compression');
app.use(compress());

app.use(passport.initialize());
app.use(passport.session());

app.use("/assets", express.static(__dirname + "/assets"));
app.use("/loginAssets", express.static(__dirname + "/assets/loginAssets"));
app.use("/websiteAssets", express.static(__dirname + "/assets/website"));
app.use("/api", api_route);

const api_route_1_0_0 = require("./routes/api/1.0.0/api_router.js");
app.use("/api/1.0.0", api_route_1_0_0);


app.get('/', authenticationMidleware(), async function (req, res) {
    if(req.isAuthenticated()){
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});
 
app.get('/login', async function (req, res) {
    if(req.isAuthenticated()){
        res.redirect('/dashboard');
    } else {
        res.setHeader('Content-Type','text/html'); 
        var header = new String(read(path.join(__dirname, './views/partials/loginHeader.html')));
        var loginPage = new String(read(path.join(__dirname, './views/login.html')));
        loginPage = header +  loginPage;
        res.end(loginPage);
    }
});

app.get('/signup', async function (req, res) {
    res.render('signup');
});

app.get('/dashboard', authenticationMidleware(), async function (req, res) {
    
    var user_id = req.session.passport.user;
    var session = req.session;
    var restaurant_name = session.restaurant_name;
    var options = {
        restaurant_name: restaurant_name,
    };
    res.render('dashboard',options);
});

app.get('/branches', authenticationMidleware(), async function (req, res) {
    
    var user_id = req.session.passport.user;
    var session = req.session;
    var restaurant_name = session.restaurant_name;
    var options = {
        restaurant_name: restaurant_name,
    };
    res.render('branches',options);
});

app.get('*', function(req, res){
    res.render('404');
});

var server = http.createServer(app);
server.listen(app_port,"0.0.0.0");
var sio = io.listen(server);
var passportSocketIo = require("passport.socketio");
var socketHandshake = require ('socket.io-handshake');

passport.serializeUser(function(user, done) {
    done(null, user);
});
  passport.deserializeUser(function(obj, done) {
    done(null, obj);
});


sio.use(passportSocketIo.authorize({
    passport : passport,
    cookieParser: cookieParser,
    key:          'connect.sid',
    secret:       'MMDAIUMANDAZTECHMM',
    store:        sessionStore,
    success:      onAuthorizeSuccess,
    fail:         onAuthorizeFail
}));

sio.use(socketHandshake({
    store: sessionStore, 
    key: 'connect.sid',
    secret: 'MMDAIUMANDAZ',
    parser: cookieParser(),
}));


function onAuthorizeSuccess(data, accept){
    accept(null, true);
}
  
function onAuthorizeFail(data, message, error, accept){
    if(error)
      throw new Error(message);
    accept(null, false);
}

function authenticationMidleware(){
    return (req,res,next) =>{
        if(req.isAuthenticated()) return next();
        res.redirect('/login');
    }
}

app.listen(socket_port,'0.0.0.0', () =>{
    console.log("Server has been started on PORT: " + socket_port);
});

sio.on('connection', async function (socket) {
    var socketSession = socket.handshake.session;
    
})
