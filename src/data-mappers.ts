import type {
    Biography,
    Entity,
    InternationalizedLabel,
    MediaResource,
    Source,
    UrlString,
    Event,
    EventEntityRelation,
    EventKind,
    EntityRelationRole,
    EntityEventRelation,
    VocabularyEntry,
} from "@intavia/api-client";

type ProviderId = string;
type Provider = Record<string, string>;

interface LinkedId {
    label: string;
    url: UrlString;
}

//FIXME Move into Template
const providers: Record<ProviderId, Provider> = {
    q: { label: "Wikidata", baseUrl: `https://www.wikidata.org/wiki/$id` },
    wiki: { label: "Wikidata", baseUrl: `https://www.wikidata.org/wiki/$id` },
    gnd: { label: "GND", baseUrl: `https://d-nb.info/gnd/$id` },
    apis: { label: "APIS", baseUrl: `https://apis.acdh.oeaw.ac.at/entity/$id` },
    albertina: {
        label: "Albertina",
        baseUrl: `https://sammlungenonline.albertina.at/?query=search=/record/objectnumbersearch=[$id]&showtype=record`,
    },
    europeana: {
        label: "Europeana",
        baseUrl: `https://www.europeana.eu/de/item/$id`,
    },
    eu: {
        label: "Europeana",
        baseUrl: `https://www.europeana.eu/de/item/$id`,
    },
    geonames: {
        label: "Geonames",
        baseUrl: `https://www.geonames.org/$id`,
    },
};

interface Mapper {
    mapper: (props: Record<string, unknown>) => any;
    requiredSourceProps: Array<string>;
    fallback?: any;
    vocabulary?: (props: Record<string, unknown>) => any;
}

const listSeparator = ";";

export const entityPropertyMappers: Record<string, Mapper> = {
    id: {
        mapper: (props) => {
            return props.id as Entity["id"];
        },
        requiredSourceProps: ["id"],
    },
    label: {
        mapper: (props) => {
            return { default: props.label } as Entity["label"];
        },
        requiredSourceProps: ["label"],
    },
    alternativeLabels: {
        mapper: (props) => {
            const alternativeLabels = props.alternativeLabels as string;
            return alternativeLabels
                .split(listSeparator)
                .filter(([_, value]) => {
                    return value !== undefined && value.trim().length > 0;
                })
                .map((label) => {
                    return { default: label.trim() } as InternationalizedLabel;
                });
        },
        requiredSourceProps: ["alternativeLabels"],
    },
    source: {
        mapper: (props) => {
            return { citation: props["source-citation"] } as Source;
        },
        requiredSourceProps: ["source-citation"],
    },
    linkedIds: {
        mapper: (props) => {
            const linkedIds = props.linkedIds as string;
            return (
                linkedIds
                    .split(listSeparator)
                    //filters non empty strings
                    .filter(([_, value]) => {
                        return value !== undefined && value.trim().length > 0;
                    })
                    .map((linkedIdTuple) => {
                        const [providerId, linkedId] = linkedIdTuple.split(/:(.*)/s);
                        const pId = providerId as ProviderId;
                        if (pId in providers) {
                            return {
                                label: providers[pId].label,
                                url: providers[pId].baseUrl.replace(
                                    "$id",
                                    linkedId as string
                                ) as UrlString,
                            };
                        } else if (pId === "url") {
                            return {
                                label: linkedId,
                                url: linkedId,
                            };
                        } else if (pId === "http" || pId === "https") {
                            const mergedId = `${pId}:${linkedId}`;
                            return {
                                label: mergedId,
                                url: mergedId,
                            };
                        }

                        // const result: Record<string, unknown> = {};
                        // linkedId && (result.id = linkedId);
                        // pId in providers &&
                        //     (result.provider = {
                        //         label: providers[pId].label,
                        //         baseUrl: providers[pId].baseUrl.replace(
                        //             "$id",
                        //             linkedId as string
                        //         ) as UrlString,
                        //     });
                        // return result;
                    })
            );
        },
        requiredSourceProps: ["linkedIds"],
    },
    description: {
        mapper: (props) => {
            return props.description as Entity["description"];
        },
        requiredSourceProps: ["description"],
    },
    media: {
        mapper: (props) => {
            const media = props.media as string;
            return media
                .split(listSeparator)
                .filter(([_, value]) => {
                    return value !== undefined && value.trim().length > 0;
                })
                .map((mediaId) => {
                    return mediaId as string;
                }) as Array<MediaResource["id"]>;
        },
        requiredSourceProps: ["media"],
    },
    kind: {
        mapper: (props) => {
            return props.kind as Entity["kind"];
        },
        requiredSourceProps: ["kind"],
    },
    relations: {
        mapper: (props) => {
            return {
                event: props.event as Event["id"],
                role: props.relationRole as EntityRelationRole["id"],
            };
        },
        requiredSourceProps: ["event", "relationRole"],
        fallback: [] as Array<EntityEventRelation>,
    },
    gender: {
        mapper: (props) => {
            //FIXME: for id do not use value, but similar to what will be provided by backend
            return {
                id: props["gender"],
                label: { default: props["gender"] } as InternationalizedLabel,
            };
        },
        requiredSourceProps: ["gender"],
    },
    occupations: {
        mapper: (props) => {
            const occupations = props.occupations as string;
            return occupations
                .split(listSeparator)
                .filter(([_, value]) => {
                    return value !== undefined && value.trim().length > 0;
                })
                .map((occupation) => {
                    return `occupation-${occupation.trim().toLowerCase().replace(/ /g, "_")}`;
                });
        },
        requiredSourceProps: ["occupations"],
        vocabulary: (props) => {
            const occupations = props.occupations as string;
            return occupations
                .split(listSeparator)
                .filter(([_, value]) => {
                    return value !== undefined && value.trim().length > 0;
                })
                .map((occupation) => {
                    return {
                        id: "occupation",
                        entry: {
                            id: `occupation-${occupation.trim().toLowerCase().replace(/ /g, "_")}`,
                            label: { default: occupation.trim() } as InternationalizedLabel,
                        },
                    };
                });
        },
    },
    biographies: {
        mapper: (props) => {
            const biographies = props.biographies as string;
            return biographies
                .split(listSeparator)
                .filter(([_, value]) => {
                    return value !== undefined && value.trim().length > 0;
                })
                .map((biographyId) => {
                    return biographyId as string;
                }) as Array<Biography["id"]>;
        },
        requiredSourceProps: ["biographies"],
    },

    /** Cultural-Heritage-Object */
    /** Group */ /** Hisotrical-Event */ /** Place*/
    /** type -> groupType, historicalEventType, placeType*/
    type: {
        mapper: (props) => {
            return {
                id: `${props.kind}-type-${String(props.type).toLowerCase().replace(/ /g, "_")}`,
                label: { default: props["type"] } as InternationalizedLabel,
            };
        },
        requiredSourceProps: ["type", "kind"],
        vocabulary: (props) => {
            return {
                id: `${props.kind}-type`,
                entry: {
                    id: `${props.kind}-type-${String(props.type).toLowerCase().replace(/ /g, "_")}`,
                    label: { default: props.type } as InternationalizedLabel,
                } as VocabularyEntry,
            };
        },
    },
    /** Place */
    geometry: {
        mapper: (props) => {
            return {
                type: "Point",
                coordinates: [Number(props["longitude"]), Number(props["latitude"])],
            };
        },
        requiredSourceProps: ["latitude", "longitude"],
    },
};

