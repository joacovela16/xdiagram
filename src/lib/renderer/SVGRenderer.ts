import type {PathCommand, XBound, XBuilder, XCircle, XEvent, XEventName, XInteractiveDef, XItem, XLine, XNode, XPoint, XRaster, XRect, XShape, XSize, XText} from "../shared/XRender";
import type {Callable, Handler, XData, XID} from "../shared/XTypes";

import Flatten from '@flatten-js/core'
import {Intersection, Shapes, IntersectionQuery} from "kld-intersections"
import {appendTo, attr, clone, create, createTransform, innerSVG, off, on, transform} from "tiny-svg";
import {LinkedList} from "../shared/XList";
import {isDefined} from "../shared/XLib";

const {Box, Relations, point, line} = Flatten;

function mapEventName(name: XEventName): string {
    if (name === "doubleclick") return "dblclick";
    if (name === "mousedrag") return "mousemove";
    return name;
}

function installEvent(item: XItem, el: Element, name: XEventName, handler: Handler): Callable {
    const eventName = mapEventName(name);
    let lastPoint: XPoint;

    const effectiveHandler = (e: any) => {
        const sPoint = new SPoint(e.clientX, e.clientY);
        lastPoint || (lastPoint = sPoint);
        const delta = new SPoint(e.movementX, e.movementY);
        // lastPoint = sPoint;
        const event: XEvent = {
            point: sPoint,
            delta,
            target: item,
            stop() {
                e.stopPropagation();
                e.preventDefault();
            },
            stopPropagation() {
                e.stopPropagation();
            },
            preventDefault() {
                e.preventDefault();
            }
        };
        handler(event);
    };

    on(el, eventName, effectiveHandler)

    return () => off(el, eventName, effectiveHandler);

}

class SPoint implements XPoint {

    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    toArray(): number[] {
        return [this.x, this.y];
    }

    get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    abs(): XPoint {
        return new SPoint(Math.abs(this.x), Math.abs(this.y));
    }

    add(number: number): XPoint;
    add(point: this): XPoint;
    add(number: number | this): XPoint {
        const me = this;
        if (typeof number === 'number') {
            return new SPoint(me.x + number, me.y + number)
        }
        return new SPoint(me.x + number.x, me.y + number.y);
    }

    ceil(): XPoint {
        return new SPoint(Math.ceil(this.x), Math.ceil(this.y));
    }

    clone(): XPoint {
        return new SPoint(this.x, this.y);
    }

    divide(number: number): XPoint;
    divide(point: this): XPoint;
    divide(number: number | this): XPoint {
        if (typeof number === 'number') {
            return new SPoint(this.x / number, this.y / number)
        }
        return new SPoint(this.x / number.x, this.y / number.y);
    }

    floor(): XPoint {
        return new SPoint(Math.floor(this.x), Math.floor(this.y));
    }

    getAngle(point: this): number {
        const dot = this.x * point.x + this.y * point.y;
        const l1 = this.length;
        const l2 = point.length;

        return Math.acos(dot / (l1 * l2));
    }

    getDistance(point: this, squared?: boolean): number {
        const x = Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2);
        return squared ? x : Math.sqrt(x);
    }

    max(other: this): XPoint {
        return new SPoint(Math.max(this.x, other.x), Math.max(this.y, other.y));
    }

    min(other: this): XPoint {
        return new SPoint(Math.min(this.x, other.x), Math.min(this.y, other.y));
    }

    modulo(number: number): XPoint;
    modulo(point: this): XPoint;
    modulo(number: number | this): XPoint {
        if (typeof number === 'number') {
            return new SPoint(this.x % number, this.y % number)
        }
        return new SPoint(this.x % number.x, this.y % number.y);
    }

    multiply(number: number): XPoint;
    multiply(point: this): XPoint;
    multiply(number: number | this): XPoint {
        if (typeof number === 'number') {
            return new SPoint(this.x * number, this.y * number)
        }
        return new SPoint(this.x * number.x, this.y * number.y);
    }

    normalize(length?: number): XPoint {
        const mag = Math.sqrt(this.x * this.x + this.y * this.y);
        const p = this.multiply(length || 1);

        return p.divide(mag);
    }

    rotate(angle: number, center: this): XPoint {
        const cx = center.x;
        const cy = center.y;
        const x = this.x;
        const y = this.y;

        var radians = (Math.PI / 180) * angle,
            cos = Math.cos(radians),
            sin = Math.sin(radians),
            nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
            ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
        return new SPoint(nx, ny);
    }

    round(): XPoint {
        return new SPoint(Math.round(this.x), Math.round(this.y));
    }

    subtract(number: number): XPoint;
    subtract(point: this): XPoint;
    subtract(number: number | this): XPoint {
        if (typeof number === 'number') {
            return new SPoint(this.x - number, this.y - number);
        }
        return new SPoint(this.x - number.x, this.y - number.y);

    }
}

