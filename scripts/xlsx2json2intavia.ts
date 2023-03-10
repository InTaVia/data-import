import { mkdir, writeFile, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { format } from "prettier";
import { keyBy } from "@stefanprobst/key-by";
import * as XLSX from "xlsx";
import { readDataFromXlsxWorkbook, transformData } from "../src";

interface GenerateParams {
    path: string;
    idPrefix?: string;
    collectionLabels?: Record<string, string>;
}

async function generate(params: GenerateParams) {
    const { path, idPrefix: _idPrefix, collectionLabels } = params;
    const buffer = await readFile(path);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const idPrefix = _idPrefix || basename(path).replace(/\.xlsx$/, "");
    const importedData = readDataFromXlsxWorkbook(workbook, idPrefix);
    const transformedData = transformData({ input: importedData, idPrefix, collectionLabels });

    const transformedDataById = {
        ...transformedData,
        entities: keyBy(transformedData.entities!, (entity) => {
            return entity.id;
        }),
        events: keyBy(transformedData.events!, (event) => {
            return event.id;
        }),
    };

    const fixturesFolder = join(process.cwd(), "public", "fixtures");
    await mkdir(fixturesFolder, { recursive: true });

    await writeFile(
        join(fixturesFolder, `${idPrefix}.json`),
        format(JSON.stringify(transformedData), { parser: "json" }),
        { encoding: "utf-8" }
    );
    await writeFile(
        join(fixturesFolder, `${idPrefix}-by-id.json`),
        format(JSON.stringify(transformedDataById), { parser: "json" }),
        { encoding: "utf-8" }
    );
}

generate({
    path: "public/data/data-duerer.xlsx",
    idPrefix: "duerer",
    collectionLabels: {
        all: "Albrecht Dürer",
        "event-dürer-macro": "Albrecht Dürer Makro Biographie",
        "event-dürer-reise-niederlande": "Albrecht Dürer Reise Niederlande",
        "event-cho": "Objekte Reise Niederlande",
    },
})
    .then(() => {
        console.log(`Successfully generated data.`);
    })
    .catch((error) => {
        console.log(`Failed to generate data.\n`, String(error));
    });
