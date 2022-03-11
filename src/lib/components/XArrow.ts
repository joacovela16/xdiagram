import {cutSegment, doHover, doReceptor, doSnap, getOrElse, isUndefined, Timer} from "../shared/XLib";
import type {XContext, XEdgeDef, XEdgeFactory, XID, XTheme} from "../shared/XTypes";
import {defineEdge} from "../shared/XHelper";
import type {XBuilder, XItem, XNode, XPoint} from "../shared/XRender";
import {PathHelper} from "../shared/XRender";
import {Command, HookActionEnum, HookFilterEnum} from "../shared/Instructions";
import doReactive from "../shared/Reactive";

interface XDraw {
    draw(): void;

    contains(p: XPoint): boolean;

    remove(): void;

    setVisible(v: boolean): void;

    setPosition(start: XPoint, end: XPoint): void;
}

type XStage = { index: number; point: XPoint; };

interface ArrowExtreme extends XDraw {
    element: XNode;
}

interface ArrowExtremeConf {
    fill?: string;
    shape: 'triangle' | 'circle';
}

interface ArrowConf extends XEdgeDef {
    dashArray?: [number, number];
    sourcePointer?: boolean | ArrowExtremeConf;
    targetPointer?: boolean | ArrowExtremeConf;
}

function isZero(n: number, epsilon: number = 0.05) {
    return n > -epsilon && n < epsilon;
}

