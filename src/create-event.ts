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
import { Buffer } from "buffer";

interface CreateEventReturn {
    event: Event;
    vocabularyEntries?: Array<VocabularyIdAndEntry>;
    upstreamEntities?: Array<Entity["id"]>;
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
    const upstreamEntities: Array<Entity["id"]> = [];

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

    // eventEntityRelation
    const {
        eventEntityRelation,
        vocabularyEntries: _vocabularyEntries,
        upstreamEntities: _upstreamEntities,
    } = createEventEntityRelation(entry);
    if (!("relations" in event)) {
        event.relations = [];
    }
    eventEntityRelation !== undefined && event.relations.push(eventEntityRelation);
    _vocabularyEntries !== undefined && vocabularyEntries.push(..._vocabularyEntries);
    _upstreamEntities !== undefined && upstreamEntities.push(..._upstreamEntities);

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
        upstreamEntities,
        unmappedProperties,
    };
}

interface CreateEventEntityRelationReturn {
    eventEntityRelation?: EventEntityRelation;
    vocabularyEntries?: Array<VocabularyIdAndEntry>;
    upstreamEntities?: Array<Entity["id"]>;
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

    const eventEntityRelation = mapper.mapper(entry)[0];
    const base64candidate = eventEntityRelation.entity.split("-").slice(-1);
    const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

    const isUpstream =
        base64regex.test(base64candidate) &&
        Buffer.from(base64candidate, "base64").toString("utf-8").startsWith("http");

    const result: CreateEventEntityRelationReturn = {};

    if (isUpstream) {
        eventEntityRelation.entity = base64candidate;
        result.upstreamEntities = [eventEntityRelation.entity];
    }

    eventEntityRelation && (result.eventEntityRelation = eventEntityRelation);
    mapper.vocabulary !== undefined && (result.vocabularyEntries = [mapper.vocabulary(entry)]);

    return result;
}
