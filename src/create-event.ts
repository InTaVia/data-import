import type {
    Entity,
    EntityRelationRole,
    EventEntityRelation,
    Event,
    InternationalizedLabel,
    VocabularyEntry,
} from "@intavia/api-client";
import { eventTargetProps } from "./config";
import { eventPropertyMappers } from "./data-mappers";
import type { UnmappedProps, VocabularyIdAndEntry } from "./types";

interface CreateEventReturn {
    event: Event;
    vocabularyEntries?: Array<VocabularyIdAndEntry>;
    unmappedProperties?: UnmappedProps;
}

export function createEvent(entry: Record<string, unknown>): CreateEventReturn {
    const targetProps = eventTargetProps;

    const unmappedProperties = {
        entry: entry,
        rowNumber: entry.rowNumber,
        sheetName: entry.sheetName,
        properties: [],
    } as UnmappedProps;

    const event: any = {};
    const vocabularyEntries: Array<VocabularyIdAndEntry> = [];

    for (const targetProp of targetProps) {
        if (!(targetProp in eventPropertyMappers)) {
            // add to unmapped props
            unmappedProperties.properties.push({
                targetProperty: targetProp,
                requiredSourceProperties: [],
            });
            continue;
        }
        const mapper = eventPropertyMappers[targetProp];

        // check if all required keys for prop are in entry, if not continue
        const hasAllRequiredProps = mapper.requiredSourceProps.every((key) => {
            return key in entry && entry[key] !== undefined && String(entry[key]).trim().length > 0;
        });

        if (!hasAllRequiredProps) {
            if (mapper.fallback !== undefined) {
                event[targetProp] = mapper.fallback;
            } else {
                // add to unmapped props
                unmappedProperties.properties.push({
                    targetProperty: targetProp,
                    requiredSourceProperties: mapper.requiredSourceProps,
                });
            }
            continue;
        }

        event[targetProp] = mapper.mapper(entry);

        if (mapper.vocabulary !== undefined) {
            vocabularyEntries.push(mapper.vocabulary(entry));
        }
    }

    // has Place ? add additional EventEntityRelation
    if (entry.place != null && String(entry.place).trim().length > 0) {
        for (const place of String(entry.place).split(";")) {
            const { eventEntityRelation, vocabularyEntries: _vocabularyEntries } =
                createEventEntityRelation({
                    entity: place.trim(),
                    relationRole: "took_place_at",
                });
            eventEntityRelation !== undefined && event.relations.push(eventEntityRelation);
            _vocabularyEntries !== undefined && vocabularyEntries.push(..._vocabularyEntries);
        }
    }

    if (unmappedProperties.properties.length > 0) {
        const messages = [];
        for (const properties of unmappedProperties.properties) {
            messages.push(
                `${properties.targetProperty} => ${properties.requiredSourceProperties.join(", ")}`
            );
        }
        unmappedProperties.error = `the following target properties of event (id: ${
            entry.id
        }) in row: ${entry.rowNumber} of sheet: ${
            entry.sheetName
        } could not be created because of missing source properties: ${messages.join("; ")}`;
    }

    //TODO: event validation

    return {
        event,
        vocabularyEntries,
        unmappedProperties,
    };
}

interface CreateEventEntityRelationReturn {
    eventEntityRelation?: EventEntityRelation;
    vocabularyEntries?: Array<VocabularyIdAndEntry>;
    error?: string;
}

export function createEventEntityRelation(
    entry: Record<string, unknown>
): CreateEventEntityRelationReturn {
    const mapper = eventPropertyMappers["relations"];

    // check if all required keys for prop are in entry, if not continue
    const hasAllRequiredProps = mapper.requiredSourceProps.every((key) => {
        return key in entry && entry[key] !== undefined && String(entry[key]).trim().length > 0;
    });

    if (!hasAllRequiredProps) {
        return { error: "some error" };
    }

    if (mapper.vocabulary !== undefined) {
        return {
            eventEntityRelation: mapper.mapper(entry)[0],
            vocabularyEntries: [mapper.vocabulary(entry)],
        };
    }

    return {
        eventEntityRelation: mapper.mapper(entry)[0],
    };
}
