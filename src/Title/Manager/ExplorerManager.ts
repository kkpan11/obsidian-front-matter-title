import {TAbstractFile, TFileExplorerItem, TFileExplorerView} from "obsidian";
import Resolver from "src/Title/Resolver/Resolver";
import Manager from "./Manager";

export default class ExplorerManager implements Manager {
    private originTitles = new Map<string, string>();
    private enabled = false;

    constructor(
        private explorerView: TFileExplorerView,
        private resolver: Resolver
    ) {
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    disable(): void {
        this.restoreTitles();
        this.enabled = false;
    }

    enable(): void {
        this.enabled = true;
    }

    async update(fileOrPath: TAbstractFile | null = null): Promise<boolean> {
        if (!this.isEnabled()) {
            return false;
        }

        const items = fileOrPath
            ? [this.explorerView.fileItems[fileOrPath.path]]
            : Object.values(this.explorerView.fileItems);

        const promises = items.map(e => this.setTitle(e));

        return Promise.all(promises).then(() => true);
    }

    private async setTitle(item: TFileExplorerItem): Promise<void> {
        const title = await this.resolver.resolve(item.file).catch(() => null);

        if (this.isTitleEmpty(title)) {
            return this.restore(item);
        } else if (item.titleInnerEl.innerText !== title) {
            this.keepOrigin(item);
            item.titleInnerEl.innerText = title;
        }
    }

    private isTitleEmpty = (title: string): boolean => title === null || title === '';

    private keepOrigin(item: TFileExplorerItem): void {
        if (!this.originTitles.has(item.file.path)) {
            this.originTitles.set(item.file.path, item.titleInnerEl.innerText);
        }
    }

    private restoreTitles(): void {
        Object.values(this.explorerView.fileItems).map(this.restore.bind(this));
    }

    private restore(item: TFileExplorerItem): void {
        if (this.originTitles.has(item.file.path)) {
            item.titleInnerEl.innerText = this.originTitles.get(item.file.path);
            this.originTitles.delete(item.file.path);
        }
    }
}