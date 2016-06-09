var proxy = require('express-http-proxy');
var easytunnel = require('easytunnel');
var express = require('express');
var app = express();
var proxies={};
var p=easytunnel.createServer({
    port: 1110,
    httpConnects:1000,
    onDisconnect:function(p){
        for(var i in proxies){
            if(proxies[i].port==p){
                proxies[i].handle=function(req,res,next){res.json({code:-1,msg:"client offline"})}
            }
        }
    }
});
app.get('/', function (req, res) {
    res.json({easyTunnel:"1.0"});
});
var server = app.listen(80, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('app listening at http://%s:%s', host, port);
});
app.get("/api/tunnel/create/:port/:device/:name",function(req,res){
    var path='/'+req.params.device+"/"+req.params.name;
    proxies[path]={};
    proxies[path].port=req.params.port;
    proxies[path].handle=proxy('127.0.0.1', {
        port:req.params.port,
        forwardPath: function(req, res) {  
            return require('url').parse(req.url).path;
        }
    });
    app.use(path,function(req, res, next) {
        proxies[path].handle(req, res, next)
    });
    console.log("Proxy "+path+" to "+req.params.port)
    res.json({"code":0,url:'/'+req.params.device+"/"+req.params.name});
});
