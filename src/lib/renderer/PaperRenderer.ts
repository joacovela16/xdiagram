import {Color, Group, PaperScope, Path, Point, PointText, Raster, Rectangle, Size} from "paper";
import type {PathCommand, XBound, XBuilder, XEvent, XEventName, XInteractiveDef, XItem, XNode, XPoint, XRaster, XShape, XSize, XText} from "../shared/XRender";
import type {Callable, XID} from "../shared/XTypes";


class PSize implements XSize {

    private el: paper.Size;

    constructor(width: number, height: number) {
        this.el = new Size(width, height);
    }

    static fromSize(s: paper.Size): XSize {
        return s && new PSize(s.width, s.height);
    }

    static toSize(s: XSize): paper.Size {
        return s && new Size(s.width, s.height);
    }

    static buildSize(width: number, height: number): paper.Size {
        return new Size(width, height);
    }

    get height(): number {
        return this.el.height;
    }

    set height(value: number) {
        this.el.height = value;
    }

    get width(): number {
        return this.el.width;
    }

    set width(value: number) {
        this.el.width = value;
    }

    abs(): XSize {
        return PSize.fromSize(this.el.abs());
    }

    add(number: number): XSize;
    add(size: XSize): XSize;
    add(number: number | XSize): XSize {
        if (typeof number === 'number') {
            return PSize.fromSize(this.el.add(number));
        } else {
            return PSize.fromSize(this.el.add(PSize.toSize(number)));
        }
    }

    ceil(): XSize {
        return PSize.fromSize(this.el.ceil());
    }

    divide(number: number): XSize;
    divide(size: XSize): XSize;
    divide(number: number | XSize): XSize {
        if (typeof number === 'number') {
            return PSize.fromSize(this.el.divide(number));
        } else {
            return PSize.fromSize(this.el.divide(PSize.toSize(number)));
        }
    }

    floor(): XSize {
        return PSize.fromSize(this.el.floor());
    }

    isNaN(): boolean {
        return this.el.isNaN();
    }

    isZero(): boolean {
        return this.el.isZero();
    }

    modulo(value: number): XSize;
    modulo(size: XSize): XSize;
    modulo(number: number | XSize): XSize {
        if (typeof number === 'number') {
            return PSize.fromSize(this.el.modulo(number));
        } else {
            return PSize.fromSize(this.el.modulo(PSize.toSize(number)));
        }
    }

    multiply(number: number): XSize;
    multiply(size: XSize): XSize;
    multiply(number: number | XSize): XSize {
        if (typeof number === 'number') {
            return PSize.fromSize(this.el.multiply(number));
        } else {
            return PSize.fromSize(this.el.multiply(PSize.toSize(number)));
        }
    }

    round(): XSize {
        return PSize.fromSize(this.el.round());
    }

    subtract(number: number): XSize;
    subtract(size: XSize): XSize;
    subtract(number: number | XSize): XSize {
        if (typeof number === 'number') {
            return PSize.fromSize(this.el.subtract(number));
        } else {
            return PSize.fromSize(this.el.subtract(PSize.toSize(number)));
        }
    }

}

class PBound implements XBound {

    private el: paper.Rectangle;

    constructor(x: number | paper.Rectangle, y?: number, width?: number, height?: number) {
        if (typeof x === 'number') {
            this.el = new Rectangle(PPoint.buildPoint(x, y), PSize.buildSize(width, height));
        } else {
            this.el = x;
        }
    }

    clone(): XBound {
        return new PBound(this.el.clone());
    }

    static fromBound(p: paper.Rectangle): XBound {
        return p && new PBound(p);
    }

    static toBound(p: XBound): paper.Rectangle {
        return p && new Rectangle(PPoint.buildPoint(p.x, p.y), PSize.buildSize(p.width, p.height));
    }

    get y(): number {
        return this.el.y;
    }

    set y(value: number) {
        this.el.y = value;
    }

    get x(): number {
        return this.el.x;
    }

    set x(value: number) {
        this.el.x = value;
    }

    get width(): number {
        return this.el.width;
    }

