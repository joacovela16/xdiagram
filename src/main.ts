import {XLightTheme} from "./modules/themes";
import {PaperRenderer} from "./modules/renderers";
import {XArrow, XDefaultNode, XNodePort} from "./modules/components";
import {XBoardPlugin, XCopyPlugin, XDataChangePlugin, XDeletePlugin, XInteractivePlugin, XLinkerPlugin, XSelectionPlugin} from "./modules/plugins";
import {XElementDef, XDiagram} from "./modules/core";

document.body.style.width = '100%';
document.body.style.height = '400px';

const xDiagram = new XDiagram(document.body, {
    id: 'test',
    theme: XLightTheme,
    renderer: PaperRenderer,
    catalog: [
        XDefaultNode({name: 'rounded-node', strokeWidth: 2, padding: 24, radius: 8}),
        XNodePort({name: 'port', strokeWidth: 2, padding: 24, radius: 8}),
        XArrow
    ],
    plugins: [
        XBoardPlugin,
        XSelectionPlugin,
        XLinkerPlugin(),
        XInteractivePlugin,
        XDeletePlugin,
        XCopyPlugin,
        XDataChangePlugin()
    ]
});

xDiagram.getListener().action('x-on-data-change', data => {
    console.log(data)
});

xDiagram.getListener().action('x-arrow-config-mapper', (cfg: XElementDef) => {
    cfg.targetPointer = true;
    return cfg;
});

xDiagram.getListener().filter('on-prepare-node-copy', (cfg: XElementDef) => {
    cfg.text = `${cfg.text}-copy`;
    return cfg;
});


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

xDiagram.addElement({
    solver: 'x-arrow',
    src: 2,
    trg: 1,
});
