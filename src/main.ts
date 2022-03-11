import "./assets/theme.scss";
import XDiagram from "./lib/XDiagram";
import {XBoardPlugin, XCopyPlugin, XDataChangePlugin, XDeletePlugin, XElementPlugin, XInteractionPlugin, XLinkerPlugin, XSelectionPlugin} from "./modules/plugins";
import type {XEdgeDef, XNodeDef} from "./modules/core";
import {XLightTheme} from "./lib/themes/XThemes";
import PaperRenderer from "./lib/renderer/PaperRenderer";
import XArrow from "./lib/components/XArrow";
import XNodeComponent from "./lib/components/XNodeComponent";

document.body.style.width = '100%';
document.body.style.height = '400px';

const xDiagram = new XDiagram(document.body, {
    id: 'test',
    theme: XLightTheme,
    renderer: PaperRenderer,
    edges: [],
    nodes: [],
    catalog: [
        XNodeComponent({name: 'rounded-node', strokeWidth: 2, padding: 24, radius: 8})
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

xDiagram.addEdge(0, 1);
xDiagram.addEdge(2, 1);