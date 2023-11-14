import {
  Wallet,
  providers,
  BigNumber,
} from "ethers";

import {
    LnAccessController,
    Eth2ArbSendServiceContract,
    Eth2ArbReceiveServiceContract,
    LayerZeroMessagerContract,
    DarwiniaMsglineMessagerContract,
} from "./contract";

export abstract class Messager {
    public name: string;
    public lnAccessController: LnAccessController;
    constructor(name: string, messagerContract: LnAccessController) {
        this.name = name;
        this.lnAccessController = messagerContract;
    }
    address(): string {
        return this.lnAccessController.address.toLowerCase();
    }
    async checkDao(dao: string): Promise<boolean> {
        return (await this.lnAccessController.dao()) === dao;
    }
    abstract isConnected(remoteChainId: number, remoteMessager: string): Promise<boolean>;
    abstract remoteAppIsSender(remoteChainId: number, localApp: string, remoteApp: string): Promise<boolean>;
    abstract remoteAppIsReceiver(remoteChainId: number, localApp: string, remoteApp: string): Promise<boolean>;
};

export class Eth2ArbSendService extends Messager {
    public contract: Eth2ArbSendServiceContract;
    constructor(address: string, signer: Wallet | providers.Provider) {
        const contract = new Eth2ArbSendServiceContract(address, signer);
        super("arbitrumL1ToL2", contract);
        this.contract = contract;
    }
    async isConnected(remoteChainId: number, remoteMessager: string): Promise<boolean> {
        return remoteMessager.toLowerCase() === await this.contract.remoteMessager();
    }
    async remoteAppIsSender(remoteChainId: number, localApp: string, remoteApp: string): Promise<boolean> {
        return false;
    }
    async remoteAppIsReceiver(remoteChainId: number, localApp: string, remoteApp: string): Promise<boolean> {
        return remoteApp.toLowerCase() === await this.contract.appPair(localApp);
    }
}

export class Eth2ArbReceiveService extends Messager {
    public contract: Eth2ArbReceiveServiceContract;
    constructor(address: string, signer: Wallet | providers.Provider) {
        const contract = new Eth2ArbReceiveServiceContract(address, signer);
        super("arbitrumL1ToL2", contract);
        this.contract = contract;
    }
    async isConnected(remoteChainId: number, remoteMessager: string): Promise<boolean> {
        const remoteAddress = await this.contract.remoteMessager();
        return remoteAddress === remoteMessager;
    }
    async remoteAppIsSender(remoteChainId: number, localApp: string, remoteApp: string): Promise<boolean> {
        return remoteApp.toLowerCase() === await this.contract.appPair(localApp);
    }
    async remoteAppIsReceiver(remoteChainId: number, localApp: string, remoteApp: string): Promise<boolean> {
        return false;
    }
}

export class LayerZeroMessager extends Messager {
    public contract: LayerZeroMessagerContract;
    constructor(address: string, signer: Wallet | providers.Provider) {
        const contract = new LayerZeroMessagerContract(address, signer);
        super("layerzero", contract);
        this.contract = contract;
    }
    async isConnected(remoteChainId: number, remoteMessager: string): Promise<boolean> {
        const remote = await this.contract.remoteMessager(BigNumber.from(remoteChainId.toString()));
        return remote.messager.toLowerCase() === remoteMessager.toLowerCase();
    }

    async remoteAppIsSender(remoteChainId: number, localApp: string, remoteApp: string): Promise<boolean> {
        return remoteApp.toLowerCase() === await this.contract.remoteAppSender(BigNumber.from(remoteChainId.toString()), localApp);
    }
    async remoteAppIsReceiver(remoteChainId: number, localApp: string, remoteApp: string): Promise<boolean> {
        return remoteApp.toLowerCase() === await this.contract.remoteAppReceiver(BigNumber.from(remoteChainId.toString()), localApp);
    }
}

export class DarwiniaMsglineMessager extends Messager {
    public contract: DarwiniaMsglineMessagerContract;
    constructor(address: string, signer: Wallet | providers.Provider) {
        const contract = new DarwiniaMsglineMessagerContract(address, signer);
        super("msgline", contract);
        this.contract = contract;
    }
    async isConnected(remoteChainId: number, remoteMessager: string): Promise<boolean> {
        const remote = await this.contract.remoteMessager(BigNumber.from(remoteChainId.toString()));
        return remote.messager.toLowerCase() === remoteMessager.toLowerCase();
    }

    async remoteAppIsSender(remoteChainId: number, localApp: string, remoteApp: string): Promise<boolean> {
        return remoteApp.toLowerCase() === await this.contract.remoteAppSender(BigNumber.from(remoteChainId.toString()), localApp);
    }
    async remoteAppIsReceiver(remoteChainId: number, localApp: string, remoteApp: string): Promise<boolean> {
        return remoteApp.toLowerCase() === await this.contract.remoteAppReceiver(BigNumber.from(remoteChainId.toString()), localApp);
    }
}
