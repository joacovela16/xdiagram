import type {Callable, XData} from "./XTypes";

export type XId = number;

export type XEventName =
    "mousedown" |
    "mouseup" |
    "mousedrag" |
    "click" |
    "doubleclick" |
    "mousemove" |
    "mouseenter" |
    "mouseleave" |
    "mouseover";

// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
type PathInstruction = 'M' | 'm' | 'L' | 'l' | 'H' | 'h' | 'V' | 'v' | 'C' | 'c' | 'S' | 's' | 'Q' | 'q' | 'T' | 't' | 'A' | 'Z';
export type PathCommand =
    [PathInstruction, number, number] |
    [PathInstruction, number] |
    [PathInstruction, number, number, number, number, number, number] |
    [PathInstruction, number, number, number, number] |
    [PathInstruction, number, number, number, number, number, number, number] |
    [PathInstruction];


export class PathHelper {
    static singleNumber(c: PathInstruction, point: number): PathCommand {
        return [c, point];
    }

    static singlePoint(c: PathInstruction, point: XPoint): PathCommand {
        return [c, point.x, point.y];
    }

    static twoPoint(c: PathInstruction, point1: XPoint, point2: XPoint): PathCommand {
        return [c, point1.x, point1.y, point2.x, point2.y];
    }

    static threePoint(c: PathInstruction, point1: XPoint, point2: XPoint, point3: XPoint): PathCommand {
        return [c, point1.x, point1.y, point2.x, point2.y, point3.x, point3.y];
    }

    static moveHor(point: number): PathCommand {
        return this.singleNumber('H', point)
    }

    static moveHorBy(point: number): PathCommand {
        return this.singleNumber('h', point)
    }

    static moveVer(point: number): PathCommand {
        return this.singleNumber('V', point)
    }

    static moveVerBy(point: number): PathCommand {
        return this.singleNumber('v', point)
    }

    static moveTo(point: XPoint): PathCommand {
        return this.singlePoint('M', point)
    }

    static moveBy(point: XPoint): PathCommand {
        return this.singlePoint('m', point)
    }

    static lineTo(point: XPoint): PathCommand {
        return this.singlePoint('L', point)
    }

    static lineBy(point: XPoint): PathCommand {
        return this.singlePoint('l', point)
    }

    static cubicTo(point1: XPoint, point2: XPoint, point3: XPoint): PathCommand {
        return this.threePoint('C', point1, point2, point3);
    }

    static cubicBy(point1: XPoint, point2: XPoint, point3: XPoint): PathCommand {
        return this.threePoint('c', point1, point2, point3);
    }

    static cubicReflexTo(point1: XPoint, point2: XPoint): PathCommand {
        return this.twoPoint('S', point1, point2);
    }

    static cubicReflexBy(point1: XPoint, point2: XPoint): PathCommand {
        return this.twoPoint('s', point1, point2);
    }

    static quadraticTo(point1: XPoint, point2: XPoint): PathCommand {
        return this.twoPoint('Q', point1, point2);
    }

    static quadraticBy(point1: XPoint, point2: XPoint): PathCommand {
        return this.twoPoint('q', point1, point2);
    }

    static quadraticReflexTo(point1: XPoint): PathCommand {
        return this.singlePoint('T', point1);
    }

    static quadraticReflexBy(point1: XPoint): PathCommand {
        return this.singlePoint('t', point1);
    }

    static arc(point1: XPoint, point2: XPoint, point3: XPoint, r: number): PathCommand {
        return ['A', point1.x, point1.y, point2.x, point2.y, point3.x, point3.y, r];
    }

    static close():PathCommand {
        return ['Z'];
    }
}

export type XEvent = {
    point: XPoint;
    delta: XPoint;
    target: XItem;
    stopPropagation(): void
    preventDefault(): void
    stop(): void
}

export interface XCompoundDef {
    items: XItem[];
    getIntersections?: (item: XNode) => XPoint[];
    command?: (c: string, ...data: any) => void
}

export interface XPoint {
    x: number;
    y: number;
    length: number;

    min(other: this): XPoint;

    max(other: this): XPoint;

    getAngle(point: this): number;

    getDistance(point: this, squared?: boolean): number

    normalize(length?: number): XPoint;

    rotate(angle: number, center: this): XPoint;

