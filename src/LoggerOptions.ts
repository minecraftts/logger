import LogLevel from "./LogLevel";

type LoggerOptions = {
    defaultLevel?: LogLevel;
    format?: string;
    color?: boolean;
    logDir?: string;
    logFile?: string;
};

export default LoggerOptions;