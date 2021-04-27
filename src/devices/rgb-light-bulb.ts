import { API, CharacteristicValue, Logging, PlatformAccessory } from "homebridge";
import { Accessory } from "node-tradfri-client";
import { characteristic, deviceInfo, getter, LoggedError, service, setter } from "../utils";
import { IDeviceAdapter } from "./device-adapter";

const TRANSITION_TIME = 0.5;

export class RGBLightBulb implements IDeviceAdapter {
  constructor(
    private log: Logging,
    private api: API,
    private accessory: PlatformAccessory,
    private device: Accessory
  ) {
    deviceInfo(this.api, this.accessory, this.device);

    const lightbulb = service(this.accessory, this.api.hap.Service.Lightbulb);

    characteristic(lightbulb, this.api.hap.Characteristic.Identify)
      .on('set', setter(this.setIdentify));

    characteristic(lightbulb, this.api.hap.Characteristic.On)
      .on("get", getter(this.getOn))
      .on("set", setter(this.setOn));

    characteristic(lightbulb, this.api.hap.Characteristic.Hue)
      .on("get", getter(this.getHue))
      .on("set", setter(this.setHue));

    characteristic(lightbulb, this.api.hap.Characteristic.Brightness)
      .on("get", getter(this.getBrightness))
      .on("set", setter(this.setBrightness));

    characteristic(lightbulb, this.api.hap.Characteristic.Saturation)
      .on("get", getter(this.getSaturation))
      .on("set", setter(this.setSaturation));
  }

  onUpdate(device: Accessory) {
    this.device = device;
  }

  private setIdentify = async () => {
    this.log.debug('setIdentify()');
    if (!this.device) {
      throw new LoggedError(this.log, "device disconnected");
    }
  }

  private getOn = async () => {
    this.log.debug(`getOn()`);
    if (!this.device) {
      throw new LoggedError(this.log, "device disconnected");
    }
    return this.device.lightList[0].onOff;
  };

  private setOn = async (value: CharacteristicValue) => {
    this.log.debug(`setOn(${value})`);
    if (!this.device) {
      throw new LoggedError(this.log, "device disconnected");
    }
    if (await this.device.lightList[0].toggle(Boolean(value))) {
      this.device.lightList[0].onOff = Boolean(value);
    }
  };

  private getHue = async () => {
    this.log.debug(`getHue()`);
    if (!this.device) {
      throw new LoggedError(this.log, "device disconnected");
    }
    return this.device.lightList[0].hue;
  };

  private setHue = async (value: CharacteristicValue) => {
    this.log.debug(`setHue(${value})`);
    if (!this.device) {
      throw new LoggedError(this.log, "device disconnected");
    }
    await this.device.lightList[0].setHue(Number(value), TRANSITION_TIME);
    this.device.lightList[0].hue = Number(value);
  };

  private getBrightness = async () => {
    this.log.debug(`getBrightness()`);
    if (!this.device) {
      throw new LoggedError(this.log, "device disconnected");
    }
    return this.device.lightList[0].dimmer;
  };

  private setBrightness = async (value: CharacteristicValue) => {
    this.log.debug(`setBrightness(${value})`);
    if (!this.device) {
      throw new LoggedError(this.log, "device disconnected");
    }
    this.device.lightList[0].setBrightness(Number(value), TRANSITION_TIME);
  };

  private getSaturation = async () => {
    this.log.debug(`getSaturation()`);
    if (!this.device) {
      throw new LoggedError(this.log, "device disconnected");
    }
    return this.device.lightList[0].saturation;
  };

  private setSaturation = async (value: CharacteristicValue) => {
    this.log.debug(`setSaturation(${value})`);
    if (!this.device) {
      throw new LoggedError(this.log, "device disconnected");
    }
    if (await this.device.lightList[0].setSaturation(Number(value), TRANSITION_TIME)) {
      this.device.lightList[0].saturation = Number(value);
    }
  };
}
