import {doLinkZone, doNumberSnap, doReceptor, getOrElse} from "../shared/XLib";
import {HookManager, type XContext, XElementDef, type XElementFactory, type XTheme} from "../shared/XTypes";
import type {XBuilder, XNode, XPoint} from "../shared/XRender";
import {Command, HookActionEnum, HookFilterEnum} from "../shared/Instructions";
import {defineElement} from "../shared/XHelper";
import {XItem} from "../shared/XRender";

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
        build(context: XContext, hookManager: HookManager, cfg: XNodeDef): XNode {
            const config: XNodeDef = {...cfg, ...conf};
            const position: Coord = config.position;
            const b: XBuilder = context.builder;
            const actionDispatcher = hookManager.dispatcher.action;
            const filterDispatcher = hookManager.dispatcher.filter;
            const theme: XTheme = context.theme;

            const radius: number = getOrElse(config.radius, 0);
            const padding: number = getOrElse(config.padding, 0);
            const initialPosition = b.makePoint(position.x, position.y);

            const textEl = b.makeText();
            const rectEl = b.makeRect();

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
                        rootEl.moveTo(point);
                        actionDispatcher(`${rootEl.id}-drag`, rootEl);
                    }
                }
            );

            const rootEl: XNode = b.makeInteractive({
                items: [rectEl, textEl],
                command,
                getIntersections(shape) {
                    const r: XNode = rectEl;
                    return r.getIntersections(shape);
                }
            });

            context.getLayer('middle').addChild(rootEl);

            textEl.locked = true;
            textEl.content = getOrElse(config.text, "...");
            textEl.fontSize = getOrElse(config.fontSize, 28);
            textEl.fillColor = getOrElse(config.textColor, theme.baseContent);

            const textPaperBounds = textEl.bounds.clone();
            textPaperBounds.height = doNumberSnap(textPaperBounds.height + padding);
            textPaperBounds.width = doNumberSnap(textPaperBounds.width * 1.2);
            textPaperBounds.center = textEl.bounds.center;

            rectEl.size = textPaperBounds.size;
            rectEl.radius = radius;
            rectEl.strokeColor = getOrElse(config.strokeColor, theme.primary);
            rectEl.strokeWidth = getOrElse(config.strokeWidth, 2);
            rectEl.fillColor = getOrElse(config.fillColor, theme.primaryContent);

            rootEl.id = config.id;
            rootEl.position = initialPosition;
            rootEl.data = config;

            rectEl.center = initialPosition;
            textEl.center = initialPosition;

            config.linkable = true;

            doLinkZone(rootEl, hookManager);
            actionDispatcher("x-make-interactive", rootEl, rootEl);

            return rootEl;
        }
    });
}
