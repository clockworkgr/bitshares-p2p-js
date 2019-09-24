import Connection from './lib/Connection.js';

let conn=new Connection('3.18.252.121',1776);
conn.on('message-sent',(type)=>{ console.log('Sent: '+type); }).on('message-received',(type)=>{ console.log('Received: '+type); }).on('status',(state) => { console.log('Status: '+state);});
conn.connect();