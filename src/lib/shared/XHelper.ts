import {XElementDef, XElementFactory, XPluginDef} from "./XTypes";

export function defineElement<T extends XElementDef = XElementDef>(factory: XElementFactory<T>): XElementFactory<T> {
    return factory;
}

export function definePlugin(def: XPluginDef): XPluginDef {
    return def;
}
