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
  
  let necessities: any = await factory.obtainNecessities();

  picker.selectedIndex.monitor().subscribe(async (event: any) => {
    Diagnostics.log(event.newValue)
    Diagnostics.watch('value ', event.newValue)

    if (event.newValue === 0) {
      CameraInfo.isRecordingVideo.onOn().subscribe(async (event: any) => {
        const isRecording = event.newValue;

        if (isRecording) {
          await Promise.all([
            flow.startFlow(necessities),
            flow.showInstruction(),
          ]);
        }
      });
    }

    if (event.newValue === 1) {
      const {
        personMats,
        bgMats,
        bgRect,
        personRect,
        taleArray,
        traceArray,
        winampArray,
        planePaint,
        planeBucket,
      } = necessities;
  
      let tapAction = 0;
      // await flow.tapToChoose(necessities, Reactive.val(event.newValue ? true : false));
      TouchGestures.onTap().subscribe(async (event: any) => {
        if (event.type === 'TAP') {
          Diagnostics.log(tapAction)
        
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
              await flow.fourthActionLeaveATrace({ traceArray });
              break;
            case 4:
              flow.hidePlanes(traceArray);
              flow.putPlanesAway(traceArray);
              await flow.fifthActionWinamp({ winampArray });
              break;
            case 5:
              flow.hidePlanes(winampArray);
              flow.revealPlanes([planePaint, planeBucket]);
              break;
            case 6:
              flow.hidePlanes([planePaint, planeBucket]);
              flow.revealPlanes(taleArray);
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