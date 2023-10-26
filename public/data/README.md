# The InTaVia Excel Template for Local Data Import

InTaVia offers the possibility to integrate local, self-compiled data into the frontend application by import. For this purpose, we provide an Excel template whose structure is very close to the frontend data model (and thus appears somewhat complex).
**Your data remains locally in the browser's memory and is not transferred to any server.**

## Use Case Examples

Explore the use case examples that have been created in the course of the InTaVia project:

-   [Albrecht Dürer](data-duerer_english.xlsx)
-   [Pier Paolo Vergerio](data-vergerio.xlsx)
-   [Herwig Zens](data-zens.xlsx)
-   [Ernest Adamič](data-ernest-adamic.xlsx)
-   [Hofburg Construction History](data-hofburg.xlsx)

## The Master Template

To start your own project, download the [master template](intavia-local-data-master-template.xlsx) and **rename** the file using a short and simple filename (e.g., data-duerer.xlsx; klimtbio.xlsx, etc.).

In the file you can find predefined tabs, including `column-description` where you find detailed information about the different columns of each tab (including if a field is mandatory or optional):

-   entity tabs (only one each allowed): `person`, `cultural-heritage-object`, `group`, `place`
-   event tabs (many tabs allowed, have to start with 'event-'): `event-...`
-   context abs (only one each allowed): `media`, `biography`

### Adding Entities

In InTaVia, an **entity** can either be a `person`, `cultural-heritage-object`, `group`, or `place`. Add the entities to the according tab. Each entity is represented by a **single row** having a **unique entity id** and several other attributes (see `column-description`).

#### Adding Media Resources and Biographies

Media resources and biography texts are captured in two additional context tabs.
Their unique ids can be used to reference/link them in the according fields of an entity record. Multiple entries can be added using a ';' delimiter within the cell. Not only persons but also other entity types can have "biographies".

### Adding Events

**Entities** are related to each others through **events**. Events describe a happening/relation in an entity's "life" or existence (or before or afterwards) in `time`, `space` and `nature`. One or more entities can be related to an event with a given `role`.

You can choose to organize all events in a single `event-` tab or have multiple `event-` tabs to split up events by topic, person, entity kind, etc. For example, have one for the main biography of a main person, and have all events that are mainly related to cultural-heritage-objects in a second tab. Compare the example use cases listed above. **Important:** the ids in each `event-` tab have to be unique (e.g., `ev-001` cannot be used in both tabs; use `pr-ev-001` and `cho-ev-001` instead).

To be able to use the InTaVia platform (i.e., visualizations) to the fullest extent, consider not only filling out the mandatory fields but especially `startDate`, `endDate`, and `place` (using `latitude` and `longitude` in `place` tab for referenced place) of an event. Otherwise, timeline and map visualizations won't be able to show your data.

Each event has its separate row - except for events with more than one related entity (see below). For example, a production event of a painting has a relation to the cultural-heritage-object entity (the painting) and a person entity (the producing artist).

#### Creating events with more than one entity relation.

The template provides a mechanism to add additional entities (+ roles) to an event.
Below the first entry add additional rows for each additional entity that is involved in an event.
For the additional rows only the fields `id`, `relationRole`, and `entity` are used and mandatory (other fields are ignored).
Use the same event id in the additional rows.
Related entities are referenced by id.

Example of an education event with student, institution, teachers, place and duration (not all columns of templated shown here):

| id     | label                                              | relationRole   | entity | kind      | startDate  | endDate    | place  |
| ------ | -------------------------------------------------- | -------------- | ------ | --------- | ---------- | ---------- | ------ |
| ev-054 | Klimt studied at University of Applied Arts Vienna | was student    | pr-001 | education | 1876-01-01 | 1883-12-31 | pl-001 |
| ev-054 |                                                    | was university | gr-001 |           |            |            |        |
| ev-054 |                                                    | was teacher    | pr-002 |           |            |            |        |
| ev-054 |                                                    | was teacher    | pr-003 |           |            |            |        |

where

-   `pr-001` is the **entity id** of the student `Gustav Klimt` listed in the `person` tab
-   `pl-001` is the **entity id** of the location `Vienna` listed in the `place` tab
-   `gr-001` is the **entity id** of the institution `University of Applied Arts Vienna` listed in the `group` tab
-   `pr-002` is the **entity id** of the teacher `Ferdinand Laufberger` listed in the `person` tab
-   `pr-003` is the **entity id** of the teacher `Julius Victor Berger` listed in the `person` tab

## Import Data

1. Open the InTaVia Application and go to [Import & Export Data](https://intavia.acdh-dev.oeaw.ac.at/io).
2. On the `Local Data Import` card click `Select Data` and open the xlsx-file you compiled.
3. A `summary`` shows how many entities (persons, cultural heritage objects, groups or institutions, and places), events, media resources and biography texts will be imported. **Note:** If this summary is not shown the selected file is most likely not an InTaVia data file (a red pop-up/toast on the lower right of the screen provides some indication).
4. In case some data is not well formatted in the data file, a list of `errors` can be opened below the summary. Each row indicates a problem in the data set detailing in which tab, row, and column the problem can be found. To import the data, please first update the problems and try again from (1.).
5. Additionally the `JSON-structure` that is generated from the Excel file and is imported into the local browser store can be viewed.
6. Finally, click `import data`. A white pop-up/toast informs if the import was successful.

### Where do I find my data now?

Local data is stored in a `collection` using the filename of the template (hence, use only a short filename; e.g., projectname.xlsx).
Switch to `Search & Curation`. The collection view is placed on the right-hand side of the screen, where you can select the collection named as the imported file using the drop-down element. All entities are listed here, by opening up an entity's detail view you can also see the related events, media resources and biographical texts you added to the template.

**Note:** The search slot on this page does not search in the local data, only in the backend/InTaVia-Knowledge graph.

**Note:** Currently, if you import a file twice, two collections with the same names are created. However, both collections point to the same data entries, since entities and events have the same ids.

## Further Questions?

Use the [Issues](https://github.com/InTaVia/data-import/issues) of this repository to ask questions, report problems, and find help for the local data import with the Excel template.
