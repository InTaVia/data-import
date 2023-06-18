import type { EntityKind, Entity, EntityEventRelation, Event } from "@intavia/api-client";
import { isEntityKind } from "@intavia/api-client";
import { createEntity, createEntityEventRelations } from "./create-entity";
import { createEvent, createEventEntityRelation } from "./create-event";
import type { TagCandidate, VocabularyIdAndEntry } from "./types";
import { CollectionCandidate, ImportData } from "./import-data";
import { arrayContainsObject, unique } from "./lib";
import { createBiography } from "./create-biography";
import { createMediaResource } from "./create-media-resource";

interface TransformDataParams {
    input: Array<Record<string, unknown>>;
    idPrefix: string;
    collectionLabels?: Record<string, string>;
}

export function transformData(params: TransformDataParams): ImportData {
    const { input, idPrefix, collectionLabels } = params;

    const unmappedEntries = [];
    let entities: ImportData["entities"] = [];
    let events: ImportData["events"] = [];
    let mediaResources: ImportData["media"] = [];
    let biographies: ImportData["biographies"] = [];
    const vocabularies: ImportData["vocabularies"] = {};
    const eventGroups: Record<string, Array<Event["id"]>> = {};
    const entityGroups: Record<string, Array<Entity["id"]>> = {};
    const collections: ImportData["collections"] = {};
    const tags: ImportData["tags"] = [];

    const registerVocabularyEntries = (
        vocabularyEntries: Array<VocabularyIdAndEntry> | undefined
    ) => {
        if (vocabularyEntries !== undefined) {
            for (const vocabulary of vocabularyEntries) {
                const { id, entry } = vocabulary;
                if (!(id in vocabularies)) {
                    vocabularies[id] = [];
                }
                if (!arrayContainsObject(vocabularies[id], entry)) {
                    vocabularies[id].push(entry);
                }
            }
        }
    };

    // check if any of the entries has tagging
    // has Tag for all? otherwise use prefix for all entities and events
    let tagsForAll = input.filter((entry) => {
        const entryEntitySheets = entry.entitySheets as Array<string>;
        const entryEventSheets = entry.eventSheets as Array<string>;
        return (
            "kind" in entry &&
            entry.kind === "tagging" &&
            "entitySheets" in entry &&
            "eventSheets" in entry &&
            entryEntitySheets.length === 0 &&
            entryEventSheets.length === 0
        );
    });
    if (tagsForAll.length === 0) {
        input.push({
            label: idPrefix,
            description: `The entire ${idPrefix} data set.`,
            entitySheets: [],
            eventSheets: [],
            kind: "tagging",
            sheetName: "tagging",
            rowNumber: 0,
        });
    }

    // CREATE ENTITIES AND EVENTS, MEDIA, BIOGRAPHIES

    for (const entry of input) {
        if (!("kind" in entry)) {
            unmappedEntries.push({
                ...entry,
                error: `no kind property for entry in row: ${entry.rowNumber} of sheet: ${entry.sheetName}`,
            });
            continue;
        }
        const kind = entry.kind as EntityKind;

        if (!("id" in entry) && entry.kind !== "tagging") {
            unmappedEntries.push({
                ...entry,
                error: `no id property for entry in row: ${entry.rowNumber} of sheet: ${entry.sheetName}`,
            });
            continue;
        }

        /** ENTITIES */
        if (isEntityKind(kind)) {
            const { entity, vocabularyEntries, validationResult, unmappedProperties } =
                createEntity({
                    entry,
                    kind,
                });
            // console.log(unmappedProperties);

            //if validation has error > add to unmappedEntries and continue
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

            const entryGroup = entry.sheetName as string;
            if (!(entryGroup in entityGroups)) {
                entityGroups[entryGroup] = [];
            }
            //add event ID to event group (for Collection or tag)
            entityGroups[entryGroup].push(entity.id as Entity["id"]);

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
                const { event, vocabularyEntries, unmappedProperties } = createEvent(entry);
                events.push(event);
                registerVocabularyEntries(vocabularyEntries);

                const entryGroup = entry.sheetName as string;
                if (!(entryGroup in eventGroups)) {
                    eventGroups[entryGroup] = [];
                }
                //add event ID to event group (for Collection or tag)
                eventGroups[entryGroup].push(event.id as Event["id"]);
            }

            //     /** MEDIA */
        } else if (kind === "media") {
            const { media, vocabularyEntries } = createMediaResource(entry);
            mediaResources.push(media);
            registerVocabularyEntries(vocabularyEntries);
        } else if (kind === "biography") {
            const { biography } = createBiography(entry);
            biographies.push(biography);
        } else if (kind === "tagging") {
            // add tags, create if not exists
            // const { tags } = createTag(entry);
            // get all ids of a given excel tab
            const {
                rowNumber = 0,
                kind = "",
                sheetName = "",
                ..._entry
            } = {
                ...entry,
                entities: [],
                events: [],
            };
            tags.push(_entry as unknown as TagCandidate);
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

    // COLLECTION CANDIDATES

    // for all data
    collections["all"] = {
        label: (collectionLabels != null && "all" in collectionLabels
            ? collectionLabels["all"]
            : idPrefix) as CollectionCandidate["label"],
        entities: entities.map((entity) => entity.id) as CollectionCandidate["entities"],
        events: events.map((event) => event.id) as CollectionCandidate["events"],
    };

    //by events

    for (const eventGroup in eventGroups) {
        collections[eventGroup] = {
            label: (collectionLabels != null && eventGroup in collectionLabels
                ? collectionLabels[eventGroup]
                : eventGroup) as CollectionCandidate["label"],
            entities: [
                ...new Set(
                    events
                        .filter((event) => eventGroups[eventGroup].includes(event.id))
                        .flatMap((event) => event.relations.map((relations) => relations.entity))
                ),
            ],
            events: eventGroups[eventGroup],
        };
    }

    // apply tagging
    // console.log(tags);

    const _tags = tags.map((tag: TagCandidate) => {
        if (tag.entitySheets.length === 0 && tag.eventSheets.length === 0) {
            for (const key in entityGroups) {
                tag.entities = [...tag.entities, ...entityGroups[key]];
            }
            tag.entities = unique(tag.entities);
            for (const key in eventGroups) {
                tag.events = [...tag.events, ...eventGroups[key]];
            }
            tag.events = unique(tag.events);
        } else {
            for (const key of tag.entitySheets) {
                tag.entities = [...tag.entities, ...entityGroups[key]];
            }
            tag.entities = unique(tag.entities);
            for (const key of tag.eventSheets) {
                tag.events = [...tag.events, ...eventGroups[key]];
            }
            tag.events = unique(tag.events);
        }
        return tag;
    });

    // (RE) RUN VALIDATION HERE FOR ENTITIES?

    // INDEX VALIDITY CHECKS
    // go through relations of entities and check if events are there
    // go through relations of events and check if entities are there

    const result: ImportData = {};
    entities && (result.entities = entities);
    events && (result.events = events);
    mediaResources && (result.media = mediaResources);
    biographies && (result.biographies = biographies);
    vocabularies && (result.vocabularies = vocabularies);
    unmappedEntries && (result.unmappedEntries = unmappedEntries);
    collections && (result.collections = collections);
    tags && (result.tags = _tags);

    return result;
}
