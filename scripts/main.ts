import Diagnostics from 'Diagnostics';
import FaceTracking from 'FaceTracking';
import TouchGestures from 'TouchGestures';
import Patches from 'Patches';
import Materials from 'Materials';
import Textures from 'Textures';
import Shaders from 'Shaders';
import Scene from 'Scene';
import CameraInfo from 'CameraInfo';
import Reactive from 'Reactive';
import Time from 'Time';
import NativeUI from 'NativeUI';

import Util from './util'
import Factory from './factory'
import Flow from './flow';

const util = new Util();

(async () => {
  
  const focalDistance = await util.getFocalDistance();

  const flow = new Flow({ focalDistance });
  const factory = new Factory({ focalDistance });

  const picker: Picker = await createPicker();

  const initialPact = await factory.obtainRequirements();
  
  const {
    personMats,
    bgMats,
    canvas,
    bgRect,
    personRect,
    camera,
    bucketIcon,
 } = initialPact;

  const necessities: any = await factory.obtainNecessities({
    bgMats,
    canvas,
    bgRect,
    personRect,
    camera,
    bucketIcon,
  });

  const {
    plane0,
    taleArray,
    traceArray,
    winampArray,
    planePaint,
    planeBucket,
  } = necessities;

  flow.initiateNothing({ bgMats, bgRect, personRect });

  let tapAction = 0;
  let firstOpen = true;

  if (firstOpen) {
    CameraInfo.isRecordingVideo.onOn().subscribe(async (event: any) => {
      const isRecording = event.newValue;
  
      if (isRecording) {
        await Promise.all([
          flow.startFlow(necessities, initialPact),
          flow.showFlowInstruction(),
        ]);
      }
    });
  }

  picker.selectedIndex.monitor().subscribe(async (event: any) => {
    tapAction = 0;
    Diagnostics.log(firstOpen);
    Diagnostics.watch('plane0 hidden :', plane0.hidden);
    if (event.oldValue !== event.newValue) flow.switchPage(necessities, initialPact, event.newValue);

    if (event.newValue === 0) {
      firstOpen = false;
      Diagnostics.log('first page')
      CameraInfo.isRecordingVideo.onOn().subscribe(async (event: any) => {
        const isRecording = event.newValue;

        if (isRecording && event.newValue === 0) {
          await Promise.all([
            flow.startFlow(necessities, initialPact),
            flow.showFlowInstruction(),
          ]);
        }
      });
    }

    // picker visibility toggle did not work on phone

    if (event.newValue === 1) {
      firstOpen = false;

      Diagnostics.log('second page')

      TouchGestures.onTap(plane0).subscribe(async (event: any) => {
        Diagnostics.log(`event type : ${event.type}`);

        if (event.type === 'TAP') {
          switch (tapAction) {
            case 0:
              flow.hidePlanes(taleArray);
              flow.firstActionMakeBgWallPaper({ bgRect, personRect, wallMat: bgMats[3], personCamTexMat: personMats[2] });
              break;
            case 1:
              flow.secondActionShowBlueScreen({ bgRect, personRect, blueMat: bgMats[1] });
              break;
            case 2:
              flow.thirdActionSegmentBlueScreenOverWall({ bgRect, bgWallMat: bgMats[0], personRect, personBlueMat: personMats[0] });
              break;
            case 3:

              picker.visible = false;
              plane0.hidden = Reactive.val(true);
              
              await Promise.all([
                flow.showTapInstructions(),
                flow.fourthActionLeaveATrace({ traceArray }),
              ]);
              
              plane0.hidden = Reactive.val(false);
              picker.visible = true;
              break;
            case 4:
              flow.hidePlanes(traceArray);
              flow.putPlanesAway(traceArray);
              
              picker.visible = false;
              plane0.hidden = Reactive.val(true);
              await flow.fifthActionWinamp({ winampArray });
              plane0.hidden = Reactive.val(false);
              picker.visible = true;

              break;
            case 5:
              flow.hidePlanes(winampArray);
              flow.revealPlanes([planePaint, planeBucket]);
              break;
            case 6:
              
              flow.hidePlanes([planePaint, planeBucket]);
              flow.revealPlanes(taleArray);
              flow.showTapInstructions();
              break;
            default:
              flow.hidePlanes(taleArray);
              flow.firstActionMakeBgWallPaper({ bgRect, personRect, wallMat: bgMats[3], personCamTexMat: personMats[2] });
              break;
          }
  
          tapAction = tapAction === 6 ? 0 : tapAction += 1;
        }
      });
    }
  })
})();

const createPicker = async () => {
  const picker = NativeUI.picker;

  const [mat, tex0, tex1] = await Promise.all([
    Materials.findFirst('material0'),
    Textures.findFirst('screenBlue'),
    Textures.findFirst('screenWall'),
  ]);

  picker.configure({
    selectedIndex: 0,
    items: [
      {image_texture: tex0},
      {image_texture: tex1},
    ]
  });

  picker.visible = true;

  return picker;
}