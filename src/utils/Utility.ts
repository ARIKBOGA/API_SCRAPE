export function serializeMap(map: any): any {
  if (map instanceof Map) {
    const obj: any = {};
    for (const [key, value] of map.entries()) {
      obj[key] = serializeMap(value);
    }
    return obj;
  } else if (Array.isArray(map)) {
    return map.map(item => serializeMap(item));
  } else {
    return map; // primitive value (string, number, boolean vs.)
  }
}

export function serialize3LevelMap(map: Map<string, Map<string, Map<string, string[]>>>): any {
  const result: any = {};
  
  for (const [key1, level2Map] of map.entries()) {
    result[key1] = {};
    
    for (const [key2, level3Map] of level2Map.entries()) {
      result[key1][key2] = {};
      
      for (const [key3, stringArray] of level3Map.entries()) {
        result[key1][key2][key3] = stringArray;
      }
    }
  }
  
  return result;
}

export function serializeArrayOfMaps(arr: Array<Map<string, Map<string, string[]>>>): any[] {
  return arr.map(map => {
    const obj: any = {};
    for (const [key1, innerMap] of map.entries()) {
      obj[key1] = {};
      for (const [key2, stringArrayMap] of innerMap.entries()) {
        obj[key1][key2] = stringArrayMap;
      }
    }
    return obj;
  });
}
