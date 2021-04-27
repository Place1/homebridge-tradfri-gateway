import { API, APIEvent, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig } from "homebridge";
import { Accessory, TradfriClient } from "node-tradfri-client";
import { PLATFORM_NAME, PLUGIN_NAME } from "./constants";
import { IDeviceAdapter } from "./devices/device-adapter";
import { initializeAdapter } from "./device-factory";
import { createClient } from "./tradfri-client";
import { isNullOrWhitespace } from "./utils";

export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, TradfriGateway);
};

// the properties on this interface should be accounted
// for in `src/config.schema.json`.
// these are properties that users can use to configure
// the plugin.
interface PluginConfig extends PlatformConfig {
  securityCode: string;
}

class TradfriGateway implements DynamicPlatformPlugin {
  private log: Logging;
  private config: PluginConfig;
  private api: API;
  private client!: TradfriClient;
  private accessories = new Map<PlatformAccessory["UUID"], PlatformAccessory>();
  private devices = new Map<PlatformAccessory["UUID"], IDeviceAdapter>();

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.config = config as PluginConfig;
    this.api = api;

    api.on(APIEvent.DID_FINISH_LAUNCHING, this.onLaunch);
    api.on(APIEvent.SHUTDOWN, this.onShutdown);
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.accessories.set(accessory.UUID, accessory);
  }

  private onLaunch = async () => {
    if (isNullOrWhitespace(this.config.securityCode)) {
      this.log.error('Please set the required Tradfri Gateway "security code" setting');
      return;
    }

    this.client = await createClient({
      securityCode: this.config.securityCode,
    });
    this.log.info(`Tradfri gateway found at: ${this.client.hostname}`);

    this.client.on("device updated", this.onDeviceUpdated);
    this.client.on("device removed", this.onDeviceRemoved);

    await this.client.observeDevices();
  };

  private onDeviceUpdated = (device: Accessory) => {
    const accessory = this.getOrCreate(device);
    if (accessory) {
      accessory.onUpdate(device);
    }
  };

  private getOrCreate(device: Accessory): IDeviceAdapter | undefined {
    const id = this.identifier(device);
    if (this.devices.has(id)) {
      return this.devices.get(id)!;
    }

    if (this.accessories.has(id)) {
      this.log.debug(`Initializing device from cache: ${device.name}`);
      const adapter = initializeAdapter(this.log, this.api, device, this.accessories.get(id)!);
      if (adapter) {
        this.devices.set(id, adapter);
        return adapter;
      }
    }

    this.log.info(`Initializing a new device: ${device.name}`);
    const accessory = new this.api.platformAccessory(device.name, id);
    const adapter = initializeAdapter(this.log, this.api, device, accessory);
    if (adapter) {
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      this.devices.set(id, adapter);
      return adapter;
    } else {
      this.log.error(`Unsupported tradfri device: ${device.name} (type=${device.type})`);
    }
  }

  private onDeviceRemoved = (instanceId: number) => {
    const id = this.identifier(instanceId);
    const accessory = this.accessories.get(id);
    if (accessory) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    this.accessories.delete(id);
    this.devices.delete(id);
  };

  private identifier(device: Accessory | number) {
    if (typeof device === "object") {
      device = device.instanceId;
    }
    return this.api.hap.uuid.generate(String(device));
  }

  private onShutdown = () => {
    if (this.client) {
      this.client.destroy();
    }
  };
}
