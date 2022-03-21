import {isDefined, Timer} from "../shared/XLib";
import {HookActionEnum} from "../shared/Instructions";
import {definePlugin} from "../shared/XHelper";


const X_ON_DATA_CHANGE_EVENT = 'x-on-data-change';


export default function XDataChangePlugin() {
    return definePlugin({
        name: 'x-datachange-plugin',
        plugin(context, hook) {
            const actionListener = hook.listener.action;
            const actionDispatcher = hook.dispatcher.action;

            const timer = new Timer(300);

            const handler = () => {
                if (hook.hasListeners(X_ON_DATA_CHANGE_EVENT)) {
                    timer.clear();
                    timer.handle(prepareData);
                }
            };

            actionListener(HookActionEnum.ELEMENT_DELETED, handler);
            actionListener(HookActionEnum.ELEMENT_INSTALLED, handler);
            actionListener(HookActionEnum.ELEMENT_END_DRAG, handler);

            function prepareData() {
                const data = context.getElements().filter(x=>isDefined(x.data)).map(x => x.data).toArray()
                actionDispatcher(X_ON_DATA_CHANGE_EVENT, data);
            }
        }
    });
};