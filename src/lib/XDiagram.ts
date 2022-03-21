import {asMap, doHookBuilder, idGen, isDefined, isUndefined} from "./shared/XLib";
import {LinkedList} from "./shared/XList";
import type {Holder, HookDispatcher, HookListener, HookManager, XContext, XDiagramOptions, XElementFactory, XID, XPluginDef, XTheme} from "./shared/XTypes";
import {XElementDef} from "./shared/XTypes";
import {HookActionEnum} from "./shared/Instructions";
import doOption, {Option} from "./shared/Option";
import {XNode} from "./shared/XRender";


export default class XDiagram {

    private readonly dispatcher: HookDispatcher;
    private readonly listener: HookListener;

    constructor(element: HTMLElement, options: XDiagramOptions) {

        const theme: XTheme = options.theme;
        const catalog: Map<string, XElementFactory> = asMap(options.catalog, x => x.name);

        const elementMapStore: Map<XID, Holder<XNode>> = new Map<XID, Holder<XNode>>();
        const elementListStore: LinkedList<XNode> = new LinkedList<XNode>();

        const builder = options.renderer(element);
        const backLayer = builder.makeGroup();
        const middleLayer = builder.makeGroup();
        const frontLayer = builder.makeGroup();

        const hookManager: HookManager = doHookBuilder();
        const dispatcher: HookDispatcher = hookManager.dispatcher;
        const listener: HookListener = hookManager.listener;
        const actionListener = listener.action;
        const actionDispatcher = dispatcher.action;

        const context: XContext = {
            element,
            backLayer,
            middleLayer,
            frontLayer,
            hookManager,
            options,
            builder,
            theme,
            activePlugin(cfg: XPluginDef) {
                this.options.plugins.push(cfg);
                cfg.plugin(this, hookManager)
            },
            getElements(): LinkedList<XNode> {
                return elementListStore;
            },
            removeElement(id: XID) {
                doOption(elementMapStore.get(id)).foreach(x => {
                    x.ref.remove();
                    elementMapStore.delete(id);
                });
            },
            addElement(node: XNode) {
                if (isDefined(node.id)) {
                    const ref = elementListStore.append(node)
                    elementMapStore.set(node.id, {state: node, ref});
                }
            },
            getElement(id: XID): Option<XNode> {
                return doOption(elementMapStore.get(id)).map(x => x.state);
            }
        };
        actionDispatcher(HookActionEnum.BEFORE_START);

        options.catalog.forEach(x => x.onInit && x.onInit(context));
        options.plugins.forEach(x => x.plugin(context, hookManager));

        actionListener(HookActionEnum.ELEMENT_ADD, (node: XElementDef): void => {

            const catalogElement: XElementFactory = catalog.get(node.solver);
            if (catalogElement) {
                const localID = idGen();
                isUndefined(node.id) && (node.id = localID);

                const xNode = catalogElement.build(context, node);

                if (xNode) {
                    isUndefined(xNode.id) && (xNode.id = localID);
                    context.addElement(xNode);
                    actionDispatcher(HookActionEnum.ELEMENT_INSTALLED, xNode);
                }
            }
        });

        actionListener(HookActionEnum.DIAGRAM_DESTROY, () => {
            builder.destroy();
            options.catalog.forEach(x => x.onDestroy && x.onDestroy(context));
        });

        actionDispatcher(HookActionEnum.AFTER_START);
        this.listener = listener;
        this.dispatcher = dispatcher;
    }

    getListener(): HookListener {
        return this.listener;
    }

    addElement(node: XElementDef): void {
        this.dispatcher.action(HookActionEnum.ELEMENT_ADD, node);
    }

    /*
        addNode(node: XNodeDef): void {
            this.dispatcher.action(HookActionEnum.NODE_ADD, node);
        }

        addEdge(src: number, trg: number, data?: XData): void {
            this.dispatcher.action(HookActionEnum.EDGE_ADD, src, trg, data);
        }*/

    destroy(): void {
        this.dispatcher.action(HookActionEnum.DIAGRAM_DESTROY);
    }
}