class SSize implements XSize {

    width: number;
    height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    abs(): XSize {
        return new SSize(Math.abs(this.width), Math.abs(this.height));
    }

    add(number: number): XSize;
    add(size: XSize): XSize;
    add(number: number | XSize): XSize {
        if (typeof number === 'number') {
            return new SSize(this.width + number, this.height + number);
        }
        return new SSize(this.width + number.width, this.height + number.height);
    }

    ceil(): XSize {
        return new SSize(Math.ceil(this.width), Math.ceil(this.height));
    }

    divide(number: number): XSize;
    divide(size: XSize): XSize;
    divide(number: number | XSize): XSize {
        if (typeof number === 'number') {
            return new SSize(this.width / number, this.height / number);
        }
        return new SSize(this.width / number.width, this.height / number.height);

    }

    floor(): XSize {
        return new SSize(Math.floor(this.width), Math.floor(this.height));
    }

    isNaN(): boolean {
        return Number.isNaN(this.width) || Number.isNaN(this.height);
    }

    isZero(): boolean {
        return this.width === 0 && this.height === 0;
    }

    modulo(value: number): XSize;
    modulo(size: XSize): XSize;
    modulo(number: number | XSize): XSize {
        if (typeof number === 'number') {
            return new SSize(this.width % number, this.height % number);
        }
        return new SSize(this.width % number.width, this.height % number.height);
    }

    multiply(number: number): XSize;
    multiply(size: XSize): XSize;
    multiply(number: number | XSize): XSize {
        if (typeof number === 'number') {
            return new SSize(this.width * number, this.height * number);
        }
        return new SSize(this.width * number.width, this.height * number.height);

    }

    round(): XSize {
        return new SSize(Math.round(this.width), Math.round(this.height));
    }

    subtract(number: number): XSize;
    subtract(size: XSize): XSize;
    subtract(number: number | XSize): XSize {
        if (typeof number === 'number') {
            return new SSize(this.width - number, this.height - number);
        }
        return new SSize(this.width - number.width, this.height - number.height);
    }

}

class SBound implements XBound {
    height: number;
    width: number;
    x: number;
    y: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get bottom(): number {
        return this.y + this.height;
    }

    set bottom(value: number) {
        this.y = value - this.height;
    }

    get bottomCenter(): XPoint {
        return new SPoint(this.x + this.width / 2, this.y + this.height);
    }

    set bottomCenter(value: XPoint) {
        this.x = value.x - this.width / 2;
        this.y = value.y - this.height;
    }

    get bottomLeft(): XPoint {
        return new SPoint(this.x, this.y + this.height);
    }

    set bottomLeft(value: XPoint) {
        this.x = value.x;
        this.y = value.y - this.height;
    }

    get bottomRight(): XPoint {
        return new SPoint(this.x + this.width, this.y + this.height);
    }

    set bottomRight(value: XPoint) {
        // this._bottomRight = value;
        this.x = value.x - this.width;
        this.y = value.y - this.height;
    }

    get center(): XPoint {
        return new SPoint(this.x + (this.width / 2), this.y + (this.height / 2));
    }

    set center(value: XPoint) {
        this.x = value.x - (this.width / 2);
        this.y = value.y - (this.height / 2);
    }

