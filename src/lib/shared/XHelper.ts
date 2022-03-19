import {XNode} from "./XRender";
import {XContext, XElementDef, XElementFactory, XElementHandler, XPluginDef} from "./XTypes";

/*

export function defineEdge<T extends XEdgeDef = XEdgeDef>(edgeDef: XEdgeHandler): XEdgeFactory {

    const name: string = edgeDef.name;
    const handler = edgeDef.handler;
    return {
        name,
        build(context: XContext, config: T): XNode {
            return handler(context, config);
        }
    };
}
*/

export function defineElement(elementHandler: XElementHandler): XElementFactory {
    const name: string = elementHandler.name;
    const handler = elementHandler.handler;
    return {
        name,
        build(context: XContext, config: XElementDef): XNode {
            return handler(context, config);
        }
    };
}

export function definePlugin(def: XPluginDef): XPluginDef {
    return def;
}
