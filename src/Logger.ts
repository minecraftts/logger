import chalk from "chalk";
import path from "path";
import stripAnsi from "strip-ansi";
import LoggerOptions from "./LoggerOptions";
import LogLevel from "./LogLevel";
import util from "util";
import fs from "fs";
import { isMainThread, threadId } from "worker_threads";

export default class Logger {
    private static instance: Logger;

    private stdout: NodeJS.WriteStream;
    private stderr: NodeJS.WriteStream;
    private format: string = `[${chalk.gray("%hh%:%mm%:%ss%")}] [%thread%/%level%]: %message%\n`;
    private logDir?: string = "logs";
    private logFilename?: string = "latest.txt";
    private defaultLevel: LogLevel = LogLevel.INFO;
    private color: boolean = true;

    constructor(options: LoggerOptions = {}) {
        Logger.instance = this;

        this.stdout = process.stdout;
        this.stderr = process.stderr;

        if ("defaultLevel" in options && options.defaultLevel !== undefined) {
            this.defaultLevel = options.defaultLevel;
        }

        if ("format" in options && options.format !== undefined) {
            this.format = options.format;
        }

        if ("color" in options && options.color !== undefined) {
            this.color = options.color;
        }

        if ("logDir" in options) {
            this.logDir = options.logDir;
        }

        if ("logFile" in options) {
            this.logFilename = options.logFile;
        }

        if (this.logDir && this.logFilename) {
            const logDir = path.join(process.cwd(), this.logDir);

            if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
            if (isMainThread) fs.writeFileSync(path.join(logDir, this.logFilename), "");
        }

        console.log = this.log.bind(this);
        console.debug = this.debug.bind(this);
        console.info = this.info.bind(this);
        console.warn = this.warn.bind(this);
        console.error = this.error.bind(this);
    }

    public static raw(...args: any[]): void {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        Logger.instance.raw(...args);
    }

    public static log(...args: any): void {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        Logger.instance.log(...args);
    }

    public static debug(...args: any): void {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        Logger.instance.debug(...args);
    }

    public static info(...args: any): void {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        Logger.instance.info(...args);
    }

    public static warn(...args: any): void {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        Logger.instance.warn(...args);
    }

    public static error(...args: any): void {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        Logger.instance.error(...args);
    }

    public static critical(...args: any): void {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        Logger.instance.critical(...args);
    }

    public raw(...args: any[]): void {
        const formatted = this.formatArgs(args);

        this.stdout.write(formatted);

        if (this.logDir && this.logFilename) {
            fs.appendFileSync(path.join(process.cwd(), this.logDir, this.logFilename), stripAnsi(formatted));
        }
    }

    public log(...args: any): void {
        this.writeFormatted(this.defaultLevel, ...args);
    }

    public debug(...args: any): void {
        this.writeFormatted(LogLevel.DEBUG, ...args);
    }

    public info(...args: any): void {
        this.writeFormatted(LogLevel.INFO, ...args);
    }

    public warn(...args: any): void {
        this.writeFormatted(LogLevel.WARNING, ...args);
    }

    public error(...args: any): void {
        this.writeFormatted(LogLevel.ERROR, ...args);
    }

    public critical(...args: any): void {
        this.writeFormatted(LogLevel.CRITICAL, ...args);
    }

    private writeFormatted(level: LogLevel, ...args: any[]): void {
        const currentTime = new Date();

        const hour = currentTime.getHours();
        const minute = currentTime.getMinutes();
        const second = currentTime.getSeconds();
        const millisecond = currentTime.getMilliseconds();

        let formattedMessage = this.format;

        formattedMessage = formattedMessage.replace("%hh%", hour.toString().padStart(2, "0"));
        formattedMessage = formattedMessage.replace("%mm%", minute.toString().padStart(2, "0"));
        formattedMessage = formattedMessage.replace("%ss%", second.toString().padStart(2, "0"));
        formattedMessage = formattedMessage.replace("%ms%", millisecond.toString().padStart(3, "0"));
        formattedMessage = formattedMessage.replace("%thread%", isMainThread ? "main" : `Thread-${threadId}`);
        formattedMessage = formattedMessage.replace("%level%", this.getLevelString(level));
        formattedMessage = formattedMessage.replace("%message%", this.formatArgs(args));

        if (!this.color) {
            formattedMessage = stripAnsi(formattedMessage);
        }

        if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
            this.stderr.write(formattedMessage);
        } else {
            this.stdout.write(formattedMessage);
        }

        if (this.logDir && this.logFilename) {
            fs.appendFileSync(path.join(process.cwd(), `${this.logDir}/${this.logFilename}`),
                stripAnsi(formattedMessage));
        }
    }

    private getLevelString(level: LogLevel): string {
        switch (level) {
            case LogLevel.DEBUG:
                if (this.color) {
                    return chalk.gray("DEBUG");
                } else {
                    return "DEBUG";
                }
            case LogLevel.INFO:
                if (this.color) {
                    return chalk.green("INFO");
                } else {
                    return "INFO";
                }
            case LogLevel.WARNING:
                if (this.color) {
                    return chalk.yellow("WARNING");
                } else {
                    return "WARNING";
                }
            case LogLevel.ERROR:
                if (this.color) {
                    return chalk.red("ERROR");
                } else {
                    return "ERROR";
                }
            case LogLevel.CRITICAL:
                if (this.color) {
                    return chalk.magentaBright("CRITICAL");
                } else {
                    return "CRITICAL";
                }
            default:
                return "UNKNOWN";
        }
    }

    private formatArgs(args: any[]): string {
        const formattedArgs: string[] = [];

        for (const arg of args) {
            if (typeof arg === "string") {
                formattedArgs.push(arg);
            } else {
                if (arg instanceof Error) {
                    if (arg.stack) formattedArgs.push(arg.stack);
                    else formattedArgs.push(arg.message);
                } else {
                    formattedArgs.push(util.inspect(arg, { showHidden: true, depth: null, colors: this.color }));
                }
            }
        }

        return formattedArgs.join(" ");
    }

    public cleanup(error?: Error | string): void {
        if (error) {
            this.critical(error);
        }

        if (this.logDir && this.logFilename) {
            const date = new Date();
            const logDir = path.join(process.cwd(), this.logDir);
            const logFile = path.join(logDir, this.logFilename);

            let destinationBase = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            let destinationName = `${destinationBase}-0`;
            let destinationFile = path.join(logDir, destinationName);
            let iteration = 0;

            if (fs.existsSync(destinationFile + ".log")) {
                while (fs.existsSync(destinationFile + ".log")) {
                    iteration++;
                    destinationName = `${destinationBase}-${iteration}`;
                    destinationFile = path.join(logDir, destinationName);
                }
            }
            
            fs.copyFileSync(logFile, destinationFile + ".log");
        }

        this.stdout.end();
        this.stderr.end();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        return Logger.instance;
    }
};