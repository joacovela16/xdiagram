import {asMap, doHookBuilder, doHookProxy, idGen, isUndefined} from "./shared/XLib";
import {LinkedList, Record} from "./shared/XList";
import type {HookDispatcher, HookListener, HookManagerProxy, XContext, XDiagramOptions, XElementFactory, XID, XPluginDef, XTheme} from "./shared/XTypes";
import {XElementDef} from "./shared/XTypes";
import {HookActionEnum} from "./shared/Instructions";
import doOption, {Option} from "./shared/Option";
import {XItem, XNode} from "./shared/XRender";

type Holder<T> = { state: T, ref: Record<T>, proxy?: HookManagerProxy };

export default class XDiagram {

    private readonly dispatcher: HookDispatcher;
    private readonly listener: HookListener;
    private readonly elementMapStore: { [idx: XID]: Holder<XNode> };

    constructor(element: HTMLElement, options: XDiagramOptions) {

        const theme: XTheme = options.theme;
        const catalog: Map<string, XElementFactory> = asMap(options.catalog, x => x.name);

        const elementMapStore: { [idx: XID]: Holder<XNode> } = {};
        const elementListStore: LinkedList<XNode> = new LinkedList<XNode>();
        this.elementMapStore = elementMapStore;

        const builder = options.renderer(element);


        const hookManager: HookManagerProxy = doHookProxy(doHookBuilder());
        const dispatcher: HookDispatcher = hookManager.dispatcher;
        const listener: HookListener = hookManager.listener;
        const actionListener = listener.action;
        const actionDispatcher = dispatcher.action;
        const layerStore: { [index: string]: XItem } = {};

        const backLayer = builder.makeGroup();
        const middleLayer = builder.makeGroup();
        const frontLayer = builder.makeGroup();

        layerStore['container'] = builder.makeGroup([backLayer, middleLayer, frontLayer]);
        layerStore['back'] = backLayer;
        layerStore['middle'] = middleLayer;
        layerStore['front'] = frontLayer;

        const context: XContext = {
            element,
            options,
            builder,
            theme,
            getLayer(name: string): XItem {
                return layerStore[name] || (layerStore[name] = builder.makeGroup());
            },
            removeLayer(name: string) {
                const layer = layerStore[name];
                layer && layer.remove();
            },
            activePlugin(cfg: XPluginDef) {
                this.options.plugins.push(cfg);
                cfg.plugin(this, hookManager)
            },
            getElements(): LinkedList<XNode> {
                return elementListStore;
            },
            removeElement(id: XID) {
                doOption(elementMapStore[id]).foreach(x => {
                    x.ref.remove();
                    x.proxy && x.proxy.clean();
                    delete elementMapStore[id];
                });
            },
            addElement(node: XNode) {
                if (isUndefined(node)) return;

                const data = node.data || (node.data = {});
                if (isUndefined(data.id)) {
                    data.id = idGen();
                }

                isUndefined(node.id) && (node.id = data.id);

                const ref = elementListStore.append(node)
                elementMapStore[node.id] = {state: node, ref};
            },
            getElement(id: XID): Option<XNode> {
                return doOption(elementMapStore[id]).map(x => x.state);
            }
        };
        actionDispatcher(HookActionEnum.BEFORE_START);

        options.catalog.forEach(x => x.onInit && x.onInit(context, hookManager));
        options.plugins.forEach(x => x.plugin(context, hookManager));

        actionListener(HookActionEnum.ELEMENT_ADD, (node: XElementDef): void => {

            const catalogElement: XElementFactory = catalog.get(node.solver);
            if (catalogElement) {
                isUndefined(node.id) && (node.id = idGen());

                const proxy = doHookProxy(hookManager);
                const xNode = catalogElement.build(context, proxy, node);
                if (xNode) {
                    xNode.id = node.id;
                    context.addElement(xNode);
                    elementMapStore[xNode.id].proxy = proxy;
                    actionDispatcher(HookActionEnum.ELEMENT_INSTALLED, xNode);
                } else {
                    proxy.clean();
                }
            }
        });

        actionListener(HookActionEnum.DIAGRAM_DESTROY, () => {
            builder.destroy();
            options.catalog.forEach(x => x.onDestroy && x.onDestroy(context, hookManager));
            hookManager.clean();
        });

        actionDispatcher(HookActionEnum.AFTER_START);
        this.listener = listener;
        this.dispatcher = dispatcher;
    }

    getListener(): HookListener {
        return this.listener;
    }

    addElement<T extends XElementDef = XElementDef>(node: T): void {
        this.dispatcher.action(HookActionEnum.ELEMENT_ADD, node);
    }

    getElement(id: XID): XNode | undefined {
        return doOption(this.elementMapStore[id]).map(x => x.state).getOrElse(undefined);
    }

    destroy(): void {
        this.dispatcher.action(HookActionEnum.DIAGRAM_DESTROY);
    }
}