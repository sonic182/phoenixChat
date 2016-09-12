import Vue from "vue"
import  VueFilter from "vue-filter"
import {Socket, Presence, LongPoller} from "phoenix"
import randomColor from "randomcolor"

Vue.use(VueFilter);

class Chat{

  constructor(){
    this.initializeConfigs()
    this.initializeVue();
  }

  initializeConfigs(){

    let user = localStorage.getItem('username');
    if (!user){
      user = prompt('dame un nombre'); localStorage.setItem('username', user);
    }

    let color = localStorage.getItem('color');
    if (!color){
      color = randomColor();
      localStorage.setItem('color', color);
    }

    let socket = new Socket("/socket", {params: {user_id: user}});
    socket.connect();

    let channel = socket.channel("chat:lobby", {})

    this.config = {
      socket: socket,
      channel: channel,
      color: color,
      user: user,
      presences: {},
      presencesList: []
    };

    this.channelEvents()
    this.presenceConfig()

    // channel.join({})
    channel.join()
    .receive("ok", this.joinChannel())
    .receive("error", resp => {
      console.log("Unable to join", resp)
    });
  }

  render(){
    let list = Presence.list(this.config.presences, (id, {metas: [first, ...rest]})=>{
      first.name = id
      first.count = rest.length + 1
      return first
    });
    this.component.$set('presences', list);
  }

  presenceConfig(){

    this.config.channel.on('presence_state', state => {
      this.config.presences = Presence.syncState(this.config.presences, state);
      this.render();
    });

    this.config.channel.on('presence_diff', diff => {
      this.config.presences = Presence.syncDiff(this.config.presences, diff);
      this.render();
    });
  }

  channelEvents(){
    this.config.channel.on("new_msg", this.receiveMessage())
    this.config.channel.on("get_connecteds", this.receiveConnecteds())
  }

  joinChannel(){
    return resp => {
      // console.log(resp)
      // console.log("Joined successfully", resp)
      // console.log("Joined successfully")
      let msg = `
      <span style="font-weight: bold;color: ${this.config.color}">${this.config.user}</span> has joined the chat
      `;
      this.config.channel.push("new_msg", {
        body: this.buildMessage(msg)
      });
      // this.component.messages.push(this.buildMessage(msg));
    }
  }

  initializeVue(){
    let data = {
      messages: [],
      new_msg: '',
      presences: [],
    }
    // Object.keys(this.config).forEach(k => { data[k] = this.config[k] });
    this.component = new Vue({
      el: '.chat',
      data: data,
      methods: {
        sendMessage: this.sendMessage()
      }
    });
  }

  sendMessage(){

    return message => {
      if (message != ''){
        this.config.channel.push("new_msg", {
          body: this.buildMessage(message, true, true, true)
        });
        this.component.new_msg = ''
      }
    }
  }

  connecteds(){
    return () => {
      this.config.channel.push('get_connecteds', {})
    }
  }

  receiveConnecteds(){
    return (payload)=>{

    }
  }

  buildMessage(message, user, color, date){

    return {
      user: (user ? this.config.user : null),
      color: (color ? this.config.color : null),
      message: message,
      date: new Date(),
    }
  }



  receiveMessage(){

    return payload => {
      // console.log(payload.body);
      // console.log("push")
      this.component.messages.push(payload.body);

      // scroll to bottom
      setTimeout(()=> {
        var elem = document.querySelector('.messages');
        elem.scrollTop = elem.scrollHeight;
      }, 100);

    }
  }

}

export default Chat
