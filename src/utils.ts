import * as fs from "fs";
import { promisify } from "util";
import { Accessory } from "node-tradfri-client";
import {
  API,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  PlatformAccessory,
  Service,
  Characteristic,
  WithUUID,
  Logging,
  Nullable,
} from "homebridge";

export function prettyJson(obj: any) {
  return JSON.stringify(obj, null, "  ");
}

export function isNullOrWhitespace(value?: string) {
  return ["", null, undefined].includes(value?.trim());
}

export const statAsync = promisify(fs.stat);
export const readFileAsync = promisify(fs.readFile);
export const writeFileAsync = promisify(fs.writeFile);

export async function fileExists(path: string) {
  try {
    return (await statAsync(path)).isFile();
  } catch (error) {
    return false;
  }
}

type GetterFn = (cb: CharacteristicGetCallback) => void;

type SetterFn = (value: CharacteristicValue, cb: CharacteristicSetCallback) => void;

export function getter(fn: () => Promise<Nullable<CharacteristicValue>>): GetterFn {
  return async (cb) => {
    try {
      cb(undefined, await fn());
    } catch (error) {
      cb(error);
    }
  };
}

export function setter<T>(fn: (v: CharacteristicValue) => Promise<void>): SetterFn {
  return async (value, cb) => {
    try {
      await fn(value);
      cb(undefined);
    } catch (error) {
      cb(error);
    }
  };
}

export function service(accessory: PlatformAccessory, service: WithUUID<typeof Service>) {
  return accessory.getService(service) ?? accessory.addService(service);
}

export function characteristic(
  service: Service,
  characteristic: WithUUID<{
    new (): Characteristic;
  }>
) {
  return service.getCharacteristic(characteristic) ?? service.addCharacteristic(characteristic);
}

export function deviceInfo(api: API, accessory: PlatformAccessory, device: Accessory) {
  const { manufacturer, modelNumber, firmwareVersion, serialNumber } = device.deviceInfo;
  const info = service(accessory, api.hap.Service.AccessoryInformation);
  if (manufacturer) {
    info.setCharacteristic(api.hap.Characteristic.Manufacturer, manufacturer);
  }
  if (modelNumber) {
    info.setCharacteristic(api.hap.Characteristic.Model, modelNumber);
  }
  if (firmwareVersion) {
    info.setCharacteristic(api.hap.Characteristic.FirmwareRevision, firmwareVersion);
  }
  if (serialNumber) {
    info.setCharacteristic(api.hap.Characteristic.SerialNumber, serialNumber);
  }
}

export class LoggedError extends Error {
  constructor(logging: Logging, error: string) {
    super(error);
    logging.error(`${error}: ${this.stack}`);
  }
}

export function toPercent(min: number, max: number, value: number) {
  return Math.round((100 * (value - min)) / (max - min));
}

export function fromPercent(min: number, max: number, value: number) {
  return min + (max - min) * (value / 100);
}
