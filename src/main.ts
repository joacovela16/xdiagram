import XDiagram from "./lib/XDiagram";
import {XBoardPlugin, XCopyPlugin, XDataChangePlugin, XDeletePlugin, XElementPlugin, XInteractionPlugin, XLinkerPlugin, XSelectionPlugin} from "./modules/plugins";
import type {XEdgeDef, XNode, XNodeDef} from "./modules/core";
import {XLightTheme} from "./lib/themes/XThemes";
import PaperRenderer from "./lib/renderer/PaperRenderer";
import XArrow from "./lib/components/XArrow";
import XDefaultNode from "./lib/components/XDefaultNode";
import {XNodePort} from "./modules/components";

document.body.style.width = '100%';
document.body.style.height = '400px';

const xDiagram = new XDiagram(document.body, {
    id: 'test',
    theme: XLightTheme,
    renderer: PaperRenderer,
    edges: [],
    nodes: [],
    catalog: [
        XDefaultNode({name: 'rounded-node', strokeWidth: 2, padding: 24, radius: 8}),
        XNodePort({name: 'port', strokeWidth: 2, padding: 24, radius: 8}),
    ],
    plugins: [
        XElementPlugin,
        XBoardPlugin,
        XSelectionPlugin,
        XLinkerPlugin(XArrow),
        XInteractionPlugin,
        XDeletePlugin,
        XCopyPlugin,
        XDataChangePlugin()
    ]
});

// xDiagram.getHookListener().filter(HookFilterEnum.NODES_CAN_LINK, () => false);

xDiagram.getHookListener().action('x-on-data-change', data => {
    console.log(data)
});

xDiagram.getHookListener().filter('x-arrow-config-mapper', (cfg: XEdgeDef) => {
    cfg.targetPointer = true;
    return cfg;
});

xDiagram.getHookListener().filter('on-prepare-node-copy', (cfg: XNodeDef) => {
    cfg.text = `${cfg.text}-copy`;
    return cfg;
});
xDiagram.getHookListener().filter('x-linker-button-plugin-can-apply', (value:boolean, node:XNode)=> {
    return node.data.type !== 'port';
})

xDiagram.addNode({
    id: 0,
    type: 'rounded-node',
    position: {
        x: 100,
        y: 100,
    },
    text: 'Task-1'
});

xDiagram.addNode({
    id: 1,
    type: 'rounded-node',
    text: 'Task-2',
    position: {
        x: 400,
        y: 100,
    }
});

xDiagram.addNode({
    id: 2,
    type: 'rounded-node',
    text: 'Task-3',
    position: {
        x: 200,
        y: 200,
    }
});


xDiagram.addNode({
    id: 3,
    type: 'port',
    text: 'Port 1',
    inNumber: 2,
    outNumber: 1,
    position: {
        x: 400,
        y: 200,
    }
});

xDiagram.addEdge(0, 1);
xDiagram.addEdge(2, 1);