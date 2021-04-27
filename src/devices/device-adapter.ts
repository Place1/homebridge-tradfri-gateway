import { Accessory } from "node-tradfri-client";

export interface IDeviceAdapter {
  onUpdate(device: Accessory): void;
}