    get left(): number {
        return this.x;
    }

    set left(value: number) {
        this.x = value;
    }

    get leftCenter(): XPoint {
        return new SPoint(this.x, this.y + this.height / 2);
    }

    set leftCenter(value: XPoint) {
        this.x = value.x;
        this.y = value.y - (this.height / 2);
    }

    get point(): XPoint {
        return new SPoint(this.x, this.y);
    }

    set point(value: XPoint) {
        this.x = value.x;
        this.y = value.y;
    }

    get right(): number {
        return this.x + this.width;
    }

    set right(value: number) {
        this.x = value - this.width;
    }

    get rightCenter(): XPoint {
        return new SPoint(this.x + this.width, this.y + (this.height / 2));
    }

    set rightCenter(value: XPoint) {
        this.x = value.x - this.width;
        this.y = value.y - (this.height / 2);
    }

    get size(): XSize {
        return new SSize(this.width, this.height);
    }

    set size(value: XSize) {
        this.width = value.width;
        this.height = value.height;
    }

    get top(): number {
        return this.y;
    }

    set top(value: number) {
        this.y = value;
    }

    get topCenter(): XPoint {
        return new SPoint(this.x + (this.width / 2), this.y);
    }

    set topCenter(value: XPoint) {
        this.x = value.x - this.width;
        this.y = value.y;
    }

    get topLeft(): XPoint {
        return new SPoint(this.x, this.y);
    }

    set topLeft(value: XPoint) {
        this.x = value.x;
        this.y = value.y;
    }

    get topRight(): XPoint {
        return new SPoint(this.x + this.width, this.y);
    }

    set topRight(value: XPoint) {
        this.x = value.x - this.width;
        this.y = value.y;
    }

    clone(): XBound {
        return new SBound(this.x, this.y, this.width, this.height);
    }

    contains(point: XPoint): boolean;
    contains(rect: XBound): boolean;
    contains(p: XPoint | XBound): boolean {
        const bottomRight = this.bottomRight;
        const box = new Box(this.x, this.y, bottomRight.x, bottomRight.y);
        if ('width' in p) {
            const br = p.bottomRight;
            const box2 = new Box(p.x, p.y, br.x, br.y);
            return Relations.inside(box2, box)
        }
        return Relations.inside(box, line(point(p.x, p.y)));
    }

    expand(amount: number | XSize | XPoint): XBound;
    expand(hor: number, ver: number): XBound;
    expand(x: number | XSize | XPoint, y?: number): XBound {
        if (typeof x === 'number') {
            const tmp = y || x;
            return new SBound(this.x - x, this.y - tmp, this.width + x, this.height + tmp)
        } else if ('width' in x) {
            const w = x.width;
            const h = x.height;
            return new SBound(this.x - w, this.y - h, this.width + w, this.height + h);
        } else {
            const p: XPoint = new SPoint(this.x, this.y);
            const s: XPoint = p.min(x);
            const e: XPoint = p.max(x);
            const diff = e.subtract(s);
            return new SBound(s.x, s.y, diff.x, diff.y);
        }
    }

    intersect(rect: XBound): XBound {
        const box1 = SBound.toBox(rect);
        const box0 = SBound.toBox(this);
        const merge = box0.merge(box1);
        // ShapeInfo.rectangle({x: this.x, y: this.y, w: this.width, h: this.height})
        // ShapeInfo.rectangle({x: rect.x, y: rect.y, w: rect.width, h: rect.height})
        return SBound.toBound(merge);
    }

    scale(amount: number): XBound;
    scale(hor: number, ver: number): XBound;
    scale(amount: number, ver?: number): XBound {
        const tmp = ver || amount;
        const xFactor = this.x / amount;
        const yFactor = this.y / tmp;
        return new SBound(this.x * xFactor, this.y * yFactor, this.width * xFactor, this.height * yFactor);
    }

    static toBox(s: XBound) {
        const bottomRight = s.bottomRight;
        return new Box(s.x, s.y, bottomRight.x, bottomRight.y);
    }

