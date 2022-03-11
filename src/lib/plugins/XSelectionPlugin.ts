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
        actionListener(HookActionEnum.ELEMENT_DRAG_START, hideBox);
        actionListener(HookActionEnum.BOARD_CLICK, hideBox);
        actionListener(HookActionEnum.ELEMENT_DELETED, () => hideBox());

        function doBounder() {
            let shape: XNode;
            const clean = () => {
                shape && shape.remove();
                shape = null;
            }
            return {
                build(point: XPoint, size: XSize, parent: XNode): void {
                    clean();
                    shape = b.makeRect(b.makeBound(point.x, point.y, size.width, size.height));
                    shape.strokeWidth = 1;
                    shape.strokeColor = context.theme.primaryFocus;
                    shape.position = point;
                    shape.dashArray = [2, 2];
                    parent.addExtension(shape);
                },
                clean
            }
        }

        function showBox(node: XNode) {
            const nodeBounds = node.bounds;
            const newSize = nodeBounds.size.add(10);

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