    set width(value: number) {
        this.el.width = value;
    }

    get topRight(): XPoint {
        return PPoint.fromPoint(this.el.topRight);
    }

    set topRight(value: XPoint) {
        this.el.topRight = PPoint.toPoint(value);
    }

    get topLeft(): XPoint {
        return PPoint.fromPoint(this.el.topLeft);
    }

    set topLeft(value: XPoint) {
        this.el.topLeft = PPoint.toPoint(value);
    }

    get topCenter(): XPoint {
        return PPoint.fromPoint(this.el.topCenter);
    }

    set topCenter(value: XPoint) {
        this.el.topCenter = PPoint.toPoint(value);
    }

    get top(): number {
        return this.el.top;
    }

    set top(value: number) {
        this.el.top = value;
    }

    get size(): XSize {
        return PSize.fromSize(this.el.size);
    }

    set size(value: XSize) {
        this.el.size = PSize.toSize(value);
    }

    get rightCenter(): XPoint {
        return PPoint.fromPoint(this.el.rightCenter);
    }

    set rightCenter(value: XPoint) {
        this.el.rightCenter = PPoint.toPoint(value);
    }

    get right(): number {
        return this.el.right;
    }

    set right(value: number) {
        this.el.right = value;
    }

    get point(): XPoint {
        return PPoint.fromPoint(this.el.point);
    }

    set point(value: XPoint) {
        this.el.point = PPoint.toPoint(value);
    }

    get leftCenter(): XPoint {
        return PPoint.fromPoint(this.el.leftCenter);
    }

    set leftCenter(value: XPoint) {
        this.el.leftCenter = PPoint.toPoint(value);
    }

    get left(): number {
        return this.el.left;
    }

    set left(value: number) {
        this.el.left = value;
    }

    get height(): number {
        return this.el.height;
    }

    set height(value: number) {
        this.el.height = value;
    }

    get center(): XPoint {
        return PPoint.fromPoint(this.el.center);
    }

    set center(value: XPoint) {
        this.el.center = PPoint.toPoint(value);
    }

    get bottomRight(): XPoint {
        return PPoint.fromPoint(this.el.bottomRight);
    }

    set bottomRight(value: XPoint) {
        this.el.bottomRight = PPoint.toPoint(value);
    }

    get bottomLeft(): XPoint {
        return PPoint.fromPoint(this.el.bottomLeft);
    }

    set bottomLeft(value: XPoint) {
        this.el.bottomLeft = PPoint.toPoint(value)
    }

    get bottomCenter(): XPoint {
        return PPoint.fromPoint(this.el.bottomCenter);
    }

    set bottomCenter(value: XPoint) {
        this.el.bottomCenter = PPoint.toPoint(value)
    }

    get bottom(): number {
        return this.el.bottom;
    }

    set bottom(value: number) {
        this.el.bottom = value;
    }


    contains(point: XPoint): boolean;
    contains(rect: XBound): boolean;
    contains(point: XPoint | XBound): boolean {
        if ('width' in point) {
            return this.el.contains(PBound.toBound(point))
        } else {
            return this.el.contains(PPoint.toPoint(point));
        }
    }

    expand(amount: number | XSize | XPoint): XBound;
    expand(hor: number, ver: number): XBound;
    expand(amount: number | XSize | XPoint, ver?: number): XBound {
        if (typeof amount === 'number') {
            return new PBound(this.el.expand(amount, ver));
        } else if ('width' in amount) {
            return new PBound(this.el.expand(PSize.toSize(amount)));
        } else {
            return new PBound(this.el.expand(PPoint.toPoint(amount)));
        }
    }

    intersect(rect: XBound): XBound {
        return PBound.fromBound(this.el.intersect(PBound.toBound(rect)));
    }

    intersects(rect: XBound, epsilon?: number): boolean {
        return this.el.intersects(PBound.toBound(rect), epsilon);
    }

    scale(amount: number): XBound;
    scale(hor: number, ver: number): XBound;
    scale(amount: number, ver?: number): XBound {
        return PBound.fromBound(this.el.scale(amount, ver));
    }

