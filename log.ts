import chalk from 'chalk';
import { BridgeInfo } from "./configure";

const log = console.log;

export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export class Log {
    simple(data: string, indent?: number) {
        log(' '.repeat(indent??0) + data);
    }
    base(bridgeInfo: BridgeInfo, paused: boolean) {
        log(`[${bridgeInfo.name}]`);
        this.simple(`From Address ${bridgeInfo.fromAddress}`, 4);
        this.simple(`To Address   ${bridgeInfo.toAddress}`, 4);
        this.simple(`Type         ${bridgeInfo.type}`, 4);
        this.simple("Paused       " + (paused ? chalk.red("True") : chalk.green("False")), 4);
    }
    error(data: string) {
        this.simple("error: " + chalk.red(data));
    }
    async waiting(data: string, util: ()=>number) {
        var offset = 0;
        const icons = ['|', '/', '-', '\\'];
        while (util() === 0) {
            offset = (offset + 1) % 4;
            const icon = icons[offset];
            process.stdout.write(`${data} [${icon}]`);
            await delay(1000);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        }
        const result = util() === 1 ? '\x1b[32m[OK]\x1b[0m' : '\x1b[31m[Fail]\x1b[0m';
        process.stdout.write(`${data} ${result}\n`);
    }
    // errmsg, current, total
    async progress(data: string, callback: ()=>Promise<[string, number, number]>) {
        var errmsg = '';
        var current = 0;
        var total = 1;
        while (current < total) {
            if (errmsg !== '') {
                break;
            }
            const percent = current/total;
            var cell_count = Math.floor(percent * 25);
            const cell = '█'.repeat(cell_count);
            const empty = '░'.repeat(25 - cell_count);
            const text = `[${current}/${total}] ${data}: ${(100 * percent).toFixed(2)}% ${cell}${empty}`
            process.stdout.write(text);
            await delay(100);
            const info = await callback();
            errmsg = info[0];
            current = info[1];
            total = info[2];
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        }
        const result = errmsg === '' ? '\x1b[32m[OK]\x1b[0m' : `\x1b[31m[Fail:${errmsg}]\x1b[0m`;
        process.stdout.write(`[${current}/${total}] ${data} ${result}\n`);
    }

    async progress2(
        data: string,
        callback: (
            draw: (
                current: number,
                total: number,
                msg: string,
                err: string
            )=>void
        )=>Promise<boolean>
    ) {
        var errmsg = '';
        var current = 0;
        var total = 1;
        function drawProgress(c: number, t: number, msg: string, err: string) {
            current = c;
            total = t;
            errmsg = err;
            if (err !== '') {
                return;
            }
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            const percent = current/total;
            var cell_count = Math.floor(percent * 25);
            const cell = '█'.repeat(cell_count);
            const empty = '░'.repeat(25 - cell_count);
            const prefix = msg === '' ? '' : `${msg}\n`;
            const text = `${prefix}[${current}/${total}] ${data}: ${(100 * percent).toFixed(2)}% ${cell}${empty}`
            process.stdout.write(text);
        }
        while (errmsg === '' && await callback(drawProgress)) {
            await delay(100);
        }
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        const result = errmsg === '' ? '\x1b[32m[OK]\x1b[0m' : `\x1b[31m[Fail:${errmsg}]\x1b[0m`;
        process.stdout.write(`[${current}/${total}] ${data} ${result}\n`);
    }
}

