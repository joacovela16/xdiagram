import {Callable, XContext, XElementDef, XElementFactory, XID, XTheme} from "../shared/XTypes";
import {defineElement} from "../shared/XHelper";
import {XNode, XPoint} from "../shared/XRender";
import {doArray, doLinker, doLinkZone, doPointer, doReceptor, doSnap, getOrElse, isDefined, isUndefined} from "../shared/XLib";
import {Command, HookActionEnum, HookFilterEnum} from "../shared/Instructions";
import {LinkedList} from "../shared/XList";

type PortConf = {
    isOuter: boolean;
    source: XID[];
    labels: string[];
    src: number;
    trg: number;
    xOffset: number;
    yOffset: number;
    pointRef: XPoint;
    fill: string;
    strokeWidth: number;
    strokeColor: string;
    radius: number;
};

type XNodeBase = {
    name: string;
    description?: string;
    fontSize?: number;
    radius?: number;
    padding?: number;
    textColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
    makeKernelLinkable?: boolean;
};

type XNodePortBase = {
    portTextSize?: number;
    in: string[];
    inColor?: string;
    inStrokeColor?: string;
    inStrikeWidth?: number;

    out: string[];
    outColor?: string;
    outStrokeColor?: string;
    outStrikeWidth?: number;
};

export type XFunctionPortDef = XNodePortBase & XElementDef;

