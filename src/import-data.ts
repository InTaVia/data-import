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
    onError: (error: string) => void;
}

export function importData(params: ImportDataParams): void {
    const { file, onSuccess, onError } = params;

    const reader = new FileReader();

    reader.onload = function onImportSuccess(event) {
        const binaryString = event.target?.result;
        const workbook = XLSX.read(binaryString, { type: "binary" });

        const idPrefix = file.name.replace(/\.xlsx$/, "");
        // each row of all sheets is imported to an json object
        const importedData = readDataFromXlsxWorkbook(workbook, idPrefix);
        const transformedData: ImportData = transformData(importedData, idPrefix);

        onSuccess(transformedData);
    };

    reader.onerror = function onImportError() {
        onError("import error");
    };

    reader.readAsBinaryString(file);
}