    unite(rect: XBound): XBound {
        return PBound.fromBound(this.el.unite(PBound.toBound(rect)));
    }

}

class PPoint implements XPoint {
    private el: paper.Point;

    constructor(x: number, y: number) {
        this.el = new Point(x, y);
    }

    toArray(): number[] {
        return [this.x, this.y];
    }

    get x(): number {
        return this.el.x;
    }

    set x(value: number) {
        this.el.x = value;
    }

    get y(): number {
        return this.el.y;
    }

    set y(value: number) {
        this.el.y = value;
    }

    get length(): number {
        return this.el.length;
    }

    set length(value: number) {
        this.el.length = value;
    }

    min(other: this): XPoint {
        return PPoint.fromPoint(Point.min(this.el, other.el));
    }

    max(other: this): XPoint {
        return PPoint.fromPoint(Point.max(this.el, other.el));
    }

    getAngle(point: this): number {
        return this.el.getAngle(point.el);
    }

    getDistance(point: this, squared?: boolean): number {
        return this.el.getDistance(point.el, squared)
    }

    normalize(length?: number): XPoint {
        return PPoint.fromPoint(this.el.normalize(length));
    }

    rotate(angle: number, center: this): XPoint {
        return PPoint.fromPoint(this.el.rotate(angle, center.el));
    }

    add(number: number): XPoint;
    add(point: this): XPoint;
    add(point: number | this): XPoint {
        if (typeof point === 'number') {
            return PPoint.fromPoint(this.el.add(point));
        } else {
            return PPoint.fromPoint(this.el.add(point.el));
        }
    }

    subtract(number: number): XPoint;
    subtract(point: this): XPoint;
    subtract(point: number | this): XPoint {
        if (typeof point === 'number') {
            return PPoint.fromPoint(this.el.subtract(point));
        } else {
            return PPoint.fromPoint(this.el.subtract(point.el));
        }
    }

    multiply(number: number): XPoint;
    multiply(point: this): XPoint;
    multiply(point: number | this): XPoint {
        if (typeof point === 'number') {
            return PPoint.fromPoint(this.el.multiply(point));
        } else {
            return PPoint.fromPoint(this.el.multiply(point.el));
        }

    }

    divide(number: number): XPoint;
    divide(point: this): XPoint;
    divide(point: number | this): XPoint {
        if (typeof point === 'number') {
            return PPoint.fromPoint(this.el.divide(point));
        } else {
            return PPoint.fromPoint(this.el.divide(point.el));
        }

    }

    modulo(number: number): XPoint;
    modulo(point: this): XPoint;
    modulo(point: number | this): XPoint {
        if (typeof point === 'number') {
            return PPoint.fromPoint(this.el.modulo(point));
        } else {
            return PPoint.fromPoint(this.el.modulo(point.el));
        }

    }

    ceil(): XPoint {
        return PPoint.fromPoint(this.el.ceil());
    }

    round(): XPoint {
        return PPoint.fromPoint(this.el.round());
    }

    floor(): XPoint {
        return PPoint.fromPoint(this.el.floor());
    }

    abs(): XPoint {
        return PPoint.fromPoint(this.el.abs());
    }

    clone(): XPoint {
        return new PPoint(this.x, this.y);
    }

    static fromPoint(p: paper.Point): PPoint {
        return p && new PPoint(p.x, p.y);
    }

    static toPoint(p: XPoint): paper.Point {
        return p && new Point(p.x, p.y);
    }

    static buildPoint(x: number, y: number): paper.Point {
        return new Point(x, y);
    }
}

class PNode<T extends paper.Item = paper.Item> implements XItem {
    id: XID;
    mainEl: T;
    mainContainer: T
    root: T
    data: object;
    private _isExtended: boolean;

    constructor(mainEl: T, mainContainer?: T) {
        this.mainEl = mainEl;
        this.mainContainer = mainContainer;

        if (mainContainer) {
            mainContainer.addChild(mainEl);
            this.root = mainContainer;
        } else {
            this.root = mainEl;
        }
    }

