import type { WorkBook } from "xlsx";
import { utils as xlsxUtils } from "xlsx";
import { sheetKinds, prefixProps } from "./config";

export function readDataFromXlsxWorkbook(
    workbook: WorkBook,
    idPrefix: string
): Array<Record<string, unknown>> {
    const worksheetNames = workbook.SheetNames;
    let input: Array<Record<string, unknown>> = [];
    for (const sheetKind of sheetKinds) {
        const matchedSheetNames = worksheetNames.filter((wsName) => {
            return wsName.startsWith(sheetKind);
        });

        for (const matchedSheetName of matchedSheetNames) {
            const sheet = workbook.Sheets[matchedSheetName];

            if (sheet != null) {
                let jsonInput = xlsxUtils.sheet_to_json(sheet) as Array<Record<string, unknown>>;

                /** Filter out keys with whitespace-only values. */
                jsonInput = jsonInput
                    .map((jsonObject, index) => {
                        const row: Record<string, unknown> = Object.fromEntries(
                            Object.entries(jsonObject).filter(([_, value]) => {
                                const valueStr: string = String(value);
                                return value != null && valueStr.trim().length > 0;
                            })
                        );

                        for (const prefixProp of prefixProps) {
                            if (prefixProp in row) {
                                const idValue = row[prefixProp] as string;
                                row[prefixProp] = `${idPrefix}-${idValue.replace("/", "-")}`;
                            }
                        }

                        if (sheetKind === "event") {
                            if (row.kind != null && String(row.kind).trim().length > 0) {
                                row["eventKind"] = row.kind;
                            } else {
                                row["eventKind"] = sheetKind;
                            }
                        }

                        if (sheetKind === "media") {
                            if (row.kind != null && String(row.kind).trim().length > 0) {
                                row["mediaKind"] = row.kind;
                            } else {
                                row["mediaKind"] = sheetKind;
                            }
                        }

                        if (sheetKind === "tagging") {
                            // console.log(row);
                            if (
                                row.entitySheets != null &&
                                String(row.entitySheets).trim().length > 0 &&
                                String(row.entitySheets).trim().split(";").length > 0
                            ) {
                                row.entitySheets = String(row.entitySheets)
                                    .trim()
                                    .split(";")
                                    .map((sheetName) => {
                                        return sheetName.trim();
                                    })
                                    .filter((sheetName) => {
                                        //FIXME: Track if sheet not included (save as error)
                                        return worksheetNames.includes(sheetName);
                                    });
                            } else {
                                row.entitySheets = [];
                            }

                            if (
                                row.eventSheets != null &&
                                String(row.eventSheets).trim().length > 0 &&
                                String(row.eventSheets).trim().split(";").length > 0
                            ) {
                                row.eventSheets = String(row.eventSheets)
                                    .trim()
                                    .split(";")
                                    .map((sheetName) => {
                                        return sheetName.trim();
                                    })
                                    .filter((sheetName) => {
                                        //FIXME: Track if sheet not included (save as error)
                                        return worksheetNames.includes(sheetName);
                                    });
                            } else {
                                row.eventSheets = [];
                            }
                        }

                        if (Object.keys(row).length !== 0) {
                            return {
                                ...row,
                                kind: sheetKind,
                                sheetName: matchedSheetName,
                                rowNumber: index + 2,
                            };
                        } else {
                            return {};
                        }
                    })
                    .filter((value) => Object.keys(value).length !== 0);

                input.push(...jsonInput);
            }
        }
    }

    return input;
}
