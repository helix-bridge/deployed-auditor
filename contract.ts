import {
  Wallet,
  providers,
  Contract,
  ContractInterface,
  BigNumber,
  utils,
} from "ethers";
import { erc20 } from "./abi/erc20";
import { lnDefaultBridge } from "./abi/lnDefaultBridge";
import { lnOppositeBridge } from "./abi/lnOppositeBridge";
import { lnv3Bridge } from "./abi/lnv3Bridge";
import { layerZeroMessager } from "./abi/layerZeroMessager";
import { proxyAdmin } from "./abi/proxyAdmin";
import { abiEth2ArbReceiveService } from "./abi/abiEth2ArbReceiveService";
import { abiEth2ArbSendService } from "./abi/abiEth2ArbSendService";
import { abiDarwiniaMsgLine } from "./abi/abiDarwiniaMsgLine";

export class EthereumContract {
  protected contract: Contract;
  public address: string;
  constructor(
    address: string,
    abi: ContractInterface,
    signer: Wallet | providers.Provider
  ) {
    this.contract = new Contract(address, abi, signer);
    this.address = address;
  }
}

export class Erc20Contract extends EthereumContract {
  constructor(address: string, signer: Wallet | providers.Provider) {
    super(address, erc20, signer);
  }

  // view
  async symbol(): Promise<string> {
    return await this.contract.symbol();
  }

  async name(): Promise<string> {
    return await this.contract.name();
  }

  async decimals(): Promise<number> {
    return await this.contract.decimals();
  }

  async balanceOf(address: string): Promise<BigNumber> {
    return await this.contract.balanceOf(address);
  }
}

export class ProxyAdmin extends EthereumContract {
    constructor(address: string, signer: Wallet | providers.Provider) {
      super(address, proxyAdmin, signer);
    }

    async owner(): Promise<string> {
        return await this.contract.owner();
    }

    async getProxyAdmin(proxy: string): Promise<string> {
        return await this.contract.getProxyAdmin(proxy);
    }
}

export class LnAccessController extends EthereumContract {
    constructor(address: string, abi: ContractInterface, signer: Wallet | providers.Provider) {
      super(address, abi, signer);
    }

    async dao(): Promise<string> {
        return await this.contract.dao();
    }

    async operator(): Promise<string> {
        return await this.contract.operator();
    }

    async callerWhiteList(sender: string): Promise<boolean> {
        return await this.contract.callerWhiteList(sender);
    }
}

export class MessagerContract extends LnAccessController {
    private messagerType: string;
    constructor(address: string, signer: Wallet | providers.Provider, abi: ContractInterface, messagerType: string) {
        super(address, abi, signer);
        this.messagerType = messagerType;
    }
}

export class Eth2ArbSendServiceContract extends MessagerContract {
    constructor(address: string, signer: Wallet | providers.Provider) {
        super(address, signer, abiEth2ArbSendService, "Eth2ArbSendService");
    }
    async remoteMessager(): Promise<string> {
        return (await this.contract.remoteMessager()).toLowerCase();
    }
    async appPair(localApp: string): Promise<string> {
        return (await this.contract.appPairs(localApp)).toLowerCase();
    }
}

export class Eth2ArbReceiveServiceContract extends MessagerContract {
    constructor(address: string, signer: Wallet | providers.Provider) {
        super(address, signer, abiEth2ArbReceiveService, "Eth2ArbReceiveService");
    }
    async remoteMessagerAlias(): Promise<string> {
        return (await this.contract.remoteMessagerAlias()).toLowerCase();
    }

    async remoteMessager(): Promise<string> {
        const remoteAlias = await this.remoteMessagerAlias();
        const remoteAddress = BigNumber.from(remoteAlias).sub(BigNumber.from("0x1111000000000000000000000000000000001111"));
        return remoteAddress.toHexString();
    }

    async appPair(localApp: string): Promise<string> {
        return (await this.contract.appPairs(localApp)).toLowerCase();
    }
}

export interface RemoteMessager {
    lzRemoteChainId: number;
    messager: string;
}

export class LayerZeroMessagerContract extends MessagerContract {
    constructor(address: string, signer: Wallet | providers.Provider) {
        super(address, signer, layerZeroMessager, "layerzero");
    }

    async remoteMessager(remoteChainId: BigNumber): Promise<RemoteMessager> {
        return await this.contract.remoteMessagers(remoteChainId);
    }

    async remoteAppReceiver(remoteChainId: BigNumber, localApp: string): Promise<string> {
        const remoteMessager = await this.remoteMessager(remoteChainId);
        const encode = utils.solidityPack([
            "uint16",
            "address",
        ], [remoteMessager.lzRemoteChainId, localApp]);
        const hash = utils.keccak256(encode);

        return (await this.contract.remoteAppReceivers(hash)).toLowerCase();
    }