    get dashArray(): number[] {
        return this.mainEl.dashArray;
    }

    set dashArray(value: number[]) {
        this.mainEl.dashArray = value;
    }

    get bounds(): XBound {
        return PBound.fromBound(this.mainEl.bounds);
    }

    get visible(): boolean {
        return this.mainEl.visible;
    };

    set visible(value: boolean) {
        this.mainEl.visible = value;
    };

    get strokeWidth(): number {
        return this.mainEl.strokeWidth;
    };

    set strokeWidth(value: number) {
        this.mainEl.strokeWidth = value;
    };

    get fillColor(): string {
        return this.mainEl.fillColor.toCSS(true);
    };

    set fillColor(value: string) {
        this.mainEl.fillColor = new Color(value);
    };

    get strokeColor(): string {
        return this.mainEl.strokeColor.toCSS(true);
    };

    set strokeColor(value: string) {
        this.mainEl.strokeColor = new Color(value);
    };

    get isExtended(): boolean {
        return this._isExtended;
    }

    get locked(): boolean {
        return this.mainEl.locked;
    }

    set locked(value: boolean) {
        this.mainEl.locked = value;
    }

    get position(): XPoint {
        return PPoint.fromPoint(this.mainEl.position);
    }

    set position(value: XPoint) {
        this.mainEl.position = PPoint.toPoint(value);
    }

    contains(point: XPoint): boolean {
        return this.mainEl.contains(PPoint.toPoint(point));
    }

    remove(): void {
        this.mainEl.remove();
    }

    clone(): XItem {
        return new PNode(this.mainEl.clone());
    }

    sendToBack(): void {
        this.mainEl.sendToBack();
    }

    sendToFront(): void {
        this.mainEl.bringToFront();
    }

    addChildren(items: this[]): void {
        this.mainEl.addChildren(items.map(x => x.root));
    }

    addChild(item: this): void {
        this.mainEl.addChild(item.root);
    }

    on(name: XEventName, handler: (e: XEvent) => void): Callable {
        const self = this;
        const me: T = this.mainEl;
        const h = (e: paper.MouseEvent) => {
            handler({
                point: PPoint.fromPoint(e.point),
                delta: PPoint.fromPoint(e.delta),
                target: self,
                stop() {
                    e.stop();
                },
                stopPropagation() {
                    e.stopPropagation();
                },
                preventDefault() {
                    e.preventDefault();
                }
            });
        }
        me.on(name, h);
        return () => me.off(name, h);
    }

    rotate(angle: number, center?: XPoint): void {
        this.mainEl.rotate(angle, PPoint.toPoint(center));
    }

    scale(scale: number, center?: XPoint): void;
    scale(hor: number, ver: number, center?: XPoint): void;
    scale(x: number, y?: XPoint | number, z?: XPoint): void {
        if (typeof x === 'number') {
            if (typeof y === 'number') {
                this.mainEl.scale(x, y, PPoint.toPoint(z))
            } else {
                this.mainEl.scale(x, PPoint.toPoint(y));
            }
        }
    }

    moveTo(delta: XPoint): void {
        this.mainEl.translate(PPoint.toPoint(delta));
        this.position = delta;
    }

    moveBy(delta: XPoint): void {
        this.mainEl.translate(PPoint.toPoint(delta));
    }

}

class PRaster extends PNode<paper.Raster> implements XRaster {

    setPixel(x: number, y: number, color: string): void {
        this.mainEl.setPixel(x, y, new Color(color));
    }

}

class PShape extends PNode<paper.Path> implements XShape {
    private commands: PathCommand[];

    addCommand(c: PathCommand): void {
        const me = this;
        (me.commands || (me.commands = [])).push(c);
    }

    begin(): void {
        this.commands = [];
    }

