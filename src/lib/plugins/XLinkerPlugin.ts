import type {Callable, XPluginDef} from "../shared/XTypes";
import {XIconTool} from "../shared/XTypes";
import {doIconTool, doLinker} from "../shared/XLib";
import type {XBound, XNode, XPoint} from "../shared/XRender";
import {HookActionEnum} from "../shared/Instructions";

export default function XLinkerPlugin(solver: string = "x-arrow"): XPluginDef {
    return doIconTool('x-linker-plugin', (context, hookManager): XIconTool => {

        let sourceNode: XNode;
        let removable: Callable;

        return {
            selectEvents: [HookActionEnum.ELEMENT_SELECTED],
            unselectEvents: [
                HookActionEnum.ELEMENT_START_DRAG,
                HookActionEnum.BOARD_CLICK,
                HookActionEnum.ELEMENT_DELETED
            ],
            onSelect(node, icon) {
                sourceNode = node;
                removable && removable();
                removable = doLinker(node, icon, node, context, hookManager, solver);
            },
            getPosition(bound: XBound): XPoint {
                const position = bound.topLeft.clone();
                position.x += -10;
                position.y += -10;
                return position;
            },
            icon(): string {
                return `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                   <circle cx="6" cy="18" r="2"></circle>
                   <circle cx="18" cy="6" r="2"></circle>
                   <line x1="7.5" y1="16.5" x2="16.5" y2="7.5"></line>
                </svg>`;
            },
        }
    });
}

