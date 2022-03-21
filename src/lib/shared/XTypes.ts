import type {LinkedList} from "./XList";
import {Record} from "./XList";
import type {XBuilder, XBuilderFactory, XItem, XNode} from "./XRender";
import type {HookActionEnum, HookFilterEnum} from "./Instructions";
import type {Option} from "./Option";

export type XID = number;

export type Holder<T> = { state: T, ref: Record<T> };


export type XData = { [index: string]: any };

type XElementBase = {
    id?: XID;
    solver: string;
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

export type XArrowState = {
    id: XID,
    element: XNode;
    src?: number;
    trg?: number;
};


export type XNodeState = {
    element: XNode;
    in: LinkedList<XArrowState>;
    out: LinkedList<XArrowState>;
};

export type Callable = () => void;

export type HookListener = {
    action(name: HookAction, f: Function): Callable;

    filter(name: HookFilter, f: Function): Callable;
};

export type HookDispatcher = {
    action(name: HookAction, ...args: any): void

    filter<T>(name: HookFilter, data: T, ...args: any): T
};

export type HookManager = {
    listener: HookListener;
    dispatcher: HookDispatcher;
    hasListeners(name: string): boolean;
};

export type XPlugin = (context: XContext, hook: HookManager) => void;

export type XPluginDef = {
    name: string;
    plugin: XPlugin
}

export interface XElementFactory<T = XElementDef> {
    name: string;
    description?: string;
    onInit?: (context: XContext) => void;
    onDestroy?: (context: XContext) => void;
    build: (context: XContext, config: T) => XNode;
}

/*
export interface XEdgeFactory {
    name: string;
    description?: string;

    build(context: XContext, config: XElementDef): XNode;
}
*/

export interface XContext {
    builder: XBuilder;
    theme: XTheme;
    element: HTMLElement;
    options: XDiagramOptions;
    hookManager: HookManager;
    backLayer: XItem;
    middleLayer: XItem;
    frontLayer: XItem;

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
