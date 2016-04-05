(function() {

	"use strict";

	let express = require('express'),
		app = express(),
		path = require('path'),
		http = require('http').Server(app),
		io = require('socket.io')(http);

	let online = 0,  //在线人数
		waiting = [],   //待匹配的人，存储socket.id
		suspending = new Set(), //处在不匹配任何人的人
		chatting = {};	//已匹配的人，'1': '2', '2': '1'结构
		//users = {};		//记录每个socket.id对应的socket (socket.io自己内部的socket.id是会变的所以需要自己保存引用)

	http.listen(3000);

	//中间件提供静态资源 js/css/image 等， 会解析public文件夹下的文件
	app.use(express.static(path.join(__dirname, 'public')));

	app.get('/', function(req, res) {
		res.sendFile(__dirname + '/index.html');
	});

	io.on('connection', function(socket) {
		//刚进来时为不匹配任何人的状态
		suspending.add(socket.id);
		//关闭页面
		socket.on('disconnect', function() {
			suspending.delete(socket.id);
    		let temp = chatting[socket.id];
    		if (temp) {
	    		suspending.add(temp);
	    		io.sockets.connected[temp].emit('chat over');
	    		delete chatting[temp];
	    		delete chatting[socket.id];
    		}
    		//实时更新在线人数
    		--online;
    		io.emit('online number', online);
  		});
  		socket.on('chat message', function(msg) {
  			io.sockets.connected[chatting[socket.id]].emit('chat message', { message: msg, author: 'Stranger' });
  			socket.emit('chat message', { message: msg, author: 'You' });
  		});
  		socket.on('find stranger', function() {
  			//如果有等待匹配的人，则匹配，否则加入等待队列
  			let flag = 0; //判断是否匹配到陌生人
  			//从不匹配任何人的状态里删掉
  			suspending.delete(socket.id);
			while (waiting.length > 0) {
				let id = waiting.shift();
				if (io.sockets.connected[id] && id != socket.id) {
					chatting[socket.id] = id;
					chatting[id] = socket.id;
					io.sockets.connected[chatting[socket.id]].emit('finded');
					socket.emit('finded');
					flag = 1
					break;
				}
			}
			//如果未匹配成果则加入等待队列
			if (!flag && !chatting[socket.id]) {
				waiting.push(socket.id);
			}
  		})
  		//与当前陌生人断开
  		socket.on('chat over', function() {
  			let temp = chatting[socket.id];
    		if (temp) {
	    		suspending.add(temp);
	    		suspending.add(socket.io);
	    		io.sockets.connected[temp].emit('chat over');
	    		delete chatting[temp];
	    		delete chatting[socket.id];
    		}
  		});
  		//实时更新在线人数
  		++online;
		io.emit('online number', online);
	});




}());