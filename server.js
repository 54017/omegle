(function() {

	"use strict";

	let express = require('express'),
		app = express(),
		path = require('path'),
		http = require('http').Server(app),
		io = require('socket.io')(http);

	let online = 0,  //在线人数
		waiting = [],   //待匹配的人，存储socket.id
		chatting = {};	//已匹配的人，'1': '2', '2': '1'结构
		//users = {};		//记录每个socket.id对应的socket (socket.io自己内部的socket.id是会变的所以需要自己保存引用)

	http.listen(3000);

	//中间件提供静态资源 js/css/image 等， 会解析public文件夹下的文件
	app.use(express.static(path.join(__dirname, 'public')));

	app.get('/', function(req, res) {
		res.sendFile(__dirname + '/index.html');
	});

	io.on('connection', function(socket) {
		++online;
		//实时更新在线人数
		io.emit('online number', online);
		//如果有等待匹配的人，则匹配，否则加入等待队列
		if (waiting.size > 0) {
			let id = waiting.shift();
			chatting[socket.id] = id;
			chatting[id] = socket.id;
		} else {
			waiting.push(socket.id);
		}
		socket.on('disconnect', function(){
    		--online;
    		delete chatting[socket.id];
  		});
  		socket.on('chat message', function(msg) {
  			io.sockets.socket(chatting[socket.id]).emit({ message: msg, author: 'stranger' });
  			socket.emit({ message: msg, author: 'You' });
  		});
	});




}());