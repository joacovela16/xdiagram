import {doHover, Timer} from "../shared/XLib";
import type {Callable, HookAction, HookManager, XContext, XPluginDef} from "../shared/XTypes";
import {definePlugin} from "../shared/XHelper";
import type {XEvent, XNode} from "../shared/XRender";
import {Command, HookActionEnum} from "../shared/Instructions";
import {LinkedList} from "../shared/XList";

const MAKE_INTERACTIVE: string = 'x-make-interactive';
const MAKE_CLICKABLE: string = 'x-make-clickable';

const XInteractivePlugin: XPluginDef = definePlugin({
    name: 'x-interactive-plugin',
    plugin(context: XContext, hook: HookManager): void {

        const actionDispatcher = hook.dispatcher.action;
        const actionListener: (name: HookAction, f: Function) => Callable = hook.listener.action;
        const canvasStyle = context.element.style;

        actionListener(MAKE_CLICKABLE, (node: XNode, base: XNode) => {
            node.on('click', () => {
                actionDispatcher(HookActionEnum.ELEMENT_SELECTED, base);
            })
        });

        actionListener(MAKE_INTERACTIVE, (node: XNode, base: XNode) => {

            const timer: Timer = new Timer(100);

            let isDragging: boolean = false;

            const listeners = new LinkedList<Callable>()

            doHover(
                node,
                (e) => {
                    e.stop();
                    !isDragging && actionDispatcher(HookActionEnum.ELEMENT_MOUSE_IN, base);
                    canvasStyle.cursor = 'pointer';
                },
                (e) => {
                    e.stop();
                    !isDragging && actionDispatcher(HookActionEnum.ELEMENT_MOUSE_OUT, base);
                    canvasStyle.cursor = 'default';
                }
            );

            node.on('mousedown', () => {
                doListeners();
                timer.handle(() => {
                    isDragging = true;
                    actionDispatcher(HookActionEnum.ELEMENT_START_DRAG, base);

                });
            });

            node.on('click', (e) => {
                timer.clear();
                cleanListeners();
                if (isDragging) {
                    isDragging = false;
                    actionDispatcher(HookActionEnum.ELEMENT_END_DRAG, base);
                    (base.data || (base.data = {})).position = {x: e.point.x, y: e.point.y};
                    actionDispatcher(HookActionEnum.DATA_UPDATE);
                } else {
                    actionDispatcher(HookActionEnum.ELEMENT_SELECTED, base)
                }
            });


            function doListeners() {
                listeners.push(
                    node.on('mousedrag', (event: XEvent): void => {
                        base.command(Command.elementDrag, event.point)
                    })
                );
            }

            function cleanListeners() {
                listeners.forEach(x => x());
                listeners.clean();
            }
        });
    }
});

export default XInteractivePlugin;