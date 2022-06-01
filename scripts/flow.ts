import Scene from 'Scene';
import Reactive from 'Reactive';
import Time from 'Time';
import Diagnostics from 'Diagnostics';
import FaceTracking from 'FaceTracking';
import Patches from 'Patches';
import FaceGestures from 'FaceGestures';

import PlaneActions from './planeActions';
import Util from './util';
import Factory from './factory';

const face: Face = FaceTracking.face(0);
const faceTransform: TransformSignal = face.cameraTransform;

export default class Flow {
  private util: Util;
  private focalDistance: FocalDistance;
  private factory: Factory;
  private planes: PlaneActions;

  constructor({ focalDistance }: { focalDistance: FocalDistance }){
    this.factory = new Factory({ focalDistance });
    this.util = new Util();
    this.planes = new PlaneActions({ focalDistance });
    this.focalDistance = focalDistance;
  }
  
  private async obtainNecessities() {
    const [
    personMats,
    bgMats,
    windowMats,
    frameTexs,
    screenTexs,
    canvas,
    bgRect,
    personRect,
    camera,
  ] = await Promise.all([
      this.factory.findMaterials({ prefix: 'person' }),
      this.factory.findMaterials({ prefix: 'bg' }),
      this.factory.findMaterials({ prefix: 'window' }),
      this.factory.findTextures({ prefix: 'frame' }),
      this.factory.findTextures({ prefix: 'screen' }),
      this.factory.createCanvasInFocalDistance({ name: 'canvas1' }),
      this.factory.createRectangleInstance({ name: 'bg' }),
      this.factory.createRectangleInstance({ name: 'person' }),
      this.factory.getCamera(),
    ]);

    return { personMats, bgMats, windowMats, frameTexs, canvas, bgRect, personRect, camera, screenTexs };
  }

