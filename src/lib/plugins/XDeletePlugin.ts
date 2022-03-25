import {Command, HookActionEnum} from "../shared/Instructions";
import {XBound, XNode, XPoint} from "../shared/XRender";
import {XTheme} from "../shared/XTypes";
import {doIconTool} from "../shared/XLib";

export const XDeletePlugin = doIconTool('x-element-delete', () => {
    return {
        selectEvents: [HookActionEnum.ELEMENT_SELECTED],
        unselectEvents: [HookActionEnum.ELEMENT_START_DRAG, HookActionEnum.BOARD_CLICK, HookActionEnum.ELEMENT_DELETED],
        getPosition(bound: XBound): XPoint {
            const position = bound.topRight.clone();
            position.x += 10;
            position.y += -10;
            return position;
        },
        iconHoverColor(theme: XTheme): string {
            return theme.error;
        },
        icon(theme: XTheme): string {
            return `
                <svg  width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="${theme.primaryContent}" fill="none" stroke-linecap="round" stroke-linejoin="round">
                   <line x1="4" y1="7" x2="20" y2="7"></line>
                   <line x1="10" y1="11" x2="10" y2="17"></line>
                   <line x1="14" y1="11" x2="14" y2="17"></line>
                   <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
                   <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>
                </svg>
                `;
        },
        onClick(node: XNode): void {
            node.command(Command.remove);
        }
    }
});
