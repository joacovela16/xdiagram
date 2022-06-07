import {Callable, XContext, XElementDef, XElementFactory, XID, XTheme} from "../shared/XTypes";
import {defineElement} from "../shared/XHelper";
import {XNode, XPoint} from "../shared/XRender";
import {doArray, doLinker, doLinkZone, doPointer, doReceptor, getOrElse, isDefined, isUndefined} from "../shared/XLib";
import {Command, HookActionEnum, HookFilterEnum} from "../shared/Instructions";
import {LinkedList} from "../shared/XList";

type PortConf = {
    isOuter: boolean;
    source: XID[];
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
};

type XNodePortBase = {

    orientation?: 'vertical' | 'horizontal';

    in: number;
    inRadius?: number;
    inColor?: string;
    inStrokeColor?: string;
    inStrikeWidth?: number;

    out: number;
    outRadius?: number;
    outColor?: string;
    outStrokeColor?: string;
    outStrikeWidth?: number;
};

export type XNodePortDef = XNodePortBase & XElementDef;

const DEFAULT_RADIUS_SIZE: number = 8;

export default function XNodePort(cfg: XNodeBase): XElementFactory<XNodePortDef> {

    const NODE_PORT = 'node-port'

    return defineElement<XNodePortDef>({
        name: cfg.name,
        onInit(context, hookManager) {
            const listener = hookManager.listener;
            const links: Set<string> = new Set<string>();

            listener.filter(HookFilterEnum.ELEMENTS_CAN_LINK, (v: boolean, src: XNode, trg: XNode) => {

                const srcData = src.data;
                const trgData = trg.data;

                if (srcData && srcData.type === NODE_PORT && isDefined(srcData.parent) && links.has(`${srcData.parent}-${src.id}`)) {
                    return false;
                }

                if (trgData && trgData.type === NODE_PORT && isDefined(trgData.parent) && links.has(`${trgData.parent}-${trg.id}`)) {
                    return false;
                }

                if (srcData && srcData.type === NODE_PORT && trgData && trgData.type === NODE_PORT && srcData && trgData && srcData.isOut && trgData.isOut) {
                    return false;
                }

                return v;
            });

            listener.filter("x-linker-plugin-can-apply", (value: boolean, node: XNode) => {
                if (node.data.solver === cfg.name) {
                    return false;
                }
                return value;
            });

            listener.action(HookActionEnum.ELEMENT_UNLINKED, (id: XID) => {
                context
                    .getElement(id)
                    .filter(x => isDefined(x.data) && isDefined(x.data.parent) && x.data.type === NODE_PORT)
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

                                console.log(`${parent}-${id}`)
                                console.log(links)
                                links.delete(`${parent}-${id}`);
                            });
                    });
            });

            listener.action(HookActionEnum.ELEMENTS_LINKED, (src: XID, trg: XID) => {
                [src, trg].forEach(id => {
                    context
                        .getElement(id)
                        .filter(x => x.data && x.data.type === NODE_PORT)
                        .foreach(node => {
                            const parent: XID = node.data.parent;
                            links.add(`${parent}-${node.id}`);
                        });
                });
            });
        },
        build(context: XContext, hookManager, config: XNodePortDef): XNode {
            const finalCfg: XNodePortDef = {...cfg, ...config};
            const b = context.builder;
            const actionDispatcher = hookManager.dispatcher.action;
            const filterDispatcher = hookManager.dispatcher.filter;
            const theme: XTheme = context.theme;

            const position = finalCfg.position;
            const radius: number = getOrElse(finalCfg.radius, 10);
            const padding: number = getOrElse(finalCfg.padding, 10);

            const taskOnRemove: LinkedList<Callable> = new LinkedList<Callable>();

            const textPoint = b.makePoint(position.x, position.y);
            const textEl = b.makeText(textPoint, getOrElse(finalCfg.text, "..."));
            textEl.locked = true;
            textEl.fontSize = getOrElse(finalCfg.fontSize, 28);
            textEl.fillColor = getOrElse(finalCfg.textColor, theme.baseContent);

            // render ports
            const portsElements: XNode[] = [];
            const inNumber = finalCfg.in;
            const outNumber = finalCfg.out;
            const inner: number[] = doArray<number>(inNumber);
            const outer: number[] = doArray<number>(outNumber);
            const isVertical = finalCfg.orientation === "vertical";
            const portsConf: PortConf[] = []
            finalCfg.inner = inner;
            finalCfg.outer = outer;

            const maxPorts = Math.max(inNumber * getOrElse(finalCfg.inRadius, DEFAULT_RADIUS_SIZE), outNumber * getOrElse(finalCfg.outRadius, DEFAULT_RADIUS_SIZE)) * 3;
            const textPaperBounds = textEl.bounds.clone();
            const tmpWidth = textPaperBounds.width + padding;
            const tmpHeight = textPaperBounds.height * 2;

            textPaperBounds.width = isVertical ? Math.max(maxPorts, tmpWidth) : tmpWidth;
            textPaperBounds.height = isVertical ? tmpHeight : Math.max(tmpHeight, maxPorts);
            textPaperBounds.center = textEl.bounds.center;

            const rectEl = b.makeRect(textPaperBounds, radius);
            const bounds = rectEl.bounds;
            bounds.center = textPaperBounds.center;
            rectEl.strokeColor = getOrElse(finalCfg.strokeColor, theme.primary);
            rectEl.strokeWidth = getOrElse(finalCfg.strokeWidth, 0);
            rectEl.fillColor = getOrElse(finalCfg.fillColor, theme.primaryContent);

            if (isVertical) {
                const distance = bounds.topRight.getDistance(bounds.topLeft);
                if (inNumber > 0) {
                    portsConf.push({
                        isOuter: false,
                        source: inner,
                        src: bounds.topLeft.x,
                        trg: bounds.topRight.x,
                        pointRef: bounds.topLeft,
                        fill: getOrElse(finalCfg.inColor, theme.primary),
                        xOffset: distance / (inNumber + 1),
                        yOffset: 0,
                        radius: getOrElse(finalCfg.inRadius, DEFAULT_RADIUS_SIZE),
                        strokeColor: getOrElse(finalCfg.inStrokeColor, theme.neutral),
                        strokeWidth: getOrElse(finalCfg.inStrikeWidth, 0)
                    });
                }

                if (outNumber > 0) {
                    portsConf.push({
                        isOuter: true,
                        source: outer,
                        src: bounds.bottomLeft.x,
                        trg: bounds.bottomRight.x,
                        pointRef: bounds.bottomLeft,
                        fill: getOrElse(finalCfg.outColor, theme.secondary),
                        xOffset: distance / (outNumber + 1),
                        yOffset: 0,
                        radius: getOrElse(finalCfg.outRadius, DEFAULT_RADIUS_SIZE),
                        strokeColor: getOrElse(finalCfg.outStrokeColor, theme.neutral),
                        strokeWidth: getOrElse(finalCfg.outStrikeWidth, 0)
                    });
                }
            } else {
                const distance = bounds.bottomLeft.getDistance(bounds.topLeft);
                if (inNumber > 0) {
                    portsConf.push({
                        isOuter: false,
                        source: inner,
                        src: bounds.topLeft.y,
                        trg: bounds.bottomLeft.y,
                        pointRef: bounds.topLeft,
                        fill: getOrElse(finalCfg.inColor, theme.primary),
                        xOffset: 0,
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
                        src: bounds.topRight.y,
                        trg: bounds.bottomRight.y,
                        pointRef: bounds.topRight,
                        fill: getOrElse(finalCfg.outColor, theme.secondary),
                        xOffset: 0,
                        yOffset: distance / (outNumber + 1),
                        radius: getOrElse(finalCfg.outRadius, 15),
                        strokeColor: getOrElse(finalCfg.outStrokeColor, theme.neutral),
                        strokeWidth: getOrElse(finalCfg.outStrikeWidth, 0)
                    });
                }
            }

            const portsElementsLength = portsConf.length;
            const PARENT_ID: XID = finalCfg.id;
            for (let i = 0; i < portsElementsLength; i++) {
                const datum = portsConf[i];
                const source = datum.source;
                const count = source.length;
                const kind = (datum.isOuter && 'out') || 'in';
                const isOuter = datum.isOuter;
                let point = datum.pointRef;

                for (let j = 0; j < count; j++) {
                    const finalPt = point.clone();
                    finalPt.x += datum.xOffset;
                    finalPt.y += datum.yOffset;

                    const circle = b.makeCircle(finalPt, radius);
                    circle.fillColor = datum.fill;

                    const localID: XID = `${kind}:${j}:${PARENT_ID}`;
                    const compound: XNode = b.makeInteractive({
                        items: [circle],
                        command: doReceptor({
                            [Command.onElementLinkIn]() {
                                circle.fillColor = isUndefined(source[j]) ? theme.warning : theme.error;
                            },
                            [Command.onElementLinkOut]() {
                                circle.fillColor = datum.fill;
                            },
                            [Command.onElementNormal]() {
                                circle.fillColor = datum.fill;
                            },
                            [Command.onElementError]() {
                                circle.fillColor = theme.error;
                            },
                            [Command.onElementLinked]() {
                                source[j] = localID;
                            },
                            [Command.onElementUnLinked]() {
                                source[j] = undefined;
                            },
                        }),
                        getIntersections(item: XNode): XPoint[] {
                            return circle.getIntersections(item);
                        }
                    });

                    point = finalPt;
                    portsElements.push(compound);
                    compound.data = {
                        id: localID,
                        type: NODE_PORT,
                        parent: finalCfg.id,
                        isOut: datum.isOuter,
                        linkable: true
                    };

                    isOuter && taskOnRemove.push(doLinker(compound, compound, compound, context, hookManager));
                    taskOnRemove.push(() => {
                        context.removeElement(localID);
                        actionDispatcher(`${localID}-deleted`);
                    });
                    isOuter && doPointer(circle, context);

                    doLinkZone(compound, hookManager);
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
                        rootEl.moveTo(point);
                        actionDispatcher(`${rootEl.id}-drag`, rootEl);
                        portsElements.forEach(x => actionDispatcher(`${x.id}-drag`, x));
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

