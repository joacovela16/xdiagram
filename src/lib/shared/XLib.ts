import {LinkedList} from "./XList";
import type {Callable, Handler, HookAction, HookDispatcher, HookFilter, HookListener, HookManager, HookManagerProxy, XContext, XIconTool} from "./XTypes";
import {XElementDef, XPluginDef, XTheme} from "./XTypes";
import type {XEvent, XItem, XNode, XPoint} from "./XRender";
import {PathHelper} from "./XRender";
import {Command, HookActionEnum, HookFilterEnum} from "./Instructions";
import {definePlugin} from "./XHelper";

export class Timer {
    private duration: number;
    private timeout;

    constructor(duration: number) {
        this.duration = duration;
    }

    handle(handler: () => void): void {
        const me = this;
        me.clear();
        me.timeout = setTimeout(handler, me.duration);
    }

    clear(): void {
        const me = this;
        me.timeout && clearTimeout(me.timeout);
    }
}

export function getOrElse<T>(obj: T, other: T): T {
    return isUndefined(obj) ? other : obj;
}

export function isUndefined<T>(obj: T) {
    return obj === undefined || obj === null;
}

export function isDefined<T>(obj: T): boolean {
    return !isUndefined(obj);
}

export function asMap<K, V>(xs: V[], key: (v: V) => K): Map<K, V> {
    const result: Map<K, V> = new Map<K, V>();
    xs.forEach(x => result.set(key(x), x));
    return result;
}

export function setHoverBehavior(dispatcher: XItem, onMouseEnter: (x: XEvent) => void, onMouseLeave: (x: XEvent) => void): void {
    dispatcher.on('mouseenter', onMouseEnter)
    dispatcher.on('mouseleave', onMouseLeave)
}

export function idGen() {
    return Math.floor(Date.now() * Math.random());
}

export function doSnap(p: XPoint, snap: number = 1) {
    return p.divide(snap).round().multiply(snap);
}

export function doNumberSnap(n: number, snap: number = 10) {
    return Math.round(n / snap) * snap;
}

export function cutSegment(end: XPoint, start: XPoint, length: number): XPoint {
    return length === 0 ? start : start.add(end.subtract(start).normalize(length));
}

export function doArray<T>(size: number, defaultValue?: T): T[] {
    const result: T[] = [];
    for (let i = 0; i < size; i++) {
        result.push(defaultValue);
    }
    return result;
}

export function doHookProxy(source: HookManager): HookManagerProxy {
    const register: LinkedList<Callable> = new LinkedList<Callable>();

    return {
        dispatcher: source.dispatcher,
        listener: {
            action(name: HookAction, f: Function): Callable {
                const c = source.listener.action(name, f);
                register.push(c);
                return c;
            },
            filter(name: HookFilter, f: Function): Callable {
                const c = source.listener.filter(name, f);
                register.push(c)
                return c;
            }
        },
        clean(): void {
            register.forEach(x => x());
            console.log(`Cleaned ${register.length} listeners`);
            register.clean();
        },
        hasListeners: source.hasListeners

    }
}

export function doHookBuilder(): HookManager {
    const action: { [index: string]: LinkedList<Function> } = {};
    const filter: { [index: string]: LinkedList<Function> } = {};

    const listener: HookListener = {

        action(name: string, f: Function): Callable {
            const record = (action[name] || (action[name] = new LinkedList())).append(f);
            return () => record.remove();
        },

        filter(name: string, f: Function): Callable {
            const record = (filter[name] || (filter[name] = new LinkedList())).append(f);
            return () => record.remove();
        }
    };

    const dispatcher: HookDispatcher = {
        action(name: string, ...args: any[]): void {
            (action[name] || (action[name] = new LinkedList())).forEach(x => x.apply(undefined, args))
        },
        filter<T>(name: string, data: T, ...args: any[]): T {
            const element = filter[name];
            if (element) {
                return element.reduce((prev, cur) => {
                    const datum: T = cur.apply(undefined, [prev, ...args]);
                    return isUndefined(datum) ? prev : datum;
                }, data);
            } else {
                return data;
            }
        }
    };

    return {
        listener,
        dispatcher,
        hasListeners(name: string): boolean {
            const r = (action[name] || filter[name]);
            return r && r.length > 0;
        }
    };
}

