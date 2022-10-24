export default class LogQueue {
    private queue: string[] = [];

    public push(item: string): void {
        this.queue.push(item);
    }

    public dump(): string[] {
        return this.queue.splice(0, this.queue.length);
    }
}