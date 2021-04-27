import { API, Logging, PlatformAccessory } from "homebridge";
import { Accessory, AccessoryTypes } from "node-tradfri-client";
import { IDeviceAdapter } from "./devices/device-adapter";
import { RGBLightBulb } from "./devices/rgb-light-bulb";

export function initializeAdapter(
  log: Logging,
  api: API,
  device: Accessory,
  accessory: PlatformAccessory
): IDeviceAdapter | undefined {
  switch (device.type) {
    case AccessoryTypes.lightbulb:
      switch (device.lightList[0].spectrum) {
        case "white":
          break;
        case "rgb":
          return new RGBLightBulb(log, api, accessory, device);
      }
      break;
  }

  // if no device is returned the caller should interpret
  // this as "the device isn't supported"
  return undefined;
}
