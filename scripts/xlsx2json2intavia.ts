import { mkdir, writeFile, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { format } from "prettier";
import * as XLSX from "xlsx";
import { readDataFromXlsxWorkbook, transformData } from "../src";

async function generate(path: any) {
    const buffer = await readFile(path);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const idPrefix = basename(path).replace(/\.xlsx$/, "");
    const importedData = readDataFromXlsxWorkbook(workbook, idPrefix);
    const transformedData = transformData(importedData, idPrefix);

    const fixturesFolder = join(process.cwd(), "public", "fixtures");
    await mkdir(fixturesFolder, { recursive: true });

    await writeFile(
        join(fixturesFolder, `${idPrefix}.json`),
        format(JSON.stringify(transformedData), { parser: "json" }),
        { encoding: "utf-8" }
    );
}

generate("public/data/data-duerer.xlsx")
    .then(() => {
        console.log(`Successfully generated data.`);
    })
    .catch((error) => {
        console.log(`Failed to generate data.\n`, String(error));
    });
