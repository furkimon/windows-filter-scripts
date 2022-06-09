import Scene from 'Scene';
import Materials from 'Materials';
import Textures from 'Textures';
import CameraInfo from 'CameraInfo';
import Shaders from 'Shaders';
import Reactive from 'Reactive';
import Diagnostics from 'Diagnostics';

import Factory from './factory';
import Util from './util';
import AnimationCenter from './animation';

export default class RectActions {
  private factory: Factory;
  private util: Util;
  private camTex: TextureBase;
  private anime: AnimationCenter;
  private fD: FocalDistance;

  constructor({ camTex, focalDistance }: { camTex: TextureBase; focalDistance: FocalDistance }) {
    this.factory = new Factory({ focalDistance });
    this.util = new Util();
    this.camTex = camTex;
    this.anime = new AnimationCenter();
    this.fD = focalDistance;
  }

  async animateRect() {
    const color = this.anime.lightUpRedGreenAnimation();

    const [rect, mat] = await Promise.all([
      this.factory.createRectWithCanvas(),
      this.factory.createColoredMaterial({ tex: this.camTex, color}),
    ]);
    
    rect.material = mat;
    return rect;
    // const shade = this.factory.createShadesForTexture({ tex: this.camTex, color });
  }
   // async giveRectAnimation ({ tex, rect }: { tex: TextureBase; rect: PlanarImage }) {
  //   const [matNew, shadedTex] = await Promise.all([
  //     this.createMaterialInstance({ name: 'matNew' }),
  //     this.createShadesForTexture({ tex }),
  //   ]);

  //   matNew.setTextureSlot(Shaders.DefaultMaterialTextures.DIFFUSE, shadedTex);

  //   rect.material = matNew;
  // }
}