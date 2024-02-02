import { Configure } from "./configure";
import { ChainManager } from "./chain";
import { BridgeManager } from "./bridge";

async function main() {
    const c = new Configure();
    const bridgeInfos = c.bridgeInfos();
    const v3bridgeInfos = c.v3bridgeInfos();
    const chainInfos = c.chainInfos();

    const chainManager = new ChainManager(Array.from(chainInfos.values()));
    //await chainManager.checkProxyAdminDao();
    //await chainManager.checkMessagerDao();

    const bridgeManager = new BridgeManager(Array.from(bridgeInfos.values()), Array.from(v3bridgeInfos.values()), chainManager);
    //await bridgeManager.checkBridgeDao();
    //await bridgeManager.checkBridgeOperator();
    //await bridgeManager.checkProxyAdmin();
    //await bridgeManager.checkMessagerService();
    //await bridgeManager.checkv3MessagerService();
    await bridgeManager.checkv3TokenRegisterInfos();
}

main();
