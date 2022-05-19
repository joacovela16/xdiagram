import {XLightTheme} from "./modules/themes";
import {PaperRenderer} from "./modules/renderers";
import {XArrow, XArrowDef, XDefaultNode, XNodeDef, XNodePort, XNodePortDef} from "./modules/components";
import {XBoardPlugin, XCopyPlugin, XDataChangePlugin, XDeletePlugin, XInteractivePlugin, XLinkerPlugin, XSelectionPlugin} from "./modules/plugins";
import {HookActionEnum, XDiagram, XElementDef} from "./modules/core";
import XFunctionPort, {XFunctionPortDef} from "./lib/components/XFunctionPort";

document.body.style.width = '100%';
document.body.style.height = '400px';

const xDiagram = new XDiagram(document.body, {
    id: 'test',
    theme: XLightTheme,
    renderer: PaperRenderer,
    catalog: [
        XDefaultNode({name: 'rounded-node', strokeWidth: 2, padding: 24, radius: 8}),
        XNodePort({name: 'port', strokeWidth: 2, padding: 24, radius: 8}),
        XFunctionPort({name: 'function-port', strokeWidth: 2, padding: 24, radius: 8}),
        XArrow
    ],
    plugins: [
        XBoardPlugin(),
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

xDiagram.addElement<XNodeDef>({
    id: 0,
    solver: 'rounded-node',
    position: {
        x: 100,
        y: 100,
    },
    text: 'Task-1'
});

xDiagram.addElement<XNodeDef>({
    id: 1,
    solver: 'rounded-node',
    text: 'Task-2',
    position: {
        x: 400,
        y: 100,
    }
});

xDiagram.addElement<XNodeDef>({
    id: 2,
    solver: 'rounded-node',
    text: 'Task-3',
    position: {
        x: 200,
        y: 200,
    }
});

xDiagram.addElement<XNodePortDef>({
    id: 3,
    solver: 'port',
    text: 'Task-3',
    position: {
        x: 450,
        y: 200,
    },
    in: 3,
    out: 2
});

xDiagram.addElement<XNodePortDef>({
    id: 4,
    solver: 'port',
    text: 'Task-4',
    position: {
        x: 650,
        y: 200,
    },
    in: 1,
    out: 1
});


xDiagram.addElement<XFunctionPortDef>({
    id: 5,
    solver: 'function-port',
    text: 'Task-5',
    position: {
        x: 650,
        y: 300,
    },
    in: ["person", "cusotmer", "input2", "input3", "input4", "input5", "input5"],
    out: ["output0"],
    portTextSize: 14
});

xDiagram.addElement<XArrowDef>({solver: 'x-arrow', src: 2, trg: 1});
xDiagram.addElement<XArrowDef>({solver: 'x-arrow', src: 2, trg: 'in:0:3'});
xDiagram.addElement<XArrowDef>({solver: 'x-arrow', src: 2, trg: 'in:2:3'});

xDiagram.getListener().action(HookActionEnum.ELEMENT_SELECTED, node=>{
    console.log('Node selected')
    console.log(node)
})