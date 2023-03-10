"use strict";

/** Functionality related to chatting. */

// Room is an abstraction of a chat channel
const Room = require("./Room");
const { getJoke } = require("./helper");

/** ChatUser is a individual connection from client -> server to chat. */

class ChatUser {
  /** Make chat user: store connection-device, room.
   *
   * @param send {function} callback to send message to this user
   * @param room {Room} room user will be in
   * */

  constructor(send, roomName) {
    this._send = send; // "send" function for this user
    this.room = Room.get(roomName); // room user will be in
    this.name = null; // becomes the username of the visitor

    console.log(`created chat in ${this.room.name}`);
  }

  /** Send msgs to this client using underlying connection-send-function.
   *
   * @param data {string} message to send
   * */

  send(data) {
    try {
      this._send(data);
    } catch {
      // If trying to send to a user fails, ignore it
    }
  }

  /** Handle joining: add to room members, announce join.
   *
   * @param name {string} name to use in room
   * */

  handleJoin(name) {
    this.name = name;
    this.room.join(this);
    this.room.broadcast({
      type: "note",
      text: `${this.name} joined "${this.room.name}".`,
    });
  }

  /** Handle a chat: broadcast to room.
   *
   * @param text {string} message to send
   * */

  handleChat(text) {
    this.room.broadcast({
      name: this.name,
      type: "chat",
      text: text,
    });
  }

  /** Handle a joke request: send back to client. */

  async handleJoke() {
    this.send(
      JSON.stringify({
        type: "chat",
        name: "Server",
        text: await getJoke(),
      })
    );
  }

  /** Handle a request to get members: sends list of members to client. */

  handleMembers() {
    const members = this.room.getMemberUsernames();
    const text = `In room: ${members.join(", ")}.`;
    this.send(
      JSON.stringify({
        type: "chat",
        name: "Server",
        text: text,
      })
    );
  }

  /** Handle a request to send a private message to a member */

  handlePrivateChat(text) {
    const [cmd, username, ...message] = text.split(" ");

    if (!username || !message) return;

    const user = Array.from(this.room.members).find(
      (member) => member.name === username
    );

    if (!user) return;

    user.send(
      JSON.stringify({
        type: "chat",
        name: this.name,
        text: message.join(" "),
      })
    );
  }

  /** Separates new username from msg and changes current user's
   * name to the new username
   *
   * broadcasts username change to room
   */

  handleChangeUsername(text) {
    const [cmd, newUsername] = text.split(" ");

    if (!newUsername) return;

    this.name = newUsername;
    this.room.broadcast({
      type: "note",
      text: `${newUsername} has changed their username.`,
    });
  }

  /** Handle messages from client:
   *
   * @param jsonData {string} raw message data
   *
   * @example<code>
   * - {type: "join", name: username} : join
   * - {type: "chat", text: msg }     : chat
   * </code>
   */

  async handleMessage(jsonData) {
    let msg = JSON.parse(jsonData);

    if (msg.type === "join") this.handleJoin(msg.name);
    else if (msg.type === "chat") this.handleChat(msg.text);
    else if (msg.type === "get-joke") await this.handleJoke();
    else if (msg.type === "get-members") this.handleMembers();
    else if (msg.type === "private") this.handlePrivateChat(msg.text);
    else if (msg.type === "new-name") this.handleChangeUsername(msg.text);
    else throw new Error(`bad message: ${msg.type}`);
  }

  /** Connection was closed: leave room, announce exit to others. */

  handleClose() {
    this.room.leave(this);
    this.room.broadcast({
      type: "note",
      text: `${this.name} left ${this.room.name}.`,
    });
  }
}

module.exports = ChatUser;
