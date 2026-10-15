import { setIcon } from "obsidian";

import { Plugin } from '../Plugin'
import { lang } from '../lang'
import { buildFolderCssSelectors } from '../Settings'

export class HideFolder {
    plugin: Plugin
    ribbonIconButton: HTMLElement;
    statusBarItem: HTMLElement;
    styleEl: HTMLStyleElement;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    load() {
        // 创建用于注入动态样式规则的 style 元素
        this.styleEl = document.createElement("style");
        this.styleEl.id = "attachment-manager-smart-hider";
        document.head.appendChild(this.styleEl);

        // 创建左侧功能区图标
        this.ribbonIconButton = this.plugin.addRibbonIcon(
            this.plugin.settings.hideFolder ? "eye-off" : "eye",
            lang.get("command_toggle_attachment_folder_visibility"),
            async (evt: MouseEvent) => {
                this.plugin.settings.hideFolder = !this.plugin.settings.hideFolder;
                await this.plugin.saveSettings();
                await this.refresh();
            }
        );

        // 创建底部状态栏指示
        this.statusBarItem = this.plugin.addStatusBarItem();

        // 注册命令：切换显示/隐藏
        this.plugin.addCommand({
            id: "toggle-attachment-folder_visibility",
            name: lang.get("command_toggle_attachment_folder_visibility"),
            callback: async () => {
                this.plugin.settings.hideFolder = !this.plugin.settings.hideFolder;
                await this.plugin.saveSettings();
                await this.refresh();
            },
        });

        this.refresh();
    }

    async refresh() {
        if (this.ribbonIconButton) {
            setIcon(this.ribbonIconButton, this.plugin.settings.hideFolder ? "eye-off" : "eye");
        }
        if (this.statusBarItem) {
            this.statusBarItem.setText(this.plugin.settings.hideFolder ? lang.get("status_attachment_folder_visibility") : "");
        }
        this.updateStyle();
    }

    updateStyle() {
        if (!this.styleEl) {
            return;
        }

        const selectors = buildFolderCssSelectors(this.plugin.settings);
        if (selectors.length === 0) {
            this.styleEl.textContent = "";
            return;
        }

        const targetRules = selectors.map(sel =>
            `.workspace-leaf-content[data-type="file-explorer"] .tree-item:has(> .tree-item-self${sel})`
        ).join(',\n');

        let css = `/* ==========================================================================
   Smart Hider: 覆盖虚拟列表计算的内联 min-height，消除留白与下垂导轨线
   ========================================================================== */
.workspace-leaf-content[data-type="file-explorer"] .nav-folder-children {
    min-height: 0 !important;
}
`;

        if (this.plugin.settings.hideFolder) {
            css += `\n/* 隐藏匹配的附件文件夹及内部文件（脱离文档流） */\n${targetRules} {\n    display: none !important;\n}\n`;
        } else if (this.plugin.settings.aeroFolder) {
            css += `\n/* 半透明显示匹配的附件文件夹 */\n${targetRules} {\n    opacity: 0.2;\n}\n`;
        }

        this.styleEl.textContent = css;
    }

    unload() {
        if (this.styleEl) {
            this.styleEl.remove();
        }
    }
}