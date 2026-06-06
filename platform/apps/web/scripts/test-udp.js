const dgram = require('dgram');
const message = Buffer.from(JSON.stringify({
    event: "MANUAL_VERIFY_SUCCESS",
    username: "boonnatee-gmail.com",
    timestamp: new Date().toISOString()
}));

const client = dgram.createSocket('udp4');
client.send(message, 514, 'localhost', (err) => {
    if (err) console.error(err);
    else console.log('UDP packet sent to localhost:514');
    client.close();
});
