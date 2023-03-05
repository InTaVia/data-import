import * as XLSX from "xlsx";
import type { Biography, Entity, Event, MediaResource, VocabularyEntry } from "@intavia/api-client";
import { readDataFromXlsxWorkbook } from "./read-xlsx-workbook";
import { transformData } from "./transform-data";

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
        idPrefix = file.name.replace(/\.xlsx$/, ""),
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
