
import {HookActionEnum} from "../shared/Instructions";
import {doIconTool, idGen} from "../shared/XLib";
import {XBound, XPoint} from "../shared/XRender";

const PREPARE_NODE_COPY: string = 'on-prepare-node-copy';

export const XCopyPlugin = doIconTool('x-copy-plugin', (context, hook) => {
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
            <g    stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
               <rect x="8" y="8" width="12" height="12" rx="2"></rect>
               <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"></path>
            </g>
            `;
        }

    }
});


