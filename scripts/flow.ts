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
import AnimationCenter from './animation';

const face: Face = FaceTracking.face(0);
const faceTransform: TransformSignal = face.cameraTransform;

export default class Flow {
  private util: Util;
  private focalDistance: FocalDistance;
  private factory: Factory;
  private planes: PlaneActions;
  private anime: AnimationCenter;

  constructor({ focalDistance }: { focalDistance: FocalDistance }){
    this.factory = new Factory({ focalDistance });
    this.util = new Util();
    this.planes = new PlaneActions({ focalDistance });
    this.focalDistance = focalDistance;
    this.anime = new AnimationCenter();
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

    await this.util.delay({ ms: 800 });

    await this.glitchScreen({ ms: 400 });

    this.firstActionMakeBgWallPaper({ bgRect, personRect, wallMat: bgMats[3], personCamTexMat: personMats[2] });

    await this.util.delay({ ms: 800 });

    await this.glitchScreen({ ms: 400 });

    this.secondActionShowBlueScreen({ bgRect, personRect, blueMat: bgMats[1] });

    await this.util.delay({ ms: 200 });
    
    await this.glitchScreen({ ms: 200 });

    this.thirdActionSegmentBlueScreenOverWall({ bgRect, bgWallMat: bgMats[0], personRect, personBlueMat: personMats[0] });
    
    await this.glitchScreen({ ms: 100 });

    await this.util.delay({ ms: 100 });

    await this.fourthActionLeaveATrace({ windowMat: windowMats[1] })
    
    await this.util.delay({ ms: 100 });

    await this.fifthActionWinamp({ windowMat: windowMats[3] });

    await this.glitchScreen({ ms: 100 });

    await this.sixthActionPaint({ windowMat: windowMats[2] })

    await this.glitchScreen({ ms: 100 });

    await this.talePlanes({ windowMats });
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

  private async fourthActionLeaveATrace({ windowMat }: { windowMat: MaterialBase }) {
    const counter = this.util.createLoopCount(50);

    const [planeTraceGroup, planeArray] = await Promise.all([
      this.factory.createNullInstance({ name: 'planeTraceGroup' }),
      Promise.all(
        counter.map(async (item) => {
          return this.factory.createPlaneInstance({
            name: `plane${item}`,
            hidden: Reactive.val(false),
          });
        })
      ),
    ]);

    this.focalDistance.addChild(planeTraceGroup);
    
    planeArray.map((plane: Plane) => {
      planeTraceGroup.addChild(plane);
      plane.material = windowMat;

      plane.y = Reactive.val(2);
      plane.x = Reactive.val(2);

      plane.hidden = Reactive.val(true);
    })
    
    for (const plane of planeArray) {
      plane.y = face.cameraTransform.y.pin();
      plane.x = face.cameraTransform.x.pin();

      plane.hidden = Reactive.val(false);

      await this.util.delay({ ms: 50 });
    }

    planeArray.map((plane) => plane.hidden = Reactive.val(true));
  }

  private async talePlanes({ windowMats }: { windowMats: MaterialBase[] }) {
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

  private async fifthActionWinamp({ windowMat }: { windowMat: MaterialBase }) {
    const counter = this.util.createLoopCount(10);

    const [planeWinampGroup, planeArray] = await Promise.all([
      this.factory.createNullInstance({ name: 'planeTraceGroup' }),
      Promise.all(
        counter.map(async (item) => {
          return this.factory.createPlaneInstance({
            name: `planeWinamp${item}`,
            height: 0.2
          });
        })
      ),
    ]);

    this.focalDistance.addChild(planeWinampGroup);
    
    planeArray.map((plane: Plane) => {
      planeWinampGroup.addChild(plane);
      plane.material = windowMat;

      plane.y = Reactive.val(2);
      plane.x = Reactive.val(2);

      plane.hidden = Reactive.val(true);
    })

    for (const plane of planeArray) {
      const index = planeArray.indexOf(plane);
      Diagnostics.log(`${index}, ${index * 2} : ${Math.random()}`)

      plane.x = Reactive.val(Math.random() / 10 - 0.07);
      plane.y = Reactive.val(Math.random() / 10 - 0.07);
      // plane.x = Reactive.val(index / 10 - 0.08);
      // plane.y = Reactive.val(index / 10 - 0.08);

      plane.hidden = Reactive.val(false);

      await this.util.delay({ ms: 100 });
    }

    planeArray.map((plane) => plane.hidden = Reactive.val(true));
  }

  private async sixthActionPaint({ windowMat }: { windowMat: MaterialBase }) {
    const [planePaint, planeBucket, planeBucketMat, bucketIcon] = await Promise.all([
      this.factory.createPlaneInstance({ name: 'planePaint', height: 0.15 }),
      this.factory.createPlaneInstance({ name: 'planeBucket', width: 0.02, height: 0.02 }),
      this.factory.createMaterialInstance({ name: 'paintPlaneMat' }),
      this.factory.findTexture({ name: 'bucketIcon' }),
    ])

    this.focalDistance.addChild(planePaint);
    this.focalDistance.addChild(planeBucket);

    planePaint.material = windowMat;
    planePaint.x = faceTransform.position.x;
    planePaint.y = faceTransform.position.y;

    planeBucketMat.diffuse = bucketIcon;
    planeBucket.material = planeBucketMat;

    const animation1 = this.anime.simpleMovement({ loopCount: 4, ms: 300 });
    const animation2 = this.anime.simpleMovement({ loopCount: 3, ms: 400 });

    planeBucket.x = planePaint.boundingBox.min.x.add(0.01).add(animation1)
    planeBucket.y = planePaint.boundingBox.min.y.add(0.01).add(animation2);
    
    await this.util.delay({ ms: 1200 });

    planePaint.hidden = Reactive.val(true);
    planeBucket.hidden = Reactive.val(true);
    // const animation = this.anime.compoundMovement();

    // planeBucket.x = planePaint.boundingBox.min.x.add(0.01).add(animation)
    // planeBucket.y = planePaint.boundingBox.min.y.add(0.01).add(animation.mul(-1));
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
    // trail windows single face transform
    // trail windows multiple from bottom left to top right
    // transition (not decided) to:
    // pop up faces +
    // kiss cam on demand?
    // winamp with matrixified panel and sound sensitive parts
    // paint with multi color face + paintBucket symbol
    // ending with windows shut down sound and return to self

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