import { ModelData } from "../../utils/Types";
import initialModelData from "../../resources/data/catalogInfo/jsons/model_catalog.json";

export const modelDataMap = new Map<string, ModelData>();
(initialModelData as ModelData[]).forEach(model => {
    const key = `${model["modeller_markalar::marka"].trim().toUpperCase()}_${model.model.trim().toUpperCase()}`;
    modelDataMap.set(key, model);
});