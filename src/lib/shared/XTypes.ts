import type {LinkedList} from "./XList";
import type {XBuilder, XBuilderFactory, XItem, XNode} from "./XRender";
import type {HookActionEnum, HookFilterEnum} from "./Instructions";
import type {Option} from "./Option";

export type XID = number;

type XNodeBase = {
    id: XID;
    type: string;
    position: { x: number, y: number };
};

type XEdgeBase = {
    src: XID;
    trg: XID;
    stages: { x: number, y: number }[];
};

export type XData = { [index: string]: any };

export type XNodeDef = XNodeBase & XData;

export type XEdgeDef = XEdgeBase & XData;

export type XDiagramOptions = {
    id: string;
    catalog: XNodeFactory[];
    nodes: XNodeDef [];
    edges: XEdgeDef[];
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

export type XNodeHandler = {
    name: string;
    handler(ctx: XContext, config: XNodeDef): XNode
};

export type XEdgeHandler = {
    name: string;
    handler(ctx: XContext, config: XEdgeDef): XNode
};

export interface XNodeFactory {
    name: string;
    description?: string;

    build(context: XContext, config: XNodeDef): XNode;
}

export interface XEdgeFactory {
    name: string;
    description?: string;

    build(context: XContext, config: XEdgeDef): XNode;
}

export interface XContext {
    builder: XBuilder;
    theme: XTheme;
    element: HTMLElement;
    options: XDiagramOptions;
    hookManager: HookManager;
    backLayer: XItem;
    middleLayer: XItem;
    frontLayer: XItem;

    getNodes(): LinkedList<XNodeState>;

    getNode(id: XID): Option<XNodeState>;

    existsNode(id: XID): boolean;
    existsLink(id: XID): boolean;

    addNode(state: XNodeState): boolean;

    addLink(arrowState: XArrowState): boolean;

    getLink(id: XID): Option<XArrowState>;

    getLinks(): LinkedList<XArrowState>;

    removeLink(id: XID, full?: boolean): boolean;

    removeNode(id: XID): boolean;

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