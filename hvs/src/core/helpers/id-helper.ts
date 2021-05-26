export default class IdHelper {
    private static next = 0;
    public static getNextId(): number {
        this.next++;
        return this.next;
    }
}