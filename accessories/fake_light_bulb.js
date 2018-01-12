function FakeLightBulb(accessory, config, toolkit) {
    this.accessory = accessory;
    this.config = config;
    this.toolkit = toolkit;
}

// `initialize` is run upon first creating the accessory
FakeLightBulb.prototype.initialize = function() {
    this.accessory.addService(this.toolkit.Service.Lightbulb, this.config.name);
}

// `configure` is run from configureAccessory phase
FakeLightBulb.prototype.configure = function() {
    this.accessory.getService(this.toolkit.Service.Lightbulb)
        .getCharacteristic(this.toolkit.Characteristic.On)
        .on('set', function(value, callback) {
            this.toolkit.log(this.config.name + ': Setting value to ' + value);
            callback();
        }.bind(this));
}

module.exports = FakeLightBulb;