  async startFlow() {
    const { personMats, bgMats, windowMats, frameTexs, canvas, bgRect, personRect, camera, screenTexs } = await this.obtainNecessities();
    
    canvas.setMode(Scene.RenderMode.WORLD_SPACE);

    this.factory.centerRect({ rect: bgRect, camera });
    this.factory.centerRect({ rect: personRect, camera });

    canvas.addChild(bgRect);
    canvas.addChild(personRect);

    bgRect.material = bgMats[2]
    personRect.hidden = Reactive.val(true);

    await this.util.delay({ ms: 80 });

    await this.glitchScreen({ ms: 40 });

    this.firstActionMakeBgWallPaper({ bgRect, personRect, wallMat: bgMats[3], personCamTexMat: personMats[2] });

    await this.util.delay({ ms: 80 });

    await this.glitchScreen({ ms: 40 });

    this.secondActionShowBlueScreen({ bgRect, personRect, blueMat: bgMats[1] });

    await this.util.delay({ ms: 20 });
    
    await this.glitchScreen({ ms: 20 });

    this.thirdActionSegmentBlueScreenOverWall({ bgRect, bgWallMat: bgMats[0], personRect, personBlueMat: personMats[0] });
    
    await this.glitchScreen({ ms: 10 });

    await this.util.delay({ ms: 100 });

    // await this.fourthActionTalePlanes({ windowMats });

    await this.leaveATrace({ windowMat: windowMats[1] })
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

  private thirdActionSegmentBlueScreenOverWall({
    bgRect,
    personRect,
    bgWallMat,
    personBlueMat,
  }: {
    bgRect: PlanarImage;
    personRect: PlanarImage;
    bgWallMat: MaterialBase;
    personBlueMat: MaterialBase;
  }) {
    personRect.hidden = Reactive.val(false);
    bgRect.material = bgWallMat;
    personRect.material = personBlueMat;
  }

  private async fourthActionTalePlanes({ windowMats }: { windowMats: MaterialBase[] }) {
    const counter = [1,2,3,4,5];

    const [
      planeGroup,
      planeArray,
    ] = await Promise.all([
      this.factory.createNullInstance({ name: 'planeGroup' }),
      Promise.all(
        counter.map(async (item) => {
          let plane = await this.factory.createPlaneInstance({ name: `plane${item}` });
  
          plane.material = windowMats[0];
  
          return plane as Plane;
        }),
      ),
    ]);

    const sortedArray = this.util.sortPlaneArrayByName(planeArray);

    this.planes.givePlaneFacePositionMultiplied({
      plane: sortedArray[planeArray.length - 1],
      faceTransform,
    });

    this.planes.followPlanesByPlanes({ planeArray: sortedArray });
      
    this.focalDistance.addChild(planeGroup);
    
    sortedArray.map((plane) => planeGroup.addChild(plane));
  }

  private async kissCamOnDemand({ windowMat }: { windowMat: MaterialBase }) {
    // const isKissing = await Patches.outputs.getBoolean('isKissing');
    const isKissing = FaceGestures.isKissing(face);

    const plane = await this.factory.createPlaneInstance({
      name: `planeKiss`,
      width: 0.2,
      height: 0.2,
    });
    const mat = await this.factory.findMaterial({ name: 'try' })
    plane.material = windowMat;

    this.focalDistance.addChild(plane);
    plane.hidden = Reactive.val(false);
    plane.transform.x = face.cameraTransform.applyToPoint(face.mouth.center).x;
    plane.transform.y = face.cameraTransform.applyToPoint(face.mouth.center).y;
  

    // plane.hidden = Reactive.val(!isKissing);
    // isKissing.monitor().subscribe(async (event: any) => {
    //   Diagnostics.log(event)
    //   plane.hidden = Reactive.val(!event.newValue);
    // })
  }

  private async leaveATrace({ windowMat }: { windowMat: MaterialBase }) {
    const counter = this.util.createLoopCount(30);

    const [planeTraceGroup, planeArray] = await Promise.all([
      this.factory.createNullInstance({ name: 'planeTraceGroup' }),
      Promise.all(
        counter.map(async (item) => {
          return this.factory.createPlaneInstance({ name: `plane${item}`, hidden: false });
        })
      ),
    ]);

    this.focalDistance.addChild(planeTraceGroup);

    let i = 0;
    const interval = Time.setInterval(() => {
      const plane = planeArray[i];

      plane.x = face.cameraTransform.x.pin(); // Reactive.val(0.01 * i);
      plane.y = face.cameraTransform.y.pin(); // Reactive.val(0.01 * i);

      planeTraceGroup.addChild(plane);
      plane.material = windowMat;

      plane.hidden = Reactive.val(false);
      i += 1;
    }, 100);

    Time.setTimeout(() => Time.clearInterval(interval), 3000)
  }

  private async glitchScreen({ ms }: { ms: number }) {
    await Patches.inputs.setBoolean('allowGlitch', true);
    return new Promise(resolve => Time.setTimeout(async () => {
      await Patches.inputs.setBoolean('allowGlitch', false);
      resolve('done');
    }, ms));
  }
}



    // FLOW

    // start with cam tex => bgRect gets camTex +
    // shake screen up and down with color flashes => bgTex gets shaken (-)
    // bg as the wallpaper => bgTex gets the wallpaper, personRect gets regular camTex ('person' mat) +
    // show blue screen => personRect gets hidden, bgRect gets blue screen mat +
    // make blue screen glitch => bgRect gets glitch +
    // blue screen segmentation with the wallpaper as bg => bgRect gets the wall as mat, personRect gets blue as mat +
    // third actions segmentation needs ghostlike shade +
    // pop up faces +
    // kiss cam on demand

    // NEEDS

    // focal distance +
    // camera texture +
    // fitted wall paper as bg mat +
    // fitted blue screen as bg mat +
    // fitted wall paper as person segment mat +
    // fitted blue as person segment mat +
    // glitch block? +
    // window mat +
    // frame textures +
    // windows start sound
    // windows warning sound