export default function XFunctionPort(cfg: XNodeBase): XElementFactory<XFunctionPortDef> {

    const NODE_TYPE = 'function-node-port'

    return defineElement<XFunctionPortDef>({
        name: cfg.name,
        onInit(context, hookManager) {
            const listener = hookManager.listener;
            const links: Set<string> = new Set<string>();
            const defaultFilter = (value: boolean, node: XNode) => {
                const data = node.data;
                if (data && data.type === NODE_TYPE) {
                    return false;
                }
                return value;
            };

            listener.filter(HookFilterEnum.ELEMENTS_CAN_LINK, (v: boolean, src: XNode, trg: XNode) => {
                const srcData = src.data;
                const trgData = trg.data;

                if (srcData && srcData.type === NODE_TYPE && isDefined(srcData.parent) && links.has(`${srcData.parent}-${src.id}`)) {
                    return false;
                }

                if (trgData && trgData.type === NODE_TYPE && isDefined(trgData.parent) && links.has(`${trgData.parent}-${trg.id}`)) {
                    return false;
                }

                if (srcData && srcData.type === NODE_TYPE && trgData && trgData.type === NODE_TYPE && srcData && trgData && srcData.isOut && trgData.isOut) {
                    return false;
                }
                return v;
            });

            listener.filter("x-linker-plugin-can-apply", (value: boolean, node: XNode) => {
                const data = node.data;
                if (data) {
                    if (data.type === NODE_TYPE) return false;
                    if (data.solver === cfg.name) {
                        return false;
                    }
                }
                return value;
            });


            listener.filter("x-delete-plugin-can-apply", defaultFilter);
            listener.filter("x-copy-plugin-can-apply", defaultFilter);


            listener.action(HookActionEnum.ELEMENT_UNLINKED, (id: XID) => {
                context
                    .getElement(id)
                    .filter(x => isDefined(x.data) && isDefined(x.data.parent) && x.data.type === NODE_TYPE)
                    .foreach(node => {
                        const data = node.data;
                        const parent: XID = data.parent;

                        context
                            .getElement(parent)
                            .filter(x => isDefined(x.data))
                            .foreach(parentNode => {
                                const inner: XID[] = (parentNode.data.inner || []);
                                const innerIdx = inner.indexOf(id);
                                innerIdx !== -1 && (inner[innerIdx] = undefined);

                                const outer: XID[] = (parentNode.data.outer || []);
                                const outerIdx = outer.indexOf(id);
                                outerIdx !== -1 && (outer[outerIdx] = undefined);

                                links.delete(`${parent}-${id}`);
                            });
                    });
            });


            listener.action(HookActionEnum.ELEMENTS_LINKED, (src: XID, trg: XID) => {
                [src, trg].forEach(id => {
                    context
                        .getElement(id)
                        .filter(x => x.data && x.data.type === NODE_TYPE)
                        .foreach(node => {
                            const parent: XID = node.data.parent;
                            links.add(`${parent}-${node.id}`);
                        });
                });
            });
        },
        build(context: XContext, hookManager, config: XFunctionPortDef): XNode {
            const finalCfg: XFunctionPortDef = {...cfg, ...config};
            const b = context.builder;
            const actionDispatcher = hookManager.dispatcher.action;
            const filterDispatcher = hookManager.dispatcher.filter;
            const theme: XTheme = context.theme;

            const makeKernelLinkable = getOrElse(finalCfg.makeKernelLinkable, true);
            const position = finalCfg.position;
            const radius: number = getOrElse(finalCfg.radius, 10);
            const padding: number = getOrElse(finalCfg.padding, 10);
            const portTextSize: number = getOrElse(finalCfg.portTextSize, 14);
            const taskOnRemove: LinkedList<Callable> = new LinkedList<Callable>();

            const textPoint = b.makePoint(position.x, position.y);
            const textEl = b.makeText(textPoint, getOrElse(finalCfg.text, "..."));
            textEl.locked = true;
            textEl.fontSize = getOrElse(finalCfg.fontSize, 28);
            textEl.fillColor = getOrElse(finalCfg.textColor, theme.baseContent);


            // render ports
            const portsElements: XNode[] = [];
            const innerDef = finalCfg.in || [];
            const outerDef = finalCfg.out || [];
            const inNumber = innerDef.length;
            const outNumber = outerDef.length;
            const inner: string[] = doArray(innerDef.length);
            const outer: string[] = doArray(outerDef.length);
            const portsConf: PortConf[] = []
            finalCfg.inner = inner;
            finalCfg.outer = outer;


            const maxPorts = Math.max(inNumber * portTextSize, outNumber * portTextSize) * 3;
            const textPaperBounds = textEl.bounds.clone();
            const tmpWidth = textPaperBounds.width + padding;
            const tmpHeight = textPaperBounds.height * 2;

            textPaperBounds.width = tmpWidth;
            textPaperBounds.height = Math.max(tmpHeight, maxPorts);
            textPaperBounds.center = textEl.bounds.center;

            const rectEl = b.makeRect(textPaperBounds, radius);
            const bounds = rectEl.bounds;
            bounds.center = textPaperBounds.center;
            rectEl.strokeColor = getOrElse(finalCfg.strokeColor, theme.primary);
            rectEl.strokeWidth = getOrElse(finalCfg.strokeWidth, 0);
            rectEl.fillColor = getOrElse(finalCfg.fillColor, theme.primaryContent);


            const DEFAULT_OFFSET: number = 10;
            const distance = bounds.bottomLeft.getDistance(bounds.topLeft);

            if (inNumber > 0) {
                portsConf.push({
                    isOuter: false,
                    source: inner,
                    labels: innerDef,
                    src: bounds.topLeft.y,
                    trg: bounds.bottomLeft.y,
                    pointRef: bounds.topLeft,
                    fill: getOrElse(finalCfg.inColor, theme.primary),
                    xOffset: -DEFAULT_OFFSET,
                    yOffset: distance / (inNumber + 1),
                    radius: getOrElse(finalCfg.inRadius, 15),
                    strokeColor: getOrElse(finalCfg.inStrokeColor, theme.neutral),
                    strokeWidth: getOrElse(finalCfg.inStrikeWidth, 0)
                });
            }

            if (outNumber > 0) {
                portsConf.push({
                    isOuter: true,
                    source: outer,
                    labels: outerDef,
                    src: bounds.topRight.y,
                    trg: bounds.bottomRight.y,
                    pointRef: bounds.topRight,
                    fill: getOrElse(finalCfg.outColor, theme.secondary),
                    xOffset: DEFAULT_OFFSET,
                    yOffset: distance / (outNumber + 1),
                    radius: getOrElse(finalCfg.outRadius, 15),
                    strokeColor: getOrElse(finalCfg.outStrokeColor, theme.neutral),
                    strokeWidth: getOrElse(finalCfg.outStrikeWidth, 0)
                });
            }

            const portsElementsLength = portsConf.length;
            const PARENT_ID: XID = finalCfg.id;
            for (let i = 0; i < portsElementsLength; i++) {
                const datum = portsConf[i];
                const source = datum.source;
                const labels = datum.labels;
                const count = source.length;
                const kind = (datum.isOuter && 'out') || 'in';
                const isOuter = datum.isOuter;
                let point = datum.pointRef;

                for (let j = 0; j < count; j++) {
                    const finalPt = point.clone();
                    const x = point.x + datum.xOffset;
                    finalPt.y += datum.yOffset;
                    const p = b.makePoint(x, finalPt.y);


                    const text = b.makeText(finalPt, labels[j]);
                    text.fillColor = theme.base100;
                    text.fontSize = portTextSize;

                    const rect = b.makeRect(text.bounds.scale(1.5, 1.2), radius);
                    rect.fillColor = datum.fill;

                    const localID: XID = `${kind}:${j}:${PARENT_ID}`;
                    const compound: XNode = b.makeInteractive({
                        items: [rect, text],
                        command: doReceptor({
                            [Command.onElementLinkIn]() {
                                rect.fillColor = isUndefined(source[j]) ? theme.warning : theme.error;
                            },
                            [Command.onElementLinkOut]() {
                                rect.fillColor = datum.fill;
                            },
                            [Command.onElementNormal]() {
                                rect.fillColor = datum.fill;
                            },
                            [Command.onElementError]() {
                                rect.fillColor = theme.error;
                            },
                            [Command.onElementLinked]() {
                                source[j] = localID;
                            },
                            [Command.onElementUnLinked]() {
                                source[j] = undefined;
                            },
                        }),
                        getIntersections(item: XNode): XPoint[] {
                            return rect.getIntersections(item);
                        }
                    });

                    actionDispatcher('x-make-clickable', compound, compound);

                    if (isOuter) {
                        compound.bounds.leftCenter = p;
                    } else {
                        compound.bounds.rightCenter = p;
                    }

                    point = finalPt;
                    portsElements.push(compound);
                    compound.data = {
                        id: localID,
                        type: NODE_TYPE,
                        parent: finalCfg.id,
                        isOut: datum.isOuter,
                        linkable: true
                    };

                    isOuter && taskOnRemove.push(doLinker(compound, compound, compound, context, hookManager));
                    taskOnRemove.push(() => {
                        context.removeElement(localID);
                        actionDispatcher(`${localID}-deleted`);
                    });
                    isOuter && doPointer(rect, context);

                    doLinkZone(compound, hookManager);
                    doPointer(compound, context);
                    context.addElement(compound);
                }
            }

            const command = doReceptor(
                {
                    [Command.remove]() {
                        if (filterDispatcher(HookFilterEnum.ELEMENT_CAN_REMOVE, true, rootEl)) {
                            taskOnRemove.forEach(x => x());
                            taskOnRemove.clean();
                        }
                    },
                    [Command.elementDrag](point: XPoint) {
                        rootEl.moveTo(doSnap(point));
                        actionDispatcher(`${rootEl.id}-drag`, rootEl);
                        portsElements.forEach(x => actionDispatcher(`${x.id}-drag`, x));
                    },
                    [Command.onElementLinkIn]() {
                        rectEl.strokeColor = theme.accent;
                    },
                    [Command.onElementLinkOut]() {
                        rectEl.strokeColor = getOrElse(config.strokeColor, theme.primary);
                    },
                    [Command.onElementNormal]() {
                        rectEl.strokeColor = getOrElse(config.strokeColor, theme.primary);
                    },
                    [Command.onElementLinked]() {
                        rectEl.strokeColor = getOrElse(finalCfg.strokeColor, theme.primary);
                    },
                    [Command.onElementError]() {
                        rectEl.strokeColor = theme.error;
                    }

                }
            );


            const rootEl = b.makeInteractive({
                items: [rectEl, textEl, ...portsElements],
                command,
                getIntersections(shape) {
                    return rectEl.getIntersections(shape);
                }
            });

            rectEl.id = finalCfg.id;
            rectEl.data = {parent: finalCfg.id};
            makeKernelLinkable && doLinkZone(rectEl, hookManager, rootEl);

            rootEl.id = finalCfg.id;
            rootEl.data = finalCfg;
            finalCfg.linkable = false;

            taskOnRemove.push(() => {
                // removes and dispatches rootEl tasks
                rootEl.remove();
                context.removeElement(rootEl.id)
                actionDispatcher(HookActionEnum.ELEMENT_DELETED, rootEl);
                actionDispatcher(`${rootEl.id}-deleted`);
            });

            context.getLayer('front').addChild(rootEl);

            actionDispatcher("x-make-interactive", rectEl, rootEl);

            return rootEl;
        }
    })
}

