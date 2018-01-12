const assert = require('assert');

class FakeLightBulb {
    constructor(accessory, config, server, toolkit) {
        this.accessory = accessory;
        this.mac = this.accessory.context.macAddress
        this.config = config;
        this.server = server
        this.toolkit = toolkit;
    }

    // `initialize` is run upon first creating the accessory
    initialize() {
        this.accessory.addService(this.toolkit.Service.Lightbulb,
            this.config.name);
    }

    // `configure` is run from configureAccessory phase
    configure() {
        this.server.on('report', (mac, key, value) => {
            if (mac != this.mac) {
                return;
            }

            assert(key == 'on');

            this.accessory.getService(this.toolkit.Service.Lightbulb)
                .getCharacteristic(this.toolkit.Characteristic.On)
                .updateValue(value);
        });

        this.server.send(this.mac, 'get', 'on', null);

        this.accessory.getService(this.toolkit.Service.Lightbulb)
            .getCharacteristic(this.toolkit.Characteristic.On)
            .on('set', (value, callback) => {
                this.toolkit.log.info(this.config.name + ': Setting value to ' +
                    value);
                this.server.send(this.mac, 'set', 'on', value);
                callback();
            });
    }
}

module.exports = FakeLightBulb;
