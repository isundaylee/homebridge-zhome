const FakeClient = require('./fake_client');
const EventEmitter = require('events');
const util = require('util');

class Server extends EventEmitter {
    constructor(log) {
        super();

        this.client = new FakeClient(this.onReceive.bind(this));
        this.log = log;
    }

    send(mac, method, key, value) {
        this.log.debug(util.format('Sending (%s, (%s, %s)) -> %s', method, key,
            value, mac));

        this.client.request(mac, method, key, value);
    }

    onReceive(mac, e, key, value) {
        this.log.debug(util.format('Received (%s, (%s, %s)) <- %s', e, key,
            value, mac));
        this.emit(e, mac, key, value);
    }
}

module.exports = Server;