    static toBound(merge: Flatten.Box): XBound {
        return new SBound(merge.xmin, merge.ymin, merge.xmax - merge.xmin, merge.ymax - merge.ymin);
    }

}

class SItem<T extends SVGGraphicsElement = SVGGraphicsElement> implements XItem {
    id: XID;
    data: XData;

    protected _dashArray: number[];
    protected _fillColor: string;
    protected _strokeColor: string;
    protected _strokeWidth: number;
    protected _visible: boolean;
    protected _bounds: XBound;
    protected _position: XPoint;
    protected _size: XSize;

    protected mainEl: SVGElement;
    protected localEl: T;
    protected containerEl?: SVGElement;
    private tasks: LinkedList<Callable>;
    private children: LinkedList<SItem>;

    constructor(local: T, container?: SVGElement) {
        this.tasks = new LinkedList<Callable>();
        this.children = new LinkedList<SItem>();
        this.localEl = local;
        this.containerEl = container;
        this.data = new Map<string, any>();
        this._position = new SPoint(0, 0);

        if (container) {
            appendTo(local, container);
            this.mainEl = container;
        } else {
            this.mainEl = local;
        }

        this.fillColor = 'none';
    }

    protected get isLinked(): boolean {
        return this.mainEl.isConnected;
    }

    protected doTask(task: Callable, index?: number): void {
        if (this.isLinked) task();
        else {
            console.debug('adding pending task...');
            if (isDefined(index)) {
                this.tasks.insertAt(index, task);
            } else {
                this.tasks.append(task);
            }
        }
    }

    protected execTasks(): void {
        if (this.isLinked) {
            this.children.forEach(x => x.execTasks());
            this.children.clean();
            this.tasks.forEach(x => x());
            this.tasks.clean();
        }
    }

    protected calculateSize() {
        const box = this.getBox();
        const tmp = new SSize(box.width, box.height);
        this._size = tmp;
        this.bounds.size = tmp;
    }

    get size(): XSize {
        if (this._size)
            return this._size;

        this.calculateSize();
        return this._size;
    }

    set size(value: XSize) {
        const self = this;
        self.doTask(() => {
            self._size = value;
            self.bounds.size = value;
            self.draw();
        }, 0);
    }

    protected draw(): void {
        const p = this._position;
        const svgTransform = createTransform();
        svgTransform.setTranslate(p.x, p.y);
        transform(this.mainEl, svgTransform);
    }

    get position(): XPoint {
        return this._position;
    }

    set position(value: XPoint) {
        this.doTask(() => {
            this._position = value;
            this.updateBound();
            this.draw();
        });
    }

    protected getBox(): DOMRect {
        return this.mainEl.getBoundingClientRect();
    }

    protected updateBound(): void {
        const b = this.bounds;
        b.point = this._position;
    }

    get bounds(): XBound {

        const box = this.getBox();
        const size = this.size;
        const b = new SBound(box.left, box.top, box.width || size.width, box.height || size.height);
        this._bounds = b;

        return b;
    }

    set bounds(value: XBound) {
        this.doTask(() => {
            this._bounds = value;
        });
    }

    get dashArray(): number[] {
        return this._dashArray;
    }

    set dashArray(value: number[]) {
        this.doTask(() => {
            this._dashArray = value;
            attr(this.localEl, 'stroke-dasharray', value.join(','));
        });
    }

    get fillColor(): string {
        return this._fillColor;
    }

    set fillColor(value: string) {
        this.doTask(() => {
            this._fillColor = value;
            attr(this.localEl, 'fill', value || 'none');
        });
    }

    get center(): XPoint {
        return this.bounds.center;
    }

    set center(value: XPoint) {
        this.doTask(() => this.doCenter(value), 1);
    }

    protected doCenter(value: XPoint) {
        const bound = this.bounds;
        bound.point = value;
        bound.center = value;
        this._position = bound.point;
        this.draw();
    }

    get strokeColor(): string {
        return this._strokeColor;
    }

    set strokeColor(value: string) {
        this.doTask(() => {
            this._strokeColor = value;
            attr(this.localEl, "stroke", value);
        });
    }

