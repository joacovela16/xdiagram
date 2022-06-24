import {cutSegment, doHover, doReceptor, getOrElse, isDefined, isUndefined, pointQuadrant, Timer} from "../shared/XLib";
import type {XContext, XElementDef, XElementFactory, XID, XTheme} from "../shared/XTypes";
import {Callable} from "../shared/XTypes";
import {defineElement} from "../shared/XHelper";
import type {XBound, XBuilder, XItem, XNode, XPoint, XShape} from "../shared/XRender";
import {PathHelper} from "../shared/XRender";
import {Command, HookActionEnum, HookFilterEnum} from "../shared/Instructions";
import {LinkedList, Record} from "../shared/XList";

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

type Position = { x: number; y: number };

export type XArrowDef = {
    src: XID;
    trg: XID;
    stages?: Position[];
    joinMode?: "continuous" | "step",
    arrowMode?: "line" | "simple" | "waypoints"
} & XElementDef;

function isZero(n: number, epsilon: number = 0.05) {
    return n > -epsilon && n < epsilon;
}

const XArrow: XElementFactory = defineElement<XArrowDef>({
    name: 'x-arrow',
    onInit(context, hookManager) {
        let listener = hookManager.listener;
        listener.filter("x-linker-plugin-can-apply", (value: boolean, node: XNode) => node.data.solver === 'x-arrow' ? false : value);
        listener.filter("x-copy-plugin-can-apply", (value: boolean, node: XNode) => node.data.solver === 'x-arrow' ? false : value);
    },
    build(context: XContext, hookManager, config: XArrowDef): XNode {

        const ID: XID = config.id;
        const b: XBuilder = context.builder;
        const PRIMARY_LENGTH: number = 15;
        const SECONDARY_LENGTH: number = 25;
        const ANGLE: number = 20;

        const pathTool = b.makePath();
        pathTool.visible = false;
        config.stages || (config.stages = []);

        const initialStages: Position[] = config.stages;

        let stagesCount: number = initialStages.length;
        let isDraggingMode: boolean = false;
        let isSelectionMode: boolean = false;
        let isVertexUnLock: boolean = true;

        // install components
        const theme: XTheme = context.theme;
        const actionDispatcher = hookManager.dispatcher.action;
        const filterDispatcher = hookManager.dispatcher.filter;
        const actionListener = hookManager.listener.action;

        actionDispatcher('x-arrow-config-mapper', config);

        const joinMode = config.joinMode || "continuous";
        const arrowMode = config.arrowMode || "simple";

        const onRemoveCallable: LinkedList<Callable> = new LinkedList<Callable>();
        const dragTimer = new Timer(300);
        const stages: XStage[] = []
        const tools: XDraw[] = []
        const path = b.makePath();

        const command = doReceptor(
            {
                [Command.unfocused]() {
                    !isDraggingMode && hideAll();
                },
                [Command.remove]() {
                    removeThis();
                }
            }
        );

        const rootEl = b.makeInteractive({
            items: [path],
            command
        });

        const htmlElement = context.element;
        const style = htmlElement.style;

        // state
        let nodeSetter: (n: XItem) => void;
        let srcRefNode: XNode, trgRefNode: XNode;

        if (initialStages.length > 1) {
            for (let i = 0; i < stagesCount; i++) {
                const datum = initialStages[i];
                stages[i] = {index: i, point: b.makePoint(datum.x, datum.y)};
            }
        } else {
            const localSrc: XID = config.src;
            const localTrg: XID = config.trg;
            context.getElement(localSrc).foreach(x => {
                srcRefNode = x;
                isUndefined(stages[0]) && stages.push({index: 0, point: x.bounds.center});

            });
            context.getElement(localTrg).foreach(x => {
                trgRefNode = x;
                isUndefined(stages[1]) && stages.push({index: 1, point: x.bounds.center});
            });
        }

        stagesCount = stages.length;
        path.strokeColor = theme.accent;
        path.strokeWidth = 2;
        path.fillColor = undefined;
        rootEl.id = config.id;
        config.linkable = false;

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
                renderer();
            } else {
                isSelectionMode = true;
                setToolsVisible(true);
                actionDispatcher(HookActionEnum.ELEMENT_SELECTED, rootEl);
            }
        });

        context.getLayer('front').addChild(rootEl);
        rootEl.data = config;

        srcRefNode && trgRefNode && actionDispatcher(HookActionEnum.ELEMENTS_LINKED, srcRefNode.id, trgRefNode.id);
        let extremeUpdater: () => void;
        let pathRenderer: () => void;
        let triangleRenderer: (startPoint: XPoint, endPoint: XPoint, length: number, angle: number, path: XShape) => void = defaultTriangleRenderer;

        installer();
        renderer();

        buildArrowTool(stages[0]);
        buildArrowTool(stages[stagesCount - 1]);

        function installer() {
            switch (joinMode) {
                case "step":
                    break;
                default:
                    extremeUpdater = continuousExtremeUpdater;
                    break;
            }

            switch (arrowMode) {
                case "line":
                    break;
                case "simple":
                    const last = stages[stagesCount - 1];
                    stages[1] = {index: 1, point: undefined};
                    stages[2] = {index: 2, point: undefined};
                    stages[3] = last;
                    stages.forEach((item, idx) => item.index = idx);
                    stagesCount = 4;

                    stepExtremeUpdater();
                    pathRenderer = simplePathRenderer;
                    extremeUpdater = stepExtremeUpdater;
                    break;
                default:
                    pathRenderer = waypointsPathRenderer;
                    break;
            }
        }

        function hideAll() {
            isSelectionMode = false;
            setToolsVisible();
        }

        function renderer(): void {
            extremeUpdater();
            pathRenderer();
            drawTools();
        }

        function drawTools(): void {
            tools.forEach(x => x.draw());
        }

        function buildVertex(stage: XStage): void {
            const circle = b.makeCircle();
            circle.center = stage.point;
            circle.radius = 10;

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
                setPosition(_start: XPoint, _end: XPoint) {
                }
            };

            const toolIndex: number = tools.push(xDraw) - 1;
            const timer: Timer = new Timer(100);

            circle.fillColor = theme.neutral;
            circle.strokeWidth = 2;
            circle.strokeColor = theme.neutralContent;

            circle.on('mousedrag', (event) => {
                stage.point = event.point;
                renderer();
            });
            circle.on('mousedown', () => {
                timer.handle(() => {
                    isDraggingMode = true;
                    actionDispatcher(HookActionEnum.ELEMENT_START_DRAG, rootEl);
                });
            });
            circle.on('mouseup', () => {
                    timer.handle(() => {
                        isDraggingMode && (isDraggingMode = false);
                        isSelectionMode = true;
                        setToolsVisible(true);
                        actionDispatcher(HookActionEnum.ELEMENT_END_DRAG, rootEl);
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
                    hideAll();
                });

            circle.on('doubleclick', () => {

                    timer.clear();
                    stages.splice(stage.index, 1);
                    tools.splice(toolIndex, 1);

                    stages.forEach((x: XStage, idx: number) => x.index = idx);
                    circle.remove();

                    isVertexUnLock = false;
                    stagesCount--;

                    renderer();
                    updateData();
                    actionDispatcher(HookActionEnum.ELEMENT_SELECTED, rootEl);
                }
            );
            rootEl.addChild(circle);
        }

        function setToolsVisible(value: boolean = false): void {
            tools.forEach(x => x.setVisible(value));
        }

        function isOverTool(point: XPoint): boolean {
            return tools.some(x => x.contains(point));
        }

        function buildTriangleShape(length: number, angle: number): ArrowExtreme {
            const trianglePath = b.makePath();
            let startPoint: XPoint, endPoint: XPoint;

            const _draw: () => void = () => triangleRenderer(startPoint, endPoint, length, angle, trianglePath);

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

            const fillColor = isSource ? (config.sourcePointer || false) : (config.targetPointer || false);

            if (fillColor) {
                if (typeof fillColor === 'boolean') {
                    primaryEl.fillColor = theme.accent;
                    primaryArrow.setVisible(fillColor);
                } else {
                    primaryEl.fillColor = getOrElse(fillColor.fill, theme.accent);
                }
            }

            primaryEl.on('mouseenter', () => setToolsVisible(true));
            parent.addChild(primaryEl);

            return primaryArrow;
        }

        function buildArrowTool(stage: XStage): void {

            if (!stage.point) return;

            const isSource: boolean = stage.index === 0;
            const primaryArrow: XDraw = buildPrimaryArrow(rootEl, isSource);

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

            context.getElement(nodeIDBound).foreach(x => setter(x))

            secondaryEl.on('mousedrag', (event) => {
                if (isDraggingMode) {

                    stage.point = stage.point.add(event.delta);
                    renderer();
                    if (nodeSelection && !nodeSelection.contains(event.point)) {
                        nodeSelection.command(Command.onElementLinkOut);
                        nodeSelection = null;
                    }

                    timer.clear();
                    timer.handle(() => {
                        context
                            .getElements()
                            .filter(x => x.data.linkable === true)
                            .find(x => x.contains(event.point))
                            .foreach(node => {

                                if (isUndefined(nodeSelection) || nodeSelection.id !== node.id) {
                                    if (isUndefined(srcRefNode) && isUndefined(trgRefNode)) {
                                        node.command(Command.onElementLinkIn, ID);
                                        nodeSelection = node;
                                    } else {
                                        const result = filterDispatcher(HookFilterEnum.ELEMENTS_CAN_LINK, true, srcRefNode || node, trgRefNode || node);
                                        if (result) {
                                            node.command(Command.onElementLinkIn, ID);
                                            nodeSelection = node;
                                        } else {
                                            node.command(Command.onElementError);
                                            nodeSelection = null;
                                        }
                                    }
                                }
                            });
                    })
                }
            });
            secondaryEl.on('mousedown', () => {
                setter(null);
                nodeSetter = setter;
                isDraggingMode = true;
                actionDispatcher(HookActionEnum.ELEMENT_START_DRAG, rootEl);
            });
            secondaryEl.on('mouseup', () => {
                isDraggingMode = false;
                htmlElement.style.cursor = 'default';

                if (nodeSelection) {
                    nodeSelection.command(Command.onElementNormal);
                    nodeSetter(nodeSelection);
                    renderer();
                    updateData();
                    nodeSelection = null;
                }
                nodeSetter = null;
                actionDispatcher(HookActionEnum.ELEMENT_END_DRAG, rootEl);
            });
            secondaryEl.on('mouseenter', () => htmlElement.style.cursor = 'pointer');
            secondaryEl.on('mouseleave', () => !isDraggingMode && hideAll());

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
                setPosition(_start: XPoint, _end: XPoint) {
                }
            };
            tools.push(item);

            function buildSetter() {
                const dragImpl: Callable = () => {
                    renderer();
                    dragTimer.clear();
                    dragTimer.handle(() => updateData());
                };

                const deleteImpl: Callable = () => removeThis();

                let dragRecord: Record<Callable>,
                    deleteRecord: Record<Callable>;

                const clean: Callable = () => {
                    dragRecord && dragRecord.getAndRemove(x => x());
                    deleteRecord && deleteRecord.getAndRemove(x => x());
                }

                const installer: (x: XNode) => void = (node) => {
                    dragRecord = onRemoveCallable.append(actionListener(`${node.id}-drag`, dragImpl));
                    deleteRecord = onRemoveCallable.append(actionListener(`${node.id}-deleted`, deleteImpl));
                }

                if (isSource) {
                    return (node: XNode) => {
                        clean();
                        if (node) {
                            config.src = node.id;
                            srcRefNode = node;
                            node.command(Command.onElementLinked, ID);
                            installer(node);
                        } else {
                            actionDispatcher(HookActionEnum.ELEMENT_UNLINKED, config.src);
                            config.src = undefined;
                            srcRefNode && srcRefNode.command(Command.onElementUnLinked, ID);
                            srcRefNode = null;
                        }
                    };
                } else {
                    return (node: XNode) => {
                        clean();
                        if (node) {
                            config.trg = node.id;
                            trgRefNode = node;
                            node.command(Command.onElementLinked, ID);
                            installer(node);
                        } else {
                            actionDispatcher(HookActionEnum.ELEMENT_UNLINKED, config.trg);
                            config.trg = undefined;
                            trgRefNode && trgRefNode.command(Command.onElementUnLinked, ID);
                            trgRefNode = null;
                        }
                    };
                }
            }
        }

        //************** PATH RENDERER **************//

        function simplePathRenderer(): void {

            path.begin();
            path.addCommand(PathHelper.moveTo(stages[0].point))
            for (let i = 1; i < 4; i++) {
                path.addCommand(PathHelper.lineTo(stages[i].point))
            }

            path.end();
        }

        function waypointsPathRenderer(): void {
            const maxLength: number = stages.length - 1;

            path.begin();
            path.addCommand(PathHelper.moveTo(stages[0].point));

            for (let i = 1; i < maxLength; i++) {
                const curPoint = stages[i].point;
                const nextPoint = stages[i + 1].point;
                const prevPoint = stages[i - 1].point;

                path.addCommand(PathHelper.lineTo(cutSegment(prevPoint, curPoint, 10)));
                path.addCommand(PathHelper.quadraticTo(curPoint, cutSegment(nextPoint, curPoint, 10)))
            }

            path.addCommand(PathHelper.lineTo(stages[maxLength].point))
            path.end();
        }

        //************** EXTREME UPDATER **************//

        function stepExtremeUpdater() {
            const srcBox: XBound = srcRefNode && srcRefNode.bounds;
            const trgBox: XBound = trgRefNode && trgRefNode.bounds;
            const srcCenter: XPoint = stages[0].point// srcBox.center;
            const trgCenter: XPoint = stages[stagesCount - 1].point;// trgBox.center;

            const w: number = Math.abs(srcCenter.x - trgCenter.x);
            const maxWidth: number = Math.max((srcBox && srcBox.width) || 0, (trgBox && trgBox.width) || 0);
            const isLessW: boolean = w < maxWidth;
            const quadrant = pointQuadrant(trgCenter, srcCenter);

            switch (quadrant) {
                case "TR":

                    if (isLessW) {
                        const start = (srcBox && srcBox.topCenter) || stages[0].point;
                        const end = (trgBox && trgBox.bottomCenter) || stages[3].point;
                        const bound = b.makeBound(start, end);
                        stages[0].point = start;
                        stages[1].point = bound.leftCenter;
                        stages[2].point = bound.rightCenter;
                        stages[3].point = end;
                    } else {
                        const start = (srcBox && srcBox.rightCenter) || stages[0].point;
                        const end = (trgBox && trgBox.leftCenter) || stages[3].point;
                        const bound = b.makeBound(start, end);
                        stages[0].point = start;
                        stages[1].point = bound.bottomCenter;
                        stages[2].point = bound.topCenter;
                        stages[3].point = end;
                    }

                    break;
                case "TL":
                    if (isLessW) {

                        const start = (srcBox && srcBox.topCenter) || stages[0].point;
                        const end = (trgBox && trgBox.bottomCenter) || stages[3].point;
                        const bound = b.makeBound(start, end);
                        stages[0].point = start;
                        stages[1].point = bound.rightCenter;
                        stages[2].point = bound.leftCenter;
                        stages[3].point = end;
                    } else {

                        const start = (srcBox && srcBox.leftCenter) || stages[0].point;
                        const end = (trgBox && trgBox.rightCenter) || stages[3].point;
                        const bound = b.makeBound(start, end);
                        stages[0].point = start;
                        stages[1].point = bound.bottomCenter;
                        stages[2].point = bound.topCenter;
                        stages[3].point = end;
                    }
                    break;
                case "BL":
                    if (isLessW) {

                        const start = (srcBox && srcBox.bottomCenter) || stages[0].point;
                        const end = (trgBox && trgBox.topCenter) || stages[3].point;
                        const bound = b.makeBound(start, end);
                        stages[0].point = start;
                        stages[1].point = bound.rightCenter;
                        stages[2].point = bound.leftCenter;
                        stages[3].point = end;

                    } else {

                        const start = (srcBox && srcBox.leftCenter) || stages[0].point;
                        const end = (trgBox && trgBox.rightCenter) || stages[3].point;
                        const bound = b.makeBound(start, end);
                        stages[0].point = start;
                        stages[1].point = bound.topCenter;
                        stages[2].point = bound.bottomCenter;
                        stages[3].point = end;
                    }
                    break;
                case "BR":
                    if (isLessW) {

                        const start = (srcBox && srcBox.bottomCenter) || stages[0].point;
                        const end = (trgBox && trgBox.topCenter) || stages[3].point;
                        const bound = b.makeBound(start, end);
                        stages[0].point = start;
                        stages[1].point = bound.leftCenter;
                        stages[2].point = bound.rightCenter;
                        stages[3].point = end;

                    } else {

                        const start = (srcBox && srcBox.rightCenter) || stages[0].point;
                        const end = (trgBox && trgBox.leftCenter) || stages[3].point;
                        const bound = b.makeBound(start, end);
                        stages[0].point = start;
                        stages[1].point = bound.topCenter;
                        stages[2].point = bound.bottomCenter;
                        stages[3].point = end;
                    }
                    break;
            }
        }

        function continuousExtremeUpdater(): void {
            const srcCenter = srcRefNode && srcRefNode.bounds.center;
            const trgCenter = trgRefNode && trgRefNode.bounds.center;

            if (stagesCount === 2) {
                pathTool.begin();
                if (srcRefNode) {
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
                    pathTool.addCommand(PathHelper.moveTo(trgCenter));

                    if (srcRefNode) {
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

        //************** TRIANGLE RENDERER **************//
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

        function stepTriangleRenderer(startPoint: XPoint, endPoint: XPoint, length: number, angle: number, path: XShape): void {
            const v = startPoint.subtract(endPoint).normalize(length);
            const ref = endPoint.add(v);

            path.begin();
            path.addCommand(PathHelper.moveTo(endPoint));
            path.addCommand(PathHelper.lineTo(ref.rotate(angle, endPoint)));
            path.addCommand(PathHelper.lineTo(ref.rotate(-angle, endPoint)));
            path.addCommand(PathHelper.close());
            path.end();
        }

        //****************************//
        function updateData() {
            config.stages = stages.map(x => ({x: x.point.x, y: x.point.y}));
            actionDispatcher(HookActionEnum.DATA_UPDATE);
        }

        function removeThis() {

            actionDispatcher(HookActionEnum.ELEMENT_DELETED, rootEl);
            const src: XID = config.src;
            const trg: XID = config.trg;
            const srcDef = isDefined(src);
            const trgDef = isDefined(trg);

            srcDef && actionDispatcher(HookActionEnum.ELEMENT_UNLINKED, src);
            trgDef && actionDispatcher(HookActionEnum.ELEMENT_UNLINKED, trg);
            srcDef && trgDef && actionDispatcher(HookActionEnum.ELEMENTS_UNLINKED, src, trg);

            context.removeElement(ID);
            rootEl.remove();
            onRemoveCallable.forEach(x => x());
            onRemoveCallable.clean();
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