export const eventPropertyMappers: Record<string, Mapper> = {
    id: {
        mapper: (props) => {
            return props.id as Event["id"];
        },
        requiredSourceProps: ["id"],
    },
    label: {
        mapper: (props) => {
            return { default: props.label } as Event["label"];
        },
        requiredSourceProps: ["label"],
    },
    description: {
        mapper: (props) => {
            // FIXME: use Event["description"] when exposed by api-client
            return props.description as string;
        },
        requiredSourceProps: ["description"],
    },
    kind: {
        mapper: (props) => {
            return `event-kind-${String(props.eventKind)
                .toLowerCase()
                .replace(/ /g, "_")}` as Event["kind"];
        },
        requiredSourceProps: ["eventKind"],
        vocabulary: (props) => {
            return {
                id: "event-kind",
                entry: {
                    id: `event-kind-${String(props.eventKind).toLowerCase().replace(/ /g, "_")}`,
                    label: { default: props.eventKind } as InternationalizedLabel,
                } as VocabularyEntry,
            };
        },
    },
    source: {
        mapper: (props) => {
            return { citation: props["source-citation"] } as Source;
        },
        requiredSourceProps: ["source-citation"],
    },
    startDate: {
        mapper: (props) => {
            return props.startDate as Event["startDate"];
        },
        requiredSourceProps: ["startDate"],
    },
    endDate: {
        mapper: (props) => {
            return props.endDate as Event["endDate"];
        },
        requiredSourceProps: ["endDate"],
    },
    relations: {
        mapper: (props) => {
            return [
                {
                    entity: props.entity as Entity["id"],
                    role: `role-${String(props.relationRole)
                        .toLowerCase()
                        .replace(/ /g, "_")}` as EntityRelationRole["id"],
                },
            ] as Array<EventEntityRelation>;
        },
        requiredSourceProps: ["entity", "relationRole"],
        fallback: [] as Array<EventEntityRelation>,
        vocabulary: (props) => {
            return {
                id: "role",
                entry: {
                    id: `role-${String(props.relationRole).toLowerCase().replace(/ /g, "_")}`,
                    label: { default: props.relationRole } as InternationalizedLabel,
                } as VocabularyEntry,
            };
        },
    },
};

export const biographyPropertyMappers: Record<string, Mapper> = {
    id: {
        mapper: (props) => {
            return props.id as Biography["id"];
        },
        requiredSourceProps: ["id"],
    },
    text: {
        mapper: (props) => {
            return props.text as Biography["text"];
        },
        requiredSourceProps: ["text"],
    },
    citation: {
        mapper: (props) => {
            return props.citation as string;
        },
        requiredSourceProps: ["citation"],
    },
};

export const mediaPropertyMappers: Record<string, Mapper> = {
    id: {
        mapper: (props) => {
            return props.id as MediaResource["id"];
        },
        requiredSourceProps: ["id"],
    },
    label: {
        mapper: (props) => {
            return { default: props.label } as MediaResource["label"];
        },
        requiredSourceProps: ["label"],
    },
    description: {
        mapper: (props) => {
            return props.description as MediaResource["description"];
        },
        requiredSourceProps: ["description"],
    },
    attribution: {
        mapper: (props) => {
            return props.attribution as MediaResource["attribution"];
        },
        requiredSourceProps: ["attribution"],
    },
    url: {
        mapper: (props) => {
            return props.url as MediaResource["url"];
        },
        requiredSourceProps: ["url"],
    },
    kind: {
        mapper: (props) => {
            return `${String(props.mediaKind)
                .toLowerCase()
                .replace(/ /g, "_")}` as MediaResource["kind"];
        },
        requiredSourceProps: ["mediaKind"],
    },
};
