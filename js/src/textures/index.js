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

export default {
  clay: { map: clay_map, normalMap: clay_normalMap, roughnessMap: clay_roughnessMap },
  concrete: { map: concrete_map, normalMap: concrete_normalMap, roughnessMap: concrete_roughnessMap },
  grass: { map: grass_map, normalMap: grass_normalMap, roughnessMap: grass_roughnessMap },
  plaster: { map: plaster_map, normalMap: plaster_normalMap, roughnessMap: plaster_roughnessMap },
  wood: { map: wood_map, normalMap: wood_normalMap, roughnessMap: wood_roughnessMap }
};
