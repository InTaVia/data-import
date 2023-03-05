import { Biography } from "@intavia/api-client";
import { biographyTargetProps } from "./config";
import { biographyPropertyMappers } from "./data-mappers";

interface CreateBiographyReturn {
    biography: Biography;
    // validationResult: ValidateEntityReturn;
    // vocabularyEntries?: Array<VocabularyIdAndEntry>;
    // unmapedProperties?: UnmappedProps;
}
export function createBiography(entry: Record<string, unknown>): CreateBiographyReturn {
    const targetProps = biographyTargetProps;

    const biography: any = {};

    for (const targetProp of targetProps) {
        if (!(targetProp in biographyPropertyMappers)) {
            // add to unmapped props
            // unmappedProperties.properties.push({
            //     targetProperty: targetProp,
            //     requiredSourceProperties: [],
            // });
            continue;
        }
        const mapper = biographyPropertyMappers[targetProp];

        // check if all required keys for prop are in entry, if not continue
        const hasAllRequiredProps = mapper.requiredSourceProps.every((key) => {
            return key in entry && entry[key] !== undefined && String(entry[key]).trim().length > 0;
        });

        if (!hasAllRequiredProps) {
            if (mapper.fallback !== undefined) {
                biography[targetProp] = mapper.fallback;
            } else {
                // add to unmapped props
                // unmappedProperties.properties.push({
                //     targetProperty: targetProp,
                //     requiredSourceProperties: mapper.requiredSourceProps,
                // });
            }
            continue;
        }

        biography[targetProp] = mapper.mapper(entry);
    }

    //TODO: validation (zod update in api-client required)

    return { biography };
}
