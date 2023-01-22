import type {
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
} from "@intavia/api-client";

type ProviderId = string;
type Provider = Record<string, string>;

//FIXME Move into Template
const providers: Record<ProviderId, Provider> = {
    q: { label: "Wikidata", baseUrl: `https://www.wikidata.org/wiki/$id` },
    gnd: { label: "GND", baseUrl: `https://d-nb.info/gnd/$id` },
    apis: { label: "APIS", baseUrl: `https://apis.acdh.oeaw.ac.at/$id` },
    albertina: {
        label: "Albertina",
        baseUrl: `https://sammlungenonline.albertina.at/?query=search=/record/objectnumbersearch=[$id]&showtype=record`,
    },
    europeana: {
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
                .split(";")
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
                    .split(";")
                    //filters non empty strings
                    .filter(([_, value]) => {
                        return value !== undefined && value.trim().length > 0;
                    })
                    .map((linkedIdTuple) => {
                        const [providerId, linkedId] = linkedIdTuple.split(":");
                        const pId = providerId as ProviderId;
                        return {
                            id: linkedId,
                            provider: {
                                label: providers[pId].label,
                                baseUrl: providers[pId].baseUrl.replace(
                                    "$id",
                                    linkedId as string
                                ) as UrlString,
                            },
                        };
                    })
            );
        },
        requiredSourceProps: ["linkedIds"],
    },
    description: {
        mapper: (props) => {
            // FIXME: use Entity["description"] when exposed by api-client
            return props.description as string;
        },
        requiredSourceProps: ["description"],
    },
    media: {
        mapper: (props) => {
            const media = props.media as string;
            return media
                .split(";")
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
                .split(";")
                .filter(([_, value]) => {
                    return value !== undefined && value.trim().length > 0;
                })
                .map((occupation) => {
                    return `occupation/${occupation.toLowerCase().replace(/ /g, "_")}`;
                });
        },
        requiredSourceProps: ["occupations"],
        vocabulary: (props) => {
            const occupations = props.occupations as string;
            return occupations
                .split(";")
                .filter(([_, value]) => {
                    return value !== undefined && value.trim().length > 0;
                })
                .map((occupation) => {
                    return {
                        vocabularyName: "occupation",
                        vocabularyEntry: {
                            id: `occupation/${occupation.toLowerCase().replace(/ /g, "_")}`,
                            label: { default: occupation } as InternationalizedLabel,
                        },
                    };
                });
        },
    },

    /** Cultural-Heritage-Object */
    /** Group */ /** Hisotrical-Event */ /** Place*/
    /** type -> groupType, historicalEventType, placeType*/
    type: {
        mapper: (props) => {
            //FIXME: for id do not use value, but similar to what will be provided by backend
            return {
                id: `${props.kind}-type/${String(props.type).toLowerCase().replace(/ /g, "_")}`,
                label: { default: props["type"] } as InternationalizedLabel,
            };
        },
        requiredSourceProps: ["type", "kind"],
        vocabulary: (props) => {
            return {
                vocabularyName: `${props.kind}-type`,
                vocabularyEntry: {
                    id: `${props.kind}-type/${String(props.type).toLowerCase().replace(/ /g, "_")}`,
                    label: { default: props.type } as InternationalizedLabel,
                } as EntityRelationRole,
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
            return `event-kind/${String(props.eventKind)
                .toLowerCase()
                .replace(/ /g, "_")}` as Event["kind"];
        },
        requiredSourceProps: ["eventKind"],
        vocabulary: (props) => {
            return {
                vocabularyName: "event-kind",
                vocabularyEntry: {
                    id: `event-kind/${String(props.eventKind).toLowerCase().replace(/ /g, "_")}`,
                    label: { default: props.eventKind } as InternationalizedLabel,
                } as EventKind,
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
                    role: `role/${String(props.relationRole)
                        .toLowerCase()
                        .replace(/ /g, "_")}` as EntityRelationRole["id"],
                },
            ] as Array<EventEntityRelation>;
        },
        requiredSourceProps: ["entity", "relationRole"],
        fallback: [] as Array<EventEntityRelation>,
        vocabulary: (props) => {
            return {
                vocabularyName: "role",
                vocabularyEntry: {
                    id: `role/${String(props.relationRole).toLowerCase().replace(/ /g, "_")}`,
                    label: { default: props.relationRole } as InternationalizedLabel,
                } as EntityRelationRole,
            };
        },
    },
};