    get strokeWidth(): number {
        return this._strokeWidth;
    }

    set strokeWidth(value: number) {
        this.doTask(() => {
            this._strokeWidth = value;
            attr(this.localEl, 'stroke-width', value);
        });
    }

    get visible(): boolean {
        return this._visible;
    }

    set visible(value: boolean) {
        this.doTask(() => {
            this._visible = value;
            if (value) {
                attr(this.mainEl, 'visibility', 'initial');
            } else {
                attr(this.mainEl, 'visibility', 'hidden');
            }
        });
    }

    addChild(item: this) {
        this.children.append(item);
        appendTo(item.mainEl, this.localEl);
        item.execTasks();
    }

    addChildren(items: this[]) {
        const mainEl = this.localEl;
        this.children.addAll(items);
        items.forEach(x => {
            appendTo(x.mainEl, mainEl);
            x.execTasks();
        });
    }

    clone(): XItem {

        const container = clone(this.containerEl);
        // container.clear();
        return new SItem(clone(this.localEl), container);
    }

    contains(point: XPoint): boolean {
        return this.bounds.contains(point);
    }

    on(name: XEventName, handler: Handler): Callable {
        return installEvent(this, this.localEl, name, handler);
    }

    remove(): void {
        this.mainEl.remove();
    }

    rotate(angle: number, center?: XPoint): void {
        this.doTask(() => {
            const p = center || this.center;
            const x = p.x;
            const y = p.y;
            const trx = createTransform();
            trx.setTranslate(-x, -y);
            trx.setRotate(angle, 0, 0);
            const svgTransform = transform(this.mainEl);
            transform(this.mainEl, [trx, svgTransform]);
            this.calculateSize();
        })
    }

    scale(scale: number, center?: XPoint): void;
    scale(hor: number, ver: number, center?: XPoint): void;
    scale(x: number, y?: XPoint | number, z?: XPoint): void {
        this.doTask(() => {

            if (typeof x === 'number' && typeof y !== 'number') {
                const p = y || this.center;
                const mv = createTransform();
                mv.setTranslate(-p.x, -p.y);
                mv.setScale(x, x);
                const svgTransform = transform(this.mainEl);
                transform(this.mainEl, [mv, svgTransform]);
                this.calculateSize();
                return;
            }

            if (typeof x === 'number' && y && typeof y === 'number') {
                const cx = z && z.x;
                const cy = z && z.y;
                // this.rootEl.scale(x, y, cx, cy);
                const svgTransform = transform(this.mainEl);
                svgTransform.setScale(cx, cy);
            } else if (typeof x === 'number' && y && typeof y !== 'number') {
                const cx = y && y.x;
                const cy = y && y.y;
                // this.rootEl.scale(x, x, cx, cy);
                const svgTransform = transform(this.mainEl);
                svgTransform.setScale(cx, cy);
            }
            this.calculateSize();
        });
    }

    sendToBack(): void {
        // this.rootEl.back();

    }

    sendToFront(): void {
        // this.rootEl.front();
    }

    moveTo(position: XPoint): void {
        this.position = position;
    }

    moveBy(delta: XPoint): void {
        this._position = this._position.add(delta);
        this.draw();
    }
}

abstract class SNode<T extends SVGGraphicsElement> extends SItem<T> implements XNode {
    private extensions: SVGElement;

    protected constructor(item: T) {
        super(item, create("g"));
        this.extensions = create("g");
        appendTo(this.extensions, this.containerEl);
    }

    addExtension(item: this): void {
        appendTo(item.mainEl, this.extensions)
    }

    command(name: string, ...data: any): void {
    }

    abstract shape(): any

    getIntersections(item: this): XPoint[] {
        const result = Intersection.intersect(this.shape(), item.shape());
        return ((result && result.points) || []).map(p => new SPoint(p.x, p.y));
    }

}

class SCircle extends SNode<SVGCircleElement> implements XCircle {
    private _radius: number;

    constructor() {
        super(create('circle'));
        attr(this.localEl, {cx: 0, cy: 0})
    }

    get radius(): number {
        return this._radius;
    }

