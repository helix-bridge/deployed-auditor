import { BridgeInfo } from "./configure";
import { Chain, ChainManager } from "./chain";
import {
    LnBridgeContract,
    LnDefaultBridgeContract,
    LnOppositeBridgeContract,
} from "./contract";
import { Log } from "./log";
import { Messager } from "./messager";

export class BridgeEndpoint {
    public chain: Chain;
    public bridgeContract: LnBridgeContract;
    constructor(address: string, type: string, chain: Chain) {
        this.chain = chain;
        if (type === 'default') {
            this.bridgeContract = new LnDefaultBridgeContract(address, chain.wallet);
        } else {
            this.bridgeContract = new LnOppositeBridgeContract(address, chain.wallet);
        }
    }

    get address(): string {
        return this.bridgeContract.address;
    }

    async checkDao(): Promise<boolean> {
        return (await this.bridgeContract.dao()) === this.chain.dao;
    }

    async checkOperator(): Promise<boolean> {
        return (await this.bridgeContract.operator()) === this.chain.operator;
    }

    async checkProxyAdmin(): Promise<boolean> {
        return await this.chain.checkProxyAdmin(this.address);
    }
}

export class Bridge {
    public name: string;
    public type: string;
    public messager: string;
    public sourceBridge: BridgeEndpoint;
    public targetBridge: BridgeEndpoint;

    constructor(bridgeInfo: BridgeInfo, fromChain: Chain, toChain: Chain) {
        this.name = bridgeInfo.name;
        this.type = bridgeInfo.type;
        this.messager = bridgeInfo.messager;
        this.sourceBridge = new BridgeEndpoint(bridgeInfo.fromAddress, bridgeInfo.type, fromChain);
        this.targetBridge = new BridgeEndpoint(bridgeInfo.toAddress, bridgeInfo.type, toChain);
    }

    getSourceMessagerFromConfigure(): Messager | undefined {
        return this.sourceBridge.chain.messagers.get(this.messager);
    }

    getTargetMessagerFromConfigure(): Messager | undefined {
        return this.targetBridge.chain.messagers.get(this.messager);
    }

    async getSourceMessagerFromChain(): Promise<string> {
        const remoteChainId = this.targetBridge.chain.id;
        const messagerService = await this.sourceBridge.bridgeContract.messager(remoteChainId);
        return (this.type === 'default' ? messagerService.sendService : messagerService.receiveService).toLowerCase();
    }

    async getTargetMessagerFromChain(): Promise<string> {
        const remoteChainId = this.sourceBridge.chain.id;
        const messagerService = await this.targetBridge.bridgeContract.messager(remoteChainId);
        return (this.type === 'default' ? messagerService.receiveService : messagerService.sendService).toLowerCase();
    }

    async checkSourceConnectTarget(): Promise<boolean> {
        const srcMessager = this.getSourceMessagerFromConfigure();
        const dstMessager = this.getTargetMessagerFromConfigure();
        if (srcMessager === undefined || dstMessager === undefined) {
            return false;
        }
        return await srcMessager!.isConnected(this.targetBridge.chain, dstMessager!.address());
    }

    async checkTargetConnectSource(): Promise<boolean> {
        const srcMessager = this.getSourceMessagerFromConfigure();
        const dstMessager = this.getTargetMessagerFromConfigure();
        if (srcMessager === undefined || dstMessager === undefined) {
            return false;
        }
        return await dstMessager!.isConnected(this.sourceBridge.chain, srcMessager!.address());
    }

    async checkSourceAppConnectTarget(): Promise<boolean> {
        const srcMessager = this.getSourceMessagerFromConfigure();
        const dstMessager = this.getTargetMessagerFromConfigure();
        if (srcMessager === undefined || dstMessager === undefined) {
            return false;
        }
        if (this.type === 'default') {
            return await srcMessager!.remoteAppIsReceiver(this.targetBridge.chain.id, this.sourceBridge.address, this.targetBridge.address);
        } else {
            return await srcMessager!.remoteAppIsSender(this.targetBridge.chain.id, this.sourceBridge.address, this.targetBridge.address);
        }
    }

    async checkTargetAppConnectSource(): Promise<boolean> {
        const srcMessager = this.getSourceMessagerFromConfigure();
        const dstMessager = this.getTargetMessagerFromConfigure();
        if (srcMessager === undefined || dstMessager === undefined) {
            return false;
        }
        if (this.type === 'default') {
            return await dstMessager!.remoteAppIsSender(this.sourceBridge.chain.id, this.targetBridge.address, this.sourceBridge.address);
        } else {
            return await dstMessager!.remoteAppIsReceiver(this.sourceBridge.chain.id, this.targetBridge.address, this.sourceBridge.address);
        }
    }
}

