import type {XNode} from "./XRender";

export enum Command {
    focused = 'focused',
    unfocused = 'unfocused',
    remove = 'remove',
    config = 'config',
    elementDrag = 'element-drag',

    onElementError = 'on-element-error',
    onElementFocus = 'on-element-focus',
    onElementNormal = 'on-element-normal',
    onElementLinkIn = 'on-element-link-in',
    onElementLinkOut = 'on-element-link-out',
    onElementLinked = 'on-element-linked',
    onElementUnLinked = 'on-element-unlinked',
}

export enum HookFilterEnum {
    ELEMENTS_CAN_LINK = "element-can-link",
    ELEMENT_CAN_REMOVE = "element-can-remove",
}

export type XElementEvent = {
    type: 'node' | 'edge' | string;
    target: XNode
};

export enum HookActionEnum {
    LINK_ZONE_IN = 'on-link-zone-in',
    LINK_ZONE_OUT = 'on-link-zone-out',

    ELEMENT_ADD = 'on-element-add',
    ELEMENT_INSTALLED = 'on-element-installed',
    ELEMENT_SELECTED = 'on-element-selected',
    ELEMENT_DELETED = 'on-element-deleted',
    ELEMENT_START_DRAG = 'on-element-drag-start',
    ELEMENT_END_DRAG = 'on-element-drag-end',
    ELEMENT_MOUSE_IN = 'on-element-mouse-in',
    ELEMENT_MOUSE_OUT = 'on-element-mouse-out',
    ELEMENTS_LINKED = 'on-elements-linked',
    ELEMENT_UNLINKED = 'on-element-unlinked',
    ELEMENTS_UNLINKED = 'on-elements-unlinked',

    BOARD_CLICK = 'on-board-click',

    BEFORE_START = 'before-start',
    AFTER_START = 'after-start',
    DATA_UPDATE = 'on-data-update',
    DIAGRAM_DESTROY = "diagram-destroy"
}