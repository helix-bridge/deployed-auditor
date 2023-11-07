import { ethers, BigNumber } from "ethers";

export class EthereumProvider {
  public provider: ethers.providers.JsonRpcProvider;

  constructor(url: string) {
    this.provider = new ethers.providers.JsonRpcProvider(url);
  }

  get currentBlocknumber() {
    return this.provider.blockNumber;
  }

  async balanceOf(address: string): Promise<BigNumber> {
    return await this.provider.getBalance(address);
  }

  async gasPrice(): Promise<BigNumber> {
    return await this.provider.getGasPrice();
  }

  async checkPendingTransaction(hash: string): Promise<number> | null {
    const transaction = await this.provider.getTransaction(hash);
    if (!transaction) {
      return null;
    }
    if (transaction.blockNumber == null) {
        return 0;
    } else {
        return transaction.confirmations;
    }
  }
}
