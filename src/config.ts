import { entityKinds } from "@intavia/api-client";

export const sheetKinds = ["media", ...entityKinds, "event", "biography"];

// FIXME can we get this information from the API-Client?
const enityBaseProps = [
    "id",
    "label",
    "description",
    "alternativeLabels",
    "source",
    "linkedIds",
    "media",
    "relations",
    "kind",
];

export const entityTargetPropsByKind: Record<string, Array<string>> = {
    person: [...enityBaseProps, "gender", "occupations"],
    // FIXME: find appropriate attributes in Backend for currentLocation and isPartOf
    "cultural-heritage-object": [...enityBaseProps, "currentLocation", "isPartOf"],
    group: [...enityBaseProps, "type"],
    "historical-event": [...enityBaseProps, "type"],
    place: [...enityBaseProps, "type", "geometry"],
};

export const eventTargetProps: Array<string> = [
    "id",
    "label",
    "description",
    "kind",
    "source",
    "startDate",
    "endDate",
    "relations",
];

export const prefixProps: Array<string> = ["id", "entity", "place", "media"];
