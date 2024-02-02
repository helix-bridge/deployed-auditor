import { ChainInfo, TokenInfo } from "./configure";
import { ProxyAdmin } from "./contract";
import { Log } from "./log";
import {
    Messager,
    Eth2ArbSendService,
    Eth2ArbReceiveService,
    LayerZeroMessager,
    DarwiniaMsglineMessager,
} from "./messager";
import {
    Wallet,
    providers,
} from "ethers";

export class Chain {
    public wallet: Wallet | providers.Provider;
    public name: string;
    public id: number;
    public lzChainId: number;
    public dao: string;
    public operator: string;
    public proxyAdmin: ProxyAdmin;
    public protocolFeeReceiver: string;
    public messagers: Map<string, Messager>;
    public tokens: Map<string, TokenInfo>;
    public log: Log;

    constructor(chainInfo: ChainInfo) {
        // if need send tx, use wallet with private key
        this.wallet = new providers.JsonRpcProvider(chainInfo.url);
        this.proxyAdmin = new ProxyAdmin(chainInfo.proxyAdmin, this.wallet);
        this.name = chainInfo.name;
        this.id = chainInfo.id;
        this.lzChainId = chainInfo.lzChainId;
        this.dao = chainInfo.dao;
        this.operator = chainInfo.operator;
        this.protocolFeeReceiver = chainInfo.protocolFeeReceiver;
        this.messagers = new Map<string, Messager>();
        this.tokens = new Map<string, TokenInfo>(); 
        this.log = new Log();
        if (chainInfo.Eth2ArbSendService) {
            const messager = new Eth2ArbSendService(chainInfo.Eth2ArbSendService!, this.wallet);
            this.messagers.set(messager.name, messager);
        }
        if (chainInfo.Eth2ArbReceiveService) {
            const messager = new Eth2ArbReceiveService(chainInfo.Eth2ArbReceiveService!, this.wallet);
            this.messagers.set(messager.name, messager);
        }
        if (chainInfo.layerZeroMessager) {
            const messager = new LayerZeroMessager(chainInfo.layerZeroMessager!, this.wallet);
            this.messagers.set(messager.name, messager);
        }
        if (chainInfo.DarwiniaMsglineMessager) {
            const messager = new DarwiniaMsglineMessager(chainInfo.DarwiniaMsglineMessager!, this.wallet);
            this.messagers.set(messager.name, messager);
        }
        chainInfo.tokens?.forEach((token: TokenInfo) => {
            this.tokens.set(token.symbol, token);
        });
    }

    async checkProxyAdminDao(): Promise<boolean> {
        return (await this.proxyAdmin.owner()).toLowerCase() === this.dao.toLowerCase();
    }

    async checkProxyAdmin(proxy: string): Promise<boolean> {
        return (await this.proxyAdmin.getProxyAdmin(proxy)).toLowerCase() === this.proxyAdmin.address.toLowerCase();
    }
}

export class ChainManager {
    public log: Log;
    public chains: Map<string, Chain> = new Map<string, Chain>();
    constructor(chainInfos: ChainInfo[]) {
        this.log = new Log();
        for (const chainInfo of chainInfos) {
            this.chains.set(chainInfo.name, new Chain(chainInfo));
        }
    }

    async checkProxyAdminDao(): Promise<void> {
        const chains = Array.from(this.chains.values());
        const count = this.chains.size;
        var index = 0;
        await this.log.progress2("waiting for check proxyAdmin dao", async (
            draw: (current: number, total: number, msg: string, err: string)=>void
        )=>{ 
            const chain = chains[index];
            index++;
            draw(index, count, `[${chain.name}]check proxyAdmin's dao`, '');
            const result = chain.checkProxyAdminDao();
            if (!result) {
                draw(index, count, '', `[${chain.name}]proxyAdmin's dao invalid`);
                return false;
            }
            return index < count;
        });
    }

    async checkMessagerDao(): Promise<void> {
        const chains = Array.from(this.chains.values());
        const count = chains.reduce((sum, current) => sum + current.messagers.size, 0);
        var chainIndex = 0;
        var messagerIndex = 0;
        var index = 0;
        await this.log.progress2("waiting for check messager dao", async (
            draw: (current: number, total: number, msg: string, err: string)=>void
        )=>{
            const chain = chains[chainIndex];
            const messagers  = Array.from(chain.messagers.values());
            const messager = messagers[messagerIndex];
            messagerIndex++;
            index++;
            if (messagerIndex >= chain.messagers.size) {
                messagerIndex = 0;
                chainIndex++;
            }
            draw(index, count, `[${chain.name}-${messager.name}]check messager dao`, '');
            const result = await messager.checkDao(chain.dao);
            if (!result) {
                draw(index, count, '', `[${chain.name}-${messager.name}]messager dao invalid`);
                return false;
            }
            return index < count;
        });
    }
}

