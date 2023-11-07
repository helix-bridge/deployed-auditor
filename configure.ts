import * as fs from "fs";

export interface ChainInfo {
    [props: string]: any
    name: string;
    id: number;
    dao: string;
    proxyAdmin: string;
    operator: string;
    protocolFeeReceiver: string;
    url: string;
    // messagers
    Eth2ArbSendService: string | undefined;
    Eth2ArbReceiveService: string | undefined;
    layerZeroMessager: string | undefined;
};

export interface BridgeInfo {
    [props: string]: any
    name: string;
    type: string;
    fromAddress: string;
    toAddress: string;
    from: string;
    to: string;
    messager: string;
};

export interface ConfigInfo {
    chains: ChainInfo[];
    bridges: BridgeInfo[];
};

export class Configure {
  public readonly config: ConfigInfo = JSON.parse(
    fs.readFileSync("./.maintain/configure.json", "utf8")
  );

  chainInfos(): Map<string, ChainInfo> {
      var commonInfo = this.config.chains.find((e) => e.name === 'common');
      function getOption(e: ChainInfo, option: string) {
          return e[option] === undefined ? commonInfo?.[option] : e[option];
      }
      const infos = this.config.chains.filter((e: ChainInfo) => e.name !== 'common').map((e: ChainInfo) => {
          return {
              name: e.name,
              id: e.id,
              dao: getOption(e, 'dao'),
              proxyAdmin: getOption(e, 'proxyAdmin'),
              operator: getOption(e, 'operator'),
              protocolFeeReceiver: getOption(e, 'protocolFeeReceiver'),
              url: e.url,
              Eth2ArbSendService: e.Eth2ArbSendService,
              Eth2ArbReceiveService: e.Eth2ArbReceiveService,
              layerZeroMessager: e.layerZeroMessager
          };
      });
      return new Map(infos.map(e => [e.name, e]));
  }

  bridgeInfos(): Map<string, BridgeInfo> {
      var defaultInfo = this.config.bridges.find((e) => e.name === 'common' && e.type === 'default');
      var oppositeInfo = this.config.bridges.find((e) => e.name === 'common' && e.type === 'opposite');
      const infos = this.config.bridges.filter((e: BridgeInfo) => e.name !== 'common').map((e: BridgeInfo) => {
          return {
              name: e.name,
              from: e.name.split('->')[0],
              to: e.name.split('->')[1],
              type: e.type,
              fromAddress: e.fromAddress !== undefined ? e.fromAddress : e.type === 'default' ? defaultInfo?.address : oppositeInfo?.address,
              toAddress: e.toAddress !== undefined ? e.toAddress : e.type === 'default' ? defaultInfo?.address : oppositeInfo?.address,
              messager: e.messager,
          }
      });
      return new Map(infos.map(e => [e.name, e]));
  }
}

