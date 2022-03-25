import {doLinkZone, doNumberSnap, doReceptor, doSnap, getOrElse} from "../shared/XLib";
import {HookManager, type XContext, XElementDef, type XElementFactory, type XTheme} from "../shared/XTypes";
import type {XBuilder, XNode, XPoint} from "../shared/XRender";
import {Command, HookActionEnum, HookFilterEnum} from "../shared/Instructions";
import {defineElement} from "../shared/XHelper";


interface XNodeRectDef {
    name: string;
    description?: string;
    fontSize?: number;
    radius?: number;
    padding?: number;
    textColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
}

type Coord = { x: number; y: number; };
export type XNodeDef = {
    text: string;
    fontSize?: number;
    radius?: number;
    padding?: number;
    textColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
    position: Coord;
} & XElementDef;

export default function XDefaultNode(conf: XNodeRectDef): XElementFactory {
    return defineElement<XNodeDef>({
        name: conf.name,
        build(context: XContext, hookManager:HookManager, cfg: XNodeDef): XNode {
            const config: XNodeDef = {...cfg, ...conf};
            const position: Coord = config.position;
            const b: XBuilder = context.builder;
            const actionDispatcher = hookManager.dispatcher.action;
            const filterDispatcher = hookManager.dispatcher.filter;
            const theme: XTheme = context.theme;

            const radius: number = getOrElse(config.radius, 0);
            const padding: number = getOrElse(config.padding, 0);
            const textPoint = b.makePoint(position.x, position.y);

            const textEl = b.makeText(textPoint, getOrElse(config.text, "..."));
            textEl.locked = true;
            textEl.fontSize = getOrElse(config.fontSize, 28);
            textEl.fillColor = getOrElse(config.textColor, theme.baseContent);

            const textPaperBounds = textEl.bounds.clone();
            textPaperBounds.height = doNumberSnap(textPaperBounds.height * 1.5);
            textPaperBounds.width = doNumberSnap(textPaperBounds.width + padding);
            textPaperBounds.center = textEl.bounds.center;

            const rectEl = b.makeRect(textPaperBounds, radius);
            rectEl.bounds.center = textPaperBounds.center;
            rectEl.strokeColor = getOrElse(config.strokeColor, theme.primary);
            rectEl.strokeWidth = getOrElse(config.strokeWidth, 0);
            rectEl.fillColor = getOrElse(config.fillColor, theme.primaryContent);

            const command = doReceptor(
                {
                    [Command.onElementLinkIn]() {
                        rectEl.strokeColor = theme.accent;
                        rectEl.strokeWidth = 3;
                    },
                    [Command.onElementLinkOut]() {
                        rectEl.strokeColor = getOrElse(config.strokeColor, theme.primary);
                        rectEl.strokeWidth = getOrElse(config.strokeWidth, 0);
                    },
                    [Command.onElementNormal]() {
                        rectEl.strokeColor = getOrElse(config.strokeColor, theme.primary);
                        rectEl.strokeWidth = getOrElse(config.strokeWidth, 0);
                    },
                    [Command.onElementError]() {
                        rectEl.strokeColor = theme.error;
                    },
                    [Command.remove]() {
                        if (filterDispatcher(HookFilterEnum.ELEMENT_CAN_REMOVE, true, rootEl)) {
                            context.removeElement(config.id);
                            rootEl.remove();
                            actionDispatcher(HookActionEnum.ELEMENT_DELETED, rootEl);
                            actionDispatcher(`${rootEl.id}-deleted`);
                        }
                    },
                    [Command.elementDrag](point: XPoint) {
                        rootEl.moveTo(doSnap(point));
                        actionDispatcher(`${rootEl.id}-drag`, rootEl);
                    }
                }
            );

            const rootEl = b.makeCompound({
                items: [rectEl, textEl],
                command,
                getIntersections(shape) {
                    return rectEl.getIntersections(shape);
                }
            });

            rootEl.id = config.id;
            rootEl.data = config;
            config.linkable = true;
            context.getLayer('middle').addChild(rootEl);

            doLinkZone(rootEl, hookManager);
            actionDispatcher("x-make-interactive", rootEl, rootEl);

            return rootEl;
        }
    });
}
