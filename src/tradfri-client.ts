import { isV4Format } from "ip";
import { discoverGateway, TradfriClient } from "node-tradfri-client";
import * as path from "path";
import {
  fileExists,
  prettyJson,
  readFileAsync,
  writeFileAsync,
} from "./utils";

export interface TradfriClientOptions {
  securityCode: string;
}

export async function createClient(options: TradfriClientOptions): Promise<TradfriClient> {
  // Discover
  const result = await discoverGateway();
  if (!result?.name) {
    throw new Error("discovery failed");
  }

  // Find local IPv4 address of the gateway
  const address = result.addresses.find((addr) => isV4Format(addr));
  if (!address) {
    throw new Error("failed to discover the gateway's IPv4 address");
  }

  // Create a client (not yet connected)
  const client = new TradfriClient(address, {
    watchConnection: {
      pingInterval: 5000, // ms
      failedPingCountUntilOffline: 1,
      failedPingBackoffFactor: 1.5,
      reconnectionEnabled: true,
      offlinePingCountUntilReconnect: 3,
      maximumReconnects: Number.POSITIVE_INFINITY,
      maximumConnectionAttempts: Number.POSITIVE_INFINITY,
      connectionInterval: 10000, // ms
      failedConnectionBackoffFactor: 1.5,
    },
  });

  // Authenticate & Connect
  try {
    const { identity, psk } = await authenticate(client, options.securityCode);
    await client.connect(identity, psk);
  } catch (error) {
    throw new Error(`failed to connect: ${error}`);
  }

  // Ping to check connectivity
  if (!(await client.ping(5000))) {
    throw new Error(`gateway unreachable: ping failed`);
  }

  return client;
}

async function authenticate(client: TradfriClient, securityCode: string): Promise<Credentials> {
  const creds = path.join(__dirname, ".credentials.cache");
  if (!(await fileExists(creds))) {
    const credentials = await client.authenticate(securityCode);
    await writeFileAsync(creds, prettyJson(credentials));
  }
  return JSON.parse(await readFileAsync(creds, "utf8"));
}

interface Credentials {
  identity: string;
  psk: string;
}
