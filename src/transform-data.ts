import type {
    EntityKind,
    Entity,
    EntityEventRelation,
    EventEntityRelation,
    EntityRelationRole,
    Event,
    VocabularyEntry,
} from "@intavia/api-client";
import { isEntityKind } from "@intavia/api-client";
import { createEntity, createEntityEventRelations } from "./create-entity";
import { createEvent, createEventEntityRelation } from "./create-event";
import type { VocabularyNameAndEntry } from "./types";
import { ImportData } from "./import-data";
import { arrayContainsObject } from "./lib";

export function transformData(input: Array<Record<string, unknown>>, idPrefix: string): ImportData {
    const unmappedEntries = [];
    let entities: Array<Entity> = [];
    let events: Array<Event> = [];
    let vocabularies: Record<string, Array<VocabularyEntry>> = {};
    let entityRelationRoles: Array<EntityRelationRole> = [];
    const eventCollections: Record<string, Array<Event["id"]>> = {};
    const eventsToAddToEntities: Record<string, Array<string>> = {};

    const registerVocabularyEntries = (
        vocabularyEntries: Array<VocabularyNameAndEntry> | undefined
    ) => {
        if (vocabularyEntries !== undefined) {
            for (const vocabulary of vocabularyEntries) {
                const { vocabularyName, vocabularyEntry } = vocabulary;
                if (!(vocabularyName in vocabularies)) {
                    vocabularies[vocabularyName] = [];
                }
                if (!arrayContainsObject(vocabularies[vocabularyName], vocabularyEntry)) {
                    vocabularies[vocabularyName].push(vocabularyEntry);
                }
            }
        }
    };

    // CREATE ENTITIES AND EVENTS

    for (const entry of input) {
        if (!("kind" in entry)) {
            unmappedEntries.push({
                ...entry,
                error: `no kind property for entry in row: ${entry.rowNumber} of sheet: ${entry.sheetName}`,
            });
            continue;
        }
        const kind = entry.kind as EntityKind;

        if (!("id" in entry)) {
            unmappedEntries.push({
                ...entry,
                error: `no id property for entry in row: ${entry.rowNumber} of sheet: ${entry.sheetName}`,
            });
            continue;
        }

        /** ENTITIES */
        if (isEntityKind(kind)) {
            const { entity, vocabularyEntries, validationResult, unmapedProperties } = createEntity(
                {
                    entry,
                    kind,
                }
            );

            //TODO: if validation has error > add to unmappedEntries and continue
            if (validationResult !== undefined && validationResult.error !== undefined) {
                unmappedEntries.push({
                    ...entry,
                    error: `validation error for entity in row: ${entry.rowNumber} of sheet: ${entry.sheetName}`,
                    zodError: validationResult.error.format(),
                });
                continue;
            }

            entities.push(entity);
            registerVocabularyEntries(vocabularyEntries);

            /** EVENTS */
        } else if (kind === "event") {
            if (
                events.some((event) => {
                    return event.id === entry.id;
                })
            ) {
                // Add relation to existing event (rows in the xlsx that have the same id an only add relations; other props are ignored)
                events = events.map((event) => {
                    if (event.id === entry.id) {
                        const { eventEntityRelation, vocabularyEntries } =
                            createEventEntityRelation(entry);

                        eventEntityRelation !== undefined &&
                            event.relations.push(eventEntityRelation);
                        registerVocabularyEntries(vocabularyEntries);

                        // TODO unmapped entries
                    }
                    return event;
                });
            } else {
                // Create new event
                const { event, vocabularyEntries } = createEvent(entry);
                events.push(event);
                registerVocabularyEntries(vocabularyEntries);

                const entryGroup = entry.sheetName as string;
                if (!(entryGroup in eventCollections)) {
                    eventCollections[entryGroup] = [];
                }
                //add event ID to event Collection
                eventCollections[entryGroup].push(event.id as string);
            }

            //     /** MEDIA */
            // } else if (kind === "media") {
            //     // TODO: check for required props
            //     // if (!('id' in entry)) {
            //     //   unmappedEntries.push({ ...entry, error: 'no id property' });
            //     //   continue;
            //     // }
            // } else if (kind === "biography") {
            // TODO: check for required props
            // if (!('id' in entry)) {
            //   unmappedEntries.push({ ...entry, error: 'no id property' });
            //   continue;
            // }
        } else {
            unmappedEntries.push({
                ...entry,
                error: `kind property: ${kind} not valid in row: ${entry.rowNumber} of sheet: ${entry.sheetName}`,
            });
            continue;
        }
    }

    // CREATE RELATIONS ENTITIES

    const entityEventRelationsToAdd: Record<
        Entity["id"],
        Array<EntityEventRelation>
    > = createEntityEventRelations(events);

    for (const entityId of Object.keys(entityEventRelationsToAdd)) {
        entities = entities.map((entity) => {
            return entity["id"] === entityId
                ? { ...entity, relations: entityEventRelationsToAdd[entityId] }
                : entity;
        });
    }

    // (RE) RUN VALIDATION HERE FOR ENTITIES?

    // INDEX VALIDITY CHECKS
    // go through relations of entities and check if events are there
    // go through relations of events and check if entities are there

    return {
        entities,
        events,
        vocabularies,
        unmappedEntries,
        eventCollections,
    };
}
