import type {XPluginDef, XTheme} from "../shared/XTypes";
import {HookActionEnum} from "../shared/Instructions";
import {definePlugin} from "../shared/XHelper";

const XBoardPlugin: XPluginDef = definePlugin({
    name: 'x-board-plugin',
    plugin(context, hook) {

        const b = context.builder;
        const theme: XTheme = context.theme;
        const color = theme.info;
        const backLayer = context.backLayer;
        const viewSize = b.viewSize();
        const raster = b.makeRaster(viewSize);
        const rectangle = b.makeRect(b.makePoint(0, 0), viewSize);
        const dispatcher = hook.dispatcher.action
        raster.position = b.viewCenter();
        rectangle.fillColor = theme.base200;

        for (let i = 0; i < viewSize.width; i += 10) {
            for (let j = 0; j < viewSize.height; j += 10) {
                raster.setPixel(i, j, color);
            }
        }

        backLayer.addChildren([rectangle, raster]);
        raster.on('click', () => dispatcher(HookActionEnum.BOARD_CLICK));
    }
});

export default XBoardPlugin;