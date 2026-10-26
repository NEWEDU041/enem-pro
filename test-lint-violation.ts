// Arquivo de teste com violações intencionais de lint
const unused_var = "this is unused";
const    poorly_spaced = "bad formatting";

export function badFunction( ){
  const anotherUnused = 42;
  return   "badly   spaced";
}

// Missing semicolons; inconsistent formatting
export const object = {key1:"value1",key2:  "value2",key3:"value3"};
