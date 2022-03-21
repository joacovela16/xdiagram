import {definePlugin} from "../shared/XHelper";
import {HookActionEnum} from "../shared/Instructions";
import type {XNode} from "../shared/XRender";


const XElementPlugin = definePlugin({
    name: 'x-element-plugin',
    plugin: (context, hook) => {
        // const actionListener = hook.listener.action;
        const actionDispatcher = hook.dispatcher.action;

        // actionDispatcher(HookActionEnum.NODE_INSTALLED, doCreate);
        // actionDispatcher(HookActionEnum.EDGE_INSTALLED, doCreate);

        // actionListener(HookActionEnum.EDGE_SELECTED, doSelection);
        // actionListener(HookActionEnum.NODE_SELECTED, doSelection);
        // actionListener(HookActionEnum.EDGE_END_DRAG, doSelection);

        // actionListener(HookActionEnum.NODE_DRAG_START, doDrag);
        // actionListener(HookActionEnum.EDGE_START_DRAG, doDrag);

        // actionListener(HookActionEnum.EDGE_UNSELECTED, unselectAll);
        // actionListener(HookActionEnum.NODE_UNSELECTED, unselectAll);

        // actionListener(HookActionEnum.NODE_DELETED, doDelete);
        // actionListener(HookActionEnum.EDGE_DELETED, doDelete);

        function doCreate(node: XNode) {
            actionDispatcher(HookActionEnum.ELEMENT_CREATED, node);
        }

        function doDelete(cfg:any ) {
            actionDispatcher(HookActionEnum.ELEMENT_DELETED, cfg);
        }
        function doDrag(node: XNode) {
            actionDispatcher(HookActionEnum.ELEMENT_START_DRAG, node);
        }

        function doSelection(node: XNode) {
            actionDispatcher(HookActionEnum.ELEMENT_SELECTED, node);
        }

        function unselectAll(node: XNode) {
            actionDispatcher(HookActionEnum.ELEMENT_UNSELECTED, node);
        }
    }
});
export default XElementPlugin;