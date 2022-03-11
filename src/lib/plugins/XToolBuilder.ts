import type {HookActionEnum} from "../shared/Instructions";
import {doIconHovering} from "../shared/XLib";
import type {XBound, XItem, XNode, XPoint} from "../shared/XRender";
import type {HookManager, XContext, XPluginDef, XTheme} from "../shared/XTypes";
import {definePlugin} from "../shared/XHelper";

interface XToolSpec {

    selectEvents: HookActionEnum[];
    unselectEvents: HookActionEnum[];
    onSelect?: (node: XNode) => void;
    iconHoverColor?: (theme: XTheme) => string;
    onClick?: (node: XNode) => void;
    onButtonReady?: (node: XItem) => void;

    icon(theme: XTheme): string;

    getPosition(bound: XBound): XPoint;
}

export default function XToolBuilder(name: string, handler: (context: XContext, hook: HookManager) => XToolSpec): XPluginDef {
    return definePlugin({
        name,
        plugin: (context, hook) => {
            let element: XNode;
            const spec = handler(context, hook);
            const b = context.builder;
            const theme: XTheme = context.theme;
            const actionListener = hook.listener.action;
            const filterDispatcher = hook.dispatcher.filter;
            const icon = doIconHovering(
                b.fromSVG(spec.icon(theme)),
                context,
                spec.iconHoverColor && spec.iconHoverColor(theme)
            );
            icon.visible = false;
            spec.onClick && icon.on('click', () => element && spec.onClick(element));
            context.frontLayer.addChild(icon);

            spec.selectEvents.forEach(e => actionListener(e, showButton));
            spec.unselectEvents.forEach(e => actionListener(e, unselectAll));
            spec.onButtonReady && spec.onButtonReady(icon);

            function showButton(node: XNode): void {
                if (filterDispatcher(`${name}-can-apply`, true, node)) {
                    focus(node);
                    spec.onSelect && spec.onSelect(node);
                }
            }

            function unselectAll(): void {
                icon.visible = false;
            }

            function focus(node: XNode): void {
                icon.position = spec.getPosition(node.bounds);
                icon.sendToFront();
                icon.visible = true;
                element = node;
            }
        }
    });
}
