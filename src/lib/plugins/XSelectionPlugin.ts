import type {HookListener, HookManager, XContext, XPluginDef} from "../shared/XTypes";
import {definePlugin} from "../shared/XHelper";
import type {XNode, XPoint, XSize} from "../shared/XRender";
import {Command, HookActionEnum} from "../shared/Instructions";

const XSelectionPlugin: XPluginDef = definePlugin({
    name: 'x-selection-plugin',
    plugin(context: XContext, hook: HookManager): void {
        const b = context.builder;
        const listener: HookListener = hook.listener;
        const actionListener = listener.action;
        const box = doBounder();
        let lastSelection: XNode;

        actionListener(HookActionEnum.ELEMENT_SELECTED, showBox);
        actionListener(HookActionEnum.ELEMENT_START_DRAG, hideBox);
        actionListener(HookActionEnum.BOARD_CLICK, hideBox);
        actionListener(HookActionEnum.ELEMENT_DELETED, hideBox);

        function doBounder() {
            const shape = b.makeRect();
            context.getLayer('back').addChild(shape);
            shape.dashArray = [2, 2];
            shape.strokeWidth = 1;
            shape.radius = 5;
            shape.fillColor = undefined;
            shape.strokeColor = context.theme.primaryFocus;
            shape.visible=false;

            return {
                build(point: XPoint, size: XSize, parent: XNode): void {
                    shape.visible = true;
                    console.log(parent.center)
                    shape.center = parent.center;
                    shape.size = size;
                },
                clean() {
                    shape.visible = false;
                }
            }
        }

        function showBox(node: XNode) {
            const nodeBounds = node.bounds;
            const newSize = nodeBounds.size.add(10);
            console.clear()
            console.log(nodeBounds.center)
            box.build(nodeBounds.center, newSize, node);

            if (lastSelection) {
                if (lastSelection.id !== node.id) {
                    lastSelection.command(Command.unfocused);
                    node.command(Command.focused);
                }
            } else {
                node.command(Command.focused);
            }
            lastSelection = node;
        }

        function hideBox(node?: XNode) {
            box.clean();
            node && node.command(Command.unfocused);
            lastSelection && lastSelection.command(Command.unfocused);
            lastSelection = null;
        }
    }
});

export default XSelectionPlugin;