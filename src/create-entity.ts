import type {
    Entity,
    EntityKind,
    EntityMap,
    Event,
    EntityEventRelation,
} from "@intavia/api-client";

import { entityTargetPropsByKind, excludeProps } from "./config";
import { entityPropertyMappers } from "./data-mappers";
import type { UnmappedProps, VocabularyIdAndEntry } from "./types";
import { validateEntity } from "./validate";
import type { ValidateEntityReturn } from "./validate";

interface CreateEntityParams {
    entry: Record<string, unknown>;
    kind: EntityKind;
}

interface CreateEntityReturn {
    entity: Entity;
    validationResult: ValidateEntityReturn;
    vocabularyEntries?: Array<VocabularyIdAndEntry>;
    unmappedProperties?: UnmappedProps;
}

export function createEntity(params: CreateEntityParams): CreateEntityReturn {
    const { entry, kind } = params;

    const unmappedProperties = {
        entry: entry,
        rowNumber: entry.rowNumber,
        sheetName: entry.sheetName,
        properties: [],
    } as UnmappedProps;

    const entity: any = {};

    const vocabularyEntries: Array<VocabularyIdAndEntry> = [];

    const targetProps = entityTargetPropsByKind[kind];

    // const difference = Object.keys(entry).filter(
    //     (key) => ![...targetProps, ...excludeProps].includes(key)
    // );
    // console.log(entry.id, difference);

    for (const targetProp of targetProps) {
        if (!(targetProp in entityPropertyMappers)) {
            unmappedProperties.properties.push({
                targetProperty: targetProp,
                requiredSourceProperties: ["property not in mapper"],
            });
            continue;
        }
        const mapper = entityPropertyMappers[targetProp];

        // check if required keys for prop are in entry, if not continue
        const hasAllRequiredProps = mapper.requiredSourceProps.every((key) => {
            return key in entry && entry[key] !== undefined && String(entry[key]).trim().length > 0;
        });
        if (!hasAllRequiredProps) {
            if (mapper.fallback !== undefined) {
                entity[targetProp] = mapper.fallback;
            } else {
                unmappedProperties.properties.push({
                    targetProperty: targetProp,
                    requiredSourceProperties: mapper.requiredSourceProps,
                });
            }
            continue;
        }

        entity[targetProp] = mapper.mapper(entry);

        if (mapper.vocabulary !== undefined) {
            const _vocabularyEntries = mapper.vocabulary(entry);

            if (Array.isArray(_vocabularyEntries)) {
                vocabularyEntries.push(..._vocabularyEntries);
            } else {
                vocabularyEntries.push(_vocabularyEntries);
            }
        }
    }

    if (unmappedProperties.properties.length > 0) {
        const messages = [];
        for (const properties of unmappedProperties.properties) {
            messages.push(
                `${properties.targetProperty} => ${properties.requiredSourceProperties.join(", ")}`
            );
        }
        unmappedProperties.error = `the following target properties of entity (id: ${
            entry.id
        }) in row: ${entry.rowNumber} of sheet: ${
            entry.sheetName
        } could not be created because of missing source properties: ${messages.join("; ")}`;
    }

    // validate Entity
    const validationResult = validateEntity(entity);

    return {
        entity: entity as EntityMap[typeof kind],
        validationResult,
        vocabularyEntries,
        unmappedProperties,
    };
}

export function createEntityEventRelations(
    events: Array<Event>
): Record<Entity["id"], Array<EntityEventRelation>> {
    const entityEventRelations = {} as Record<Entity["id"], Array<EntityEventRelation>>;
    const mapper = entityPropertyMappers["relations"];
    for (const event of events) {
        if (
            event.relations !== undefined &&
            Array.isArray(event.relations) &&
            event.relations.length > 0
        ) {
            for (const relation of event.relations) {
                if (!(relation.entity in entityEventRelations)) {
                    entityEventRelations[relation.entity] = [];
                }
                entityEventRelations[relation.entity].push(
                    mapper.mapper({ event: event.id, relationRole: relation.role })
                );
            }
        }
    }
    return entityEventRelations;
}
