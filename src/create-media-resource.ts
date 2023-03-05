import { MediaResource } from "@intavia/api-client";
import { mediaTargetProps } from "./config";
import { mediaPropertyMappers } from "./data-mappers";
import { VocabularyIdAndEntry } from "./types";

interface CreateMediaResourceReturn {
    media: MediaResource;
    // validationResult: ValidateEntityReturn;
    vocabularyEntries?: Array<VocabularyIdAndEntry>;
    // unmapedProperties?: UnmappedProps;
}
export function createMediaResource(entry: Record<string, unknown>): CreateMediaResourceReturn {
    const targetProps = mediaTargetProps;

    const media: any = {};

    const vocabularyEntries: Array<VocabularyIdAndEntry> = [];

    for (const targetProp of targetProps) {
        if (!(targetProp in mediaPropertyMappers)) {
            // add to unmapped props
            // unmappedProperties.properties.push({
            //     targetProperty: targetProp,
            //     requiredSourceProperties: [],
            // });
            continue;
        }
        const mapper = mediaPropertyMappers[targetProp];

        // check if all required keys for prop are in entry, if not continue
        const hasAllRequiredProps = mapper.requiredSourceProps.every((key) => {
            return key in entry && entry[key] !== undefined && String(entry[key]).trim().length > 0;
        });

        if (!hasAllRequiredProps) {
            if (mapper.fallback !== undefined) {
                media[targetProp] = mapper.fallback;
            } else {
                // add to unmapped props
                // unmappedProperties.properties.push({
                //     targetProperty: targetProp,
                //     requiredSourceProperties: mapper.requiredSourceProps,
                // });
            }
            continue;
        }

        media[targetProp] = mapper.mapper(entry);

        if (mapper.vocabulary !== undefined) {
            const _vocabularyEntries = mapper.vocabulary(entry);

            if (Array.isArray(_vocabularyEntries)) {
                vocabularyEntries.push(..._vocabularyEntries);
            } else {
                vocabularyEntries.push(_vocabularyEntries);
            }
        }
    }

    //TODO: validation (zod update in api-client required)

    return { media, vocabularyEntries };
}
