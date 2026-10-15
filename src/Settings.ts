import { moment } from "obsidian";

export interface Settings {
    folderName: string;
    pastedImageName: string;
    datetimeFormat: string;
    hideFolder: boolean;
    aeroFolder: boolean;
    autoRenameFolder: boolean;
    autoRenameFiles: boolean;
    autoDeleteFolder: boolean;
}

const _notename = "${notename}";
const _filename = "${filename}";
const _datetime = "${datetime}";

export const DEFAULT_SETTINGS: Settings = {
    folderName: `${_filename}_Attachments`,
    pastedImageName: `${_notename}-${_datetime}`,
    datetimeFormat: 'YYYYMMDDHHmmssSSS',
    hideFolder: false,
    aeroFolder: true,
    autoRenameFolder: true,
    autoRenameFiles: true,
    autoDeleteFolder: false,
}

export const containsFilenameOrNotename = (settings: Settings) => {
    return settings.folderName.contains(_filename) || settings.folderName.contains(_notename);
}

const encode = (text: string) => {
    // 特殊字符
    const specialCharacters = ["\\$", "\\[", "\\]", "\\{", "\\}", "\\(", "\\)", "\\*", "\\+", "\\.", "\\?", "\\\\", "\\^"];
    // 特殊字符的匹配正则
    const reg = new RegExp("[" + specialCharacters.join("") + "]", 'gi');
    // 对特殊字符进行转义
    return text.replace(reg, (character: string) => `\\${character}`);
}

const escapeCssAttr = (text: string) => {
    return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export const buildFolderCssSelectors = (settings: Settings): string[] => {
    const raw = settings.folderName.trim();
    const selectors: string[] = [];

    if (raw.contains(_filename)) {
        const parts = raw.split(_filename);
        const prefix = parts[0];
        const suffix = parts[1];

        // 针对 Obsidian 中支持的 markdown 与 canvas 文件
        const extensions = ['.md', '.markdown', '.canvas'];
        for (const ext of extensions) {
            const endStr = `${ext}${suffix}`;
            if (prefix) {
                selectors.push(`[data-path*="${escapeCssAttr(prefix)}"][data-path$="${escapeCssAttr(endStr)}" i]`);
            } else {
                selectors.push(`[data-path$="${escapeCssAttr(endStr)}" i]`);
            }
        }
    } else if (raw.contains(_notename)) {
        const parts = raw.split(_notename);
        const prefix = parts[0];
        const suffix = parts[1];

        if (suffix && prefix) {
            selectors.push(`[data-path*="${escapeCssAttr(prefix)}"][data-path$="${escapeCssAttr(suffix)}" i]`);
        } else if (suffix) {
            selectors.push(`[data-path$="${escapeCssAttr(suffix)}" i]`);
        } else if (prefix) {
            selectors.push(`[data-path*="/${escapeCssAttr(prefix)}" i]`, `[data-path^="${escapeCssAttr(prefix)}" i]`);
        } else {
            selectors.push(`[data-path]`);
        }
    } else {
        // 固定文件夹名，如 attachments 或 _resources
        selectors.push(`[data-path$="/${escapeCssAttr(raw)}" i]`, `[data-path="${escapeCssAttr(raw)}" i]`);
    }

    return selectors;
}

export const buildFolderRegExp = (settings: Settings) => {
    let reg = encode(settings.folderName);
    // 兼容 notename
    // https://github.com/chenfeicqq/obsidian-attachment-manager/issues/11
    reg = reg.replace(encode(_filename), ".+").replace(encode(_notename), ".+");
    return new RegExp("^" + reg + "$");
}

export const getAttachmentFolderName = (settings: Settings, fileName: string, notename: string) => {
    // 使用 filename
    if (settings.folderName.contains(_filename)) {
        return settings.folderName.replace(_filename, fileName);
    }
    // 使用 notename
    if (settings.folderName.contains(_notename)) {
        return settings.folderName.replace(_notename, notename);
    }
    // 非 filename/notename
    return settings.folderName;
}

export const buildFolderName = (settings: Settings, fileName: string, notename: string) => {
    // 指定当前文件所在文件夹（"./"）下指定的文件夹
    return "./" + getAttachmentFolderName(settings, fileName, notename);
}

export const buildPastedImageName = (settings: Settings, notename: string) => {
    return buildPastedImageNameWithMoment(settings, moment(), notename);
}

export const buildPastedImageNameWithMoment = (settings: Settings, moment: moment.Moment, notename: string) => {
    const datetime = moment.format(settings.datetimeFormat);
    return settings.pastedImageName.replace(_notename, notename).replace(_datetime, datetime);
}