let PlatformAccessory, Service, Characteristic, UUIDGen;

const Server = require('./server');

const PLUGIN_NAME = "homebridge-zhome"
const PLATFORM_NAME = "ZHome"

const EXPIRATION_TIMEOUT = 20.0 * 1000;

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

class ZHome {
    constructor(log, config, api) {
        this.log = log
        this.config = config
        this.accessories = {}
        this.expirationTimeouts = {}

        log.debug = log.info;

        this.toolkit = {
            'Service': Service,
            'Characteristic': Characteristic,
            'log': log
        }

        this.server = new Server(log);

        if (api) {
            this.api = api;

            this.api.on('didFinishLaunching', () => {
                this.server.on('ping', (mac, key, value) => {
                    if (key != 'type') {
                        this.log.error('Received ping from ' + mac + ' with ' +
                            'unexpected key ' + key + '.');
                        return;
                    }

                    this.addAccessoryIfNecessary(mac, value);
                    this.resetExpirationTimeout(mac);
                });
            });
        }
    }

    resetExpirationTimeout(macAddress) {
        if (this.expirationTimeouts[macAddress] != null) {
            clearTimeout(this.expirationTimeouts[macAddress]);
        }

        this.expirationTimeouts[macAddress] = setTimeout(() => {
            this.log.info("Removing " + macAddress + " due to missed pings.");
            this.removeAccessory(macAddress);
        }, EXPIRATION_TIMEOUT);
    }

    addAccessoryIfNecessary(macAddress, type) {
        let accessories = Object.values(this.accessories);

        for (var i=0; i<accessories.length; i++) {
            if (accessories[i].context.macAddress == macAddress) {
                return false;
            }
        }

        return this.addAccessory(macAddress, type);
    }

    addAccessory(macAddress, type) {
        let accessoryConfig = this.config.accessories[macAddress];

        if (accessoryConfig == null) {
            this.log.info("Not adding device " + macAddress + " because it is not "
                + "declared in config.js.");
            return false;
        }

        this.log.info("Adding accessory " + macAddress + " of type `" + type + "`.");

        let uuid = UUIDGen.generate(macAddress);
        let accessory = new PlatformAccessory(accessoryConfig.name, uuid);

        accessory.context.macAddress = macAddress;
        accessory.context.type = type;
        accessory.context.config = accessoryConfig;

        let accessoryObject = new ACCESSORY_MAP[type](accessory, accessoryConfig,
            this.server, this.toolkit);

        accessoryObject.initialize();
        accessoryObject.configure();

        this.accessories[macAddress] = accessory;
        this.resetExpirationTimeout(macAddress);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

        return true;
    }

    configureAccessory(accessory) {
        accessory.reachable = false;

        let type = accessory.context.type;
        let macAddress = accessory.context.macAddress;
        let accessoryConfig = accessory.context.config;

        this.log.info("Configuring cached accessory " + macAddress + " of type `" +
            type + "`.");

        let accessoryObject = new ACCESSORY_MAP[type](accessory, accessoryConfig,
            this.server, this.toolkit);

        accessoryObject.configure();

        this.accessories[macAddress] = accessory;
        this.resetExpirationTimeout(macAddress);
    }

    removeAccessory(macAddress) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME,
            [this.accessories[macAddress]]);

        delete this.accessories[macAddress];
        delete this.expirationTimeouts[macAddress];
    }
}