    async remoteAppSender(remoteChainId: BigNumber, localApp: string): Promise<string> {
        const remoteMessager = await this.remoteMessager(remoteChainId);
        const encode = utils.solidityPack([
            "uint16",
            "address",
        ], [remoteMessager.lzRemoteChainId, localApp]);
        const hash = utils.keccak256(encode);

        return (await this.contract.remoteAppSenders(hash)).toLowerCase();
    }
}

export interface MsglineRemoteMessager {
    msglineRemoteChainId: number;
    messager: string;
}

export class DarwiniaMsglineMessagerContract extends MessagerContract {
    constructor(address: string, signer: Wallet | providers.Provider) {
        super(address, signer, abiDarwiniaMsgLine, "msgline");
    }

    async remoteMessager(remoteChainId: BigNumber): Promise<MsglineRemoteMessager> {
        return await this.contract.remoteMessagers(remoteChainId);
    }

    async remoteAppReceiver(remoteChainId: BigNumber, localApp: string): Promise<string> {
        const remoteMessager = await this.remoteMessager(remoteChainId);
        const encode = utils.solidityPack([
            "uint256",
            "address",
        ], [remoteMessager.msglineRemoteChainId, localApp]);
        const hash = utils.keccak256(encode);

        return (await this.contract.remoteAppReceivers(hash)).toLowerCase();
    }

    async remoteAppSender(remoteChainId: BigNumber, localApp: string): Promise<string> {
        const remoteMessager = await this.remoteMessager(remoteChainId);
        const encode = utils.solidityPack([
            "uint256",
            "address",
        ], [remoteMessager.msglineRemoteChainId, localApp]);
        const hash = utils.keccak256(encode);

        return (await this.contract.remoteAppSenders(hash)).toLowerCase();
    }
}

export interface MessagerService {
    sendService: string;
    receiveService: string;
}

export abstract class LnBridgeContract extends LnAccessController {
    constructor(address: string, abi: ContractInterface, signer: Wallet | providers.Provider) {
        super(address, abi, signer);
    }

    async paused(): Promise<boolean> {
        return await this.contract.paused();
    }

    abstract messager(remoteChainId: number): Promise<MessagerService>;
    abstract tokenRegistered(remoteChainId: number, srcToken: string, dstToken: string, srcDecimals: number, dstDecimals: number): Promise<boolean>;
}

export class LnDefaultBridgeContract extends LnBridgeContract {
    constructor(address: string, signer: Wallet | providers.Provider) {
        super(address, lnDefaultBridge, signer);
    }
    async messager(remoteChainId: number): Promise<MessagerService> {
        return await this.contract.messagers(remoteChainId);
    }
    async tokenRegistered(remoteChainId: number, srcToken: string, dstToken: string, srcDecimals: number, dstDecimals: number): Promise<boolean> {
        // TODO
        return true;
    }
}

export class LnOppositeBridgeContract extends LnBridgeContract {
    constructor(address: string, signer: Wallet | providers.Provider) {
        super(address, lnOppositeBridge, signer);
    }
    async messager(remoteChainId: number): Promise<MessagerService> {
        return await this.contract.messagers(remoteChainId);
    }
    async tokenRegistered(remoteChainId: number, srcToken: string, dstToken: string, srcDecimals: number, dstDecimals: number): Promise<boolean> {
        // TODO
        return true;
    }
}

export interface Lnv3TokenConfigure {
    protocolFee: number;
    penalty: number;
    sourceDecimals: number;
    targetDecimals: number;
}

export interface Lnv3TokenInfo {
    config: Lnv3TokenConfigure;
    index: number;
    sourceToken: string;
    targetToken: string;
    protocolFeeIncome: number;
}

export class Lnv3BridgeContract extends LnBridgeContract {
    constructor(address: string, signer: Wallet | providers.Provider) {
        super(address, lnv3Bridge, signer);
    }
    private tokenKey(remoteChainId: number, sourceToken: string, targetToken: string): string {
        const encode = utils.solidityPack([
            "uint256",
            "address",
            "address",
        ], [remoteChainId, sourceToken, targetToken]);
        return utils.keccak256(encode);
    }
    async messager(remoteChainId: number): Promise<MessagerService> {
        return await this.contract.messagers(remoteChainId);
    }
    async tokenRegistered(remoteChainId: number, srcToken: string, dstToken: string, srcDecimals: number, dstDecimals: number): Promise<boolean> {
        const tokenInfo = await this.tokenInfo(remoteChainId, srcToken, dstToken);
        const tokenKey = this.tokenKey(remoteChainId, srcToken, dstToken);
        return tokenInfo.config.sourceDecimals === srcDecimals && tokenInfo.config.targetDecimals === dstDecimals && tokenKey === await this.indexToTokenKey(tokenInfo.index);
    }
    async tokenInfo(remoteChainId: number, sourceToken: string, targetToken: string): Promise<Lnv3TokenInfo> {
        const encode = this.tokenKey(remoteChainId, sourceToken, targetToken);
        return await this.contract.tokenInfos(encode);
    }
    async indexToTokenKey(index: number): Promise<string> {
        return await this.contract.tokenIndexer(index);
    }
}