const XArrow: XEdgeFactory = defineEdge<ArrowConf>({
    name: 'default-arrow',
    handler: function (context: XContext, config: ArrowConf): XNode {

        const ID: XID = config.id;
        const b: XBuilder = context.builder;
        const PRIMARY_LENGTH: number = 15;
        const SECONDARY_LENGTH: number = 25;
        const ANGLE: number = 20;

        let start_arrow_diff = PRIMARY_LENGTH;
        let end_arrow_diff = PRIMARY_LENGTH;

        const pathTool = b.makePath();
        pathTool.visible = false;

        const initialStages: { x: number, y: number }[] = config.stages || [];

        let stagesCount: number = initialStages.length;
        let isDraggingMode: boolean = false;
        let isSelectionMode: boolean = false;
        let isVertexUnLock: boolean = true;

        // install components
        const theme: XTheme = context.theme;
        const actionDispatcher = context.hookManager.dispatcher.action;
        const filterDispatcher = context.hookManager.dispatcher.filter;
        const confReactive = doReactive<ArrowConf>(config);

        const dragTimer = new Timer(300);
        const stages: XStage[] = []
        const tools: XDraw[] = []
        const path = b.makePath();
        const command = doReceptor(
            {
                [Command.unfocused]() {
                    !isDraggingMode && hideAll();
                },
                [Command.nodeDrag]() {
                    updatePositions();
                    dragTimer.clear();
                    dragTimer.handle(() => updateData());
                },
                [Command.remove]() {
                    if (filterDispatcher(HookFilterEnum.EDGE_CAN_REMOVE, true, rootEl) && context.removeLink(ID)) {
                        rootEl.remove();
                        actionDispatcher(HookActionEnum.EDGE_DELETED, config);
                        confReactive.clean();
                    }
                },
                [Command.config](cfg: ArrowConf) {
                    confReactive.set(cfg);
                }
            }
        );

        const rootEl = b.makeCompound({
            items: [path],
            command
        });

        const htmlElement = context.element;
        const style = htmlElement.style;

        // state
        let nodeSetter: (n: XItem) => void;
        let srcRefNode: XNode, trgRefNode: XNode;

        context.getNode(config.src).foreach(x => srcRefNode = x.element);
        context.getNode(config.trg).foreach(x => trgRefNode = x.element);

        for (let i = 0; i < stagesCount; i++) {
            const datum = initialStages[i];
            stages[i] = {index: i, point: b.makePoint(datum.x, datum.y)};
        }

        path.strokeColor = theme.accent;
        path.strokeWidth = 3;

        stagesCount = 2;

        buildArrowTool(stages[0]);
        buildArrowTool(stages[1]);

        confReactive.subscribe(cfg => {
            start_arrow_diff = cfg.sourcePointer ? PRIMARY_LENGTH : 0;
            end_arrow_diff = cfg.targetPointer ? PRIMARY_LENGTH : 0;
            cfg.dashArray && (path.dashArray = cfg.dashArray);
        });

        path.on("mouseenter", () => {
            style.cursor = isSelectionMode ? 'cell' : 'pointer';
            setToolsVisible(true);
        });

        path.on('mouseleave', (event) => {
            style.cursor = 'default';
            const point = event.point;
            !isSelectionMode && !isDraggingMode && !isOverTool(point) && setToolsVisible();
        });

        path.on('click', (event) => {
            if (isSelectionMode) {

                const point = event.point;
                const stage: XStage = {index: 0, point: point};

                for (let i = 0; i < stagesCount - 1; i++) {
                    const current = stages[i].point;
                    const next = stages[i + 1].point;
                    const n1 = next.subtract(current).normalize();
                    const n2 = next.subtract(point).normalize();
                    const d = n2.subtract(n1);

                    if (isZero(d.x) && isZero(d.y)) {
                        stages.splice(i + 1, 0, stage);
                        break;
                    }
                }
                stages.forEach((v: XStage, index: number) => v.index = index);
                stagesCount++;
                buildVertex(stage);
                updatePositions();
            } else {
                isSelectionMode = true;
                setToolsVisible(true);
                actionDispatcher(HookActionEnum.EDGE_SELECTED, rootEl);
            }
        });

        confReactive.subscribe(val => {
            const dashArray = val.dashArray;
            dashArray && (path.dashArray = dashArray);
        });

        context.frontLayer.addChild(rootEl);
        rootEl.data = config;

        updatePositions();

        function hideAll() {
            isSelectionMode = false;
            setToolsVisible();
        }

        function updatePositions(): void {
            updateExtremes();
            drawPath();
            drawTools();
        }

        function drawTools(): void {
            tools.forEach(x => x.draw());
        }

        function buildVertex(stage: XStage): void {
            const circle = b.makeCircle(stage.point, 10);
            const xDraw: XDraw = {
                draw(): void {
                    circle.position = stage.point;
                },
                contains(p: XPoint): boolean {
                    return circle.contains(p);
                },
                remove() {
                    circle.remove();
                },
                setVisible(v: boolean): void {
                    circle.visible = v;
                },
                setPosition(start: XPoint, end: XPoint) {
                }
            };

            const toolIndex: number = tools.push(xDraw) - 1;
            const timer: Timer = new Timer(100);

            circle.fillColor = theme.neutral;
            circle.strokeWidth = 2;
            circle.strokeColor = theme.neutralContent;

            circle.on('mousedrag', (event) => {
                stage.point = doSnap(event.point);
                updatePositions();
            });
            circle.on('mousedown', () => {
                timer.handle(() => {
                    isDraggingMode = true;
                    actionDispatcher(HookActionEnum.EDGE_START_DRAG, rootEl);
                });
            });
            circle.on('mouseup', () => {
                    timer.handle(() => {
                        isDraggingMode && (isDraggingMode = false);
                        isSelectionMode = true;
                        setToolsVisible(true);
                        actionDispatcher(HookActionEnum.EDGE_END_DRAG, rootEl);
                        updateData();
                    });
                }
            );

            doHover(circle,
                () => {
                    htmlElement.style.cursor = 'pointer';
                },
                () => {
                    htmlElement.style.cursor = 'default';
                });

            circle.on('doubleclick', () => {

                    timer.clear();
                    stages.splice(stage.index, 1);
                    tools.splice(toolIndex, 1);

                    stages.forEach((x: XStage, idx: number) => x.index = idx);
                    circle.remove();

                    isVertexUnLock = false;
                    stagesCount--;

                    updatePositions();
                    updateData();
                    actionDispatcher(HookActionEnum.EDGE_SELECTED, rootEl);
                }
            );
            rootEl.addChild(circle);
        }

        function setToolsVisible(value: boolean = false): void {
            tools.forEach(x => x.setVisible(value));
        }

        function isOverTool(point: XPoint) {
            return tools.some(x => x.contains(point));
        }

        function drawPath() {
            const maxLength: number = stages.length - 1;

            path.begin();
            path.addCommand(PathHelper.moveTo(cutSegment(stages[1].point, stages[0].point, start_arrow_diff)));

            for (let i = 1; i < maxLength; i++) {
                const curPoint = stages[i].point;
                const nextPoint = stages[i + 1].point;
                const prevPoint = stages[i - 1].point;

                path.addCommand(PathHelper.lineTo(cutSegment(prevPoint, curPoint, 10)));
                path.addCommand(PathHelper.quadraticTo(curPoint, cutSegment(nextPoint, curPoint, 10)))
            }

            path.addCommand(PathHelper.lineTo(cutSegment(stages[maxLength - 1].point, stages[maxLength].point, end_arrow_diff)))
            path.end();
        }

        function buildCircleShape(): ArrowExtreme {
            const el = b.makeCircle(b.makePoint(0, 0), 5);

            let startPoint: XPoint, endPoint: XPoint;
            const _draw = () => {
            };

            return {
                element: el,
                contains(p: XPoint): boolean {
                    return el.contains(p);
                },
                draw(): void {
                    _draw();
                },
                remove(): void {
                    el.remove();
                },
                setPosition(start: XPoint, end: XPoint): void {
                    startPoint = start;
                    endPoint = end;
                    _draw();
                },
                setVisible(v: boolean): void {
                    el.visible = v;
                }

            }
        }

        function buildTriangleShape(length: number, angle: number): ArrowExtreme {
            const trianglePath = b.makePath();

            let startPoint: XPoint, endPoint: XPoint;

            const _draw = (): void => {

                const v = startPoint.subtract(endPoint).normalize(length);
                const ref = endPoint.add(v);

                trianglePath.begin();
                trianglePath.addCommand(PathHelper.moveTo(endPoint));
                trianglePath.addCommand(PathHelper.lineTo(ref.rotate(angle, endPoint)));
                trianglePath.addCommand(PathHelper.lineTo(ref.rotate(-angle, endPoint)));
                trianglePath.addCommand(PathHelper.close());
                trianglePath.end();
            }
            return {
                element: trianglePath,
                contains(p: XPoint): boolean {
                    return trianglePath.contains(p);
                },
                setVisible(v: boolean): void {
                    trianglePath.visible = v;
                },
                draw(): void {
                    _draw();
                },
                remove(): void {
                    trianglePath.remove();
                },
                setPosition(start: XPoint, end: XPoint): void {
                    startPoint = start;
                    endPoint = end;
                    _draw();
                }
            };
        }

        function buildPrimaryArrow(parent: XNode, isSource: boolean): XDraw {
            const primaryArrow: ArrowExtreme = buildTriangleShape(PRIMARY_LENGTH, ANGLE);
            const primaryEl = primaryArrow.element;

            primaryArrow.setVisible(false);
            primaryEl.on('mouseenter', () => setToolsVisible(true));
            parent.addChild(primaryEl);

            confReactive.subscribe(cfg => {
                const value = isSource ? cfg.sourcePointer : cfg.targetPointer;
                if (value) {
                    if (typeof value === 'boolean') {
                        primaryEl.fillColor = theme.accent;
                        primaryArrow.setVisible(value);
                    } else {
                        primaryEl.fillColor = getOrElse(value.fill, theme.accent);
                        if (value.shape === 'circle') {

                        }
                    }
                }
            });

            return primaryArrow;
        }

        function buildArrowTool(stage: XStage): void {

            if (!stage.point) return;

            const isSource: boolean = stage.index === 0;
            const primaryArrow: XDraw = buildPrimaryArrow(rootEl, isSource);
            buildPrimaryArrow(rootEl, isSource);

            const secondaryArrow: ArrowExtreme = buildTriangleShape(SECONDARY_LENGTH, ANGLE)
            const secondaryEl = secondaryArrow.element;
            secondaryEl.strokeColor = theme.neutralContent;
            secondaryEl.fillColor = theme.neutral;
            secondaryEl.strokeWidth = 2;
            secondaryEl.visible = false;

            const getStartPoint = isSource ? () => stages[1].point : () => stages[stages.length - 2].point;
            const getEndpoint = isSource ? () => stage.point : () => stages[stages.length - 1].point;
            const setter = buildSetter();
            const nodeIDBound = isSource ? config.src : config.trg;

            let nodeSelection: XNode;

            const timer = new Timer(100);
            const _draw = (): void => {
                const start = getStartPoint()
                const end = getEndpoint();

                primaryArrow.setPosition(start, end);

                secondaryArrow.setPosition(start, end.add(end.subtract(start).normalize(8)));
            };

            secondaryEl.on('mousedrag', (event) => {
                if (isDraggingMode) {

                    stage.point = stage.point.add(event.delta);
                    updatePositions();

                    if (nodeSelection && !nodeSelection.contains(event.point)) {
                        nodeSelection.command(Command.onNodeNormal);
                        nodeSelection = null;
                    }

                    timer.clear();
                    timer.handle(() => {
                        context
                            .getNodes()
                            .find(x => x.element.contains(event.point))
                            .foreach(x => {

                                const node = x.element;

                                if (isUndefined(nodeSelection) || nodeSelection.id !== node.id) {
                                    if (isUndefined(srcRefNode) && isUndefined(trgRefNode)) {
                                        node.command(Command.onNodeFocus);
                                        nodeSelection = node;
                                    } else {
                                        const result = filterDispatcher(HookFilterEnum.NODES_CAN_LINK, true, srcRefNode || node, trgRefNode || node);
                                        if (result) {
                                            node.command(Command.onNodeFocus);
                                            nodeSelection = node;
                                        } else {
                                            node.command(Command.onNodeError);
                                            nodeSelection = null;
                                        }
                                    }
                                }
                            });
                    })
                }
            });

            secondaryEl.on('mousedown', e => {
                context
                    .getNode(nodeIDBound)
                    .foreach(node => {
                        if (isSource) {
                            srcRefNode = null;
                            config.src = undefined;
                            node.out.findAndRemove(x => x.id === ID && x.src === nodeIDBound);
                        } else {
                            trgRefNode = null;
                            config.trg = undefined;
                            node.in.findAndRemove(x => x.id === ID && x.trg === nodeIDBound);
                        }
                        context.removeLink(ID, false);
                        nodeSetter = setter;
                        isDraggingMode = true;
                        actionDispatcher(HookActionEnum.EDGE_START_DRAG, rootEl);
                    });
            });

            secondaryEl.on('mouseup', () => {
                isDraggingMode = false;
                htmlElement.style.cursor = 'default';

                if (nodeSelection) {
                    setter(nodeSelection);
                    updatePositions();
                    updateData();
                    nodeSelection.command(Command.onNodeNormal);
                    nodeSelection = null;

                    context.getLink(ID).fold(
                        (link) => {
                            link.src = srcRefNode && srcRefNode.id;
                            link.trg = trgRefNode && trgRefNode.id;
                        },
                        () => {
                            context.addLink({
                                id: ID,
                                element: rootEl,
                                src: srcRefNode && srcRefNode.id,
                                trg: trgRefNode && trgRefNode.id
                            });
                        }
                    )

                }
                nodeSetter = null;
                actionDispatcher(HookActionEnum.EDGE_END_DRAG, rootEl);
            });
            secondaryEl.on('mouseenter', () => htmlElement.style.cursor = 'pointer');
            secondaryEl.on('mouseleave', e => !isDraggingMode && hideAll());

            _draw();

            rootEl.addChild(secondaryEl);

            const item: XDraw = {
                setVisible(v: boolean): void {
                    primaryArrow.setVisible(!v);
                    secondaryArrow.setVisible(v);
                },
                contains(p: XPoint): boolean {
                    return secondaryEl.contains(p);
                },
                remove(): void {
                    secondaryEl.remove()
                },
                draw(): void {
                    _draw()
                },
                setPosition(start: XPoint, end: XPoint) {
                }
            };
            tools.push(item);

            function buildSetter() {
                if (isSource) {
                    return (node: XNode) => {
                        if (context.addLink({id: ID, element: rootEl, src: node.id})) {
                            srcRefNode = node;
                            config.src = node.id;
                        }
                    };
                } else {
                    return (node: XNode) => {
                        if (context.addLink({id: ID, element: rootEl, trg: node.id})) {
                            trgRefNode = node;
                            config.trg = node.id;
                        }
                    };
                }
            }
        }

        function updateExtremes(): void {
            const srcCenter = srcRefNode && srcRefNode.bounds.center;
            const trgCenter = trgRefNode && trgRefNode.bounds.center;

            if (stagesCount === 2) {
                pathTool.begin();
                // linked to src
                if (srcRefNode) {
                    // pathTool.moveTo(srcCenter);
                    pathTool.addCommand(PathHelper.moveTo(srcCenter))
                    if (trgRefNode) {
                        pathTool.addCommand(PathHelper.lineTo(trgCenter));
                        pathTool.end();
                        const trgPoints = trgRefNode.getIntersections(pathTool);
                        const firstTrgPoints = trgPoints && trgPoints[0];
                        firstTrgPoints && (stages[stagesCount - 1].point = firstTrgPoints);
                    } else {
                        const point = stages[stagesCount - 1].point;
                        pathTool.addCommand(PathHelper.lineTo(point));
                        pathTool.end();
                    }
                    const srcPoints = srcRefNode.getIntersections(pathTool);
                    const firstSrcPoint = srcPoints && srcPoints[0];
                    firstSrcPoint && (stages[0].point = firstSrcPoint);
                }

                if (trgRefNode) {
                    // pathTool.moveTo(trgCenter);
                    pathTool.addCommand(PathHelper.moveTo(trgCenter));

                    if (srcRefNode) {
                        // pathTool.lineTo(srcCenter);
                        pathTool.addCommand(PathHelper.lineTo(srcCenter));
                        pathTool.end();
                        const srcPoints = srcRefNode.getIntersections(pathTool);
                        const firstSrcPoints = srcPoints && srcPoints[0];
                        firstSrcPoints && (stages[0].point = firstSrcPoints);
                    } else {
                        // pathTool.lineTo(stages[0].point);
                        pathTool.addCommand(PathHelper.lineTo(stages[0].point));
                        pathTool.end();
                    }
                    const trgPoints: XPoint[] = trgRefNode.getIntersections(pathTool);
                    const firstTrgPoint: XPoint = trgPoints && trgPoints[0];
                    firstTrgPoint && (stages[stagesCount - 1].point = firstTrgPoint);
                }


            } else {

                if (srcRefNode) {
                    pathTool.begin();
                    pathTool.addCommand(PathHelper.moveTo(srcCenter));
                    pathTool.addCommand(PathHelper.lineTo(stages[1].point));
                    pathTool.end();
                    const srcPoints: XPoint[] = srcRefNode.getIntersections(pathTool);
                    const firstSrcPoint: XPoint = srcPoints && srcPoints[0];
                    firstSrcPoint && (stages[0].point = firstSrcPoint);
                }

                if (trgRefNode) {
                    pathTool.begin()
                    pathTool.addCommand(PathHelper.moveTo(stages[stagesCount - 2].point))
                    pathTool.addCommand(PathHelper.lineTo(trgCenter))
                    pathTool.end();

                    const trgPoints: XPoint[] = trgRefNode.getIntersections(pathTool);
                    const firstTrgPoint: XPoint = trgPoints && trgPoints[0];
                    firstTrgPoint && (stages[stagesCount - 1].point = firstTrgPoint);
                }
            }
        }

        function updateData() {
            config.stages = stages.map(x => ({x: x.point.x, y: x.point.y}));
            actionDispatcher(HookActionEnum.DATA_UPDATE);
        }

        return rootEl;
    }
});