export class BridgeManager {
    public log: Log;
    public bridges: Map<string, Bridge> = new Map<string, Bridge>();
    constructor(bridgeInfos: BridgeInfo[], chainManager: ChainManager) {
        this.log = new Log();
        for (const bridgeInfo of bridgeInfos) {
            const fromChain = chainManager.chains.get(bridgeInfo.from);
            const toChain = chainManager.chains.get(bridgeInfo.to);
            if (fromChain === undefined || toChain === undefined) {
                this.log.error(`[${bridgeInfo.name}] bridge's chain not configured`);
                continue;
            }
            this.bridges.set(bridgeInfo.name, new Bridge(bridgeInfo, fromChain, toChain));
        }
    }
    // check dao
    async checkBridgeDao(): Promise<void> {
        const bridges = Array.from(this.bridges.values());
        const count = this.bridges.size * 2;
        var index = 1;
        await this.log.progress2("waiting for check bridge dao", async (
            draw: (current: number, total: number, msg: string, err: string)=>void
        )=>{ 
            const bridge = bridges[Math.floor(index / 2)];
            draw(index++, count, `[${bridge.name}]check source bridge's dao`, '');
            let result = await bridge.sourceBridge.checkDao();
            if (!result) {
                draw(index, count, '', `[${bridge.name}]source bridge's dao invalid`);
                return false;
            }
            draw(index++, count, `[${bridge.name}]check target bridge's dao`, '');
            result = await bridge.targetBridge.checkDao();
            if (!result) {
                draw(index, count, '', `[${bridge.name}]target bridge's dao invalid`);
                return false;
            }
            return index < count;
        });
    }

    // check operator
    async checkBridgeOperator(): Promise<void> {
        const bridges = Array.from(this.bridges.values());
        const count = this.bridges.size * 2;
        var index = 1;
        await this.log.progress2("waiting for check bridge operator", async (
            draw: (current: number, total: number, msg: string, err: string)=>void
        )=>{ 
            const bridge = bridges[Math.floor(index / 2)];
            draw(index++, count, `[${bridge.name}]check source bridge's operator`, '');
            let result = await bridge.sourceBridge.checkOperator();
            if (!result) {
                draw(index, count, '', `[${bridge.name}]source bridge's operator invalid`);
                return false;
            }
            draw(index++, count, `[${bridge.name}]check target bridge's operator`, '');
            result = await bridge.targetBridge.checkOperator();
            if (!result) {
                draw(index, count, '', `[${bridge.name}]target bridge's operator invalid`);
                return false;
            }
            return index < count;
        });
    }

    // check proxy admin
    async checkProxyAdmin(): Promise<void> {
        const bridges = Array.from(this.bridges.values());
        const count = this.bridges.size * 2;
        var index = 1;
        await this.log.progress2("waiting for check bridge's proxyAdmin", async (
            draw: (current: number, total: number, msg: string, err: string)=>void
        )=>{ 
            const bridge = bridges[Math.floor(index / 2)];
            draw(index++, count, `[${bridge.name}]check source bridge's proxyAdmin`, '');
            let result = await bridge.sourceBridge.checkProxyAdmin();
            if (!result) {
                draw(index, count, '', `[${bridge.name}]source bridge's proxyAmin invalid`);
                return false;
            }
            draw(index++, count, `[${bridge.name}]check target bridge's proxyAdmin`, '');
            result = await bridge.targetBridge.checkProxyAdmin();
            if (!result) {
                draw(index, count, '', `[${bridge.name}]target bridge's proxyAmin invalid`);
                return false;
            }
            return index < count;
        });
    }

    // check messager service
    async checkMessagerService(): Promise<void> {
        const bridges = Array.from(this.bridges.values());
        const countEachTime = 6;
        const count = this.bridges.size * countEachTime;
        var index = 1;
        await this.log.progress2("waiting for check bridge's message service", async (
            draw: (current: number, total: number, msg: string, err: string)=>void
        )=>{ 
            const bridge = bridges[Math.floor(index / countEachTime)];
            // check
            draw(index++, count, `[${bridge.name}]check source messager setting`, '');
            const sourceMessagerAddress = await bridge.getSourceMessagerFromChain();
            const sourceMessager = bridge.getSourceMessagerFromConfigure();
            if (sourceMessagerAddress !== sourceMessager?.address()) {
                draw(index, count, 'check source messager', `[${bridge.name}]source address not matched, ${sourceMessagerAddress} != ${sourceMessager?.address()}`);
                return false;
            }
            draw(index++, count, `[${bridge.name}]check target messager setting`, '');
            const targetMessagerAddress = await bridge.getTargetMessagerFromChain();
            const targetMessager = bridge.getTargetMessagerFromConfigure();
            if (targetMessagerAddress !== targetMessager?.address()) {
                draw(index, count, 'check target messager', `[${bridge.name}]target address not matched, ${targetMessagerAddress} != ${targetMessager?.address()}`);
                return false;
            }
            draw(index++, count, `[${bridge.name}]check messager connection source->target`, '');
            const srcConnected = await bridge.checkSourceConnectTarget();
            if (!srcConnected) {
                draw(index, count, 'check connect source->target', `[${bridge.name}]source not connected`);
                return false;
            }
            draw(index++, count, `[${bridge.name}]check messager connection target->source`, '');
            const dstConnected = await bridge.checkTargetConnectSource();
            if (!dstConnected) {
                draw(index, count, 'check connect target->source', `[${bridge.name}]target not connected`);
                return false;
            }
            // check app connection
            draw(index++, count, `[${bridge.name}]check app connection source->target`, '');
            const srcAppConnected = await bridge.checkSourceAppConnectTarget();
            if (!srcAppConnected) {
                draw(index, count, 'check app connect source->target', `[${bridge.name}]source app not connected`);
                return false;
            }
            draw(index++, count, `[${bridge.name}]check app connection target->source`, '');
            const dstAppConnected = await bridge.checkTargetAppConnectSource();
            if (!dstAppConnected) {
                draw(index, count, 'check app connect target->source', `[${bridge.name}]target app not connected`);
                return false;
            }
            return index < count;
        });
    }
}

