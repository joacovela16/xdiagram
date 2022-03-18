import {doLinkZone, doNumberSnap, doReceptor, getOrElse} from "../shared/XLib";
import {type XContext, type XNodeDef, type XNodeFactory, type XTheme} from "../shared/XTypes";
import type {XBuilder, XNode} from "../shared/XRender";
import {Command, HookActionEnum, HookFilterEnum} from "../shared/Instructions";
import {defineNode} from "../shared/XHelper";

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

interface RoundedNodeConf extends XNodeDef {
    text: string;
    fontSize: number,
    radius: number;
    padding: number;
    textColor: string;
    strokeColor: string;
    strokeWidth: number;
    fillColor: string;
}

export default function XDefaultNode(conf: XNodeRectDef): XNodeFactory {
    return defineNode<RoundedNodeConf>({
        name: conf.name,
        handler: function (context: XContext, cfg: RoundedNodeConf): XNode {
            const config: RoundedNodeConf = {...cfg, ...conf};
            const position = config.position;
            const b: XBuilder = context.builder;
            const actionDispatcher = context.hookManager.dispatcher.action;
            const filterDispatcher = context.hookManager.dispatcher.filter;
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
                    [Command.onNodeFocus]() {
                        rectEl.strokeColor = theme.accent;
                        rectEl.strokeWidth = 3;
                    },
                    [Command.onNodeNormal]() {
                        rectEl.strokeColor = getOrElse(config.strokeColor, theme.primary);
                        rectEl.strokeWidth = getOrElse(config.strokeWidth, 0);
                    },
                    [Command.onNodeError]() {
                        rectEl.strokeColor = theme.error;
                    },
                    [Command.remove]() {
                        if (filterDispatcher(HookFilterEnum.NODE_CAN_REMOVE, true, rootEl) && context.removeNode(config.id)) {
                            rootEl.remove();
                            actionDispatcher(HookActionEnum.NODE_DELETED, config);
                        }
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
            context.frontLayer.addChild(rootEl);

            doLinkZone(rootEl, context);

            return rootEl;
        }
    });
}