    add(number: number): XPoint;

    add(point: this): XPoint;

    subtract(number: number): XPoint;

    subtract(point: this): XPoint;

    multiply(number: number): XPoint;

    multiply(point: this): XPoint;

    divide(number: number): XPoint;

    divide(point: this): XPoint;

    modulo(number: number): XPoint;

    modulo(point: this): XPoint;

    ceil(): XPoint;

    round(): XPoint;

    floor(): XPoint;

    abs(): XPoint;

    clone(): XPoint;

    toArray(): number[];
}

export interface XSize {
    width: number;
    height: number;

    add(number: number): XSize

    add(size: XSize): XSize

    subtract(number: number): XSize

    subtract(size: XSize): XSize

    multiply(number: number): XSize

    multiply(size: XSize): XSize

    divide(number: number): XSize

    divide(size: XSize): XSize

    modulo(value: number): XSize

    modulo(size: XSize): XSize

    isZero(): boolean

    isNaN(): boolean

    round(): XSize

    ceil(): XSize

    floor(): XSize

    abs(): XSize
}

export interface XBound {
    x: number
    y: number
    width: number
    height: number
    point: XPoint
    size: XSize
    left: number
    top: number
    right: number
    bottom: number
    center: XPoint;
    topLeft: XPoint;
    topRight: XPoint;
    bottomLeft: XPoint;
    bottomRight: XPoint;
    leftCenter: XPoint;
    topCenter: XPoint;
    rightCenter: XPoint;
    bottomCenter: XPoint;

    contains(point: XPoint): boolean

    contains(rect: XBound): boolean

    intersects(rect: XBound, epsilon?: number): boolean

    intersect(rect: XBound): XBound

    expand(amount: number | XSize | XPoint): XBound;

    expand(hor: number, ver: number): XBound;

    scale(amount: number): XBound;

    scale(hor: number, ver: number): XBound;

    clone(): XBound;
}

export interface XItem {
    id: XId
    visible: boolean;
    locked: boolean;
    strokeWidth: number;
    strokeColor: string;
    fillColor: string;
    bounds: XBound;
    position: XPoint;
    dashArray: number[];
    data: XData;

    sendToBack(): void;

    sendToFront(): void;

    contains(point: XPoint): boolean;

    remove(): void;

    addChildren(items: this[]);

    addChild(items: this);

    on(name: XEventName, handler: (e: XEvent) => void): Callable;

    moveTo(delta: XPoint): void

    moveBy(delta: XPoint): void

    rotate(angle: number, center?: XPoint): void

    scale(scale: number, center?: XPoint): void

    scale(hor: number, ver: number, center?: XPoint): void

    clone(): XItem;
}

export interface XNode extends XItem {
    getIntersections(item: this): XPoint[];
    addExtension(item: this): void
    command(name: string, ...data: any): void
}

export interface XShape extends XNode {
    begin(): void

    addCommand(c: PathCommand): void

    end(): void

    clear(): void
}

export interface XRaster extends XItem {
    setPixel(x: number, y: number, color: string): void;

    setPixel(x: number, y: number, color: string): void;
}

export interface XText extends XItem {
    point: XPoint;
    content: string
    fontFamily: string;
    fontWeight: string | number;
    fontSize: number | string;
    leading: number | string;
    justification: string;
}

export type XBuilderFactory = (el: HTMLElement) => XBuilder;

export interface XBuilder {
    makeCompound(compose?: XCompoundDef): XNode

    makePoint(x: number, y: number): XPoint;

    makeSize(width: number, height: number): XSize;

    makeBound(from: XPoint, to: XPoint): XBound;

    makeBound(x: number, y: number, width: number, height: number): XBound;

    makeGroup(): XItem;

    makeGroup(children: XItem[]): XItem;

    makeRect(point: XPoint, size: XSize): XNode;

    makeRect(bound: XBound, radius?: number): XNode;

    makeCircle(point: XPoint, radius: number): XNode;

    makeLine(from: XPoint, to: XPoint): XNode;

    makeText(point: XPoint, content?: string): XText;

    makePath(): XShape;

    makeRaster(size: XSize, position?: XPoint): XRaster;

    fromSVG(svg: SVGElement | string, options?: any): XItem;

    viewSize(): XSize;

    viewCenter(): XPoint;

    destroy(): void
}