    set radius(value: number) {
        this.doTask(() => {
            this._radius = value;
            attr(this.localEl, {'r': value});
            this.draw();
        }, 1);
    }

    shape(): any {
        const position = this.position;
        return Shapes.circle(position.x, position.y, this._radius);
    }
}

class SLine extends SNode<SVGLineElement> implements XLine {
    private from: XPoint;
    private to: XPoint;

    constructor() {
        super(create('line'));
    }

    setExtremes(start?: XPoint, end?: XPoint): void {
        this.doTask(() => {
            const me = this;
            if (start) {
                me.from = start;
            }

            if (end) {
                me.to = end;
            }

            const from = me.from;
            const to = me.to;
            if (from && to) {
                attr(me.localEl, {x1: from.x, y1: from.y, x2: to.x, y2: to.y});
            }
        }, 0);
    }

    shape(): any {
        const from = this.from;
        const to = this.to;
        const x1: number = from.x
        const y1: number = from.y;

        const x2: number = to.x;
        const y2: number = to.y;
        return Shapes.line(x1, y1, x2, y2);
    }
}

class SRect extends SNode<SVGRectElement> implements XRect {
    private _radius: number;

    constructor() {
        super(create('rect'));
    }

    get radius(): number {
        return this._radius;
    }

    set radius(value: number) {
        this.doTask(() => {
            this._radius = value;
            this.calculateSize();
            this.draw();
        });
    }

    protected draw() {
        const r = this.radius;
        r && attr(this.localEl, 'rx', r);

        const xSize = this.size;
        xSize && attr(this.localEl, {width: xSize.width, height: xSize.height});
        super.draw();
    }

    shape(): any {
        const me = this;
        const bounds = me.bounds;
        const topLeft = bounds.topLeft;
        const s = bounds.size;
        return Shapes.rectangle(topLeft.x, topLeft.y, s.width, s.height);
    }
}

class SGroup extends SItem {
    constructor() {
        super(create('g'));
    }
}

class SText extends SItem<SVGTextElement> implements XText {

    constructor() {
        super(create('text'));
        attr(this.mainEl, {style: 'user-select: none'});
    }

    get center(): XPoint {
        return super.center;
    }

    set center(value: XPoint) {
        this.doTask(() => {
            const bound = this.bounds;
            this._position = new SPoint(-bound.width / 2, bound.height * 0.3);
            this.draw();
        }, 1);
    }

    get content(): string {
        return this.localEl.textContent;
    }

    get fontFamily(): string {
        return attr(this.localEl, 'font-family');
    }

    get fontSize(): number | string {
        return attr(this.localEl, 'font-size');
    }

    get fontWeight(): string | number {
        return attr(this.localEl, 'font-weight');
    }

    get justification(): string {
        return attr(this.localEl, 'font-size-adjust');
    }

    get leading(): number | string {
        return attr(this.localEl, 'leading');
    }

    set content(value: string) {
        this.doTask(() => {
            innerSVG(this.localEl, value);
            this.calculateSize();
        }, 0);
    }

    set fontFamily(value: string) {
        this.doTask(() => {
            attr(this.localEl, 'font-family', value);
            this.calculateSize();
        }, 0);
    }

    set fontSize(value: number | string) {
        this.doTask(() => {
            attr(this.localEl, 'font-size', value);
            this.calculateSize();
        }, 0);
    }

    set fontWeight(value: string | number) {
        this.doTask(() => {
            attr(this.localEl, 'font-weight', value);
            this.calculateSize();
        });
    }

    set justification(value: string) {
        this.doTask(() => {
            attr(this.localEl, 'anchor', value);
            this.calculateSize();
        }, 0);
    }

    set leading(value: number | string) {
        this.doTask(() => {
            attr(this.localEl, 'leading', value);
            this.calculateSize();
        }, 0);
    }
}

class SRaster extends SItem<SVGGElement> implements XRaster {
    constructor() {
        super(create('g'));
    }

    setPixel(x: number, y: number, color: string): void {
    }

}

class SShape extends SNode<SVGPathElement> implements XShape {

