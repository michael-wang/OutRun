import {LinearMipmapLinearFilter,NoColorSpace,RepeatWrapping,TextureLoader} from 'three';
import tileUrl from './assets/coast-meadow.png';

// Linear channels encode patch tone, overhead blade relief and side-on tufts, respectively.
export async function loadMeadowTexture(){
 const tile=await new TextureLoader().loadAsync(tileUrl);
 tile.name='coastal meadow surface';
 tile.colorSpace=NoColorSpace;
 tile.wrapS=tile.wrapT=RepeatWrapping;
 tile.minFilter=LinearMipmapLinearFilter;
 tile.anisotropy=2;
 return tile;
}
