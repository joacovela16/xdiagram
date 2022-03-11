import {doHover, doSnap, Timer} from "../shared/XLib";
import type {Callable, HookAction, HookManager, XContext, XPluginDef} from "../shared/XTypes";
import {definePlugin} from "../shared/XHelper";
import type {XEvent, XNode} from "../shared/XRender";
import {Command, HookActionEnum} from "../shared/Instructions";
import {LinkedList} from "../shared/XList";

const XInteractionPlugin: XPluginDef = definePlugin({
    name: 'x-interaction',
    plugin(context: XContext, hook: HookManager): void {

        const actionDispatcher = hook.dispatcher.action;
        const actionListener: (name: HookAction, f: Function) => Callable = hook.listener.action;
        const canvasStyle = context.element.style;

        actionListener(HookActionEnum.NODE_INSTALLED, (node: XNode) => {

            context
                .getNode(node.id)
                .foreach(state => {

                    const timer: Timer = new Timer(100);

                    let isDragging: boolean = false;

                    const listeners = new LinkedList<Callable>()

                    doHover(
                        node,
                        (e) => {
                            e.stop();
                            !isDragging && actionDispatcher(HookActionEnum.NODE_MOUSE_IN, node);
                            canvasStyle.cursor = 'pointer';
                        },
                        (e) => {
                            e.stop();
                            !isDragging && actionDispatcher(HookActionEnum.NODE_MOUSE_OUT, node);
                            canvasStyle.cursor = 'default';
                        }
                    );

                    node.on('mousedown', () => {
                        doListeners();
                        timer.handle(() => {
                            isDragging = true;
                            actionDispatcher(HookActionEnum.NODE_DRAG_START, node);

                        });
                    });

                    node.on('click', (e) => {
                        timer.clear();
                        cleanListeners();
                        if (isDragging) {
                            isDragging = false;
                            actionDispatcher(HookActionEnum.NODE_DRAG_END, node);
                            (node.data || (node.data = {})).position = {x: e.point.x, y: e.point.y};
                            actionDispatcher(HookActionEnum.DATA_UPDATE);
                        } else {
                            actionDispatcher(HookActionEnum.NODE_SELECTED, node)
                        }
                    });


                    function doListeners() {
                        listeners.push(
                            node.on('mousedrag', (event: XEvent): void => {
                                node.moveTo(doSnap(event.point));
                                state.in.forEach(x => x.element.command(Command.nodeDrag));
                                state.out.forEach(x => x.element.command(Command.nodeDrag));
                            })
                        );
                    }

                    function cleanListeners() {
                        listeners.forEach(x => x());
                        listeners.clean();
                    }
                });
        });
    }
});

export default XInteractionPlugin;