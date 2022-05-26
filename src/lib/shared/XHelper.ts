import {XElementDef, XElementFactory, XPluginDef, XTheme} from "./XTypes";

export function defineElement<T extends XElementDef = XElementDef>(factory: XElementFactory<T>): XElementFactory<T> {
    return factory;
}

export function definePlugin(def: XPluginDef): XPluginDef {
    return def;
}

export function defineTheme(def: XTheme): XTheme {
    return def;
}