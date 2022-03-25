import type {XTheme} from "../shared/XTypes";
import {HookActionEnum} from "../shared/Instructions";
import {definePlugin} from "../shared/XHelper";


export default function XBoardPlugin(zoom: boolean = true, pan: boolean = true) {
    return definePlugin({
        name: 'x-board-plugin',
        plugin(context, hookManager) {

            const b = context.builder;
            const element = context.element;
            const style = element.style;
            const theme: XTheme = context.theme;
            const color = theme.info;
            const backLayer = context.getLayer('board');
            const container = context.getLayer('container');
            const viewSize = b.viewSize();
            const raster = b.makeRaster(viewSize);
            const dispatcher = hookManager.dispatcher.action
            raster.position = b.viewCenter();

            for (let i = 0; i < viewSize.width; i += 10) {
                for (let j = 0; j < viewSize.height; j += 10) {
                    raster.setPixel(i, j, color);
                }
            }

            backLayer.addChildren([raster]);
            backLayer.sendToBack();
            raster.on('click', () => dispatcher(HookActionEnum.BOARD_CLICK));

            if (pan) {
                let isMoving = false;
                raster.on('mousedown', e => {
                    isMoving = true;
                    style.cursor = 'move';
                });

                raster.on('mouseup', e => {
                    isMoving = false;
                    style.cursor = 'default';
                });

                raster.on('mousedrag', e => {
                    isMoving && container.moveBy(e.delta)
                });
            }
            const wheelHandler = (e: WheelEvent) => {
                // -1 = up
                const sign = Math.sign(e.deltaY);
                container.scale(1 + sign * -0.1, b.makePoint(e.x, e.y));
            };

            zoom && element.addEventListener('wheel', wheelHandler);

            return () => {
                element.removeEventListener('wheel', wheelHandler);
            }
        }
    });
};