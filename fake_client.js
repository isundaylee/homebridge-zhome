const assert = require('assert');

class FakeClient {
    constructor(onReceive) {
        this.onReceive = onReceive;

        this.accessories = {
            '1122334455667788': new FakeLightBulbClient('1122334455667788', this),
            'AABBCCDDEEFF1122': new FakeLightBulbClient('AABBCCDDEEFF1122', this)
        }
    }

    broadcast(method, key, value) {
        accessories = Object.values(this.accessories);

        for (var i=0; i<accessories.length; i++) {
            accessories[i].request(method, key, value);
        }
    }

    request(mac, method, key, value) {
        this.accessories[mac].request(method, key, value);
    }
}

class FakeLightBulbClient {
    constructor(mac, client) {
        this.client = client;
        this.mac = mac;
        this.on = true;

        setInterval(function() {
            this.client.onReceive(this.mac, 'ping', 'type', 'fake_light_bulb');
            this.report();
        }.bind(this), 10000);
    }

    request(method, key, value) {
        if (method == 'set') {
            assert(key == 'on');
            this.on = value;
            this.report();
        } else if (method == 'get') {
            assert(key == 'on');
            this.report();
        }
    }

    report() {
        this.client.onReceive(this.mac, 'report', 'on', this.on);
    }
}

module.exports = FakeClient;
