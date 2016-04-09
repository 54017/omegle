(function(undefined) {

	"use strict";

	require('./index.css');

	let React = require('react');
	
	let ReactDOM = require('react-dom');


	let io = require('./socket.js');

	let socket = io(), peerConnection;
	let config = {
		iceServers: [
				{url: "stun:23.21.150.121"},
				{url: "stun:stun.1.google.com:19302"}
		]   
	};
	let PeerConnection = window.PeerConnection || window.webkitPeerConnection || 
        window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    peerConnection = new PeerConnection(null); //没有stun服务器，局域网内通讯


	let ChatRoom = React.createClass({
		getInitialState: function() {
			return { chat: [], connectState: '点击缘起开始聊天!', number: '', sendButtonText: '发送', startButtonText: '缘起', condition: false }
		},
		componentDidMount: function() {
			let connected = '捕获到小伙伴，先打个招呼吧~',
				start = '缘起',
				disconnected = '聊天结束，再见.';


			//socket.io实时更新在线人数
			socket.on('online number', function(number) {
				this.setState({ number: number });
			}.bind(this));

			//socket.io监控聊天信息
			socket.on('chat message', function(res) {
				this.state.chat.push(res);
				this.setState({ chat: this.state.chat });
			}.bind(this));

			//socket.io监控匹配成功事件
			socket.on('finded', function(res) {
				this.setState({ connectState: connected, condition: true });
				if (res) {
					let options = {
						offerToReceiveAudio: false,
    					offerToReceiveVideo: true
					}
					peerConnection.createOffer(function(offer) {
						peerConnection.setLocalDescription(offer);
						socket.emit('send offer', peerConnection.localDescription);
					}, function(e) {
						console.log("error: ", e);
					}, options);
				}
			}.bind(this));
			//接收到offer
			socket.on('get offer', function(res) {
				console.log("remote offer", res);
				peerConnection.setRemoteDescription(new RTCSessionDescription(res), function() {
					peerConnection.createAnswer(function(answer) {
						peerConnection.setLocalDescription(answer);
						socket.emit('send answer', answer);
					}, function(e) {
						console.log("create answer fail", e);
					});
				});

			});

			//接收到answer
			socket.on('get answer', function(res) {
				console.log("get answer");
				peerConnection.setRemoteDescription(new RTCSessionDescription(res), function() {
					console.log("get answer ok");
				}, function(e) {
					console.log("get answer fail", e);
				});
			});

			//监控对方断开连接的情况
			socket.on('chat over', function() {
				this.setState({ connectState: disconnected, condition: false, startButtonText: start });
			}.bind(this));
		},

		//开始按钮点击回调事件
		startClickCallback: function() {
			let start = '缘起',
				end = '缘灭',
				connecting = '正在寻找小伙伴中...',
				disconnected = '聊天结束，再见.';

			//开始按钮缘起缘灭切换
			if (!this.state.condition) {
				this.setState({ connectState: connecting, startButtonText: end });
				socket.emit('find stranger');
			} else {
				socket.emit('chat over');
				this.setState({ connectState: disconnected, startButtonText: start, condition: false });
			}
		},
		render: function() {
			return (
				<div id="chatRoom">
					<VideoBox />
					<div className="chatBox">
						<ConnectState message={ this.state.connectState } />
						<OnlineNumber number={ this.state.number } />
						<ChatList chat={ this.state.chat } />
						<ChatForm startButtonText={ this.state.startButtonText } sendButtonText={ this.state.sendButtonText } condition={ this.state.condition } startClickCallback={ this.startClickCallback } />
					</div>
				</div>
			);
		}
	});

	let ChatList = React.createClass({
		componentDidUpdate: function() {
			this.refs.chatList.scrollTop = this.refs.chatList.scrollHeight;
		},
		render: function() {
			let count = 0;
			let chatNodes = this.props.chat.map(function(chat) {
				return (
					<Chat author={ chat.author } message={ chat.message } key={ ++count }/>
				);
			});
			return (
				<div className="chatList" ref='chatList'>
					{ chatNodes }
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
			return { text: '' };
		},
		handleInput: function(e) {
			this.setState({ text: e.target.value });
		},
		sendCallback: function() {
			if (this.props.condition && this.state.text) {
				socket.emit('chat message', this.state.text);
				this.setState({ text: '' });
			}
		},
		handleKeyDown: function(e) {
			if (e.keyCode == 13) {
				e.preventDefault();
				this.sendCallback();
			}
		},
		render: function() {
			return (
				<div className="chatForm">
					<StartButton text={ this.props.startButtonText } startClickCallback={ this.props.startClickCallback }/>
					<SendButton text={ this.props.sendButtonText } condition={ this.props.condition } sendCallback={ this.sendCallback } />
					<div className="edit">
						<textarea value={ this.state.text } onChange={ this.handleInput } onKeyDown={ this.handleKeyDown } disabled={ !this.props.condition }></textarea>
					</div>
				</div>
			);
		}
	});


	let Chat = React.createClass({
		render: function() {
			return (
				<div className="chat">
				<p><span className={ this.props.author.toLowerCase() }>{ this.props.author }</span>: { this.props.message }</p>
				</div>
			);
		}
	});

	let VideoBox = React.createClass({
		render: function() {
			return (
				<div className="videoBox">
					<Video owner="stranger" />
					<Video owner="you" />
				</div>
			);
		}
	});

	let Video = React.createClass({
		componentDidMount: function() {
			//自己的摄像头或者别人的摄像头
			if (this.refs.you) {
				let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
				if (getUserMedia) {
					getUserMedia.call(navigator, { video: true, audio: false }, function(localMediaStream) {
						let video = this.refs.you;
						video.src = window.URL.createObjectURL(localMediaStream);
						peerConnection.addStream(localMediaStream);
						video.onloadedmetadata = function(e) {
		        		};
					}.bind(this), function(e) {
						console.log("error: ", e);
					});
				} else {
					alert("你的浏览器不支持WebRTC");
					return;
				}
			} else {

                //当ICE Server添加被添加到该peerConnection后触发
                peerConnection.onicecandidate = function(e) {
                	if (!e || !e.candidate) {
                		return;
                	}
                	console.log('emit ice candidate', e.candidate);
                	socket.emit('ice candidate', e.candidate); //信令机制传递网络信息
                };

                peerConnection.onaddstream = function(e) {
                	console.log("onaddstream");
                	this.refs.stranger.src = window.URL.createObjectURL(e.stream);
                }.bind(this);

                socket.on('ice candidate', function(res) {
                	console.log("xxxx");
                	peerConnection.addIceCandidate(new RTCIceCandidate(res));
                });
			}
		},
		render: function() {
			return (
				<div className="video">
					<video autoPlay ref={ this.props.owner }></video>
				</div>
			);
		}
	});

	let StartButton = React.createClass({
		handleClick: function() {
			this.props.startClickCallback();
		},
		render: function() {
			return (
				<button className='newButton btn' onClick={ this.handleClick }>{ this.props.text }</button>
			);
		}
	});

	let SendButton = React.createClass({
		handleClick: function() {
			this.props.sendCallback();
		},
		render: function() {
			let className = 'sendButton btn';
			if (!this.props.condition) {
				className = className + ' forbidden';
			}
			return (
				<button className={ className } onClick={ this.handleClick }>{ this.props.text }</button>
			);
		}
	})

	ReactDOM.render(
		<ChatRoom />,
		document.querySelector('#container')
	);

}());