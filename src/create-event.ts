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
import type { VocabularyNameAndEntry } from "./types";

interface CreateEventReturn {
    event: Event;
    vocabularyEntries?: Array<VocabularyNameAndEntry>;
}

export function createEvent(entry: Record<string, unknown>): CreateEventReturn {
    const targetProps = eventTargetProps;
    const event: any = {};
    const vocabularyEntries: Array<VocabularyNameAndEntry> = [];

    for (const targetProp of targetProps) {
        if (!(targetProp in eventPropertyMappers)) {
            // TODO: add to unmapped props (see entity creation)
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
                // TODO: add to unmapped props (see entity creation)
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
        const { eventEntityRelation, vocabularyEntries: _vocabularyEntries } =
            createEventEntityRelation({
                entity: entry.place,
                relationRole: "took_place_at",
            });
        eventEntityRelation !== undefined && event.relations.push(eventEntityRelation);
        _vocabularyEntries !== undefined && vocabularyEntries.push(..._vocabularyEntries);
    }

    //event validation

    return {
        event,
        vocabularyEntries,
    };
}

interface CreateEventEntityRelationReturn {
    eventEntityRelation?: EventEntityRelation;
    vocabularyEntries?: Array<VocabularyNameAndEntry>;
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
