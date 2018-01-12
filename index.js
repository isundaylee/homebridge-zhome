let PlatformAccessory, Service, Characteristic, UUIDGen;

const PLUGIN_NAME = "homebridge-zhome"
const PLATFORM_NAME = "ZHome"

const ACCESSORY_MAP = {
    'fake_light_bulb': require('./accessories/fake_light_bulb')
}

module.exports = function (homebridge) {
    PlatformAccessory = homebridge.platformAccessory

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, ZHome, true);
}

function ZHome(log, config, api) {
    this.log = log
    this.config = config
    this.accessories = []

    this.toolkit = {
        'Service': Service,
        'Characteristic': Characteristic,
        'log': log
    }

    if (api) {
        this.api = api;

        this.api.on('didFinishLaunching', function() {
            // TODO: Start discovering new accessories.

            this.addAccessoryIfNecessary('1122334455667788', 'fake_light_bulb');
            this.addAccessoryIfNecessary('AABBCCDDEEFF1122', 'fake_light_bulb');
        }.bind(this));
    }
}

ZHome.prototype.addAccessoryIfNecessary = function(macAddress, type) {
    for (var i=0; i<this.accessories.length; i++) {
        if (this.accessories[i].context.macAddress == macAddress) {
            return false;
        }
    }

    return this.addAccessory(macAddress, type);
}

ZHome.prototype.addAccessory = function(macAddress, type) {
    let accessoryConfig = this.config.accessories[macAddress];

    if (accessoryConfig == null) {
        this.log("Not adding device " + macAddress + " because it is not " +
            "declared in config.js.");
        return false;
    }

    this.log("Adding accessory " + macAddress + " of type `" + type + "`.");

    let uuid = UUIDGen.generate(macAddress);
    let accessory = new PlatformAccessory(accessoryConfig.name, uuid);

    accessory.context.macAddress = macAddress;
    accessory.context.type = type;
    accessory.context.config = accessoryConfig;

    let accessoryObject = new ACCESSORY_MAP[type](accessory, accessoryConfig,
        this.toolkit);

    accessoryObject.initialize();
    accessoryObject.configure();

    this.accessories.push(accessory);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

    return true;
}

ZHome.prototype.configureAccessory = function(accessory) {
    accessory.reachable = false;

    let type = accessory.context.type;
    let macAddress = accessory.context.macAddress;
    let accessoryConfig = accessory.context.config;

    this.log("Configuring cached accessory " + macAddress + " of type `" +
        type + "`.");

    let accessoryObject = new ACCESSORY_MAP[type](accessory, accessoryConfig,
        this.toolkit);

    accessoryObject.configure();

    this.accessories.push(accessory);
}