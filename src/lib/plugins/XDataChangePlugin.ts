import {Timer} from "../shared/XLib";
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

            actionListener(HookActionEnum.DATA_UPDATE, () => {
                if (hook.hasListeners(X_ON_DATA_CHANGE_EVENT)) {
                    timer.clear();
                    timer.handle(prepareData);
                }
            });

            function prepareData() {
                const data = context.getElements().map(x => x.data).toArray()
                actionDispatcher(X_ON_DATA_CHANGE_EVENT, data);
            }
        }
    });
};