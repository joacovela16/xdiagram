import {XContext,  XElementFactory, XTheme, XElementDef} from "../shared/XTypes";
import {defineElement} from "../shared/XHelper";
import {XNode, XPoint} from "../shared/XRender";
import {doLinkZone, doReceptor, getOrElse} from "../shared/XLib";
import {Command, HookActionEnum, HookFilterEnum} from "../shared/Instructions";

type PortConf = {
    count: number;
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

    // inNumber: number;
    inRadius?: number;
    inColor?: string;
    inStrokeColor?: string;
    inStrikeWidth?: number;

    // outNumber: number;
    outRadius?: number;
    outColor?: string;
    outStrokeColor?: string;
    outStrikeWidth?: number;
};

type XNodePortConf = XNodePortBase & XElementDef;

export default function XNodePort(cfg: XNodeBase): XElementFactory<XNodePortConf> {

    return defineElement<XNodePortConf>({
        name: cfg.name,
        build(ctx: XContext, config: XNodePortConf): XNode {
            const finalCfg: XNodePortConf = {...cfg, ...config};
            const b = ctx.builder;
            const hookManager = ctx.hookManager;
            const actionDispatcher = hookManager.dispatcher.action;
            const filterDispatcher = hookManager.dispatcher.filter;
            const theme: XTheme = ctx.theme;


            const position = finalCfg.position;
            const radius: number = getOrElse(finalCfg.radius, 0);
            const padding: number = getOrElse(finalCfg.padding, 0);
            const textPoint = b.makePoint(position.x, position.y);

            const textEl = b.makeText(textPoint, getOrElse(finalCfg.text, "..."));
            textEl.locked = true;
            textEl.fontSize = getOrElse(finalCfg.fontSize, 28);
            textEl.fillColor = getOrElse(finalCfg.textColor, theme.baseContent);


            const textPaperBounds = textEl.bounds.clone();
            textPaperBounds.width = textPaperBounds.width + padding;
            textPaperBounds.height = textPaperBounds.width*0.75;
            textPaperBounds.center = textEl.bounds.center;

            const rectEl = b.makeRect(textPaperBounds, radius);
            const bounds = rectEl.bounds;
            bounds.center = textPaperBounds.center;
            rectEl.strokeColor = getOrElse(finalCfg.strokeColor, theme.primary);
            rectEl.strokeWidth = getOrElse(finalCfg.strokeWidth, 0);
            rectEl.fillColor = getOrElse(finalCfg.fillColor, theme.primaryContent);

            // render ports
            const portsElements: XNode[] = [];
            const inNumber = finalCfg.inNumber;
            const outNumber = finalCfg.outNumber;
            const isVertical = finalCfg.orientation === "vertical";
            const portsConf: PortConf[] = []

            if (isVertical) {
                const distance = bounds.topRight.getDistance(bounds.topLeft);
                if (inNumber > 0) {
                    portsConf.push({
                        count: inNumber,
                        src: bounds.topLeft.x,
                        trg: bounds.topRight.x,
                        pointRef: bounds.topLeft,
                        fill: getOrElse(finalCfg.inColor, theme.primary),
                        xOffset: distance / (inNumber + 1),
                        yOffset: 0,
                        radius: getOrElse(finalCfg.inRadius, 15),
                        strokeColor: getOrElse(finalCfg.inStrokeColor, theme.neutral),
                        strokeWidth: getOrElse(finalCfg.inStrikeWidth, 0)
                    });
                }

                if (outNumber > 0) {
                    portsConf.push({
                        count: outNumber,
                        src: bounds.bottomLeft.x,
                        trg: bounds.bottomRight.x,
                        pointRef: bounds.bottomLeft,
                        fill: getOrElse(finalCfg.outColor, theme.secondary),
                        xOffset: distance / (outNumber + 1),
                        yOffset: 0,
                        radius: getOrElse(finalCfg.outRadius, 15),
                        strokeColor: getOrElse(finalCfg.outStrokeColor, theme.neutral),
                        strokeWidth: getOrElse(finalCfg.outStrikeWidth, 0)
                    });
                }
            } else {
                const distance = bounds.bottomLeft.getDistance(bounds.topLeft);
                if (inNumber > 0) {
                    portsConf.push({
                        count: inNumber,
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
                        count: outNumber,
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
            for (let i = 0; i < portsElementsLength; i++) {
                const datum = portsConf[i];

                let point = datum.pointRef;

                for (let j = 0; j < datum.count; j++) {
                    const finalPt = point.clone();
                    finalPt.x += datum.xOffset;
                    finalPt.y += datum.yOffset;

                    const circle = b.makeCircle(finalPt, radius);
                    circle.fillColor = datum.fill;
                    circle.strokeWidth = datum.strokeWidth;
                    circle.strokeColor = datum.strokeColor;
                    portsElements.push(circle);
                    doLinkZone(circle, ctx);

                    point = finalPt;
                }
            }

            const command = doReceptor(
                {
                    [Command.onNodeFocus]() {
                        rectEl.strokeColor = theme.accent;
                        rectEl.strokeWidth = 3;
                    },
                    [Command.onNodeNormal]() {
                        rectEl.strokeColor = getOrElse(finalCfg.strokeColor, theme.primary);
                        rectEl.strokeWidth = getOrElse(finalCfg.strokeWidth, 0);
                    },
                    [Command.onNodeError]() {
                        rectEl.strokeColor = theme.error;
                    },
                    [Command.remove]() {
                        if (filterDispatcher(HookFilterEnum.NODE_CAN_REMOVE, true, rootEl) ) {
                            rootEl.remove();
                            ctx.removeElement(finalCfg.id)
                            actionDispatcher(HookActionEnum.ELEMENT_DELETED, finalCfg);
                        }
                    }
                }
            );

            const rootEl = b.makeCompound({
                items: [rectEl, textEl, ...portsElements],
                command,
                getIntersections(shape) {
                    return rectEl.getIntersections(shape);
                }
            });

            rootEl.id = finalCfg.id;
            rootEl.data = finalCfg;
            ctx.frontLayer.addChild(rootEl);

            //doLinkZone(rootEl, ctx);

            return rootEl;
        }
    })
}

