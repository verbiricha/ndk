import "websocket-polyfill";

import { NDK } from "../../ndk/index.js";
import { NDKKind } from "../../events/kinds/index.js";
import { NDKRelay } from "../index.js";

describe("NDKPool", () => {
    it("refuses to connect to blacklisted relays", () => {
        const blacklistedRelay = new NDKRelay("wss://url1");
        const ndk = new NDK({
            blacklistRelayUrls: [blacklistedRelay.url],
        });
        const { pool } = ndk;
        pool.addRelay(blacklistedRelay);

        expect(pool.relays.size).toEqual(0);
    });

    it("connects to relays temporarily when creating relay sets", async () => {
        const ndk = new NDK({});
        const { pool } = ndk;

        expect(pool.relays.size).toEqual(0);

        const relay = new NDKRelay("wss://purplepag.es");
        await pool.useTemporaryRelay(relay);

        expect(pool.relays.size).toEqual(1);
        await pool.disconnect();
    });

    it("can be disconnected", async () => {
        const ndk = new NDK({
            explicitRelayUrls: ["wss://nos.lol", "wss://nostr.mom"],
            outboxRelayUrls: ["wss://purplepag.es"],
            enableOutboxModel: true,
        });
        const { pool, outboxPool } = ndk;

        await ndk.connect();

        expect(pool.relays.size).toEqual(2);
        expect(outboxPool?.relays.size).toEqual(1);

        await ndk.fetchEvent({
            authors: ["7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194"],
            kinds: [NDKKind.Contacts],
        });

        expect(pool.relays.size).toEqual(3);
        expect(outboxPool?.relays.size).toEqual(1);

        await ndk.disconnect();

        expect(pool.relays.size).toEqual(0);
        expect(outboxPool?.relays.size).toEqual(0);
    });
});
