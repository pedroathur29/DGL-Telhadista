// texturas geradas uma vez a partir do código de roof-scene.js (buildTextures) e salvas em WebP
import clay_map from './clay-map.webp';
import clay_normalMap from './clay-normalMap.webp';
import clay_roughnessMap from './clay-roughnessMap.webp';
import concrete_map from './concrete-map.webp';
import concrete_normalMap from './concrete-normalMap.webp';
import concrete_roughnessMap from './concrete-roughnessMap.webp';
import grass_map from './grass-map.webp';
import grass_normalMap from './grass-normalMap.webp';
import grass_roughnessMap from './grass-roughnessMap.webp';
import plaster_map from './plaster-map.webp';
import plaster_normalMap from './plaster-normalMap.webp';
import plaster_roughnessMap from './plaster-roughnessMap.webp';
import wood_map from './wood-map.webp';
import wood_normalMap from './wood-normalMap.webp';
import wood_roughnessMap from './wood-roughnessMap.webp';

// versões com metade da resolução, para a faixa baixa de qualidade (quality.js); as de 256 px são as mesmas
import low_clay_map from './low/clay-map.webp';
import low_clay_normalMap from './low/clay-normalMap.webp';
import low_concrete_map from './low/concrete-map.webp';
import low_concrete_normalMap from './low/concrete-normalMap.webp';
import low_grass_map from './low/grass-map.webp';
import low_grass_normalMap from './low/grass-normalMap.webp';
import low_plaster_map from './low/plaster-map.webp';
import low_plaster_normalMap from './low/plaster-normalMap.webp';
import low_wood_map from './low/wood-map.webp';
import low_wood_normalMap from './low/wood-normalMap.webp';

export default {
  clay: { map: clay_map, normalMap: clay_normalMap, roughnessMap: clay_roughnessMap },
  concrete: { map: concrete_map, normalMap: concrete_normalMap, roughnessMap: concrete_roughnessMap },
  grass: { map: grass_map, normalMap: grass_normalMap, roughnessMap: grass_roughnessMap },
  plaster: { map: plaster_map, normalMap: plaster_normalMap, roughnessMap: plaster_roughnessMap },
  wood: { map: wood_map, normalMap: wood_normalMap, roughnessMap: wood_roughnessMap }
};

export const LOW = {
  clay: { map: low_clay_map, normalMap: low_clay_normalMap, roughnessMap: clay_roughnessMap },
  concrete: { map: low_concrete_map, normalMap: low_concrete_normalMap, roughnessMap: concrete_roughnessMap },
  grass: { map: low_grass_map, normalMap: low_grass_normalMap, roughnessMap: grass_roughnessMap },
  plaster: { map: low_plaster_map, normalMap: low_plaster_normalMap, roughnessMap: plaster_roughnessMap },
  wood: { map: low_wood_map, normalMap: low_wood_normalMap, roughnessMap: wood_roughnessMap }
};
