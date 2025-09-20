
export enum Colors {
    Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underscore = "\x1b[4m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Hidden = "\x1b[8m",

    FgBlack = "\x1b[30m",
    FgRed = "\x1b[31m",
    FgGreen = "\x1b[32m",
    FgYellow = "\x1b[33m",
    FgBlue = "\x1b[34m",
    FgMagenta = "\x1b[35m",
    FgCyan = "\x1b[36m",
    FgWhite = "\x1b[37m",

    BgBlack = "\x1b[40m",
    BgRed = "\x1b[41m",
    BgGreen = "\x1b[42m",
    BgYellow = "\x1b[43m",
    BgBlue = "\x1b[44m",
    BgMagenta = "\x1b[45m",
    BgCyan = "\x1b[46m",
    BgWhite = "\x1b[47m",
}

export enum Levels {
    ERROR = "ERROR",
    WARN = "WARN",
    INFO = "INFO",
    DEBUG = "DEBUG",
    SUCCESS = "SUCCESS"
}

export default class Console {


    static error(...args: any[]): void {
        this.log(Levels.ERROR, ...args);
    }

    static warn(...args: any[]): void {
        this.log(Levels.WARN, ...args);
    }

    static info(...args: any[]): void {
        this.log(Levels.INFO,...args);
    }
    static success(...args: any[]): void {
        this.log(Levels.SUCCESS,...args);
    }
    static debug(...args: any[]): void {
        this.log(Levels.DEBUG,...args);
    }

    static logCustomLevel(levelName: string,without: boolean = true, ...args: any[]): void {
        if(without){
            this.logWithout(levelName as Levels,...args);
        } else {
            this.log(levelName as Levels,...args);
        }
    }


    static logWithout(level: Levels, ...args: any[]): void {
        const color = level === Levels.ERROR ? Colors.FgRed :
            level === Levels.WARN ? Colors.FgYellow :
                level === Levels.INFO ? Colors.FgMagenta :
                    level === Levels.SUCCESS ? Colors.FgGreen :
                        Colors.FgCyan; // DEBUG

        let output = "\n";

        for (const arg of args) {
            let msg: string | undefined;

            if (arg instanceof Error) {
                // Se o argumento for um Error, usa a stack trace.
                // A propriedade .stack já inclui a mensagem do erro.
                msg = arg.stack;
            } else if (typeof arg === 'string') {
                if(arg !== ''){
                    msg = arg;
                } else {
                    continue
                }
            } else {
                // Para outros tipos de objetos, converte para JSON.
                msg = JSON.stringify(arg, null, 2);
            }

            output += `  ${color}${level}  ${Colors.Reset}${msg}\n`;
        }

        process.stdout.write(output);
    }

    static log(level: Levels, ...args: any[]): void {
        const color = level === Levels.ERROR ? Colors.FgRed :
            level === Levels.WARN ? Colors.FgYellow :
                level === Levels.INFO ? Colors.FgMagenta :
                    level === Levels.SUCCESS ? Colors.FgGreen :
                        Colors.FgCyan; // DEBUG

        let output = "\n";

        for (const arg of args) {
            let msg: string | undefined;

            if (arg instanceof Error) {
                // Se o argumento for um Error, usa a stack trace.
                // A propriedade .stack já inclui a mensagem do erro.
                msg = arg.stack;
            } else if (typeof arg === 'string') {
                if(arg !== ''){
                    msg = arg;
                } else {
                    continue
                }
            } else {
                // Para outros tipos de objetos, converte para JSON.
                msg = JSON.stringify(arg, null, 2);
            }

            output += `  ${color}${level}  ${Colors.Reset}${msg}\n`;
        }

        output += "\n";
        process.stdout.write(output);
    }


    // ---- MÉTODOS INTERATIVOS ----
    static async ask(question: string, defaultValue?: string): Promise<string> {
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

        const coloredQuestion = ` ${Colors.FgMagenta}${question}${Colors.Reset}`;
        const defaultValuePart = defaultValue
            ? ` [${Colors.Reset}${Colors.FgCyan}${defaultValue}${Colors.Reset}]`
            : '';
        const fullPrompt = `${coloredQuestion}${defaultValuePart}:\n > `;


        return new Promise(resolve => {
            rl.question(fullPrompt, ans => {
                rl.close();
                const value = ans.trim();
                resolve(value === '' && defaultValue !== undefined ? defaultValue : value);
            });
        });
    }


    static async confirm(message: string, defaultYes = false): Promise<boolean> {
        const suffix = defaultYes ? 'yes' : 'no';
        while (true) {
            const ans = (await this.ask(message + " (yes/no)", suffix)).toLowerCase();
            if (!ans) return defaultYes;
            if (['y','yes'].includes(ans)) return true;
            if (['n','no'].includes(ans)) return false;
            this.warn('Resposta inválida, digite y ou n.');
        }
    }


    /**
     * Exibe uma tabela formatada no console.
     * @param data
     */
    static table(data: Record<string, any> | Array<{ Field: string, Value: any }>): void {
        // Normaliza para array de objetos { Field, Value }
        let rows: Array<{ Field: string, Value: any }>;
        if (Array.isArray(data)) {
            rows = data.map(row => ({ Field: String(row.Field), Value: String(row.Value) }));
        } else {
            rows = Object.entries(data).map(([Field, Value]) => ({ Field, Value: String(Value) }));
        }
        // Descobre o tamanho máximo de cada coluna
        const fieldLen = Math.max(...rows.map(r => r.Field.length), 'Field'.length);
        const valueLen = Math.max(...rows.map(r => r.Value.length), 'Value'.length);
        const sep = `+${'-'.repeat(fieldLen+2)}+${'-'.repeat(valueLen+2)}+`;
        // Cabeçalho com cor verde
        let output = sep + '\n';
        output += `| ${Colors.FgGreen}${'Field'.padEnd(fieldLen)}${Colors.Reset} | ${Colors.FgGreen}${'Value'.padEnd(valueLen)}${Colors.Reset} |\n`;
        output += sep + '\n';
        // Linhas
        for (const row of rows) {
            output += `| ${row.Field.padEnd(fieldLen)} | ${row.Value.padEnd(valueLen)} |\n`;
        }
        output += sep + '\n';
        process.stdout.write(output);
    }
}