export function doIconHovering(iconItem: XItem, context: XContext, hoverColor?: string): XItem {
    const position = context.builder.makePoint(0, 0)
    const builder = context.builder;
    const theme = context.theme;
    const style: CSSStyleDeclaration = context.element.style;

    iconItem.center = position;
    iconItem.strokeColor = theme.neutral;

    const circle = builder.makeCircle();
    const group = builder.makeGroup([circle, iconItem]);

    circle.center = position;
    circle.radius = 15;
    circle.fillColor = theme.primaryContent;
    circle.strokeColor = theme.neutral;
    circle.strokeWidth = 2;


    setHoverBehavior(group,
        () => {
            circle.fillColor = hoverColor || theme.primaryFocus;
            iconItem.strokeColor = theme.primaryContent;
            style.cursor = 'pointer';
        }, () => {
            circle.fillColor = theme.primaryContent;
            iconItem.strokeColor = theme.neutral;
            style.cursor = 'default';
        });
    return group;
}

export function doLinkZone(bind: XItem, hookManager: HookManager, ref?: XItem): void {
    const actionDispatcher = hookManager.dispatcher.action;
    doHover(
        bind,
        () => actionDispatcher(HookActionEnum.LINK_ZONE_IN, ref || bind),
        () => actionDispatcher(HookActionEnum.LINK_ZONE_OUT, ref || bind)
    );
}

export function doDraggable(
    bind: XItem,
    ctx: XContext,
    target?: XItem,
    onDragStart?: Handler,
    onDrag?: Handler,
    onDragEnd?: Handler,
    onClick?: Handler,
    timeout?: number
): Callable {
    const timer: Timer = new Timer(timeout || 100);
    const builder = ctx.builder;
    const events = new LinkedList<Callable>();
    let isDragging:boolean = false;
    const onDragHandler = onDrag || ((_e) => {
    });

    function cleanAll() {
        events.forEach(x => x());
        events.clean();
    }

    function dragEnd(e: XEvent) {
        onDragEnd && onDragEnd(e)
        cleanAll();
        isDragging=false;
    }

    const mousedownClean = bind.on('mousedown', e => {
        timer.handle(() => {
            isDragging=true;
            onDragStart && onDragStart(e);
            events.append(builder.on('mousemove', e => onDragHandler(e)));

            events.append(builder.on('mouseup', e => dragEnd(e)));
            events.append(builder.on('mouseleave', e => dragEnd(e)));
        });
    });

    const clickClean = bind.on('click', (e) => {
        timer.clear();
       !isDragging && onClick && onClick(e);
    })

    return () => {
        mousedownClean();
        clickClean();
        cleanAll();
    };

}

export function doHover(bind: XItem, inner: Handler, outer: Handler) {
    bind.on("mouseenter", e => inner(e));
    bind.on('mouseleave', e => outer(e));
}

export function doPointer(bind: XItem, context: XContext): void {
    const style = context.element.style;
    doHover(bind, () => {
        style.cursor = 'pointer'
    }, () => {

        style.cursor = 'default'
    })
}

export function doReceptor(handlers: { [index in (Command | string)]?: Function }): (n: string, ...arg: any) => void {
    return (name: string, ...args: any) => {
        const h = handlers[name];

        return h && h(...args);
    }
}

