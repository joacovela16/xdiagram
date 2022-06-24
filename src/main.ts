import {XLightTheme} from "./modules/themes";
import {XArrow, XArrowDef, XDefaultNode, XNodeDef, XNodePort, XNodePortDef} from "./modules/components";
import {XBoardPlugin, XCopyPlugin, XDataChangePlugin, XDeletePlugin, XInteractivePlugin, XLinkerPlugin, XSelectionPlugin} from "./modules/plugins";
import {Callable, HookActionEnum, LinkedList, PathHelper, XDiagram, XElementDef, XItem, XPoint, XShape} from "./modules/core";
import XFunctionPort, {XFunctionPortDef} from "./lib/components/XFunctionPort";
import SVGRenderer from "./lib/renderer/SVGRenderer";

document.body.style.width = '100%';
document.body.style.height = '400px';

const xDiagram = new XDiagram(document.getElementById("app"), {
    id: 'test',
    theme: XLightTheme,
    renderer: SVGRenderer,
    catalog: [
        XDefaultNode({name: 'rounded-node', padding: 5, radius: 8}),
        XNodePort({name: 'port', padding: 5, radius: 8}),
        XFunctionPort({name: 'function-port', padding: 5, radius: 8}),
        XArrow
    ],
    plugins: [
        // XBoardPlugin(),
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
/*
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
        x: 950,
        y: 300,
    },
    in: ["person", "cusotmer", "input2", "input3"],
    out: ["output0"],
    portTextSize: 14
});*/
xDiagram.addElement<XArrowDef>({solver: 'x-arrow', src: 2, trg: 1});
/*
xDiagram.addElement<XArrowDef>({solver: 'x-arrow', src: 2, trg: 'in:0:3'});
xDiagram.addElement<XArrowDef>({solver: 'x-arrow', src: 2, trg: 'in:2:3'});*/
/*

xDiagram.getListener().action(HookActionEnum.ELEMENT_SELECTED, node => {
    console.log('Node selected')
    console.log(node)
})*/

/*
const linkedList = new LinkedList<number>();
linkedList.append(1);
linkedList.forEach(x => console.log(x));
linkedList.insertAt(1,0)
linkedList.forEach(x => console.log(x));

const builder = SVGRenderer(document.getElementById("app"));
const icon = builder.fromSVG(
    `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <desc>Download more icon variants from https://tabler-icons.io/i/ball-basketball</desc>
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <circle cx="12" cy="12" r="9"></circle>
   <line x1="5.65" y1="5.65" x2="18.35" y2="18.35"></line>
   <line x1="5.65" y1="18.35" x2="18.35" y2="5.65"></line>
   <path d="M12 3a9 9 0 0 0 9 9"></path>
   <path d="M3 12a9 9 0 0 1 9 9"></path>
</svg>`
)
icon.center = builder.makePoint(300, 300);
builder.addItems(icon);

const xRect = builder.makeRect();
xRect.size = builder.makeSize(100, 100);
xRect.fillColor = 'red';
xRect.radius = 8;
xRect.center = builder.makePoint(0, 0);
xRect.scale(1.5)
xRect.rotate(45)

const xText = builder.makeText();
xText.center = builder.makePoint(0, 0);
xText.content = "hola";

const xItem = builder.makeGroup();
xItem.position = builder.makePoint(100, 100);

const xLine = builder.makeLine();
xLine.strokeWidth = 4;
xLine.strokeColor = 'blue';
xLine.setExtremes(builder.makePoint(40, 40), builder.makePoint(100, 100))


const xCircle = builder.makeCircle();
xCircle.strokeWidth = 2;
xCircle.strokeColor = 'blue';
xCircle.radius = 50;
xCircle.fillColor = 'black';
xCircle.center = builder.makePoint(200, 200);

builder.addItems(xCircle);
builder.addItems(xLine);


builder.addItems(xItem);
xItem.addChildren([xRect, xText]);

doDraggable(xItem);
doDraggable(xLine);
doDraggable(xCircle);

xItem.on('click', e => {

    const r = builder.makeRect();
    r.size = xRect.size.multiply(1.1)
    r.fillColor = undefined;
    r.strokeColor = 'red';
    r.strokeWidth = 2;
    r.dashArray = [4, 4];
    r.center = xRect.center;
    builder.addItems(r)
})

function doDraggable(xItem: XItem): void {

    let isDrag = false;
    const events = new LinkedList<Callable>()

    function cleanAll() {
        events.forEach(x => x());
        events.clean();
    }

    xItem.on('mousedown', e => {
        isDrag = true;
        events.append(builder.on('mousemove', e => xItem.moveBy(e.delta)));

        events.append(builder.on('mouseup', e => cleanAll()));
        events.append(builder.on('mouseleave', e => cleanAll()));
    })

}

const path = builder.makePath();
builder.addItems(path);
path.fillColor = 'orange'
defaultTriangleRenderer(
    builder.makePoint(300,300),
    builder.makePoint(300,350),
    10,
    20,
    path
)

function defaultTriangleRenderer(startPoint: XPoint, endPoint: XPoint, length: number, angle: number, path: XShape): void {
    const v = startPoint.subtract(endPoint).normalize(length);
    const ref = endPoint.add(v);

    path.begin();
    path.addCommand(PathHelper.moveTo(endPoint));
    path.addCommand(PathHelper.lineTo(ref.rotate(angle, endPoint)));
    path.addCommand(PathHelper.lineTo(ref.rotate(-angle, endPoint)));
    path.addCommand(PathHelper.close());
    path.end();
}

*/