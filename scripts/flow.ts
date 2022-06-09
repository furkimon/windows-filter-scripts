import Scene from 'Scene';
import Reactive from 'Reactive';
import Time from 'Time';
import Diagnostics from 'Diagnostics';
import FaceTracking from 'FaceTracking';
import Patches from 'Patches';
import FaceGestures from 'FaceGestures';
import NativeUI from 'NativeUI';
import Materials from 'Materials';
import Textures from 'Textures';
import TouchGestures from 'TouchGestures';
import CameraInfo from 'CameraInfo';

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

  async startFlow(necessities: any, initialPact: any) {
    const {
      taleArray,
      traceArray,
      winampArray,
      planePaint,
      planeBucket,
    } = necessities;

    const {
      personMats,
      bgMats,
      canvas,
      bgRect,
      personRect,
      camera,
    } =  initialPact;
    
    this.factory.initiateCanvasAndRects({ camera, canvas, bgMats, bgRect, personRect });

    this.initiateNothing({ bgMats, bgRect, personRect });

    // 0,5 sec entrance
    await this.util.delay({ ms: 300 });

    await this.glitchScreen({ ms: 200 });

    // 0,6 sec 95

    this.firstActionMakeBgWallPaper({ bgRect, personRect, wallMat: bgMats[3], personCamTexMat: personMats[2] });

    await this.glitchScreen({ ms: 100 });

    await this.util.delay({ ms: 300 });

    await this.glitchScreen({ ms: 200 });

    // 0,4 sec blue screen

    this.secondActionShowBlueScreen({ bgRect, personRect, blueMat: bgMats[1] });

    await this.glitchScreen({ ms: 100 });

    await this.util.delay({ ms: 200 });
    
    await this.glitchScreen({ ms: 100 });

    // 0,3 sec blue segment with wallpaper

    this.thirdActionSegmentBlueScreenOverWall({ bgRect, bgWallMat: bgMats[0], personRect, personBlueMat: personMats[0] });
    
    await this.glitchScreen({ ms: 100 });

    await this.util.delay({ ms: 200 });

    // 2,1 sec trace

    await this.fourthActionLeaveATrace({ traceArray }) // 2 secs trace
    
    await this.util.delay({ ms: 100 });

    this.hidePlanes(traceArray);

    // 1,1 sec winamp

    await this.fifthActionWinamp({ winampArray }); // 1 sec winamp

    await this.glitchScreen({ ms: 100 });

    this.hidePlanes(winampArray);
    
    // 1,3 sec paint
    this.revealPlanes([planePaint, planeBucket])
    await this.util.delay({ ms: 1200 });
    await this.glitchScreen({ ms: 100 });
    this.hidePlanes([ planePaint, planeBucket]);

    // sideways 8
    this.revealPlanes(taleArray);
  }

  initiateNothing({ bgMats, bgRect, personRect }: {
    bgRect: PlanarImage;
    bgMats: MaterialBase[];
    personRect: PlanarImage;
  }) {
    bgRect.material = bgMats[2]
    personRect.hidden = Reactive.val(true);
  }

  firstActionMakeBgWallPaper({
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

  secondActionShowBlueScreen({
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

  thirdActionSegmentBlueScreenOverWall({
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

  async fourthActionLeaveATrace({ traceArray }: { traceArray: Plane[]; }) {
    for (const plane of traceArray) {
      plane.y = face.cameraTransform.y.pin();
      plane.x = face.cameraTransform.x.pin();

      plane.hidden = Reactive.val(false);

      await this.util.delay({ ms: 40 });
    }
  }

  async seventhActionTalePlanes({ taleArray, taleGroup }: { taleArray: Plane[]; taleGroup: SceneObject }) {
    // const sortedArray = this.util.sortPlaneArrayByName(taleArray);

    // this.planes.givePlaneFacePositionMultiplied({
    //   plane: sortedArray[taleArray.length - 1],
    //   faceTransform,
    // });

    // this.planes.followPlanesByPlanes({ planeArray: sortedArray });
      
    // this.focalDistance.addChild(taleGroup);
    
    // sortedArray.map((plane) => taleGroup.addChild(plane));
  }

  async fifthActionWinamp({ winampArray }: { winampArray: Plane[] }) {
    for (const plane of winampArray) {
      const index = winampArray.indexOf(plane);
      plane.x = Reactive.val(Math.random() / 10 - 0.09 + index * 0.01);
      plane.y = Reactive.val(Math.random() / 10 - 0.08 + index * 0.01);

      plane.hidden = Reactive.val(false);

      await this.util.delay({ ms: 100 });
    }
  }

  private async glitchScreen({ ms }: { ms: number }) {
    await Patches.inputs.setBoolean('allowGlitch', true);
    return new Promise(resolve => Time.setTimeout(async () => {
      await Patches.inputs.setBoolean('allowGlitch', false);
      resolve('done');
    }, ms));
  }

  async allowInstructions(bool: boolean) {
    return Patches.inputs.setBoolean('allowInstructions', bool)
  }

  async showTapInstructions() {
    await this.allowInstructions(true);

    await new Promise(resolve => Time.setTimeout(async () => {
      await this.allowInstructions(false);
      resolve('done');
    }, 700));
  }

  async showFlowInstruction() {
    await this.allowInstructions(false);

    await new Promise(resolve => Time.setTimeout(async () => {
      await this.allowInstructions(true);
      resolve('done');
    }, 1900));

    await new Promise(resolve => Time.setTimeout(async () => {
      await this.allowInstructions(false);
      resolve('done');
    }, 600));

    await new Promise(resolve => Time.setTimeout(async () => {
      await this.allowInstructions(true);
      resolve('done');
    }, 5400));

    await new Promise(resolve => Time.setTimeout(async () => {
      await this.allowInstructions(false);
      resolve('done');
    }, 600));
  }

  hidePlanes(planeArray: Plane[]) {
    planeArray.map((plane: Plane) => plane.hidden = Reactive.val(true));
  }

  switchPage(necessities: any, initialPact: any, value: number) {
    const {
      taleArray,
      traceArray,
      winampArray,
      planePaint,
      planeBucket,
      plane0,
    } = necessities;

    const {
      bgMats,
      bgRect,
      personRect,
    } =  initialPact;

    this.hidePlanes(taleArray);
    this.hidePlanes(traceArray);
    this.hidePlanes(winampArray);

    this.putPlanesAway(traceArray);

    plane0.hidden = Reactive.val(!value);
    planePaint.hidden = Reactive.val(true);
    planeBucket.hidden = Reactive.val(true);

    this.initiateNothing({ bgRect, personRect, bgMats });
  }

  revealPlanes(planeArray: Plane[]) {
    planeArray.map((plane: Plane) => plane.hidden = Reactive.val(false));
  }

  putPlanesAway( planeArray: Plane[]) {
    planeArray.map((plane: Plane) => {
      plane.y = Reactive.val(2);
      plane.x = Reactive.val(2);
    })
  }

  toggleTapPlane(plane: Plane, value: number) {
    plane.hidden = Reactive.val(!value);
  }

  // async tapToChoose(necessities: any, page: BoolSignal) {
  //   const {
  //     personMats,
  //     bgMats,
  //     bgRect,
  //     personRect,
  //     taleArray,
  //     traceArray,
  //     winampArray,
  //     planePaint,
  //     planeBucket,
  //     windowMats,
  //   } = necessities;

  //   let tapAction = 0;
  //   const pageBool = page.pinLastValue();

  //   TouchGestures.onTap().subscribe(async (event: any) => {
  //     if (event.type === 'TAP' && pageBool) {
  //       Diagnostics.log(tapAction)
      
  //       switch (tapAction) {
  //         case 0:
  //           this.hidePlanes(taleArray);
  //           this.firstActionMakeBgWallPaper({ bgRect, personRect, wallMat: bgMats[3], personCamTexMat: personMats[2] });
  //           break;
  //         case 1:
  //           this.secondActionShowBlueScreen({ bgRect, personRect, blueMat: bgMats[1] });
  //           break;
  //         case 2:
  //           this.thirdActionSegmentBlueScreenOverWall({ bgRect, bgWallMat: bgMats[0], personRect, personBlueMat: personMats[0] });
  //           break;
  //         case 3:
  //           await this.fourthActionLeaveATrace({ traceArray });
  //           // const { traceGroup, traceArray } = await this.factory.createTraceItemsInInterval(windowMats[1])
  //           break;
  //         case 4:
  //           // await this.factory.destroyItemsInInterval(traceGroup, traceArray)
  //           this.hidePlanes(traceArray);
  //           this.putPlanesAway(traceArray);
  //           await this.fifthActionWinamp({ winampArray });
  //           // const { winampArray, winampGroup, winampInterval } = await this.factory.createWinampItemsInInterval(windowMats[3]);
  //           break;
  //         case 5:
  //           this.hidePlanes(winampArray);
  //           // await this.factory.destroyItemsInInterval(winampGroup, winampArray, winampInterval);
  //           this.revealPlanes([planePaint, planeBucket]);
  //           break;
  //         case 6:
  //           this.hidePlanes([planePaint, planeBucket]);
  //           this.revealPlanes(taleArray);
  //           break;
  //         default:
  //           this.hidePlanes(taleArray);
  //           this.firstActionMakeBgWallPaper({ bgRect, personRect, wallMat: bgMats[3], personCamTexMat: personMats[2] });
  //           break;
  //       }

  //       tapAction = tapAction === 6 ? 0 : tapAction += 1;
  //     }
  //   });
  // }
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

        
    // if (choice) {
    //   await this.factory.destroyObject(taleGroup);
    //   taleArray.map(async (plane: Plane) => { 
    //     await this.factory.destroyObject(plane);
    //   })
    // }

  // async kissCamOnDemand({ windowMat }: { windowMat: MaterialBase }) {
  //   const isKissing = FaceGestures.isKissing(face);

  //   const plane = await this.factory.createPlaneInstance({
  //     name: `planeKiss`,
  //     width: 0.2,
  //     height: 0.2,
  //   });

  //   const mat = await this.factory.findMaterial({ name: 'try' })
  //   plane.material = windowMat;

  //   this.focalDistance.addChild(plane);
  //   plane.hidden = Reactive.val(false);
  //   plane.transform.x = face.cameraTransform.applyToPoint(face.mouth.center).x;
  //   plane.transform.y = face.cameraTransform.applyToPoint(face.mouth.center).y;
  

  //   // plane.hidden = Reactive.val(!isKissing);
  //   // isKissing.monitor().subscribe(async (event: any) => {
  //   //   Diagnostics.log(event)
  //   //   plane.hidden = Reactive.val(!event.newValue);
  //   // })
  // }