export function doLinker(
    source: XItem,
    trigger: XItem,
    startFrom: XItem,
    context: XContext,
    hookManager: HookManager,
    solver: string = 'x-arrow'
): Callable {
    const b = context.builder;
    const theme = context.theme;
    const actionListener = hookManager.listener.action;
    const actionDispatcher = hookManager.dispatcher.action;
    const filterDispatcher = hookManager.dispatcher.filter;
    const listeners: LinkedList<Callable> = new LinkedList<Callable>();
    const onDestroy: LinkedList<Callable> = new LinkedList<Callable>();
    const line = b.makePath();

    let isDragging: boolean = false;
    const timer = new Timer(300);
    let isValid: boolean;
    let targetNode: XNode;

    line.visible = false;
    line.strokeWidth = 2;
    line.strokeColor = theme.primary;
    line.dashArray = [4, 4];
    context.getLayer('back').addChild(line);

    onDestroy.push(
        trigger.on('mousedown', () => {
            timer.clear();
            timer.handle(() => {
                isDragging = true;
                doListeners();
            });
        })
    );

    onDestroy.push(
        trigger.on('mouseup', () => {
            timer.clear();
            isDragging = false;
            line.visible = false;
            targetNode && targetNode.command(Command.onElementNormal);

            if (isValid && targetNode) {
                const srcID = source.id;
                const trgID = targetNode.id;
                const localCfg: XElementDef = {solver, src: srcID, trg: trgID};
                actionDispatcher(HookActionEnum.ELEMENT_ADD, localCfg);
            }
            targetNode = null;
            isValid = false;
            cleanListeners();
        })
    );

    onDestroy.push(
        trigger
            .on('mousedrag', event => {

                if (!isDragging) return;

                line.begin();
                line.addCommand(PathHelper.moveTo(startFrom.position));
                line.addCommand(PathHelper.lineTo(event.point));
                line.end();
            })
    );

    function cleanListeners() {
        listeners.forEach(x => x());
        listeners.clean();
    }

    function doListeners() {

        line.visible = true;
        listeners
            .push(
                actionListener(HookActionEnum.LINK_ZONE_IN, (node: XNode) => {

                    if (isDragging && source.id !== node.id) {
                        targetNode = node;
                        isValid = filterDispatcher(HookFilterEnum.ELEMENTS_CAN_LINK, true, source, node);
                        if (isValid) {
                            node.command(Command.onElementLinkIn);
                            line.strokeColor = theme.accent;
                        } else {
                            node.command(Command.onElementError);
                            line.strokeColor = theme.error;
                        }
                    }
                })
            );

        listeners
            .push(
                actionListener(HookActionEnum.LINK_ZONE_OUT, (node: XNode) => {
                    console.log(node)
                    node.command(Command.onElementLinkOut);
                    line.strokeColor = theme.primary;
                    targetNode = null;
                    console.log('out')
                })
            );
    }

    return () => {
        line.remove();
        onDestroy.forEach(x => x());
        onDestroy.clean();
        cleanListeners();
    }
}

export function doIconTool(name: string, handler: (context: XContext, hook: HookManager) => XIconTool): XPluginDef {
    return definePlugin({
        name,
        plugin: (context, hook) => {
            let element: XNode;

            const spec = handler(context, hook);
            const b = context.builder;
            const theme: XTheme = context.theme;
            const actionListener = hook.listener.action;
            const filterDispatcher = hook.dispatcher.filter;
            const iconItem = b.fromSVG(spec.icon(theme));

            const icon = doIconHovering(
                iconItem,
                context,
                spec.iconHoverColor && spec.iconHoverColor(theme)
            );
            icon.visible = false;
            spec.onClick && icon.on('click', () => element && spec.onClick(element));
            context.getLayer('front').addChild(icon);

            spec.selectEvents.forEach(e => actionListener(e, showButton));
            spec.unselectEvents.forEach(e => actionListener(e, unselectAll));
            spec.onButtonReady && spec.onButtonReady(icon);

            function showButton(node: XNode): void {
                if (filterDispatcher(`${name}-can-apply`, true, node)) {
                    focus(node);
                    spec.onSelect && spec.onSelect(node, icon);
                } else {
                    unselectAll();
                }
            }

            function unselectAll(): void {
                icon.visible = false;
            }

            function focus(node: XNode): void {
                icon.position = spec.getPosition(node.bounds);
                icon.sendToFront();
                icon.visible = true;
                element = node;
            }
        }
    });
}

export function pointQuadrant(point: XPoint, center: XPoint): "TL" | "TR" | "BL" | "BR" {
    if (point.x >= center.x && point.y <= center.y) {
        return "TR"
    } else if (point.x <= center.x && point.y <= center.y) {
        return "TL"
    } else if (point.x <= center.x && point.y >= center.y) {
        return "BL";
    } else {
        return "BR";
    }
}

export function pointIsUp(point: XPoint, center: XPoint): boolean {
    const quadrant = pointQuadrant(point, center);
    switch (quadrant) {
        case "TL":
        case "TR":
            return true;
        default:
            return false;
    }
}