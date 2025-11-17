import { ModelData } from "../../utils/Types";
import initialModelData from "../../resources/catalog/jsons/MODELLER.json";
import initialMarkaData from '../../resources/catalog/jsons/MARKALAR.json';

export const modelDataMap = new Map<string, ModelData>();
(initialModelData as ModelData[]).forEach(model => {
    const key = `${model["modeller_markalar::marka"].trim().toUpperCase()}_${model.model.trim().toUpperCase()}`;
    modelDataMap.set(key, model);
});

// Import Marka (Brand) data and store it in a map for easy lookup
export const markaNameToIdMap = new Map<string, number>();
for (const [idString, name] of Object.entries(initialMarkaData)) {
    markaNameToIdMap.set(name.trim().toUpperCase(), parseInt(idString));
}