import * as XLSX from "xlsx";
import type { Biography, Entity, Event, MediaResource, VocabularyEntry } from "@intavia/api-client";
import { readDataFromXlsxWorkbook } from "./read-xlsx-workbook";
import { transformData } from "./transform-data";
import { TagCandidate } from "./types";

export interface CollectionCandidate {
    label: string;
    entities: Array<Entity["id"]>;
    events: Array<Event["id"]>;
}

export interface ImportData {
    entities?: Array<Entity>;
    events?: Array<Event>;
    media?: Array<MediaResource>;
    biographies?: Array<Biography>;
    vocabularies?: Record<string, Array<VocabularyEntry>>;
    unmappedEntries?: Array<unknown>;
    collections?: Record<string, CollectionCandidate>;
    tags?: Array<TagCandidate>;
    upstreamEntityIds?: Array<Entity["id"]>;
}

interface ImportDataParams {
    file: File;
    onSuccess: (data: ImportData) => void;
    onError: (error: string) => void;
    idPrefix?: string;
    collectionLabels?: Record<string, string>;
}

export function importData(params: ImportDataParams): void {
    const {
        file,
        onSuccess,
        onError,
        idPrefix = file.name.replace(/(\.xlsx|\.json)$/, ""),
        collectionLabels,
    } = params;

    const reader = new FileReader();

    reader.onload = function onImportSuccess(event) {
        const binaryString = event.target?.result;
        const workbook = XLSX.read(binaryString, { type: "binary" });

        // each row of all sheets is imported to an json object
        const importedData = readDataFromXlsxWorkbook(workbook, idPrefix);
        const transformedData: ImportData = transformData({
            input: importedData,
            idPrefix,
            collectionLabels,
        });

        onSuccess(transformedData);
    };

    reader.onerror = function onImportError() {
        onError("import error");
    };

    reader.readAsBinaryString(file);
}

export function readJsonFile(
    file: File,
    onSuccess: (data: ImportData) => void,
    onError: (error: string) => void
) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        const result = JSON.parse(reader.result as string) as ImportData;

        // add all entities to a new collection if dataset doesn't contain collections
        if (!result.collections || Object.keys(result.collections).length === 0) {
            const collectionName = file.name.replace(".json", "");
            result.collections = {
                collectionName: {
                    label: collectionName,
                    entities: result.entities
                        ? result.entities.map((entity) => {
                              return entity.id;
                          })
                        : [],
                    events: result.events
                        ? result.events.map((event) => {
                              return event.id;
                          })
                        : [],
                },
            };
        }

        onSuccess(result);
    });

    reader.onerror = () => {
        onError("import error");
    };

    reader.readAsText(file);
}
