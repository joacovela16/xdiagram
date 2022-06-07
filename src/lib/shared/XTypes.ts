import type {LinkedList} from "./XList";
import type {XBuilder, XBuilderFactory, XItem, XNode} from "./XRender";
import type {HookActionEnum, HookFilterEnum} from "./Instructions";
import type {Option} from "./Option";
import {XBound, XPoint} from "./XRender";

export type XID = number | string;

export type XData = { [index: string]: any };

type XElementBase = {
    id?: XID;
    solver: string;
    linkable?: boolean;
    description?: string;
};

export type XElementDef = XElementBase & XData;

export type XDiagramOptions = {
    id: string;
    catalog: XElementFactory[];
    plugins: XPluginDef[];
    theme: XTheme;
    renderer: XBuilderFactory
};

export type HookAction = HookActionEnum | string;

export type HookFilter = HookFilterEnum | string;

export type Callable = () => void;

export type HookListener = {
    action(name: HookAction, f: Function): Callable;

    filter(name: HookFilter, f: Function): Callable;
};

export type HookDispatcher = {
    action(name: HookAction, ...args: any[]): void

    filter<T>(name: HookFilter, data: T, ...args: any[]): T
};

export type HookManager = {
    listener: HookListener;
    dispatcher: HookDispatcher;
    hasListeners(name: string): boolean;

};

export interface HookManagerProxy extends HookManager {
    clean(): void;
}

export type XPlugin = (context: XContext, hookManager: HookManager) => Callable | void;

export type XPluginDef = {
    name: string;
    plugin: XPlugin
}

export interface XElementFactory<T = XElementDef> {
    name: string;
    description?: string;
    onInit?: (context: XContext, hookManager: HookManager) => void;
    onDestroy?: (context: XContext, hookManager: HookManager) => void;
    build: (context: XContext, hookManager: HookManager, config: T) => XNode;
}

export interface XContext {
    builder: XBuilder;
    theme: XTheme;
    element: HTMLElement;
    options: XDiagramOptions;

    getLayer(name: string): XItem;

    removeLayer(name: string): void;

    getElements(): LinkedList<XNode>;

    getElement(id: XID): Option<XNode>;

    addElement(node: XNode): void;

    removeElement(id: XID): void;

    activePlugin(cfg: XPluginDef): void
}

export type XTheme = {
    primary: string;
    primaryFocus: string;
    primaryContent: string;
    secondary: string;
    secondaryFocus: string;
    secondaryContent: string;
    accent: string;
    accentFocus: string;
    accentContent: string;
    neutral: string;
    neutralFocus: string;
    neutralContent: string;
    base100: string;
    base200: string;
    base300: string;
    baseContent: string;
    info: string;
    success: string;
    warning: string;
    error: string;
}

export type XIconTool = {
    selectEvents: HookActionEnum[];
    unselectEvents: HookActionEnum[];
    onSelect?: (node: XNode, icon: XItem) => void;
    iconHoverColor?: (theme: XTheme) => string;
    onClick?: (node: XNode) => void;
    onButtonReady?: (node: XItem) => void;

    icon(theme: XTheme): string;

    getPosition(bound: XBound): XPoint;
}