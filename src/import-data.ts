import * as XLSX from "xlsx";
import type { Entity, Event } from "@intavia/api-client";
import { readDataFromXlsxWorkbook } from "./read-xlsx-workbook";
import { transformData } from "./transform-data";

export interface ImportData {
    entities: Array<Entity>;
    events: Array<Event>;
    vocabularies: Record<string, unknown>;
    unmappedEntries: Array<unknown>;
    eventCollections: Record<string, Array<string>>;
}

interface ImportDataParams {
    file: File;
    onSuccess: (data: ImportData) => void;
    onError: () => void;
}

export function importData(params: ImportDataParams): void {
    const { file, onSuccess, onError } = params;

    const reader = new FileReader();

    reader.onload = function onImportSuccess(event) {
        const binaryString = event.target?.result;
        const workbook = XLSX.read(binaryString, { type: "binary" });
        // each row in all sheets is imported to an json object
        const idPrefix = file.name.replace(/\.xlsx$/, "");
        const importedData = readDataFromXlsxWorkbook(workbook, idPrefix);
        const transformedData: ImportData = transformData(importedData, idPrefix);

        onSuccess(transformedData as ImportData); // FIXME: avoid type cast
    };

    reader.onerror = function onImportError() {
        onError();
    };

    reader.readAsBinaryString(file);
}
