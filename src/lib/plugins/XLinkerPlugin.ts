import type {Callable, XElementDef, XPluginDef} from "../shared/XTypes";
import {Timer} from "../shared/XLib";
import type {XBound, XItem, XNode, XPoint} from "../shared/XRender";
import {PathHelper} from "../shared/XRender";
import {Command, HookActionEnum, HookFilterEnum} from "../shared/Instructions";
import {LinkedList} from "../shared/XList";
import XToolBuilder from "./XToolBuilder";
import {definePlugin} from "../shared/XHelper";

export const X_ARROW_CONFIG_MAPPER_EVENT = 'x-arrow-config-mapper';

function BUTTON_PLUGIN(solver: string): XPluginDef {
    return XToolBuilder('x-linker-button-plugin', context => {

        const b = context.builder;
        const theme = context.theme;
        const line = b.makePath();
        const listeners: LinkedList<Callable> = new LinkedList<Callable>();
        const hookManager = context.hookManager;
        const actionListener = hookManager.listener.action;
        const actionDispatcher = hookManager.dispatcher.action;
        const filterDispatcher = hookManager.dispatcher.filter;
        const timer = new Timer(100);

        let isLinking: boolean = false;
        let sourceNode: XNode, targetNode: XNode;

        line.visible = false;
        line.strokeWidth = 2;
        line.strokeColor = theme.primary;
        line.dashArray = [4, 4];

        context.backLayer.addChild(line);

        function cleanListeners() {
            listeners.forEach(x => x());
            listeners.clean();
        }

        function doListeners() {
            listeners
                .push(
                    actionListener(HookActionEnum.LINK_ZONE_IN, (node: XNode) => {
                        if (isLinking && sourceNode && sourceNode.id !== node.id) {
                            targetNode = node;
                            if (filterDispatcher(HookFilterEnum.NODES_CAN_LINK, sourceNode, targetNode)) {
                                node.command(Command.onNodeFocus);
                                line.strokeColor = theme.accent;
                            } else {
                                node.command(Command.onNodeError);
                                line.strokeColor = theme.error;
                            }
                        }
                    })
                );

            listeners
                .push(
                    actionListener(HookActionEnum.LINK_ZONE_OUT, (node: XNode) => {
                        node.command(Command.onNodeNormal);
                        line.strokeColor = theme.primary;
                        targetNode = null;
                    })
                );
        }

        return {
            selectEvents: [HookActionEnum.ELEMENT_SELECTED],
            unselectEvents: [
                HookActionEnum.ELEMENT_START_DRAG,
                HookActionEnum.BOARD_CLICK,
                // HookActionEnum.EDGE_SELECTED,
                HookActionEnum.ELEMENT_DELETED
            ],
            onSelect(node) {
                sourceNode = node;
            },
            getPosition(bound: XBound): XPoint {
                const position = bound.topLeft.clone();
                position.x += -10;
                position.y += -10;
                return position;
            },
            icon(): string {
                return `<svg width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                       <circle cx="6" cy="18" r="2"></circle>
                       <circle cx="18" cy="6" r="2"></circle>
                       <line x1="7.5" y1="16.5" x2="16.5" y2="7.5"></line>
                    </svg>`;
            },
            onButtonReady(linkIcon: XItem): void {
                linkIcon.on('mousedown', () => {
                    timer.clear();
                    timer.handle(() => {
                        if (sourceNode) {
                            line.clear();
                            line.visible = true;
                            isLinking = true;
                            doListeners();
                        }
                    });
                });

                linkIcon.on('mouseup', () => {
                    timer.clear();
                    isLinking = false;
                    line.visible = false;
                    sourceNode && sourceNode.command(Command.onNodeNormal);
                    targetNode && targetNode.command(Command.onNodeNormal);

                    if (sourceNode && targetNode) {
                        const localCfg: XElementDef = {solver, src: sourceNode.id, trg: targetNode.id};
                        actionDispatcher(HookActionEnum.ELEMENT_ADD, localCfg);
                    }
                    targetNode = null;
                    cleanListeners();
                });

                linkIcon.on('mousedrag', event => {
                    if (isLinking) {
                        const src = sourceNode.position;
                        const trg = event.point;
                        line.begin();
                        line.addCommand(PathHelper.moveTo(src));
                        line.addCommand(PathHelper.lineTo(trg));
                        line.end();
                    }
                });
            }
        }
    });
}

export default function XLinkerPlugin(solver: string = "x-arrow"): XPluginDef {
    // const factory: XEdgeFactory = arrowFactory;

    return definePlugin({
        name: 'x-linker-plugin',
        plugin(ctx, hook) {

            // const factory = ctx.options.catalog.find(x => x.name === solver);
            // if (isUndefined(factory)) return;

            // const actionListener = hook.listener.action;
            // const dispatcher = hook.dispatcher;

            ctx.activePlugin(BUTTON_PLUGIN(solver));

            /*actionListener(HookActionEnum.ELEMENT_ADD, (cfg: XElementDef) => {
                const src: number = cfg.src;
                const trg: number = cfg.trg;

                if (!cfg.linkable && isDefined(src) && isDefined(trg)) {

                    ctx.getElement(src).foreach(srcElem => {
                        ctx.getElement(trg).foreach(trgElem => {

                            const points = getMinDistance(srcElem.bounds, trgElem.bounds);
                            const finalPoints = dispatcher.filter(HookFilterEnum.EDGE_OBTAIN_EXTREMES, points);

                            if (finalPoints.length === 2) {
                                const x = finalPoints[0];
                                const y = finalPoints[1];

                                cfg.stages = [{x: x.y, y: x.y}, {x: y.y, y: y.y}];

                                const finalCfg: XElementDef = dispatcher.filter(X_ARROW_CONFIG_MAPPER_EVENT, cfg);
                                const arrow = factory.build(ctx, finalCfg);
                                ctx.addElement(arrow);
                                // dispatcher.action(HookActionEnum.EDGE_INSTALLED, arrow);
                                dispatcher.action(HookActionEnum.DATA_UPDATE);
                            }

                        });
                    });
                }
            });*/
            /*actionListener(HookActionEnum.EDGE_ADD, (src: XID, trg: XID, data?: XData): void => {

                ctx.getNode(src).foreach(srcState => {
                    ctx.getNode(trg).foreach(trgState => {
                        const srcElem = srcState.element;
                        const trgElem = trgState.element;

                        const srcID = srcElem.id;
                        const trgID = trgElem.id;

                        const points = getMinDistance(srcElem.bounds, trgElem.bounds);
                        const finalPoints = dispatcher.filter(HookFilterEnum.EDGE_OBTAIN_EXTREMES, points);

                        if (finalPoints.length === 2) {
                            const x = finalPoints[0];
                            const y = finalPoints[1];
                            const edgeDef: XEdgeDef = {
                                id: idGen(),
                                src: srcID,
                                trg: trgID,
                                stages: [{x: x.y, y: x.y}, {x: y.y, y: y.y},],
                                ...data
                            };

                            const finalCfg: XEdgeDef = dispatcher.filter(X_ARROW_CONFIG_MAPPER_EVENT, edgeDef);
                            const arrow = factory.build(ctx, finalCfg);
                            const arrowState: XArrowState = {id: edgeDef.id, src, trg, element: arrow};

                            if (ctx.addLink(arrowState)) {
                                dispatcher.action(HookActionEnum.EDGE_INSTALLED, arrow);
                                dispatcher.action(HookActionEnum.DATA_UPDATE);
                            } else {
                                arrow.remove();
                            }
                        }
                    });
                });
            });*/

        }
    });
}