import type {XNode} from "./XRender";

export enum Command {
    focused='focused',
    unfocused='unfocused',
    remove='remove',
    config='config',
    nodeDrag='nodeDrag',
    onNodeError='onNodeError',
    onNodeFocus='onNodeFocus',
    onNodeNormal='onNodeNormal',
}

export enum HookFilterEnum {
    NODES_CAN_LINK = "node_can_link",
    NODE_CAN_REMOVE = "node_can_remove",
    EDGE_OBTAIN_EXTREMES = "edge_obtain_extremes",
    EDGE_CAN_REMOVE = 'edge_can_remove'
}

export type XElementEvent = {
    type: 'node' | 'edge' | string;
    target: XNode
};

export enum HookActionEnum {
    // NODE_ADD = "on-node-add",
    // NODE_INSTALLED = "on-node-insert",
    // NODE_DELETED = "on-node-deleted",
    // NODE_DRAG_START = "on-node-drag-start",
    // NODE_DRAG_END = "on-node-drag-end",
    // NODE_SELECTED = "on-node-selected",
    // NODE_UNSELECTED = "on-node-unselected",
    // NODE_MOUSE_IN = "on-node-mouse-in",
    // NODE_MOUSE_OUT = "on-node-mouse-out",

    // EDGE_ADD = "on-edge-add",
    // EDGE_INSTALLED = "on-edge-installed",
    // EDGE_DELETED = "on-edge-deleted",
    // EDGE_SELECTED = 'on-edge-selected',
    // EDGE_UNSELECTED = 'on-edge-unselected',
    // EDGE_START_DRAG = 'on-edge-start-drag',
    // EDGE_END_DRAG = 'on-edge-end-drag',

    LINK_ZONE_IN = 'on-link-zone-in',
    LINK_ZONE_OUT = 'on-link-zone-out',

    ELEMENT_ADD = 'on-element-add',
    ELEMENT_INSTALLED = 'on-element-installed',
    ELEMENT_CREATED = 'on-element-created',
    ELEMENT_SELECTED = 'on-element-selected',
    ELEMENT_DELETED = 'on-element-deleted',
    ELEMENT_UNSELECTED = 'on-element-unselected',
    ELEMENT_START_DRAG = 'on-element-drag-start',
    ELEMENT_END_DRAG = 'on-element-drag-end',
    ELEMENT_MOUSE_IN = 'on-element-mouse-in',
    ELEMENT_MOUSE_OUT = 'on-element-mouse-out',


    BOARD_CLICK = 'on-board-click',

    BEFORE_START = 'before-start',
    AFTER_START = 'after-start',
    DATA_UPDATE = 'on-data-update',
    DIAGRAM_DESTROY = "diagram_destroy"
}