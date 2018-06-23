var DINAMO    = require("./../aws/dinamo");
var CONNECT   = require('./../connect');
const LOG     = require('ramman-z-log');

function createChat (iNuid,iNdata,iNfunction) {
  /*
    @discr
      @example

    @inputs
      @required
        iNuid -> string
        iNdata -> object
      @optinal
        iNfunction -> function
  */
  var uid = iNuid,
      dataForQuery = {};


}


function checkChatAccessForCreate () {

}

function addMember () {

}

function addMessage () {

}







/*
include
  firebase base
  dynamo base

@SCHEMA
  - FIREBASE
    - CHATS -> db
        live    -> object   (info which write message in real time to chat)
          data    -> number
          status  -> number
          type    -> number
          user    -> string
        members -> object   (there are some users in this chat)
          $uid    -> string
        msg -   > object    (the last message was written to chat)
          content -> string
          time    -> number
          type    -> number
          user    -> string
        type    -> number   (chat type 1 - private, 2 - common)

    - MEMBERS  -> db
      $uid    -> object (chief user (every user has information about his chats in members db) )
        $chatId   -> object (chat id)
          $uid      -> string (user ids what engaged in this chat)



*/
