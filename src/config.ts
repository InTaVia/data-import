import { entityKinds } from "@intavia/api-client";

export const sheetKinds = ["media", ...entityKinds, "event", "biography", "tagging"];

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
    person: [...enityBaseProps, "gender", "occupations", "biographies"],
    // FIXME: find appropriate attributes in Backend for currentLocation and isPartOf
    "cultural-heritage-object": [...enityBaseProps, "type"],
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
];

export const biographyTargetProps: Array<string> = ["id", "text", "citation"];

export const mediaTargetProps: Array<string> = [
    "id",
    "label",
    "description",
    "attribution",
    "url",
    "kind",
];

export const excludeProps: Array<string> = ["sheetName", "rowNumber", "eventKind"];

export const prefixProps: Array<string> = ["id", "entity", "place", "media", "biographies"];