    end(): void {
        const commands = this.commands;
        if (commands) {
            const mainEl = this.mainEl;
            mainEl.removeSegments();
            commands.forEach(x => {
                switch (x[0]) {
                    case "M":
                        mainEl.moveTo(new Point(x[1], x[2]));
                        break;
                    case "m":
                        mainEl.moveBy(new Point(x[1], x[2]));
                        break;
                    case "L":
                        mainEl.lineTo(new Point(x[1], x[2]));
                        break;
                    case "l":
                        mainEl.lineBy(new Point(x[1], x[2]));
                        break;
                    case "Q":
                        mainEl.quadraticCurveTo(new Point(x[1], x[2]), new Point(x[3], x[4]));
                        break;
                    case "q":
                        mainEl.quadraticCurveBy(new Point(x[1], x[2]), new Point(x[3], x[4]));
                        break;
                    case "C":
                        mainEl.cubicCurveTo(new Point(x[1], x[2]), new Point(x[3], x[4]), new Point(x[5], x[6]));
                        break;
                    case "c":
                        mainEl.cubicCurveBy(new Point(x[1], x[2]), new Point(x[3], x[4]), new Point(x[5], x[6]));
                        break;
                    case "Z":
                        mainEl.closePath();
                        break;
                }
            });
        }
    }

    moveTo(point: XPoint): void {
        this.mainEl.moveTo(PPoint.toPoint(point));
    }

    lineTo(point: XPoint): void {
        this.mainEl.add(PPoint.toPoint(point));
    }

    arcTo(through: XPoint, to: XPoint): void {
        this.mainEl.arcTo(PPoint.toPoint(through), PPoint.toPoint(to));
    }

    curveTo(through: XPoint, to: XPoint): void {
        this.mainEl.curveTo(PPoint.toPoint(through), PPoint.toPoint(to));
    }

    cubicCurveTo(handle1: XPoint, handle2: XPoint, to: XPoint): void {
        this.mainEl.cubicCurveTo(PPoint.toPoint(handle1), PPoint.toPoint(handle2), PPoint.toPoint(to));
    }

    quadraticCurveTo(handle: XPoint, to: XPoint): void {
        this.mainEl.quadraticCurveTo(PPoint.toPoint(handle), PPoint.toPoint(to));
    }

    closePath(): void {
        this.mainEl.closePath();
    }

    getIntersections(other: this): XPoint[] {
        return this.mainEl.getIntersections(other.mainEl).map(x => PPoint.fromPoint(x.point));
    }

    getNearestPoint(point: XPoint): XPoint {
        return PPoint.fromPoint(this.mainEl.getNearestPoint(PPoint.toPoint(point)));
    }

    addExtension(item: XItem) {
    }

    command(name: string, ...data) {
    }

    clear(): void {
        this.mainEl.removeSegments();
    }
}

class PText extends PNode<paper.PointText> implements XText {

    get content(): string {
        return this.mainEl.content;
    }

    set content(value: string) {
        this.mainEl.content = value;
    }

    get fontFamily(): string {
        return this.mainEl.fontFamily;
    }

    set fontFamily(value: string) {
        this.mainEl.fontFamily = value;
    }

    get fontSize(): number | string {
        return this.mainEl.fontSize;
    }

    set fontSize(value: number | string) {
        this.mainEl.fontSize = value;
    }

    get fontWeight(): string | number {
        return this.mainEl.fontWeight;
    }

    set fontWeight(value: string | number) {
        this.mainEl.fontWeight = value;
    }

    get justification(): string {
        return this.mainEl.justification;
    }

    set justification(value: string) {
        this.mainEl.justification = value;
    }

    get leading(): number | string {
        return this.mainEl.leading;
    }

    set leading(value: number | string) {
        this.mainEl.leading = value;
    }

    get position(): XPoint {
        return PPoint.fromPoint(this.mainEl.point);
    }

    set position(value: XPoint) {
        this.mainEl.point = PPoint.toPoint(value);
    }
}

class PCompound extends PNode implements XNode {
    private collapsibleDef: XInteractiveDef;
    private extensions: paper.Group;

    constructor(def: XInteractiveDef) {
        // el, extension
        super(new Group(), new Group());
        const base: XItem = this;
        const extensions = new Group();
        this.collapsibleDef = {
            items: [],
            getIntersections(item: XShape): XPoint[] {
                return [];
            },
            command(n, ...data) {
            },
            ...def
        };

        this.mainContainer.addChild(extensions);
        this.extensions = extensions;
        extensions.sendToBack();
        (<XItem>base).addChildren(this.collapsibleDef.items);
    }

