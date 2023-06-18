import type { Entity, Event, VocabularyEntry } from "@intavia/api-client";

export interface VocabularyIdAndEntry {
    id: string;
    entry: VocabularyEntry;
}

interface UnmappedPropsType {
    targetProperty: string;
    requiredSourceProperties: Array<string>;
}

export interface UnmappedProps {
    entry: Record<string, unknown>;
    rowNumber: number;
    sheetName: string;
    properties: Array<UnmappedPropsType>;
    error?: string;
}

export interface TagCandidate {
    label: string;
    description: string;
    entitySheets?: Array<string>;
    eventSheets?: Array<string>;
    entities: Array<Entity["id"]>;
    events: Array<Event["id"]>;
}
