import {XNode} from "./XRender";
import {XContext, XEdgeDef, XEdgeFactory, XEdgeHandler, XNodeDef, XNodeFactory, XNodeHandler, XPluginDef} from "./XTypes";

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

export function defineNode<T extends XNodeDef>(nodeDef: XNodeHandler): XNodeFactory {
    const name: string = nodeDef.name;
    const handler = nodeDef.handler;
    return {
        name,
        build(context: XContext, config: T): XNode {
            return handler(context, config);
        }
    };
}

export function definePlugin(def: XPluginDef): XPluginDef {
    return def;
}