    private pathCommand: PathCommand[];

    constructor() {
        super(create('path'));
        this.pathCommand = [];
    }

    shape(): any {
        return Shapes.path(this.buildPath());
    }

    addCommand(c: PathCommand): void {
        this.pathCommand.push(c);
    }

    addExtension(item: this): void {
        appendTo(item.mainEl, this.localEl);
    }

    begin(): void {
        this.pathCommand = []
    }

    clear(): void {
        this.pathCommand = []
    }

    command(name: string, ...data: any): void {
    }

    end(): void {
        const str = this.buildPath();
        attr(this.localEl, 'd', str)
    }

    private buildPath(): string {
        return this.pathCommand.map(x => x.join(' ')).join(' ');
    }
}

class SCompound extends SItem<SVGGElement> implements XNode {
    private compound: XInteractiveDef;

    constructor(compound: XInteractiveDef) {
        super(create('g'));
        this.compound = compound;

        const me: XItem = this;
        compound.items && me.addChildren(compound.items);
    }

    command(name: string, ...data: any): void {
        this.compound.command(name, ...data);
    }

    getIntersections(item: this): XPoint[] {
        const node: XNode = item;
        return this.compound.getIntersections(node);
    }
}

class SBuilder implements XBuilder {
    private draw: SVGSVGElement;
    private item: SItem<SVGSVGElement>;

    constructor(el: HTMLElement) {
        this.draw = create('svg');
        attr(this.draw, {width: '100%', height: '100%'});
        this.item = new SItem(this.draw);
        el.append(this.draw);
    }

    board: "svg"

    on(eventName: XEventName, handler: Handler): Callable {
        return installEvent(this.item, this.draw, eventName, handler);
    }

    addItems(...children: XItem[]): void {
        const i: XItem = this.item;
        i.addChildren(children)
    }

    makeInteractive(def: XInteractiveDef): XNode {
        return new SCompound(def);
    }

    destroy(): void {
        this.draw.remove();
    }

    fromSVG(svg: SVGGraphicsElement | string, options?: any): XItem {
        if (typeof svg === 'string') {
            const g = create('g')
            innerSVG(g, svg) as SVGGraphicsElement;
            return new SItem(g);
        }
        return new SItem(svg);
    }

    makeBound(from: XPoint, to: XPoint): XBound;
    makeBound(x: number, y: number, width: number, height: number): XBound;
    makeBound(x: XPoint | number, y: XPoint | number, width?: number, height?: number): XBound {

        if (typeof x === 'number' && typeof y === 'number' && width && height) {
            return new SBound(x, y, width, height);
        } else if (typeof x !== 'number' && typeof y !== 'number') {
            const s = x.min(y);
            const e = x.max(y);
            const diff = e.subtract(s);
            return new SBound(s.x, s.y, diff.x, diff.y);
        }
        return undefined;
    }

    makeCircle(): XCircle {
        return new SCircle();
    }

    makeGroup(): XItem;
    makeGroup(children: XItem[]): XItem;
    makeGroup(children?: XItem[]): XItem {
        const c: XItem[] = children || []
        const sGroup: XItem = new SGroup();
        sGroup.addChildren(c);
        return sGroup;
    }

    makeLine(): XLine {
        return new SLine();
    }

    makePath(): XShape {
        return new SShape();
    }

    makePoint(x: number, y: number): XPoint {
        return new SPoint(x, y);
    }

    makeRaster(): XRaster {
        return new SRaster();
    }

    makeRect(): XRect {
        return new SRect();
    }

    makeSize(width: number, height: number): XSize {
        return new SSize(width, height);
    }

    makeText(): XText {
        const sText = new SText();

        return sText;
    }

    viewCenter(): XPoint {
        const box = this.draw.getBoundingClientRect();
        const bound = new SBound(box.x, box.y, box.width, box.height);
        return bound.center;
    }

    viewSize(): XSize {
        const box = this.draw.getBoundingClientRect()
        return new SSize(box.width, box.height);
    }
}

export default function SVGRenderer(el: HTMLElement): XBuilder {
    return new SBuilder(el);
}
