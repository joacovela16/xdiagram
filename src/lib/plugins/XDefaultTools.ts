import type {XTheme} from "../shared/XTypes";
import type {XBound, XNode, XPoint} from "../shared/XRender";
import {Command, HookActionEnum} from "../shared/Instructions";
import XToolBuilder from "./XToolBuilder";
import {idGen} from "../shared/XLib";

const PREPARE_NODE_COPY: string = 'on-prepare-node-copy';

export const XCopyPlugin = XToolBuilder('x-copy-plugin', (context, hook) => {
    const filterDispatcher = hook.dispatcher.filter;
    return {
        selectEvents: [HookActionEnum.ELEMENT_SELECTED],
        unselectEvents: [
            HookActionEnum.BOARD_CLICK,
            HookActionEnum.ELEMENT_START_DRAG,
            HookActionEnum.ELEMENT_DELETED,
        ],
        onClick(node) {
            const data = node.data;
            if (data) {
                const clone = JSON.parse(JSON.stringify(data));

                const position = clone.position || (clone.position = {x: 50, y: 50});
                position.x += 50;
                position.y += 50;
                clone.id = idGen();
                const finalData = filterDispatcher(PREPARE_NODE_COPY, clone);

                hook.dispatcher.action(HookActionEnum.ELEMENT_ADD, finalData);
            }
        },
        getPosition(bound: XBound): XPoint {
            const position = bound.bottomRight.clone();
            position.x += 10;
            position.y += 10;
            return position;
        },
        icon(): string {
            return `
            <svg  width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
               <rect x="8" y="8" width="12" height="12" rx="2"></rect>
               <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"></path>
            </svg>
            `;
        }

    }
});

export const XDeletePlugin = XToolBuilder('x-element-delete', (context, hook) => {
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
            hook.dispatcher.action(`${node.id}-deleted`);
        }
    }
});

