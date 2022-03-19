import XDiagram from "./lib/XDiagram";
import {XBoardPlugin, XCopyPlugin, XDataChangePlugin, XDeletePlugin, XElementPlugin, XInteractivePlugin, XLinkerPlugin, XSelectionPlugin} from "./modules/plugins";
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
        XArrow
    ],
    plugins: [
        XElementPlugin,
        XBoardPlugin,
        XSelectionPlugin,
        XLinkerPlugin(),
        XInteractivePlugin,
        XDeletePlugin,
        XCopyPlugin,
        XDataChangePlugin()
    ]
});

// xDiagram.getHookListener().filter(HookFilterEnum.NODES_CAN_LINK, () => false);

xDiagram.getListener().action('x-on-data-change', data => {
    console.log(data)
});

xDiagram.getListener().action('x-arrow-config-mapper', (cfg: XEdgeDef) => {
    cfg.targetPointer = true;
    return cfg;
});

xDiagram.getListener().filter('on-prepare-node-copy', (cfg: XNodeDef) => {
    cfg.text = `${cfg.text}-copy`;
    return cfg;
});

xDiagram.getListener().filter('x-linker-button-plugin-can-apply', (value:boolean, node:XNode)=> {
    return node.data.type !== 'port';
})

xDiagram.addElement({
    id: 0,
    solver: 'rounded-node',
    position: {
        x: 100,
        y: 100,
    },
    text: 'Task-1'
});

xDiagram.addElement({
    id: 1,
    solver: 'rounded-node',
    text: 'Task-2',
    position: {
        x: 400,
        y: 100,
    }
});

xDiagram.addElement({
    id: 2,
    solver: 'rounded-node',
    text: 'Task-3',
    position: {
        x: 200,
        y: 200,
    }
});


/*
xDiagram.addElement({
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
*/
/*

xDiagram.addElement({
    solver: 'x-arrow',
    src: 0,
    trg: 1,
});
*/
xDiagram.addElement({
    solver: 'x-arrow',
    src: 2,
    trg: 1,
});
