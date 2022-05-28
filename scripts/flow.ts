import Util from './util';
import Factory from './factory';
import Scene from 'Scene';
import Reactive from 'Reactive';
import Time from 'Time';
import Diagnostics from 'Diagnostics';

export default class Flow {
  private util: Util;
  private focalDistance: FocalDistance;
  private factory: Factory;

  constructor({ focalDistance }: { focalDistance: FocalDistance }){
    this.factory = new Factory({ focalDistance });
  }
  
  private async obtainNecessities() {
    const [
    personMats,
    bgMats,
    windowMats,
    frameTexs,
    canvas,
    bgRect,
    personRect,
    camera,
  ] = await Promise.all([
      this.factory.findMaterials({ prefix: 'person' }),
      this.factory.findMaterials({ prefix: 'bg' }),
      this.factory.findMaterials({ prefix: 'window' }),
      this.factory.findTextures({ prefix: 'frame' }),
      this.factory.createCanvasInFocalDistance({ name: 'canvas1' }),
      this.factory.createRectangleInstance({ name: 'bg' }),
      this.factory.createRectangleInstance({ name: 'person' }),
      this.factory.getCamera(),
    ]);

    return { personMats, bgMats, windowMats, frameTexs, canvas, bgRect, personRect, camera };
  }

  async startFlow() {
    const { personMats, bgMats, windowMats, frameTexs, canvas, bgRect, personRect, camera } = await this.obtainNecessities();
    
    canvas.setMode(Scene.RenderMode.WORLD_SPACE);

    this.factory.centerRect({ rect: bgRect, camera });
    this.factory.centerRect({ rect: personRect, camera });

    canvas.addChild(bgRect);
    canvas.addChild(personRect);

    bgRect.material = bgMats[2]
    personRect.hidden = Reactive.val(true);
    // personRect.material = personMats[2]
    // await this.util.delay({ ms: 2000 });

  
    let i = 0;
    while (i < 2) {
      Diagnostics.log(`i : ${i}`);
      await new Promise(function(resolve, reject) {
        Time.setTimeout(() => resolve("I am done"), 2000);
      });
      if (i === 0) this.firstActionMakeBgWallPaper({ bgRect, personRect, wallMat: bgMats[0], personCamTexMat: personMats[2] });
      if (i === 1) this.secondActionShowBlueScreen({ bgRect, personRect, blueMat: bgMats[1] });
      if (i === 2) Diagnostics.log('hey done!')
      i++
    }
  }

  private firstActionMakeBgWallPaper({
    bgRect,
    personRect,
    wallMat,
    personCamTexMat,
  }: {
    bgRect: PlanarImage;
    personRect: PlanarImage;
    wallMat: MaterialBase;
    personCamTexMat: MaterialBase;
  }) {
    bgRect.material = wallMat;
    personRect.material = personCamTexMat;
    personRect.hidden = Reactive.val(false);
  }

  private secondActionShowBlueScreen({
    bgRect,
    personRect,
    blueMat,
  }: {
    bgRect: PlanarImage;
    personRect: PlanarImage;
    blueMat: MaterialBase;
  }) {
    personRect.hidden = Reactive.val(true);
    bgRect.material = blueMat;
  }
}
    // start with cam tex => bgRect gets camTex +
    // shake screen up and down with color flashes => bgTex gets shaken (-)
    // bg as the wallpaper => bgTex gets the wallpaper, personRect gets regular camTex ('person' mat) +
    // show blue screen => personRect gets hidden, bgRect gets blue screen mat +
    // make blue screen glitch => bgRect gets glitch
    // blue screen segmentation with the wallpaper as bg => bgRect gets the wall as mat, personRect gets blue as mat
    // pop up faces => windows are hidden:false

    // needs:
    // focal distance +
    // camera texture +
    // fitted wall paper as bg mat +
    // fitted blue screen as bg mat +
    // fitted wall paper as person segment mat +
    // fitted blue as person segment mat +
    // glitch block?
    // window mat +
    // frame textures