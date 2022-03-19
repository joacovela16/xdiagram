import {asMap, doHookBuilder, idGen, isUndefined} from "./shared/XLib";
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
        const filterDispatcher = dispatcher.filter;
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
                const ref = elementListStore.append(node)
                elementMapStore.set(node.id, {state: node, ref});
            },
            getElement(id: XID): Option<XNode> {
                return doOption(elementMapStore.get(id)).map(x => x.state);
            }
            /*existsNode(id: XID): boolean {
                return nodeMapStore.has(id);
            },
            existsLink(id: XID): boolean {
                return linkMapStore.has(id);
            },
            getNodes(): LinkedList<XNodeState> {
                return nodeListStore;
            },
            getNode(id: XID): Option<XNodeState> {
                return doOption(nodeMapStore.get(id)).map(x => x.state);
            },
            removeNode(id: XID): boolean {
                return doOption(nodeMapStore.get(id))
                    .exists(node => {

                        const state = node.state;

                        if (filterDispatcher(HookFilterEnum.NODE_CAN_REMOVE, true, state.element)) {
                            state.out.forEach(x => x.element.command(Command.remove));
                            state.in.forEach(x => x.element.command(Command.remove));
                            state.in.clean();
                            state.out.clean();
                            node.ref.remove();
                            actionDispatcher(HookActionEnum.DATA_UPDATE);
                            return true;
                        }

                        return false;
                    });
            },
            getLink(id: XID): Option<XArrowState> {
                return doOption(linkMapStore.get(id)).map(x => x.state);
            },
            removeLink(id: XID, full?: boolean): boolean {

                return doOption(linkMapStore.get(id))
                    .exists(link => {
                        const state = link.state;
                        const src = state.src;
                        const trg = state.trg;

                        if (isUndefined(full) || full) {
                            isDefined(src) && doOption(nodeMapStore.get(src)).map(x => x.state).foreach(x => x.out.findAndRemove(y => y.id === id));
                            isDefined(trg) && doOption(nodeMapStore.get(trg)).map(x => x.state).foreach(x => x.in.findAndRemove(y => y.id === id));
                        }

                        link.ref.remove();
                        linkMapStore.delete(id);
                        actionDispatcher(HookActionEnum.DATA_UPDATE);
                        return true;
                    });
            },
            addLink(arrowState: XArrowState): boolean {

                const id = arrowState.id;
                const srcDefined = doOption(nodeMapStore.get(arrowState.src))
                    .map(x => x.state.out)
                    .filter(outer => !outer.exists(x => x.id === id))
                    .exists(outer => {
                        outer.append(arrowState);
                        return true;
                    });
                const trgDefined = doOption(nodeMapStore.get(arrowState.trg))
                    .map(x => x.state.in)
                    .filter(inner => !inner.exists(x => x.id === id))
                    .exists(inner => {
                        inner.append(arrowState);
                        return true;
                    });
                const result: boolean = srcDefined || trgDefined;

                doOption(linkMapStore.get(id))
                    .filter(() => srcDefined && trgDefined) // both must be defined
                    .fold(link => {
                            link.state.src = getOrElse(link.state.src, arrowState.src);
                            link.state.trg = getOrElse(link.state.trg, arrowState.trg);
                        },
                        () => {
                            const ref = linkListStore.append(arrowState);
                            linkMapStore.set(id, {ref, state: arrowState});
                        });

                return result;
            },
            addNode(state: XNodeState): boolean {
                const key = state.element.id;

                if (nodeMapStore.has(key)) return false;
                const ref = nodeListStore.append(state);
                nodeMapStore.set(key, {state, ref});

                return true;
            },
            getLinks(): LinkedList<XArrowState> {
                return linkListStore;
            }*/
        };
        actionDispatcher(HookActionEnum.BEFORE_START);

        options.plugins.forEach(x => x.plugin(context, hookManager));

        /*actionListener(HookActionEnum.NODE_ADD, (node: XNodeDef): void => {
            const catalogElement: XNodeFactory = catalog.get(node.type);

            if (catalogElement) {
                const xNode = catalogElement.build(context, node);
                if (xNode) {
                    const state: XNodeState = {element: xNode, out: new LinkedList<XArrowState>(), in: new LinkedList()};

                    const ref = nodeListStore.append(state);
                    nodeMapStore.set(node.id, {state, ref});

                    actionDispatcher(HookActionEnum.NODE_INSTALLED, xNode);
                }
            }
        });*/

        actionListener(HookActionEnum.ELEMENT_ADD, (node: XElementDef): void => {

            const catalogElement: XElementFactory = catalog.get(node.solver);
            if (catalogElement) {
                const xNode = catalogElement.build(context, node);

                if (xNode) {
                    context.addElement(xNode);
                    actionDispatcher(HookActionEnum.ELEMENT_INSTALLED, xNode);
                }
            }
        });

        actionListener(HookActionEnum.DIAGRAM_DESTROY, () => builder.destroy());
        actionDispatcher(HookActionEnum.AFTER_START);
        this.listener = listener;
        this.dispatcher = dispatcher;
    }

    getListener(): HookListener {
        return this.listener;
    }

    addElement(node: XElementDef): void {
        isUndefined(node.id) && (node.id = idGen());
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