export default XArrow;


/*

export class XArrow {
    private group: paper.Group;
    private renderer: ArrowRenderer;
    private x: XPoint;
    private y: XPoint;

    constructor(group: paper.Group) {
        this.group = group;

    }


    render(startPoint: XPoint, endPoint: XPoint): void {

        this.rectLine(startPoint, endPoint);
    }

    private rectLine(startPoint: XPoint, endPoint: XPoint): void {
        let path = new Path();
        path.strokeColor = new Color('red')
        path.add(startPoint);
        path.add(endPoint);
        path.removeOnDrag();
        path.removeOnUp();
    }

    private curveLine(startPoint: XPoint, endPoint: XPoint): void {
        const source = startPoint, target = endPoint;
        const inverted = (target.y < source.y && source.x < target.x) || (target.y > source.y && target.x < source.x);

        const rectangle = new Rectangle(source, target);
        const center = rectangle.center.rotate(inverted ? -10 : 10, startPoint);

        const path = new Path();
        path.add(startPoint);
        path.curveTo(center, endPoint);
        path.strokeColor = new Color('red');
        path.removeOnDrag()
        path.removeOnUp()
        this.group.addChild(path);

    }

    private curvedLine(startPoint: XPoint, endPoint: XPoint): void {

        let source = startPoint, target = endPoint;
        let inverted = false;

        if (source.length > target.length || (target.x > source.x && target.y < source.y)) {
            source = endPoint;
            target = startPoint;
            inverted = true;
        }

        const rectangle = new Rectangle(source, target);
        const h1 = rectangle.topCenter.subtract(source);
        const h2 = rectangle.bottomCenter.subtract(target);
        const s1 = new Segment(source, null, h1)
        const s2 = new Segment(target, h2, null);
        const path = new Path([s1, s2]);
        path.strokeColor = new Color("red");
        path.strokeWidth = 2;
        path.removeOnUp();
        path.removeOnDrag();
        // point
        const pathLength = path.length;
        const LENGTH = 15;
        const norm = path.getPointAt(inverted ? LENGTH : pathLength - LENGTH);
        const angle = 45;
        const leftCorner = norm.rotate(angle, endPoint);
        const rightCorner = norm.rotate(-angle, endPoint);
        const path1 = new Path([leftCorner, endPoint, rightCorner]);
        path1.strokeColor = new Color('blue');
        path1.fillColor = new Color('blue');
        path1.removeOnUp();
        path1.removeOnDrag();
        this.group.addChild(path);
        this.group.addChild(path1);
    }

}

}*/