    addExtension(item: this) {
        this.extensions.addChild(item.mainEl);
    }

    command(name: string, ...data) {
        this.collapsibleDef.command(name, ...data);
    }

    getIntersections(item: this): XPoint[] {
        const x: XNode = item;
        return this.collapsibleDef.getIntersections(x);
    }
}

class PaperBuilder implements XBuilder {
    private project: paper.Project;
    private paperScope: paper.PaperScope;

    constructor(canvas: HTMLCanvasElement) {
        const paperScope: paper.PaperScope = new PaperScope();
        paperScope.activate();
        paperScope.setup(canvas);
        this.paperScope = paperScope;
        this.project = paperScope.project;
    }

    addItems(...children: XItem[]): void {
    }

    makeInteractive(def: XInteractiveDef): XNode {
        return new PCompound(def);
    }

    fromSVG(svg: SVGElement | string, options?: any): XItem {
        return new PNode(this.project.importSVG(svg, options));
    }

    makeBound(from: XPoint, to: XPoint): XBound;
    makeBound(x: number, y: number, width: number, height: number): XBound;
    makeBound(x: XPoint | number, y: XPoint | number, width?: number, height?: number): XBound {
        if (typeof x === 'number') {
            if (typeof y === 'number') {
                return PBound.fromBound(new Rectangle(x, y, width, height));
            } else {
                return null;
            }
        } else {
            if (typeof y === 'number') {
                return null;
            } else {
                return PBound.fromBound(new Rectangle(PPoint.toPoint(x), PPoint.toPoint(y)));
            }
        }
    }


    makeCircle(point: XPoint, radius: number): XNode {
        return new PShape(new Path.Circle(PPoint.toPoint(point), radius));
    }

    makeGroup(): XItem;
    makeGroup(children: XItem[]): XItem;
    makeGroup(children?: XItem[]): XItem {
        const pGroup: XItem = new PNode(new Group());
        children && pGroup.addChildren(children);
        return pGroup;
    }

    makeLine(from: XPoint, to: XPoint): XNode {
        return new PShape(new Path.Line(PPoint.toPoint(from), PPoint.toPoint(to)));
    }

    makePath(): XShape {
        return new PShape(new Path());
    }

    makePoint(x: number, y: number): XPoint {
        return new PPoint(x, y);
    }

    makeRaster(size: XSize, position?: XPoint): XRaster {
        return new PRaster(new Raster(PSize.toSize(size), PPoint.toPoint(position)));
    }

    makeRect(point: XPoint, size: XSize): XNode;
    makeRect(bound: XBound, radius?: number): XNode;
    makeRect(x: XPoint | XBound, y?: XSize | number): XNode {
        if ('width' in x) {
            // x = XBound
            if (y && typeof y === 'number') {
                return new PShape(new Path.Rectangle(PBound.toBound(x), new Size(y, y)));
            } else {
                return new PShape(new Path.Rectangle(PBound.toBound(x)));
            }
        } else if (typeof y !== 'number') {
            return new PShape(new Path.Rectangle(PPoint.toPoint(x), PSize.toSize(y)));
        } else {
            return null;
        }
    }

    makeSize(width: number, height: number): XSize {
        return new PSize(width, height);
    }

    makeText(point: XPoint, content?: string): XText {
        const pointText = new PointText(PPoint.toPoint(point));
        pointText.content = content;
        return new PText(pointText);
    }

    viewCenter(): XPoint {
        return PPoint.fromPoint(this.project.view.center);
    }

    viewSize(): XSize {
        return PSize.fromSize(this.project.view.viewSize);
    }

    destroy(): void {
        this.project.clear();
        this.project.remove();
    }
}

export default function PaperRenderer(element: HTMLElement): XBuilder {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    element.appendChild(canvas)
    return new PaperBuilder(canvas);
}