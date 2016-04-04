(function(undefined) {

	"use strict";

	require('./index.css');

	let React = require('react');
	
	let ReactDOM = require('react-dom');


	let io = require('./socket.js');

	let socket = io();


	let ChatRoom = React.createClass({
		render: function() {
			return (
				<div id="chatRoom">
					<VideoBox />
					<ChatBox />
				</div>
			);
		}
	});

	let ChatBox = React.createClass({
		render: function() {
			return (
				<div className="chatBox">
					<ChatList />
					<ChatForm />
				</div>
			);
		}
	});

	let ChatList = React.createClass({
		getInitialState: function() {
			return { chat: [], connectState: '点击缘起开始聊天!', number: '' }
		},
		componentDidMount: function() {
			//socket.io实时更新在线人数
			socket.on('online number', function(number) {
				this.setState({ number: number });
			}.bind(this));
			//监控缘起缘灭button的点击事件
			document.addEventListener('startClicked', function() {
				let init = '点击缘起开始聊天!',
					connecting = '正在寻找小伙伴中...',
					connected = '捕获小伙伴，先打个招呼吧~',
					disconnected = '聊天结束，再见.',
					current = this.state.connectState;
				if (current == init || current == disconnected) {
					this.setState({ connectState: connecting });
				} else {
					this.setState({ connectState: disconnected });
				}
			}.bind(this));
			//socket.io监控聊天
			socket.on('chat message', function(res) {
				this.state.chat.push(res);
			});
		},
		componentWillUnmount: function() {
			document.removeEventListener('startClicked');
		},
		render: function() {
			let chatNodes = this.state.chat.map(function(chat) {
				return (
					<Chat author={ chat.author } chat={ chat.message }/>
				);
			});
			return (
				<div className="chatList">
					<ConnectState message={ this.state.connectState } />
					<OnlineNumber number={ this.state.number } />
					<Chat />
				</div>
			);
		}
	});

	let OnlineNumber = React.createClass({
		render: function() {
			return (
				<div className="onlineNumber">
					<p>{ this.props.number }</p>
				</div>
			);
		}
	});

	let ConnectState = React.createClass({
		render: function() {
			return (
				<div className="message">
					<p>{ this.props.message }</p>
				</div>
			);
		}
	});

	let ChatForm = React.createClass({
		getInitialState: function() {
			return { sendButtonText: '发送', startButtonText: '缘起', condition: true };
		},
		clickCallback: function() {
			let start = '缘起',
				end = '缘灭';
			if (this.state.startButtonText === start) {
				this.setState({ startButtonText: end });
			} else {
				this.setState({ startButtonText: start });
			}
			document.dispatchEvent(new Event('startClicked'));
		},
		render: function() {
			return (
				<div className="chatForm">
					<StartButton text={ this.state.startButtonText } clickCallback= { this.clickCallback }/>
					<SendButton text={ this.state.sendButtonText } condition={ this.state.condition } />
					<EditableDiv />
				</div>
			);
		}
	});

	let EditableDiv = React.createClass({
		render: function() {
			return (
				<div className="edit" contentEditable>
				</div>
			);
		}
	});

	let Chat = React.createClass({
		render: function() {
			return (
				<div className="chat">
					<span>{ this.props.author }</span><p>{ this.props.message }</p>
				</div>
			);
		}
	});

	let VideoBox = React.createClass({
		render: function() {
			return (
				<div className="videoBox">
					<Video />
					<Video />
				</div>
			);
		}
	});

	let Video = React.createClass({
		componentDidMount: function() {
			/*let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
			if (getUserMedia) {
				getUserMedia.call(navigator, { video: false, audio: false }, function(localMediaStream) {
					let video = document.querySelectorAll('video')[1];
					video.src = window.URL.createObjectURL(localMediaStream);
					video.onloadedmetadata = function(e) {
	        		};
				}, function(e) {
					console.log("error: ", e);
				});
			} else {
				alert("你的浏览器不支持WebRTC");
				return;
			}*/
		},
		render: function() {
			return (
				<div className="video">
					<video autoPlay></video>
				</div>
			);
		}
	});

	let StartButton = React.createClass({
		handleClick: function() {
			this.props.clickCallback();
		},
		render: function() {
			return (
				<button className='newButton btn' onClick={ this.handleClick }>{ this.props.text }</button>
			);
		}
	});

	let SendButton = React.createClass({
		handleClick: function() {
			socket.emit('')
		},
		render: function() {
			return (
				<button className='sendButton btn' onClick={ this.handleClick }>{ this.props.text }</button>
			);
		}
	})

	ReactDOM.render(
		<ChatRoom />,
		document.querySelector('#container')
	);

}());