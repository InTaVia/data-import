//FIXME validation will require @intavia/api-client@0.1.7
import type { Entity, Event } from "@intavia/api-client";
import {
    person as personSchema,
    culturalHeritageObject as culturalHeritageObjectSchema,
    place as placeSchema,
    group as groupSchema,
    historicalEvent as historicalEventSchema,
} from "@intavia/api-client";

export interface ValidateEntityReturn {
    data?: any;
    error?: any;
}

export function validateEntity(entity: Entity): ValidateEntityReturn {
    if (!("kind" in entity)) return { error: "No kind property provided for entity." };
    let result = undefined;
    if (entity.kind === "person") {
        result = personSchema.safeParse(entity);
    } else if (entity.kind === "cultural-heritage-object") {
        result = culturalHeritageObjectSchema.safeParse(entity);
    } else if (entity.kind === "place") {
        result = placeSchema.safeParse(entity);
    } else if (entity.kind === "group") {
        result = groupSchema.safeParse(entity);
    } else if (entity.kind === "historical-event") {
        result = historicalEventSchema.safeParse(entity);
    }

    if (result) {
        if (result.success === true) {
            return { data: result.data };
        } else {
            return { error: result.error };
        }
    } else {
        return { error: "Validation was not possible." };
    }
}

export function validateEvent(event: Event) {}
